import { CREATURES, ARENA, BASES, BOTS, EASY, CAM, ZONE, BUSHES, SHOT, UPGRADES, arenaDist, squarePoint, baseAt } from './config.js'
import { stepBeingState, tryAttack, canEvolve, sameTeam, morphBeingState, spendPoint } from './world/being.js'
import { lineBlocked } from './blocks.js'
import { isProfane } from './nickname.js'

const MATE_SPACE = 9

const ADJ = [
  'dark', 'red', 'blue', 'ice', 'fire', 'mad', 'wild', 'lost', 'holy', 'evil',
  'fast', 'slow', 'big', 'tiny', 'old', 'raw', 'grim', 'pale', 'void', 'neon',
  'acid', 'iron', 'gold', 'jade', 'onyx', 'ash', 'dust', 'salt', 'rust', 'mint',
  'zero', 'ultra', 'mega', 'hyper', 'super', 'anti', 'poly', 'omni', 'nano', 'cyber',
  'night', 'day', 'sun', 'moon', 'star', 'sky', 'sea', 'snow', 'rain', 'mist',
  'soft', 'hard', 'lazy', 'busy', 'silly', 'angry', 'happy', 'sleepy', 'hungry', 'shiny',
  'toxic', 'brave', 'lucky', 'feral', 'noble', 'rogue', 'swift', 'quiet', 'loud', 'deep',
  'high', 'low', 'last', 'true', 'fake', 'burnt', 'frozen', 'molten', 'hollow', 'turbo',
  'green', 'pink', 'grey', 'white', 'black', 'amber', 'coral', 'lime', 'plum', 'teal',
  'atomic', 'cosmic', 'lunar', 'solar', 'astral', 'sharp', 'blunt', 'sour', 'sweet', 'spicy',
  'salty', 'crispy', 'fluffy', 'tipsy', 'dizzy', 'clumsy', 'grumpy', 'sneaky', 'cheeky', 'wobbly',
  'windy', 'foggy', 'muddy', 'dusty', 'rocky', 'sandy', 'icy', 'wet', 'dry', 'flat',
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
  'grub', 'larva', 'beetle', 'hornet', 'mantis', 'spider', 'leech', 'snail', 'gecko', 'lizard',
  'otter', 'badger', 'weasel', 'ferret', 'raven', 'falcon', 'magpie', 'heron', 'stork', 'goose',
  'mouse', 'shrew', 'stoat', 'lemur', 'tapir', 'bison', 'moose', 'llama', 'camel', 'gator',
  'titan', 'wizard', 'knight', 'goblin', 'troll', 'ogre', 'witch', 'druid', 'ranger', 'slayer',
  'warden', 'healer', 'caster', 'gunner', 'sniper', 'tracer', 'dasher', 'glider', 'vortex', 'nebula',
  'comet', 'meteor', 'crater', 'canyon', 'tundra', 'jungle', 'marsh', 'dune', 'cliff', 'cave',
  'ramen', 'tacos', 'pizza', 'kebab', 'sushi', 'cookie', 'muffin', 'cereal', 'butter', 'syrup',
  'potato', 'tomato', 'banana', 'cherry', 'lemon', 'peach', 'berry', 'kettle', 'teapot', 'pillow',
  'mirror', 'candle', 'button', 'pocket', 'hammer', 'wrench', 'magnet', 'rocket', 'laser', 'cable',
]
const FIRST_NAMES = [
  'lucas', 'enzo', 'noah', 'liam', 'mateo', 'ayaz', 'kylian', 'ines', 'lena', 'jade',
  'kevin', 'bryan', 'dylan', 'sofia', 'maya', 'nina', 'theo', 'gabin', 'rayan', 'sasha',
  'adam', 'ali', 'omar', 'yusuf', 'emre', 'mert', 'ivan', 'pavel', 'dimitri', 'milan',
  'alex', 'max', 'leo', 'hugo', 'jules', 'tom', 'sam', 'ben', 'nathan', 'ethan',
  'chloe', 'emma', 'lea', 'anna', 'zoe', 'lisa', 'kim', 'mia', 'eva', 'nora',
  'diego', 'pablo', 'carlos', 'marco', 'luca', 'nico', 'jonas', 'felix', 'oscar', 'viktor',
  'wei', 'chen', 'hiro', 'ken', 'yuki', 'ravi', 'arjun', 'kofi', 'amir', 'tariq',
  'yanis', 'ilyes', 'karim', 'samir', 'walid', 'bilal', 'hamza', 'idris', 'anwar', 'elias',
  'noam', 'levi', 'ezra', 'micah', 'stefan', 'radek', 'tomas', 'lukas', 'kamil', 'artur',
  'mikko', 'lars', 'sven', 'erik', 'nils', 'bjorn', 'finn', 'noel', 'remi', 'yann',
  'loic', 'clara', 'julie', 'marie', 'laila', 'amina', 'salma', 'rania', 'dalia', 'irina',
  'olga', 'katya', 'vera', 'polina', 'mina', 'yuna', 'hana', 'aiko', 'diya', 'kiran',
  'anaya', 'rohan', 'zara', 'nadia', 'leila', 'bruno', 'paulo', 'tiago', 'kwame', 'thabo',
]
const HANDLES = [
  'kaido', 'zeno', 'kiro', 'nova', 'jinx', 'echo', 'lynx', 'drake', 'ryu', 'kaze',
  'zed', 'axel', 'neo', 'kai', 'rex', 'ace', 'jet', 'zen', 'vex', 'nyx',
  'orbit', 'karma', 'omega', 'atlas', 'orion', 'hydra', 'kraken', 'wraith', 'fury', 'blitz',
  'noob', 'goat', 'sigma', 'sweat', 'camper', 'smurf', 'clutch', 'flick', 'combo', 'whiff',
  'lag', 'ping', 'afk', 'gg', 'ez', 'rip', 'oof', 'meh', 'pog', 'kek',
  'clip', 'frag', 'spawn', 'wipe', 'rush', 'peek', 'bait', 'mercy', 'venom', 'toxin',
  'raptor', 'katana', 'shogun', 'ronin', 'ninja', 'sensei', 'yokai', 'oni', 'tanuki', 'legend',
  'shadow', 'thor', 'loki', 'odin', 'freya', 'hermes', 'apollo', 'ares', 'zeus', 'hades',
  'sol', 'luna', 'vega', 'rigel', 'lyra', 'draco', 'cygnus', 'byte', 'null', 'root',
  'sudo', 'proxy', 'cache', 'kernel', 'daemon', 'sus', 'bruh', 'yolo', 'drip', 'based',
]
const MASH = ['azerty', 'qwerty', 'asdfgh', 'zxcvbn', 'wasd', 'qsdfg', 'poiuy', 'lkjhg', 'mnbvc', 'yxcvb', 'hjkl', 'uiop', 'sdfghj', 'ertyui', 'vbnmqs', 'azsxdc', 'qwezxc', 'wxcvbn', 'dfghjk', 'tyuiop', 'jkluio', 'nbvcxw']
const SUFFIXES = ['', '', '', '', '', 'x', 'z', 'yt', 'ttv', 'off', 'pro', 'hd', '_', '69', '77', '99', '07', '2k', 'fr', 'xd', 'uwu', '.', 'tv', 'gg', '01', '', '', '', '', 'io', 'inc', 'exe', 'ez', 'pk', 'v2', 'jr', '00', '10', '11', '12', '13', '21', '42', 'be', 'nl']
const PREFIXES = ['', '', '', '', '', '', 'x', 'i', 'le', 'the', 'mr', 'ze', 'lil', 'not', 'og', 'its', 'real', 'im', '', '', '', '', '', 'xx', 'yo', 'dr', 'sir', 'big', 'san', 'el', 'la', 'mc', 'von', 'ur', 'my']
const LEET = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7' }
const ALL_WORDS = HANDLES.concat(NOUNS, FIRST_NAMES)
const TAGS = ['FR', 'EU', 'NA', 'TR', 'BR', 'DE', 'ES', 'IT', 'PL', 'RU', 'JP', 'MA', 'UK', 'US', 'CA', 'NL', 'BE', 'PT', 'SE', 'NO', 'DK', 'FI', 'GR', 'RO', 'UA', 'CZ', 'HU', 'AR', 'MX', 'CO', 'IN', 'ID', 'PH', 'VN', 'KR', 'AU', 'ZA']
const OPENERS = ['iam', 'just', 'only', 'simply', 'pure', 'trust', 'call', 'imthe', 'notthe', 'always', 'never', 'still', 'why', 'sir', 'lord']
const ENDERS = ['plays', 'gamer', 'boi', 'man', 'guy', 'boss', 'kid', 'king', 'god', 'main', 'lord', 'club', 'crew', 'gang', 'team']
const GUESTS = ['guest', 'player', 'user', 'anon', 'noob', 'newbie', 'random', 'someone', 'nobody', 'unknown', 'visitor', 'rookie']
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

