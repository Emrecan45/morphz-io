import { createMatch } from '../src/world/match.js'
import {
  STATE_RATE,
  DIGEST_RATE,
  encodeRoster,
  encodeState,
  encodeShot,
  encodeFood,
} from '../src/online.js'
import { BOTS, UPGRADES, CREATURES, START } from '../src/config.js'

const STEP = 1 / 30
const SILENCE_MAX = 15000
const META_SAVE = 30000

const PARENT = {}
for (const id of Object.keys(CREATURES)) {
  for (const kid of CREATURES[id].next || []) PARENT[kid] = id
}

function emptyRow() {
  return { picks: 0, offers: 0, kills: 0, deaths: 0, ms: 0, xp: 0, lives: 0 }
}

export class Arena {
  constructor(state, env) {
    this.env = env
    this.state = state
    this.meta = { humans: {}, bots: {} }
    this.metaAt = 0
    this.recording = false
    state.blockConcurrencyWhile(async () => {
      const kept = await state.storage.get('meta')
      if (kept && kept.humans && kept.bots) this.meta = kept
    })
    this.match = null
    this.mode = 'solo'
    this.clients = new Map()
    this.loop = null
    this.last = 0
    this.stateClock = 0
    this.digestClock = 0
    this.rosterDirty = false
    this.cards = new Map()
    this.stats = {
      bornAt: Date.now(),
      activeMs: 0,
      loopAt: 0,
      joins: 0,
      peak: 0,
      msgIn: 0,
      msgOut: 0,
      bytesOut: 0,
      ticks: 0,
      lag: 0,
    }
  }

  metaRow(b, id) {
    const store = b.human ? this.meta.humans : this.meta.bots
    if (!store[id]) store[id] = emptyRow()
    return store[id]
  }

  openShape(b) {
    b.shapeId = b.defId
    b.shapeAt = Date.now()
    b.shapeXp = b.total || 0
    if (this.recording) this.metaRow(b, b.defId).lives++
  }

  closeShape(b) {
    if (!b.shapeId) return
    if (this.recording) {
      const row = this.metaRow(b, b.shapeId)
      row.ms += Math.max(0, Date.now() - (b.shapeAt || Date.now()))
      row.xp += Math.max(0, (b.total || 0) - (b.shapeXp || 0))
    }
    b.shapeId = null
  }

  countPick(b, defId) {
    if (!this.recording || defId === START) return
    const parent = PARENT[defId]
    if (!parent) return
    this.metaRow(b, defId).picks++
    for (const kid of CREATURES[parent].next) this.metaRow(b, kid).offers++
  }

  saveMeta(force) {
    const now = Date.now()
    if (!force && now - this.metaAt < META_SAVE) return
    this.metaAt = now
    try {
      const out = this.state.storage.put('meta', this.meta)
      if (out && out.catch) out.catch(() => {})
    } catch {
    }
  }

  metaTotals() {
    const out = {}
    for (const camp of ['humans', 'bots']) {
      out[camp] = {}
      for (const id of Object.keys(this.meta[camp])) out[camp][id] = this.meta[camp][id]
    }
    return out
  }

