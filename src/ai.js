import { CREATURES, ARENA, BASES, BOTS, EASY, CAM, ZONE, BUSHES, SHOT, UPGRADES, arenaDist, squarePoint, baseAt } from './config.js'
import { stepBeingState, tryAttack, canEvolve, sameTeam, morphBeingState, spendPoint } from './world/being.js'
import { lineBlocked } from './blocks.js'

const MATE_SPACE = 9

const ADJ = [
  'dark', 'red', 'blue', 'ice', 'fire', 'mad', 'wild', 'lost', 'holy', 'evil',
  'fast', 'slow', 'big', 'tiny', 'old', 'raw', 'grim', 'pale', 'void', 'neon',
  'acid', 'iron', 'gold', 'jade', 'onyx', 'ash', 'dust', 'salt', 'rust', 'mint',
  'zero', 'ultra', 'mega', 'hyper', 'super', 'anti', 'poly', 'omni', 'nano', 'cyber',
  'night', 'day', 'sun', 'moon', 'star', 'sky', 'sea', 'snow', 'rain', 'mist',
  'soft', 'hard', 'lazy', 'busy', 'silly', 'angry', 'happy', 'sleepy', 'hungry', 'shiny',
]
const NOUNS = [
  'wolf', 'shark', 'dragon', 'ghost', 'blade', 'storm', 'king', 'lord', 'cat', 'dog',
  'duck', 'panda', 'bear', 'fox', 'hawk', 'crow', 'moth', 'wasp', 'toad', 'newt',
  'viper', 'cobra', 'tiger', 'lion', 'ram', 'bull', 'crab', 'squid', 'eel', 'koi',
  'reaper', 'hunter', 'raider', 'walker', 'runner', 'digger', 'seeker', 'keeper', 'binder', 'ripper',
  'blob', 'slime', 'worm', 'bug', 'ant', 'bee', 'fly', 'rat', 'mole', 'bat',
  'core', 'edge', 'rift', 'surge', 'pulse', 'spark', 'flame', 'frost', 'quake', 'bloom',
  'toast', 'noodle', 'waffle', 'pickle', 'donut', 'bagel', 'melon', 'pepper', 'olive', 'mango',
  'sock', 'spoon', 'brick', 'nail', 'gear', 'bolt', 'wire', 'chip', 'disk', 'pixel',
]
const FIRST_NAMES = [
  'lucas', 'enzo', 'noah', 'liam', 'mateo', 'ayaz', 'kylian', 'ines', 'lena', 'jade',
  'kevin', 'bryan', 'dylan', 'sofia', 'maya', 'nina', 'theo', 'gabin', 'rayan', 'sasha',
  'adam', 'ali', 'omar', 'yusuf', 'emre', 'mert', 'ivan', 'pavel', 'dimitri', 'milan',
  'alex', 'max', 'leo', 'hugo', 'jules', 'tom', 'sam', 'ben', 'nathan', 'ethan',
  'chloe', 'emma', 'lea', 'anna', 'zoe', 'lisa', 'kim', 'mia', 'eva', 'nora',
  'diego', 'pablo', 'carlos', 'marco', 'luca', 'nico', 'jonas', 'felix', 'oscar', 'viktor',
  'wei', 'chen', 'hiro', 'ken', 'yuki', 'ravi', 'arjun', 'kofi', 'amir', 'tariq',
]
const HANDLES = [
  'kaido', 'zeno', 'kiro', 'nova', 'jinx', 'echo', 'lynx', 'drake', 'ryu', 'kaze',
  'zed', 'axel', 'neo', 'kai', 'rex', 'ace', 'jet', 'zen', 'vex', 'nyx',
  'orbit', 'karma', 'omega', 'atlas', 'orion', 'hydra', 'kraken', 'wraith', 'fury', 'blitz',
  'noob', 'goat', 'sigma', 'sweat', 'camper', 'smurf', 'clutch', 'flick', 'combo', 'whiff',
  'lag', 'ping', 'afk', 'gg', 'ez', 'rip', 'oof', 'meh', 'pog', 'kek',
]
const MASH = ['azerty', 'qwerty', 'asdfgh', 'zxcvbn', 'wasd', 'qsdfg', 'poiuy', 'lkjhg', 'mnbvc', 'yxcvb', 'hjkl', 'uiop']
const SUFFIXES = ['', '', '', '', '', 'x', 'z', 'yt', 'ttv', 'off', 'pro', 'hd', '_', '69', '77', '99', '07', '2k', 'fr', 'xd', 'uwu', '.', 'tv', 'gg', '01']
const PREFIXES = ['', '', '', '', '', '', 'x', 'i', 'le', 'the', 'mr', 'ze', 'lil', 'not', 'og', 'its', 'real', 'im']
const LEET = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7' }
const ALL_WORDS = HANDLES.concat(NOUNS, FIRST_NAMES)
const TAGS = ['FR', 'EU', 'NA', 'TR', 'BR', 'DE', 'ES', 'IT', 'PL', 'RU', 'JP', 'MA']
const OPENERS = ['iam', 'just', 'only', 'simply', 'pure', 'trust', 'call']
const ALNUM = 'abcdefghjkmnpqrstuvwxyz23456789'

