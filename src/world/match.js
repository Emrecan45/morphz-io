import {
  ARENA,
  BOTS,
  LOOT,
  START,
  SPAWN,
  BUSHES,
  ZONE,
  UPGRADES,
  baseAt,
} from '../config.js'
import { makeGrid, spotTaken, forEachBlock } from '../blocks.js'
import { makeSwarm, fillSwarm, forEachNear } from './near.js'
import { maskSweep } from './hitbox.js'
import { buildStaticWorld } from './decor.js'
import { createFood, updateFood, eatAround, scatterLoot } from './food.js'
import { createZoneState, stepZone } from './zone.js'
import {
  createBeingState,
  morphBeingState,
  placeBeingState,
  stepBeingState,
  addXp,
  applyMods,
  spendPoint,
  damageBeing,
  killBeing,
  sameTeam,
  separate,
  spawnSafely,
  keptTeamXp,
  canEvolve,
  tryAttack,
  stepBursts,
} from './being.js'
import { initAi, stepAi, botName, robotName, nameSalt, setBotBrains, pickFamily } from '../ai.js'

const NO_HOOKS = {
  onShot() {},
  onHit() {},
  onKill() {},
  onMorph() {},
  onBotMorph() {},
  onZoneOpen() {},
  onZoneTaken() {},
  onBurst() {},
  onFade() {},
  onVanish() {},
  onSpawn() {},
  onEat() {},
  onRoster() {},
}

function lootSpread(b) {
  const total = Math.max(LOOT.min, Math.min(LOOT.max, Math.round(b.xp * LOOT.part)))
  const cap = 5 + b.tier * 5
  const rep = []
  for (let i = 0; i < ARENA.rings.length; i++) rep.push(0)
  let leftOver = total
  let placed = 0
  for (let ring = Math.min(ARENA.rings.length - 1, b.tier); ring >= 0; ring--) {
    const value = ARENA.rings[ring].food
    const budget = ring === 0 ? leftOver : Math.round(leftOver * LOOT.topShare)
    const slots = ring === 0 ? cap - placed : Math.max(1, Math.floor((cap - placed) * LOOT.topSlots))
    const n = Math.min(Math.floor(budget / value), slots)
    if (n <= 0) continue
    rep[ring] = n
    leftOver -= n * value
    placed += n
    if (placed >= cap) break
  }
  if (placed === 0) rep[0] = 1
  return rep
}

export function createWorldDecor(mode, plan) {
  const statics = plan || buildStaticWorld()
  const world = {
    beings: [],
    shots: [],
    shotCounter: 0,
    blocks: statics.blocks,
    bushes: statics.bushes,
    grid: makeGrid(statics.blocks),
    bushGrid: makeGrid(statics.bushes),
    placeGrid: makeGrid(statics.blocks.concat(statics.bushes)),
    activeZone: null,
    food: null,
    statics,
  }
  world.food = createFood(world.placeGrid)
  return world
}