  liveStats() {
    const st = this.stats
    const active = st.activeMs + (st.loopAt ? Date.now() - st.loopAt : 0)
    return {
      mode: this.mode,
      running: !!this.loop,
      humans: this.humanCount(),
      sockets: this.clients.size,
      bots: this.match ? this.match.world.beings.length - this.humanCount() : 0,
      ageSec: Math.round((Date.now() - st.bornAt) / 1000),
      activeSec: Math.round(active / 1000),
      joins: st.joins,
      peak: st.peak,
      msgIn: st.msgIn,
      msgOut: st.msgOut,
      bytesOut: st.bytesOut,
      ticks: st.ticks,
      lag: st.lag,
    }
  }

  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname.endsWith('/count')) {
      return new Response(JSON.stringify({ players: this.clients.size, humans: this.humanCount(), max: BOTS.population }), {
        headers: { 'content-type': 'application/json' },
      })
    }
    if (url.pathname.endsWith('/stats')) {
      return new Response(JSON.stringify({ ...this.liveStats(), meta: this.metaTotals() }), {
        headers: { 'content-type': 'application/json' },
      })
    }
    if (request.headers.get('upgrade') !== 'websocket') {
      return new Response('websocket attendu', { status: 426 })
    }
    const mode = url.searchParams.get('mode') === 'team' ? 'team' : 'solo'
    const watcher = url.searchParams.get('watch') === '1'
    if (watcher && (!this.match || this.humanCount() === 0)) return new Response('no match running', { status: 409 })
    this.startLoop(mode)
    if (!watcher && this.humanCount() >= BOTS.population) return new Response('room full', { status: 503 })

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    server.accept()
    this.attachSocket(server)
    return new Response(null, { status: 101, webSocket: client })
  }

  startLoop(mode) {
    if (this.loop) return
    if (this.match) {
      this.last = Date.now()
      this.stats.loopAt = this.last
      this.recording = true
      for (const b of this.match.world.beings) this.openShape(b)
      this.loop = setInterval(() => this.turn(), STEP * 1000)
      return
    }
    this.mode = mode
    this.match = createMatch(mode, {
      hooks: {
        onRoster: () => {
          this.rosterDirty = true
        },
        onSpawn: (b) => {
          this.openShape(b)
        },
        onMorph: (b, defId) => {
          this.closeShape(b)
          this.countPick(b, defId)
          this.openShape(b)
        },
        onKill: (victim, killer) => {
          if (!this.recording) return
          this.closeShape(victim)
          this.metaRow(victim, victim.defId).deaths++
          if (killer && killer !== victim) this.metaRow(killer, killer.defId).kills++
        },
        onZoneTaken: (team) => {
          if (this.match && this.match.match && this.match.match.events) {
            if (!this.match.match.events.zonewon) this.match.match.events.zonewon = []
            this.match.match.events.zonewon.push(team)
          }
        },
      },
    })
    
    for (let i = 0; i < 60 * 30; i++) {
      this.match.tick(STEP)
    }
    this.match.drainEvents()
    this.recording = true
    for (const b of this.match.world.beings) this.openShape(b)

    this.last = Date.now()
    this.stats.loopAt = this.last
    this.loop = setInterval(() => this.turn(), STEP * 1000)
  }

  stopLoop() {
    if (this.match) {
      for (const b of this.match.world.beings) this.closeShape(b)
    }
    this.recording = false
    this.saveMeta(true)
    if (this.loop) clearInterval(this.loop)
    if (this.stats.loopAt) {
      this.stats.activeMs += Date.now() - this.stats.loopAt
      this.stats.loopAt = 0
    }
    this.loop = null
    this.cards.clear()
  }

  pickFocus(card) {
    const p = this.match
    if (!p) return
    const from = card.focus
    let best = null
    let score = -Infinity
    for (const b of p.world.beings) {
      if (!b.alive || !b.netId) continue
      let close = 0
      for (const o of p.world.beings) {
        if (o === b || !o.alive) continue
        const dx = o.x - b.x
        const dz = o.z - b.z
        if (dx * dx + dz * dz < 900) close++
      }
      let mark = close
      if (from) mark -= Math.hypot(b.x - from.x, b.z - from.z) * 0.05
      if (mark > score) {
        score = mark
        best = b
      }
    }
    card.focus = best
  }

  humanCount() {
    let n = 0
    for (const card of this.clients.values()) if (card.being) n++
    return n
  }

  closeWatchers() {
    for (const card of [...this.clients.values()]) {
      if (card.being) continue
      try {
        card.ws.close(1000, 'match over')
      } catch {
      }
    }
  }

  attachSocket(ws) {
    const card = { ws, being: null, lastSeen: Date.now() }
    this.clients.set(ws, card)
    this.stats.joins++
    if (this.clients.size > this.stats.peak) this.stats.peak = this.clients.size
    ws.addEventListener('message', (evt) => {
      this.stats.msgIn++
      let msg = null
      try {
        msg = JSON.parse(evt.data)
      } catch {
        return
      }
      if (Array.isArray(msg)) this.receive(card, msg[0], msg[1])
    })
    ws.addEventListener('close', () => this.detachSocket(card))
    ws.addEventListener('error', () => this.detachSocket(card))
  }

  detachSocket(card) {
    if (!this.clients.has(card.ws)) return
    this.clients.delete(card.ws)
    if (card.being) {
      this.cards.delete(card.being.netId)
      if (this.match) {
        this.match.kill(card.being)
        this.match.removePlayer(card.being)
      }
      card.being = null
    }
    if (this.clients.size === 0) {
      this.stopLoop()
      return
    }
    if (this.humanCount() === 0) this.closeWatchers()
  }

  send(ws, type, data) {
    const packet = JSON.stringify([type, data])
    try {
      ws.send(packet)
      this.stats.msgOut++
      this.stats.bytesOut += packet.length
    } catch {
    }
  }

  broadcast(type, data) {
    const packet = JSON.stringify([type, data])
    for (const card of this.clients.values()) {
      try {
        card.ws.send(packet)
        this.stats.msgOut++
        this.stats.bytesOut += packet.length
      } catch {
      }
    }
  }

  receive(card, type, data) {
    card.lastSeen = Date.now()
    const p = this.match
    if (!p) return

    if (type === 'join') {
      if (card.being) return
      const live = this.match
      const name = String((data && data.name) || '').slice(0, 12)
      const b = live.addPlayer(name)
      card.being = b
      this.send(card.ws, 'welcome', {
        id: b.netId,
        mode: this.mode,
        roster: encodeRoster(live.world.beings),
        food: encodeFood(live.world.food),
      })
      this.rosterDirty = true
      return
    }

    if (type === 'watch') {
      if (card.being || card.watching) return
      card.watching = true
      this.pickFocus(card)
      this.send(card.ws, 'welcome', {
        id: null,
        mode: this.mode,
        roster: encodeRoster(p.world.beings),
        food: encodeFood(p.world.food),
      })
      return
    }

    if (!card.being) return
    if (type === 'input') {
      p.input(card.being, data)
      return
    }
    if (type === 'upgrade') {
      p.upgrade(card.being, data)
      return
    }
    if (type === 'choose') {
      p.pickShape(card.being, data)
      return
    }
    if (type === 'respawn') {
      p.respawn(card.being, data === 1)
    }
  }

  viewOf() {
    const p = this.match
    return { zones: p.match.zones, world: p.world }
  }

  turn() {
    const p = this.match
    if (!p) return
    const nowMs = Date.now()
    this.stats.ticks++
    if (nowMs - this.last > 100) this.stats.lag++
    this.saveMeta(false)
    let leftOver = Math.min(0.5, (nowMs - this.last) / 1000)
    this.last = nowMs
    while (leftOver > 0.0005) {
      const stepDt = Math.min(STEP * 1.5, leftOver)
      p.tick(stepDt)
      leftOver -= stepDt
    }

    this.sweep(nowMs)

    const events = p.drainEvents()
    if (events.shots.length) this.broadcast('shots', events.shots.map(encodeShot))
    if (events.bursts.length) this.broadcast('bursts', events.bursts)
    if (events.fades.length) this.broadcast('fades', events.fades)
    if (events.vanishes.length) this.broadcast('vanishes', events.vanishes)
    if (events.eaten.length) this.broadcast('eaten', events.eaten)
    if (events.repops.length) this.broadcast('repops', events.repops)
    if (events.zonewon) {
      for (const team of events.zonewon) this.broadcast('zonewon', team)
    }
    for (const death of events.deaths) this.broadcast('death', death)

    if (this.rosterDirty) {
      this.rosterDirty = false
      this.broadcast('roster', encodeRoster(p.world.beings))
    }

    for (const card of this.clients.values()) {
      const b = card.being
      if (!b) continue
      const signature = b.points + ':' + UPGRADES.list.map((u) => b.comp[u.id]).join(',')
      if (this.cards.get(b.netId) !== signature) {
        this.cards.set(b.netId, signature)
        this.send(card.ws, 'self', [b.points, UPGRADES.list.map((u) => b.comp[u.id])])
      }
      if (b.pendingMorph && !b.optionsSent && b.def.next.length) {
        b.optionsSent = true
        this.send(card.ws, 'options', b.def.next.slice())
      }
    }

    const view = this.viewOf()
    this.digestClock -= STEP
    if (this.digestClock <= 0) {
      this.digestClock = DIGEST_RATE
      const digest = []
      for (const b of p.world.beings) {
        digest.push([b.netId, Math.round(b.xp), b.alive ? 1 : 0, Math.floor(b.total)])
      }
      this.broadcast('digest', digest)
    }

    this.stateClock -= STEP
    if (this.stateClock <= 0) {
      this.stateClock = STATE_RATE
      for (const card of this.clients.values()) {
        if (card.being) {
          this.send(card.ws, 'state', encodeState(view, card.being))
          continue
        }
        if (!card.watching) continue
        if (!card.focus || !card.focus.alive) this.pickFocus(card)
        this.send(card.ws, 'state', encodeState(view, card.focus))
      }
    }
  }

  sweep(nowMs) {
    for (const card of [...this.clients.values()]) {
      if (nowMs - card.lastSeen < SILENCE_MAX) continue
      try {
        card.ws.close(1000, 'silence')
      } catch {
      }
      this.detachSocket(card)
    }
  }
}