const TASTES = ['speed', 'hunt', 'defense']

const ROBOTS = [
  'james', 'jack', 'oliver', 'harry', 'george', 'charlie', 'thomas', 'william',
  'henry', 'jacob', 'ethan', 'mason', 'logan', 'ryan', 'kevin', 'brian',
  'scott', 'tyler', 'aaron', 'peter', 'frank', 'danny', 'eddie', 'gary',
  'greg', 'dave', 'mike', 'steve', 'tony', 'wayne', 'nick', 'walter',
  'emily', 'sophie', 'lily', 'amelia', 'olivia', 'grace', 'ruby', 'ellie',
  'molly', 'daisy', 'holly', 'katie', 'laura', 'sarah', 'alice', 'jenny',
  'kelly', 'wendy', 'nancy', 'betty', 'susan', 'donna', 'carol', 'megan',
  'rachel', 'julie', 'diane', 'joyce',
]

let easy = false

export function setBotBrains(weak) {
  easy = !!weak
}

const BUILDS = {
  speed: ['speed', 'fireRate', 'damage', 'bullet', 'hpStat', 'range', 'regen', 'pierce'],
  hunt: ['damage', 'pierce', 'bullet', 'range', 'fireRate', 'hpStat', 'speed', 'regen'],
  defense: ['hpStat', 'damage', 'regen', 'fireRate', 'range', 'pierce', 'speed', 'bullet'],
}