const SOLOS = 11
const PAIR_JOINS = ['', '_', '-', '.', ' ']
const PAIR_ONE = [ADJ, FIRST_NAMES, HANDLES, NOUNS, ALL_WORDS]
const PAIR_TWO = [NOUNS, HANDLES, FIRST_NAMES, ENDERS, ADJ]
const BODIES = SOLOS + PAIR_ONE.length * PAIR_TWO.length * PAIR_JOINS.length
const CAPS = 6
const LEETS = 3
const WRAPS = [['', ''], ['xX', 'Xx'], ['__', '__'], ['_', '_'], ['-', '-'], ['.', '']]
const HEADS = 6
const TAILS = 12
const REPEAT_TAIL = 1
const BLANK_ODDS = 9
const TRIES = 8
const LIMIT = 12
const FLOOR = 4

function odds(plain, rest) {
  const out = []
  for (let i = 0; i < plain; i++) out.push(0)
  for (const v of rest) out.push(v)
  return out
}

const CAP_ODDS = odds(6, [1, 1, 1, 2, 2, 3, 4, 5, 5])
const LEET_ODDS = odds(22, [1, 2])
const WRAP_ODDS = odds(26, [1, 2, 3, 4, 5])
const HEAD_ODDS = odds(18, [1, 1, 2, 3, 4, 5])
const TAIL_ODDS = odds(26, [1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 5, 6, 7, 8, 9, 10, 10, 11])
const JOIN_ODDS = odds(10, [1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4])
const PLAIN_SOLOS = 4
const SOLO_SHARE = 24
const ODD_SHARE = 30