export function createMatch(mode, options) {
  const opts = options || {}
  const given = opts.hooks || {}
  const match = {
    mode: mode === 'team' ? 'team' : 'solo',
    clock: 0,
    counter: 100,
    byId: new Map(),
    events: { shots: [], eaten: [], repops: [], deaths: [], bursts: [], fades: [], vanishes: [], zonewon: [] },
  }

  const hooks = {}
  for (const key of Object.keys(NO_HOOKS)) {
    hooks[key] = given[key] || NO_HOOKS[key]
  }

  const salt = nameSalt()
  const takenNames = new Set()
  let masked = false

  const world = createWorldDecor(match.mode, opts.statics)
  const statics = world.statics
  world.food.onEatEvent = (g, i) => match.events.eaten.push([g, i])
  world.food.onRepop = (g, i, x, z) => match.events.repops.push([g, i, rounded(x), rounded(z)])

  match.world = world
  match.statics = statics
  match.zones = createZoneState()

  const swarm = makeSwarm()
  const spray = makeSwarm()

  function beingReach(b) {
    return b.bound || b.radius || 0
  }

  function shotReach(s) {
    return s.radius || 0
  }

  function rounded(v) {
    return Math.round(v * 100) / 100
  }

  function nextId() {
    match.counter++
    return match.counter
  }

  function fillSeats() {
    takenNames.clear()
  }

  function takeSeat() {
    let pick = 0
    for (let k = 0; k < 24; k++) {
      pick = pickFamily()
      if (!takenNames.has(pick)) break
    }
    takenNames.add(pick)
    return pick
  }

  function dropSeat(b) {
    if (b.family === undefined) return
    takenNames.delete(b.family)
    b.family = undefined
  }

  function register(b) {
    if (!b.netId) b.netId = nextId()
    match.byId.set(b.netId, b)
    world.beings.push(b)
    hooks.onSpawn(b)
    return b
  }

  function unregister(b) {
    dropSeat(b)
    b.alive = false
    const i = world.beings.indexOf(b)
    if (i >= 0) world.beings.splice(i, 1)
    if (b.netId) match.byId.delete(b.netId)
    for (const s of world.shots) if (s.owner === b) s.owner = null
    hooks.onVanish(b)
  }

  function thinnestTeam() {
    const n = { red: 0, blue: 0 }
    for (const b of world.beings) if (b.team) n[b.team]++
    if (n.red === n.blue) return Math.random() < 0.5 ? 'red' : 'blue'
    return n.red < n.blue ? 'red' : 'blue'
  }

  function balancedSide(b) {
    const n = { red: 0, blue: 0 }
    const power = { red: 0, blue: 0 }
    for (const o of world.beings) {
      if (!o.team || o === b) continue
      n[o.team]++
      if (o.alive) power[o.team] += o.xp
    }
    const weak = power.red < power.blue ? 'red' : 'blue'
    const other = weak === 'red' ? 'blue' : 'red'
    if (n[weak] + 1 > n[other] + BOTS.spread) return b.team
    return weak
  }

  function weakestTeam() {
    const power = { red: 0, blue: 0 }
    for (const b of world.beings) {
      if (!b.team || !b.alive) continue
      power[b.team] += b.xp
    }
    if (power.red === power.blue) return thinnestTeam()
    return power.red < power.blue ? 'red' : 'blue'
  }

  function spawnBeing(b) {
    const [x, z] = spawnSafely(b, world, SPAWN.minDistance, SPAWN.attempts)
    placeBeingState(b, x, z)
    b.immune = SPAWN.immunity
    eatAround(world.food, b, (value, item) => {
      addXp(b, value)
      hooks.onEat(b, value, item)
    })
  }

  function seedXp(index) {
    let roll = (index + 0.5) / BOTS.population
    for (const s of BOTS.seed) {
      if (roll < s.share) return Math.round(s.xp[0] + Math.random() * (s.xp[1] - s.xp[0]))
      roll -= s.share
    }
    return 0
  }

  function makeBot(index, side) {
    const team = match.mode === 'team' ? side || (index % 2 ? 'red' : 'blue') : null
    const family = takeSeat()
    const nick = botName(index, salt, family)
    const robot = robotName(index)
    const b = createBeingState(START, masked ? robot : nick, false, team)
    b.isBot = true
    b.family = family
    b.nick = nick
    b.robot = robot
    register(b)
    spawnBeing(b)
    initAi(b)
    addXp(b, seedXp(index))
    return b
  }

  fillSeats()
  for (let i = 0; i < BOTS.population; i++) makeBot(i)

  function inEnemyBase(b) {
    if (match.mode !== 'team' || !b.team || !b.alive) return false
    const team = baseAt(b.x)
    return !!team && team !== b.team
  }

  function bushAt(x, z) {
    let found = null
    forEachBlock(world.bushGrid, x, z, 0, (bu) => {
      const dx = x - bu.x
      const dz = z - bu.z
      if (dx * dx + dz * dz <= bu.rv * bu.rv) {
        found = bu
        return false
      }
      return true
    })
    return found
  }

  function clashBullets(shots) {
    for (let i = 0; i < shots.length; i++) shots[i].tag = i
    fillSwarm(spray, shots, shotReach)
    for (let i = 0; i < shots.length; i++) {
      const a = shots[i]
      if (a.death) continue
      forEachNear(spray, a.x, a.z, a.radius, (b) => {
        if (b.tag <= a.tag || b.death || a.owner === b.owner) return true
        if (a.team && a.team === b.team) return true
        const rr = a.radius + b.radius
        const dx = a.x - b.x
        const dz = a.z - b.z
        if (dx * dx + dz * dz > rr * rr) return true
        const ha = a.pierce
        const hb = b.pierce
        a.pierce -= hb
        b.pierce -= ha
        if (b.pierce <= 0) b.death = true
        if (a.pierce <= 0) {
          a.death = true
          return false
        }
        return true
      })
    }
  }

  function updateShots(dt) {
    const shots = world.shots
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i]
      s.life -= dt
      if (s.px === undefined) {
        s.px = s.x
        s.pz = s.z
      }
      s.x += s.vx * dt
      s.z += s.vz * dt
      s.death = false
    }
    clashBullets(shots)
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i]
      const band = match.mode === 'team' ? baseAt(s.x) : null
      let done =
        s.death ||
        s.life <= 0 ||
        Math.abs(s.x) > ARENA.half ||
        Math.abs(s.z) > ARENA.half ||
        (band !== null && band !== s.team)
      if (!done && spotTaken(world.grid, s.x, s.z, s.radius)) done = true
      let hitBeing = false
      if (!done) {
        const mx = (s.px + s.x) / 2
        const mz = (s.pz + s.z) / 2
        const span = Math.hypot(s.x - s.px, s.z - s.pz) / 2 + s.radius
        forEachNear(swarm, mx, mz, span, (b) => {
          if (!b.alive || b === s.owner || b.immune > 0 || sameTeam(s.owner, b)) return true
          if (s.seen && s.seen.has(b)) return true
          if (!maskSweep(b, s.px, s.pz, s.x, s.z, s.radius)) return true
          damageBeing(b, s.damage, s.owner, world, hooks)
          if (s.poison && b.alive) {
            b.poison = { dps: s.poison.dps, t: s.poison.duration }
            b.poisonBy = s.owner
          }
          hitBeing = true
          if (s.pass <= 0) {
            done = true
            return false
          }
          s.pass--
          if (!s.seen) s.seen = new Set()
          s.seen.add(b)
          return true
        })
      }
      if (done) {
        if (hitBeing) {
          match.events.vanishes.push(s.id)
        } else if (s.life <= 0) {
          match.events.fades.push(s.id)
          hooks.onFade(s)
        } else {
          match.events.bursts.push(s.id)
          hooks.onBurst(s)
        }
        shots.splice(i, 1)
      } else {
        s.px = s.x
        s.pz = s.z
      }
    }
  }

  function noteShots(b) {
    const shots = world.shots
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i]
      if (s.owner !== b || s.note) break
      s.note = true
      match.events.shots.push(s)
    }
  }

  const rawShot = hooks.onShot
  const rawDeath = hooks.onKill
  hooks.onShot = (b) => {
    noteShots(b)
    rawShot(b)
  }
  hooks.onKill = (victim, killer) => {
    match.events.deaths.push([victim.netId || 0, killer && killer.netId ? killer.netId : 0])
    scatterLoot(world.food, victim.x, victim.z, lootSpread(victim))
    rawDeath(victim, killer)
    if (victim.human) {
      victim.awaitingRespawn = true
      return
    }
    victim.deadFor = 0
  }

  function keptOnDeath(b) {
    if (match.mode !== 'team') return 0
    return Math.max(keptTeamXp(b.xp), Math.min(BOTS.keptCap, Math.floor(b.xp * BOTS.keptXp)))
  }

  function respawnBot(b) {
    if (match.mode === 'team') {
      const side = balancedSide(b)
      if (side !== b.team) {
        const fresh = nextId()
        b.team = side
        dropSeat(b)
        b.family = takeSeat()
        b.nick = botName(fresh, salt, b.family)
        b.robot = robotName(fresh)
        b.name = masked ? b.robot : b.nick
        hooks.onRoster()
      }
    }
    const kept = keptOnDeath(b)
    morphBeingState(b, START)
    b.level = 1
    b.xp = kept
    b.points = 0
    for (const u of UPGRADES.list) b.comp[u.id] = 0
    b.total = b.total || 0
    addXp(b, 0)
    applyMods(b)
    b.hp = b.maxHp
    b.alive = true
    b.poison = null
    b.poisonBy = null
    b.deadFor = null
    spawnBeing(b)
    initAi(b)
    hooks.onMorph(b, START)
  }

  function respawnHuman(b, rebalance) {
    if (rebalance && match.mode === 'team') {
      const side = balancedSide(b)
      if (side !== b.team) {
        b.team = side
        hooks.onRoster()
      }
    }
    const kept = keptOnDeath(b)
    morphBeingState(b, START)
    b.xp = kept
    b.level = 1
    b.points = 0
    for (const u of UPGRADES.list) b.comp[u.id] = 0
    b.pendingMorph = false
    b.optionsSent = false
    b.awaitingRespawn = false
    addXp(b, 0)
    applyMods(b)
    b.hp = b.maxHp
    b.alive = true
    b.poison = null
    b.poisonBy = null
    spawnBeing(b)
    hooks.onMorph(b, START)
  }

  function adjustPopulation() {
    let humans = 0
    for (const b of world.beings) if (!b.isBot) humans++
    const wanted = Math.max(0, BOTS.population - humans)
    const bots = world.beings.filter((b) => b.isBot)
    if (bots.length > wanted) {
      bots.sort((a, b) => a.xp - b.xp || a.total - b.total)
      for (let i = 0; i < bots.length - wanted; i++) {
        const victim = bots[i]
        if (victim.alive) killBeing(victim, null, world, hooks)
        unregister(victim)
      }
      hooks.onRoster()
      return
    }
    for (let i = bots.length; i < wanted; i++) makeBot(match.counter, thinnestTeam())
    if (bots.length < wanted) hooks.onRoster()
  }

  function sortBeings() {
    const list = world.beings
    for (let i = 0; i < list.length; i++) list[i].tag = i
    fillSwarm(swarm, list, beingReach)
  }

  function tick(dt) {
    match.clock += dt
    if (match.mode === 'team') stepZone(match.zones, dt, world, match, hooks)

    for (const b of world.beings) {
      if (!b.alive) {
        if (b.isBot && b.deadFor !== null && b.deadFor !== undefined) {
          b.deadFor += dt
          if (b.deadFor >= BOTS.respawn) respawnBot(b)
        }
        continue
      }
      if (b.human) {
        const s = b.input
        if (s) {
          const face = s[2] || s[3] ? { x: s[2], z: s[3], snap: true } : null
          stepBeingState(b, dt, s[0], s[1], world, face)
          if (s[4]) tryAttack(b, world, hooks)
        } else {
          stepBeingState(b, dt, 0, 0, world, null)
        }
      } else {
        stepAi(b, dt, world, hooks)
      }
      stepBursts(b, dt, world, hooks)
      eatAround(world.food, b, (value, item) => {
        addXp(b, value)
        hooks.onEat(b, value, item)
      })
      if (b.hp <= 0) {
        const venom = b.poisonBy
        const by = venom && venom !== b && venom.alive && !sameTeam(venom, b) ? venom : null
        killBeing(b, by, world, hooks)
      } else if (inEnemyBase(b)) {
        b.deathCause = 'base'
        killBeing(b, null, world, hooks)
      }
    }

    sortBeings()
    separate(world, dt, swarm)
    updateShots(dt)
    updateFood(world.food, dt)

    world.reveal = false
    for (const b of world.beings) {
      if (!b.alive) {
        b.bush = null
        b.hidden = false
        continue
      }
      const was = b.hidden
      b.bush = bushAt(b.x, b.z)
      b.hidden = !!b.bush
      if (was && !b.hidden) world.reveal = true
    }
  }

  return {
    match,
    world,
    hooks,
    get zones() {
      return match.zones
    },
    get events() {
      return match.events
    },
    tick,
    adjustPopulation,
    setBotMask(on) {
      masked = !!on
      const touched = []
      for (const b of world.beings) {
        if (!b.isBot) continue
        if (!b.robot) b.robot = robotName(b.netId)
        const want = masked ? b.robot : b.nick === undefined ? b.name : b.nick
        if (b.name === want) continue
        b.name = want
        touched.push(b)
      }
      return touched
    },
    setBotSkill(weak) {
      setBotBrains(weak)
      for (const b of world.beings) if (b.isBot && b.ai) initAi(b)
    },
    byId(id) {
      return match.byId.get(id) || null
    },
    addPlayer(name, local) {
      const side = match.mode === 'team' ? weakestTeam() : null
      const b = createBeingState(START, name, !!local, side)
      b.human = true
      b.input = null
      register(b)
      spawnBeing(b)
      adjustPopulation()
      hooks.onRoster()
      return b
    },
    kill(b) {
      if (b && b.alive) killBeing(b, null, world, hooks)
    },
    removePlayer(b) {
      if (!b) return
      if (b.alive) killBeing(b, null, world, hooks)
      unregister(b)
      adjustPopulation()
      hooks.onRoster()
    },
    input(b, s) {
      if (b) b.input = s
    },
    upgrade(b, id) {
      if (b) spendPoint(b, id)
    },
    pickShape(b, defId) {
      if (!b || !b.pendingMorph || !b.def.next.includes(defId)) return false
      morphBeingState(b, defId)
      if (canEvolve(b)) b.pendingMorph = true
      b.optionsSent = false
      hooks.onMorph(b, defId)
      hooks.onRoster()
      return true
    },
    respawn(b, rebalance) {
      if (b && !b.alive) respawnHuman(b, rebalance)
    },
    adopt(drop) {
      if (drop && drop.alive) killBeing(drop, null, world, hooks)
      match.byId.clear()
      let top = 100
      for (const b of world.beings) {
        b.human = false
        b.input = null
        b.isPlayer = false
        b.isBot = true
        b.seen = true
        b.first = false
        if (b.deadFor === null || b.deadFor === undefined) b.deadFor = 0
        if (!b.netId) b.netId = ++top
        if (b.netId > top) top = b.netId
        match.byId.set(b.netId, b)
        initAi(b)
      }
      match.counter = top
      world.shots.length = 0
      world.food.local = true
      adjustPopulation()
      hooks.onRoster()
    },
    setMode(next) {
      const wanted = next === 'team' ? 'team' : 'solo'
      if (wanted === match.mode) return false
      match.mode = wanted
      return true
    },
    softReset() {
      match.clock = 0
      match.zones.active = null
      match.zones.nextIn = ZONE.firstDelay
      match.zones.previous = null
      match.zones.captures = 0
      world.activeZone = null
      world.shots.length = 0
      
      if (match.mode === 'team') {
        const free = []
        const seats = { red: 0, blue: 0 }
        const power = { red: 0, blue: 0 }
        for (const b of world.beings) {
          b.score = 0
          b.kills = 0
          const home = baseAt(b.x)
          if (!home) {
            free.push(b)
            continue
          }
          b.team = home
          seats[home]++
          power[home] += b.xp
        }
        free.sort((a, b) => b.xp - a.xp)
        for (const b of free) {
          const gap = seats.red - seats.blue
          let side
          if (gap >= BOTS.spread) side = 'blue'
          else if (-gap >= BOTS.spread) side = 'red'
          else side = power.red <= power.blue ? 'red' : 'blue'
          b.team = side
          seats[side]++
          power[side] += b.xp
        }
      } else {
        for (const b of world.beings) {
          b.team = null
          b.score = 0
          b.kills = 0
        }
      }
    },
    reset() {
      for (const b of [...world.beings]) unregister(b)
      world.shots.length = 0
      match.byId.clear()
      match.counter = 100
      match.clock = 0
      match.zones.active = null
      match.zones.nextIn = ZONE.firstDelay
      match.zones.previous = null
      match.zones.captures = 0
      world.activeZone = null
      world.food.local = true
      for (const g of world.food.groups) {
        for (const it of g.items) {
          it.alive = true
          it.x = it.ix
          it.z = it.iz
          it.timer = 0
          it.scale = 1
        }
      }
      match.events = { shots: [], eaten: [], repops: [], deaths: [], bursts: [], fades: [], vanishes: [] }
      fillSeats()
      for (let i = 0; i < BOTS.population; i++) makeBot(i)
      hooks.onRoster()
    },
    drainEvents() {
      const e = match.events
      match.events = { shots: [], eaten: [], repops: [], deaths: [], bursts: [], fades: [], vanishes: [] }
      return e
    },
  }
}

export { BUSHES }