function mix(n) {
  let h = (n + 1) * 2654435761
  h ^= h >>> 15
  h = Math.imul(h, 2246822519)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

const STYLES = 21
const BLANKS = 2
const BATCH = STYLES + BLANKS
let batchKey = ''
let batchOrder = null

export function nameSalt() {
  return (Math.random() * 0x7fffffff) | 0
}

function orderForBatch(batch, salt) {
  const key = batch + '.' + salt
  if (batchKey === key) return batchOrder
  const t = []
  for (let i = 0; i < BATCH; i++) t.push(i)
  for (let i = BATCH - 1; i > 0; i--) {
    const j = mix(salt ^ (batch * 1009 + i)) % (i + 1)
    const v = t[i]
    t[i] = t[j]
    t[j] = v
  }
  batchKey = key
  batchOrder = t
  return t
}

function pickIn(list, h) {
  return list[h % list.length]
}

function upper(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function robotName(i) {
  const n = ((i % 4096) + 4096) % 4096
  return upper(ROBOTS[(n * 13) % ROBOTS.length]) + ' (bot)'
}

export function botName(i, salt) {
  const seed = salt | 0
  const place = orderForBatch(Math.floor(i / BATCH), seed)[((i % BATCH) + BATCH) % BATCH]
  if (place < BLANKS) return ''
  const style = place - BLANKS
  const h = mix(mix(i * 7 + 13) ^ seed)
  const a = h >>> 2
  const b = h >>> 8
  const c = h >>> 14
  const d = h >>> 20
  let name = ''
  if (style === 0) name = pickIn(FIRST_NAMES, a) + String(10 + (b % 90))
  else if (style === 1) name = pickIn(ADJ, a) + pickIn(NOUNS, b)
  else if (style === 2) name = pickIn(ADJ, a) + '_' + pickIn(NOUNS, b)
  else if (style === 3) name = upper(pickIn(ADJ, a)) + upper(pickIn(NOUNS, b))
  else if (style === 4) name = b % 3 ? pickIn(ALL_WORDS, a) : upper(pickIn(ALL_WORDS, a))
  else if (style === 5) name = pickIn(HANDLES, a) + pickIn(SUFFIXES, b)
  else if (style === 6) {
    let g = a
    for (let k = 0; k < 8; k++) {
      const word = pickIn(ALL_WORDS, g)
      name = word.replace(/[aeiost]/g, (x) => LEET[x])
      if (name !== word) break
      g = mix(g)
    }
  }
  else if (style === 7) name = 'xX' + pickIn(ALL_WORDS, a) + 'Xx'
  else if (style === 8) name = pickIn(ADJ, a).toUpperCase() + pickIn(NOUNS, b).toUpperCase()
  else if (style === 9) name = pickIn(NOUNS, a) + pickIn(NOUNS, a).slice(-1).repeat(2 + (b % 3))
  else if (style === 10) name = pickIn(PREFIXES, a) + upper(pickIn(HANDLES, b))
  else if (style === 11) name = pickIn(MASH, a) + String(b % 1000)
  else if (style === 12) name = pickIn(ALL_WORDS, a).split('').join('.')
  else if (style === 13) name = pickIn(FIRST_NAMES, a) + upper(pickIn(FIRST_NAMES, b))
  else if (style === 14) name = pickIn(FIRST_NAMES, a) + pickIn(SUFFIXES, b)
  else if (style === 15) name = pickIn(TAGS, a) + '|' + pickIn(ALL_WORDS, b)
  else if (style === 16) {
    const word = pickIn(ALL_WORDS, a)
    name = ''
    for (let k = 0; k < word.length; k++) name += k % 2 ? word.charAt(k).toUpperCase() : word.charAt(k)
  } else if (style === 17) name = String(10 + (b % 90)) + pickIn(ALL_WORDS, a)
  else if (style === 18) name = pickIn(NOUNS, a) + pickIn(NOUNS, a)
  else if (style === 19) {
    name = ''
    let g = a
    const size = 4 + (b % 3)
    for (let k = 0; k < size; k++) {
      name += ALNUM.charAt(g % ALNUM.length)
      g = mix(g)
    }
  } else name = pickIn(OPENERS, a) + pickIn(ALL_WORDS, b)
  if (!name) name = pickIn(ALL_WORDS, c)
  if (name.length < 9 && style > 5 && style < 15 && style !== 7 && style !== 11 && style !== 12 && d % 4 === 0) name += pickIn(SUFFIXES, d)
  return name.slice(0, 12)
}

function buildPlan(taste, soft) {
  const out = BUILDS[taste].slice()
  for (let i = out.length - 1; i > 0; i--) {
    if (!soft && Math.random() > 0.28) continue
    const swap = out[i]
    out[i] = out[i - 1]
    out[i - 1] = swap
  }
  return out
}

export function initAi(b) {
  const soft = easy && !!b.isBot
  const taste = TASTES[Math.floor(Math.random() * TASTES.length)]
  b.weak = soft
  b.ai = {
    state: 'wander',
    think: Math.random() * 0.5,
    tx: b.x,
    tz: b.z,
    target: null,
    boldness: soft ? waitFor(EASY.boldness) : 0.45 + Math.random() * 0.7,
    skill: soft ? waitFor(EASY.skill) : 0.26 + Math.random() * 0.46,
    weak: soft,
    slow: soft ? EASY.think : 1,
    err: 0,
    aim: 0.8,
    hold: 0.4 + Math.random() * 0.6,
    morphIn: waitFor(BOTS.morphDelay),
    clickIn: waitFor(BOTS.clickDelay),
    lastX: b.x,
    lastZ: b.z,
    strafe: Math.random() < 0.5 ? -1 : 1,
    spent: 0.5,
    blocked: 0,
    avoid: 0,
    duckFor: 0,
    duckCd: 0,
    duckX: 0,
    duckZ: 0,
    ignore: null,
    ignoreFor: 0,
    seenFoe: null,
    seenX: 0,
    seenZ: 0,
    ghostFor: 0,
    zoner: Math.random() < 0.35,
    wanderRing: Math.random(),
    taste: taste,
    plan: buildPlan(taste, soft),
  }
}

function spendOne(b) {
  let used = 0
  for (const c of UPGRADES.list) used += b.comp[c.id] || 0
  if (used >= (b.ai.weak ? EASY.maxComp : BOTS.maxComp)) return false
  for (const id of b.ai.plan) if (spendPoint(b, id)) return true
  return false
}

function waitFor(range) {
  return range[0] + Math.random() * (range[1] - range[0])
}

function pickMorph(b) {
  const list = b.def.next
  const liked = []
  for (const id of list) if (CREATURES[id].branch === b.ai.taste) liked.push(id)
  const pool = liked.length ? liked : list
  return pool[Math.floor(Math.random() * pool.length)]
}

function aimAhead(b, t, dist, ai) {
  const flight = b.def.shot.speed * b.mods.bullet
  const span = (b.def.range * b.mods.range) / flight
  let lead = Math.min(span, dist / flight)
  let x = t.x + t.vx * lead - b.x
  let z = t.z + t.vz * lead - b.z
  lead = Math.min(span, Math.hypot(x, z) / flight) * ai.aim
  x = t.x + t.vx * lead - b.x
  z = t.z + t.vz * lead - b.z
  const c = Math.cos(ai.err)
  const s = Math.sin(ai.err)
  return { x: x * c - z * s, z: x * s + z * c }
}

function threatScore(b) {
  const t = b.def.shot
  const salvo = (t.nb || 1) * (t.burst || 1)
  const dps = (b.def.damage * salvo * (t.power || 1) * b.mods.damage * b.mods.fireRate) / b.def.cooldown
  const raw = b.def.hp * b.mods.hpStat * 0.5 + dps * 3.4 + b.def.range * b.mods.range * 1.6
  return raw * (0.35 + 0.65 * (b.hp / b.maxHp))
}

function pickWanderTarget(b) {
  const ai = b.ai
  const bias = Math.min(1, (b.tier + ai.boldness) / 3.4)
  const maxD = ARENA.half * (1 - bias * 0.72)
  const minD = Math.max(4, ARENA.half * (0.18 - bias * 0.16))
  const d = minD + Math.random() * Math.max(6, maxD - minD)
  const [x, z] = squarePoint(d)
  ai.tx = x
  ai.tz = z
}

function nearestFood(food, b) {
  let best = null
  let bs = 0
  const reach = 34 + b.tier * 9
  const far = reach * reach
  for (const g of food.groups) {
    const value = ARENA.rings[g.ring].food
    for (let i = 0; i < g.items.length; i++) {
      const it = g.items[i]
      if (!it.alive) continue
      if (b.team && baseAt(it.x) !== null) continue
      const dx = it.x - b.x
      const dz = it.z - b.z
      const d2 = dx * dx + dz * dz
      if (d2 > far) continue
      const s = value / (Math.sqrt(d2) + 12)
      if (s > bs) {
        bs = s
        best = it
      }
    }
  }
  return best
}

function onScreen(b, o) {
  const mine = CAM.height + b.def.size * CAM.sizeFactor
  const theirs = CAM.height + o.def.size * CAM.sizeFactor
  const dx = o.x - b.x
  const dz = o.z - b.z
  if (Math.abs(dx) > Math.min(mine, theirs) * CAM.seeWide) return false
  if (dz < -Math.min(mine * CAM.seeFar, theirs * CAM.seeNear)) return false
  if (dz > Math.min(mine * CAM.seeNear, theirs * CAM.seeFar)) return false
  return true
}

function dodge(b, world, reflex) {
  let soon = Infinity
  let px = 0
  let pz = 0
  for (const s of world.shots) {
    if (s.owner === b || sameTeam(s.owner, b)) continue
    const rx = s.x - b.x
    const rz = s.z - b.z
    const d2 = rx * rx + rz * rz
    if (d2 > 324) continue
    const sp2 = s.vx * s.vx + s.vz * s.vz
    if (sp2 < 0.01) continue
    const t = -(rx * s.vx + rz * s.vz) / sp2
    if (t <= reflex || t > 0.5 || t >= soon) continue
    const mx = rx + s.vx * t
    const mz = rz + s.vz * t
    const near = b.bodyRadius + s.radius + 0.6
    const md2 = mx * mx + mz * mz
    if (md2 > near * near) continue
    soon = t
    const md = Math.sqrt(md2)
    if (md > 0.3) {
      px = -mx / md
      pz = -mz / md
    } else {
      const sp = Math.sqrt(sp2)
      px = -s.vz / sp
      pz = s.vx / sp
    }
  }
  return soon < Infinity ? { x: px, z: pz } : null
}

export function stepAi(b, dt, world, hooks) {
  const ai = b.ai
  if (!ai) return

  if (b.points > 0) {
    ai.clickIn -= dt
    if (ai.clickIn <= 0) {
      ai.clickIn = waitFor(BOTS.clickDelay)
      spendOne(b)
    }
  }

  if (b.pendingMorph && b.def.next.length) {
    ai.morphIn -= dt
    if (ai.morphIn <= 0) {
      ai.morphIn = waitFor(BOTS.morphDelay)
      const pick = pickMorph(b)
      morphBeingState(b, pick)
      if (canEvolve(b)) b.pendingMorph = true
      hooks.onMorph(b, pick)
      hooks.onBotMorph(b)
    }
  }

  ai.hold -= dt
  ai.think -= dt
  if (world.reveal) ai.think = 0
  ai.ignoreFor -= dt
  ai.avoid -= dt
  ai.duckFor -= dt
  ai.duckCd -= dt
  ai.ghostFor -= dt
  if (ai.think <= 0) {
    const spent = ai.spent
    ai.spent = (0.3 + Math.random() * 0.4) * ai.slow
    ai.think = ai.spent
    ai.err = (1 - ai.skill) * 0.34 * (Math.random() * 2 - 1)
    ai.aim = 0.5 + ai.skill * 0.45
    const crawled = b.def.speed * b.mods.speed * spent * 0.3
    const stalled = Math.hypot(b.x - ai.lastX, b.z - ai.lastZ) < crawled
    if (!stalled) ai.blocked = 0
    else {
      ai.blocked++
      ai.strafe = -ai.strafe
      if (ai.blocked >= 3) {
        if (ai.state === 'chase') {
          ai.ignore = ai.target
          ai.ignoreFor = 5
        } else {
          ai.avoid = 1.4
          pickWanderTarget(b)
        }
        ai.blocked = 0
      }
    }
    ai.lastX = b.x
    ai.lastZ = b.z
    ai.mate = null
    if (b.team) {
      let md = MATE_SPACE
      for (const o of world.beings) {
        if (o === b || !o.alive || o.team !== b.team) continue
        const d = Math.hypot(o.x - b.x, o.z - b.z)
        if (d < md) {
          md = d
          ai.mate = o
        }
      }
    }
    const mine = threatScore(b)
    const oldTarget = ai.target
    let prey = null
    let predator = null
    let rival = null
    let preyScore = 0
    let preyD = Infinity
    let predD = Infinity
    let rivalD = Infinity
    for (const o of world.beings) {
      if (o === b || !o.alive || sameTeam(b, o)) continue
      if (o === ai.ignore && ai.ignoreFor > 0) continue
      if (!onScreen(b, o)) continue
      const d = Math.hypot(o.x - b.x, o.z - b.z)
      if (o.hidden && o.bush !== b.bush && d > BUSHES.reveal) continue
      const theirs = threatScore(o)
      if (theirs < mine * (0.72 + ai.boldness * 0.3)) {
        const s = mine / theirs / (d + 8)
        if (s > preyScore) {
          prey = o
          preyScore = s
          preyD = d
        }
      } else if (theirs > mine * 1.45) {
        if (d < predD) {
          predator = o
          predD = d
        }
      } else if (d < rivalD) {
        rival = o
        rivalD = d
      }
    }

    const reach = b.def.range * b.mods.range
    if (predator && predD < predator.def.range * predator.mods.range * 0.85) {
      ai.state = 'flee'
      ai.target = predator
    } else if (prey && preyD < reach * (0.9 + ai.boldness * 0.5)) {
      ai.state = 'chase'
      ai.target = prey
    } else if (rival && rivalD < reach * (b.team ? 0.85 : 0.5 + ai.boldness * 0.3)) {
      ai.state = 'chase'
      ai.target = rival
    } else if (ai.zoner && b.team && world.activeZone && world.activeZone.team !== b.team) {
      ai.state = 'objective'
      ai.tx = world.activeZone.x + (Math.random() * 2 - 1) * ZONE.radius * 0.55
      ai.tz = world.activeZone.z + (Math.random() * 2 - 1) * ZONE.radius * 0.55
    } else {
      const f = nearestFood(world.food, b)
      if (f) {
        ai.state = 'feed'
        ai.tx = f.x
        ai.tz = f.z
      } else {
        ai.state = 'wander'
        pickWanderTarget(b)
      }
      ai.target = null
    }
    if (ai.target && ai.target !== oldTarget) ai.hold = 0.25 + (1 - ai.skill) * 0.55
    if (ai.target && !ai.target.hidden) {
      ai.seenFoe = ai.target
      ai.seenX = ai.target.x
      ai.seenZ = ai.target.z
      ai.ghostFor = 0
    } else if (!ai.target && oldTarget && oldTarget === ai.seenFoe && oldTarget.alive && oldTarget.hidden) {
      ai.ghostFor = 2.4 + Math.random() * 1.4
    }
    if (!ai.target && ai.ghostFor > 0) {
      ai.state = 'suppress'
      ai.tx = ai.seenX
      ai.tz = ai.seenZ
    }
  }

  let dx = 0
  let dz = 0
  let face = null
  let target = null
  let aimX = 0
  let aimZ = 0

  if (ai.state === 'flee' && ai.target && ai.target.alive) {
    const t = ai.target
    dx = b.x - t.x
    dz = b.z - t.z
    if (arenaDist(b.x, b.z) > ARENA.half - 14) {
      const d = Math.hypot(b.x, b.z) || 1
      dx -= (b.x / d) * 16
      dz -= (b.z / d) * 16
    }
    const away = Math.hypot(t.x - b.x, t.z - b.z) || 0.001
    if (away < b.def.range * b.mods.range * 0.82) {
      target = t
      face = aimAhead(b, t, away, ai)
      aimX = face.x
      aimZ = face.z
    } else {
      face = { x: dx, z: dz }
    }
  } else if (ai.state === 'chase' && ai.target && ai.target.alive) {
    const t = ai.target
    target = t
    dx = t.x - b.x
    dz = t.z - b.z
    const dist = Math.hypot(dx, dz) || 0.001
    const ideal = b.def.range * b.mods.range * 0.62
    face = aimAhead(b, t, dist, ai)
    aimX = face.x
    aimZ = face.z
    if (dist < ideal * 0.66) {
      dx = -dx
      dz = -dz
    } else if (dist < ideal * 1.1) {
      dx = (-(t.z - b.z) / dist) * ai.strafe
      dz = ((t.x - b.x) / dist) * ai.strafe
    }
  } else if (ai.state === 'suppress') {
    dx = ai.seenX - b.x
    dz = ai.seenZ - b.z
    const dist = Math.hypot(dx, dz) || 0.001
    face = { x: dx, z: dz }
    aimX = dx
    aimZ = dz
    if (dist < b.def.range * b.mods.range * 0.55) {
      const ox = dx
      dx = (-dz / dist) * ai.strafe
      dz = (ox / dist) * ai.strafe
    }
  } else {
    dx = ai.tx - b.x
    dz = ai.tz - b.z
    if (ai.state === 'wander' && Math.hypot(dx, dz) < 2.2) pickWanderTarget(b)
  }

  let m = Math.hypot(dx, dz)
  if (m > 0.001) {
    dx /= m
    dz /= m
  }

  if (ai.blocked > 0 || ai.avoid > 0) {
    const sx = -dz * ai.strafe
    const sz = dx * ai.strafe
    dx = dx * 0.3 + sx
    dz = dz * 0.3 + sz
  }

  if (ai.duckCd <= 0 && ai.skill > 0.62) {
    const duck = dodge(b, world, 0.18 + (1 - ai.skill) * 0.3)
    if (duck) {
      ai.duckX = duck.x
      ai.duckZ = duck.z
      ai.duckFor = 0.26
      ai.duckCd = 0.55 + (1 - ai.skill) * 1.2
    }
  }
  if (ai.duckFor > 0) {
    const w = 0.3 + ai.skill * 0.45
    dx += ai.duckX * w
    dz += ai.duckZ * w
  }

  if (ai.mate && ai.mate.alive) {
    const mx = b.x - ai.mate.x
    const mz = b.z - ai.mate.z
    const md = Math.hypot(mx, mz)
    if (md < MATE_SPACE && md > 0.001) {
      const push = (MATE_SPACE - md) / MATE_SPACE
      dx += (mx / md) * push * 1.4
      dz += (mz / md) * push * 1.4
    }
  }

  m = Math.hypot(dx, dz)
  if (m > 0.001) {
    dx /= m
    dz /= m
  }

  if (b.team) {
    const wall = ARENA.half - BASES.depth
    if (b.team === 'red' && b.x > wall - 10) dx = Math.min(dx, -0.5)
    if (b.team === 'blue' && b.x < -wall + 10) dx = Math.max(dx, 0.5)
  }

  stepBeingState(b, dt, dx, dz, world, face)

  if (target && b.cd <= 0) {
    const ddx = target.x - b.x
    const ddz = target.z - b.z
    const dist = Math.hypot(ddx, ddz) || 0.001
    const am = Math.hypot(aimX, aimZ) || 0.001
    const aligned = (Math.sin(b.yaw) * aimX + Math.cos(b.yaw) * aimZ) / am
    const band = b.team ? baseAt(target.x) : null
    const walled =
      (band !== null && band !== b.team) ||
      lineBlocked(world.grid, b.x, b.z, target.x, target.z, SHOT.radiusPerTier[b.def.tier])
    if (ai.hold <= 0 && !walled && onScreen(b, target) && dist < b.def.range * b.mods.range * 0.82 && aligned > 0.93) {
      tryAttack(b, world, hooks)
      ai.hold = 0.08 + (1 - ai.skill) * 0.45
    }
  }

  if (!target && ai.state === 'suppress' && b.cd <= 0) {
    const ddx = ai.seenX - b.x
    const ddz = ai.seenZ - b.z
    const dist = Math.hypot(ddx, ddz) || 0.001
    const aligned = (Math.sin(b.yaw) * ddx + Math.cos(b.yaw) * ddz) / dist
    const walled = lineBlocked(world.grid, b.x, b.z, ai.seenX, ai.seenZ, SHOT.radiusPerTier[b.def.tier])
    if (ai.hold <= 0 && !walled && dist < b.def.range * b.mods.range * 0.82 && aligned > 0.9) {
      tryAttack(b, world, hooks)
      ai.hold = 0.35 + (1 - ai.skill) * 0.7
    }
  }
}

export { CREATURES }