export const NAME_FAMILIES = BODIES * CAPS * LEETS * WRAPS.length * HEADS * TAILS

export function nameSalt() {
  return (Math.random() * 0x7fffffff) | 0
}

function roll(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function pickBody() {
  const pick = Math.floor(Math.random() * 100)
  if (pick < SOLO_SHARE) return Math.floor(Math.random() * PLAIN_SOLOS)
  if (pick < ODD_SHARE) return PLAIN_SOLOS + Math.floor(Math.random() * (SOLOS - PLAIN_SOLOS))
  const one = Math.floor(Math.random() * PAIR_ONE.length)
  const two = Math.floor(Math.random() * PAIR_TWO.length)
  return SOLOS + (one * PAIR_TWO.length + two) * PAIR_JOINS.length + roll(JOIN_ODDS)
}

export function pickFamily() {
  const body = pickBody()
  const caps = roll(CAP_ODDS)
  const leet = roll(LEET_ODDS)
  const wrap = roll(WRAP_ODDS)
  const head = roll(HEAD_ODDS)
  const tail = roll(TAIL_ODDS)
  return ((((body * CAPS + caps) * LEETS + leet) * WRAPS.length + wrap) * HEADS + head) * TAILS + tail
}

function pickIn(list, h) {
  return list[h % list.length]
}

function pickUnder(list, h, max) {
  const start = h % list.length
  for (let k = 0; k < list.length; k++) {
    const word = list[(start + k) % list.length]
    if (word.length <= max) return word
  }
  return list[start].slice(0, max)
}

function upper(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function robotName(i) {
  const n = ((i % 4096) + 4096) % 4096
  return upper(ROBOTS[(n * 13) % ROBOTS.length]) + ' (bot)'
}

function headText(kind, h) {
  if (kind === 1) return pickIn(PREFIXES, h)
  if (kind === 2) return pickIn(OPENERS, h)
  if (kind === 3) return pickIn(TAGS, h) + '|'
  if (kind === 4) return '[' + pickIn(TAGS, h) + ']'
  if (kind === 5) return String(10 + (h % 90))
  return ''
}

function tailText(kind, h) {
  if (kind === 2) return pickIn(SUFFIXES, h)
  if (kind === 3) return String(10 + (h % 90))
  if (kind === 4) return String(2006 + (h % 16))
  if (kind === 5) return String(1000 + (h % 9000))
  if (kind === 6) return '_' + pickIn(TAGS, h)
  if (kind === 7) return 'x'.repeat(2 + (h % 3))
  if (kind === 8) return '(' + String(1 + (h % 9)) + ')'
  if (kind === 9) return '-' + String(10 + (h % 90))
  if (kind === 10) return pickIn(ENDERS, h)
  if (kind === 11) return '.' + pickIn(TAGS, h).toLowerCase()
  return ''
}

function noiseWord(h, size) {
  let out = ''
  let g = h
  for (let k = 0; k < size; k++) {
    out += ALNUM.charAt(g % ALNUM.length)
    g = mix(g)
  }
  return out
}

function strippedWord(h, room) {
  let g = h
  for (let k = 0; k < 10; k++) {
    const word = pickIn(ALL_WORDS, g)
    const cut = word.replace(/[aeiouy]/g, '')
    if (cut.length > 2 && cut.length < word.length && cut.length <= room) return cut
    g = mix(g)
  }
  return pickUnder(ALL_WORDS, g, room)
}

function soloBody(kind, room, h) {
  if (kind === 1) return pickUnder(HANDLES, h, room)
  if (kind === 2) return pickUnder(NOUNS, h, room)
  if (kind === 3) return pickUnder(FIRST_NAMES, h, room)
  if (kind === 4) return pickUnder(MASH, h, room)
  if (kind === 5) return pickUnder(GUESTS, h, room)
  if (kind === 6) return noiseWord(h, Math.min(room, 4 + (h % 3)))
  if (kind === 7 && room >= 5) return pickUnder(ALL_WORDS, h, (room + 1) >> 1).split('').join('.')
  if (kind === 8) return strippedWord(h, room)
  if (kind === 9 && room >= 7) return upper(pickUnder(FIRST_NAMES, h, room - 3)) + ' ' + upper(ALNUM.charAt(mix(h) % 23)) + '.'
  if (kind === 10 && room >= 6) {
    const twin = pickUnder(NOUNS, h, room >> 1)
    return twin + twin
  }
  return pickUnder(ALL_WORDS, h, room)
}

function pairBody(index, room, h) {
  let k = index - SOLOS
  const join = PAIR_JOINS[k % PAIR_JOINS.length]
  k = (k - (k % PAIR_JOINS.length)) / PAIR_JOINS.length
  const two = PAIR_TWO[k % PAIR_TWO.length]
  k = (k - (k % PAIR_TWO.length)) / PAIR_TWO.length
  const one = PAIR_ONE[k]
  const space = room - join.length
  if (space < 7) return { words: [pickUnder(one, h, room)], join: '' }
  const first = pickUnder(one, h, Math.min(7, space - 3))
  return { words: [first, pickUnder(two, mix(h), space - first.length)], join }
}

function cased(words, join, mode) {
  const flat = words.join(join)
  if (mode === 1) return upper(flat)
  if (mode === 2) return words.map(upper).join(join)
  if (mode === 3) return flat.toUpperCase()
  if (mode === 4) {
    let out = ''
    for (let k = 0; k < flat.length; k++) out += k % 2 ? flat.charAt(k).toUpperCase() : flat.charAt(k)
    return out
  }
  if (mode === 5) return words.length > 1 ? words[0] + join + upper(words[1]) : upper(flat)
  return flat
}

function leeted(text, mode) {
  if (mode === 1) return text.replace(/[aeiost]/g, (x) => LEET[x])
  if (mode === 2) return text.charAt(0) + text.slice(1).replace(/[aeiost]/g, (x) => LEET[x])
  return text
}

function familyName(family, h) {
  let n = family
  const tailKind = n % TAILS
  n = (n - tailKind) / TAILS
  const headKind = n % HEADS
  n = (n - headKind) / HEADS
  const wrapKind = n % WRAPS.length
  n = (n - wrapKind) / WRAPS.length
  const leet = n % LEETS
  n = (n - leet) / LEETS
  const caps = n % CAPS
  n = (n - caps) / CAPS
  const body = n % BODIES

  const a = h >>> 2
  const b = h >>> 8
  const c = h >>> 14

  let open = WRAPS[wrapKind][0]
  let close = WRAPS[wrapKind][1]
  let head = headText(headKind, a)
  let tail = tailText(tailKind, b)
  let bump = tailKind === REPEAT_TAIL ? 3 : 0
  let room = LIMIT - open.length - close.length - head.length - tail.length - bump
  if (room < FLOOR) {
    head = ''
    room = LIMIT - open.length - close.length - tail.length - bump
  }
  if (room < FLOOR) {
    tail = ''
    room = LIMIT - open.length - close.length - bump
  }
  if (room < FLOOR) {
    bump = 0
    room = LIMIT - open.length - close.length
  }

  let words
  let join = ''
  if (body < SOLOS) {
    words = [soloBody(body, room, c)]
  } else {
    const pair = pairBody(body, room, c)
    words = pair.words
    join = pair.join
  }
  let core = leeted(cased(words, join, caps), leet)
  if (bump && core) core += core.charAt(core.length - 1).repeat(2 + (b % 2))
  return (open + head + core + tail + close).slice(0, LIMIT)
}

export function botName(i, salt, family) {
  const seed = salt | 0
  const base = mix(mix(i * 7 + 13) ^ seed)
  if (base % 100 < BLANK_ODDS) return ''
  const slot = (((family | 0) % NAME_FAMILIES) + NAME_FAMILIES) % NAME_FAMILIES
  for (let k = 0; k < TRIES; k++) {
    const name = familyName(slot, mix(base ^ (k * 7919)))
    if (name && !isProfane(name)) return name
  }
  return ''
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
