export const ARENA = {
  half: 150,
  rings: [
    { name: 'The Rim', from: 86, to: 150, food: 2, color: 0x6f9e52, density: 1 },
    { name: 'The Pits', from: 38, to: 86, food: 6, color: 0xb8863a, density: 0.8 },
    { name: 'The Core', from: 0, to: 38, food: 16, color: 0x79479e, density: 0.55 },
  ],
}

export const EDGE = 1.5

export function arenaDist(x, z) {
  return Math.max(Math.abs(x), Math.abs(z))
}

export function squarePoint(d, rng) {
  const draw = rng || Math.random
  const side = Math.floor(draw() * 4)
  const u = (draw() * 2 - 1) * d
  if (side === 0) return [u, -d]
  if (side === 1) return [u, d]
  if (side === 2) return [-d, u]
  return [d, u]
}

export const ROCKS = {
  count: 200,
  min: 0.7,
  max: 2.0,
}

export const TREES = {
  count: 300,
  min: 0.9,
  max: 2.4,
}

export const BUSHES = {
  count: 110,
  min: 2.4,
  max: 4.2,
  reveal: 4,
}

export const TIER_LEVEL = [1, 5, 10, 15]

export const FOOD = {
  count: 1200,
  radius: 0.42,
  respawn: 2.2,
}

export const CAM = {
  height: 23,
  tilt: 0.5,
  sizeFactor: 5.4,
  lerp: 6,
  overlayRef: 19,
  seeWide: 0.78,
  seeFar: 0.63,
  seeNear: 0.41,
}

export const CAM_PULL = Math.tan(CAM.tilt)
export const CAM_PITCH = -Math.PI / 2 + CAM.tilt

export const LOOT = {
  part: 0.42,
  killShare: 0.34,
  min: 3,
  max: 170,
  topShare: 0.62,
  topSlots: 0.7,
}

export const BOTS = {
  population: 40,
  spread: 6,
  respawn: 2.5,
  damage: 0.55,
  keptXp: 0.5,
  keptCap: 620,
  maxComp: 10,
  morphDelay: [0.6, 1.6],
  clickDelay: [0.22, 0.5],
  seed: [
    { share: 0.18, xp: [0, 110] },
    { share: 0.55, xp: [125, 445] },
    { share: 0.2, xp: [470, 1280] },
    { share: 0.07, xp: [1340, 2900] },
  ],
}

export const EASY = {
  skill: [0.02, 0.2],
  boldness: [0.55, 1.05],
  think: 1.8,
  damage: 0.62,
  maxComp: 4,
}

export const MODES = {
  solo: { name: 'Free for all', resume: 'Everyone against everyone.' },
  team: { name: 'Teams', resume: 'Endless duel. Entering the enemy base kills you.' },
}

export const ZONE = {
  radius: 18,
  firstDelay: 90,
  between: 48,
  speed: 6.4,
  decayRate: 4,
  holdTime: 40,
  hold: 2,
  capture: 100,
  neutral: 0x9aa6b4,
}

export const BASES = {
  depth: 24,
}

export function baseAt(x) {
  if (x < -ARENA.half + BASES.depth) return 'red'
  if (x > ARENA.half - BASES.depth) return 'blue'
  return null
}

export const GOLD = 0xffe07a

export function cssHex(v) {
  return '#' + v.toString(16).padStart(6, '0')
}

export function treeTint(color) {
  const up = (v) => Math.round(v + (255 - v) * 0.2)
  const r = up((color >> 16) & 255)
  const g = up((color >> 8) & 255)
  const b = up(color & 255)
  return cssHex((r << 16) | (g << 8) | b)
}

export const TEAMS = {
  red: { name: 'Red', color: 0xf2503f, accent: 0x8f2418, emissive: 0x4a0f06 },
  blue: { name: 'Blue', color: 0x3f9bf2, accent: 0x184e8f, emissive: 0x062a5e },
}

export function teamLook(isPlayer, team) {
  if (team) return TEAMS[team]
  return isPlayer ? TEAMS.blue : TEAMS.red
}

export const SHOT = {
  maxSpread: 0.2,
  freeShots: 2,
  perShot: 0.035,
  radiusPerTier: [0.2, 0.22, 0.24, 0.26],
  recoilPerTier: [0, 0, 9, 14],
  recoilFade: 0.02,
}

export const REGEN = {
  delay: 5.5,
  rate: 0.055,
}

export const UPGRADES = {
  max: 5,
  xpPerLevel: 22,
  growth: 1.2,
  maxLevel: 15,
  pointsPerLevel: 1,
  pointsPerMorph: 2,
  list: [
    { id: 'regen', name: 'Regeneration', step: 0.16 },
    { id: 'hpStat', name: 'Max health', step: 0.09 },
    { id: 'damage', name: 'Damage', step: 0.09 },
    { id: 'pierce', name: 'Bullet health', step: 1 },
    { id: 'range', name: 'Range', step: 0.096 },
    { id: 'bullet', name: 'Bullet speed', step: 0.07 },
    { id: 'fireRate', name: 'Fire rate', step: 0.07 },
    { id: 'speed', name: 'Speed', step: 0.088 },
  ],
}

export function levelThreshold(n) {
  const u = UPGRADES
  return Math.round((u.xpPerLevel * (Math.pow(u.growth, n) - 1)) / (u.growth - 1))
}

export function levelForXp(xp) {
  let n = 1
  while (n < UPGRADES.maxLevel && xp >= levelThreshold(n)) n++
  return n
}

export const START = 'grub'

export const SPAWN = {
  minDistance: 44,
  attempts: 40,
  immunity: 2.4,
  keptXp: 0.6,
  keepFloor: 300,
  watch: 55,
  mate: 5,
  crowding: 4,
}

export const CREATURES = {
  grub: {
    name: 'Grub',
    role: 'a single weak bullet, short range',
    tier: 0,
    branch: 'neutral',
    size: 0.7,
    hp: 34,
    speed: 4.68,
    damage: 7,
    range: 8,
    cooldown: 0.95,
    shot: { pattern: 'bolt', nb: 1, speed: 6, pierce: 1, power: 0.7143 },
    value: 6,
    color: 0xccd3da,
    accent: 0xa8631a,
    body: { shape: 'blob', length: 1.25, legs: 0, tail: 2, horns: 0, spikes: 0, jaw: false, crest: false, fins: false, hit: { x: 0.441, r: 0.699, m: [[-0.683, 0.349], [-0.319, 0.399], [0.046, 0.413], [0.41, 0.477], [0.775, 0.342]] } },
    next: ['spinner', 'fang', 'carapace'],
  },

  spinner: {
    name: 'Spinner',
    role: 'a burst of two bullets',
    tier: 1,
    branch: 'speed',
    size: 0.84,
    hp: 95,
    speed: 4.32,
    damage: 19,
    range: 12,
    cooldown: 1.15,
    shot: { pattern: 'burst', burst: 2, burstGap: 0.18, nb: 1, speed: 6.9, pierce: 1, spread: 0.05, power: 0.7895 },
    value: 14,
    color: 0xf8c749,
    accent: 0x1c7d78,
    body: { shape: 'raptor', length: 1.5, legs: 2, tail: 4, horns: 0, spikes: 0, jaw: true, crest: true, fins: false, arms: true, hit: { x: 0.414, r: 0.859, m: [[-0.406, 0.455], [-0.026, 0.41], [0.354, 0.455], [0.734, 0.337], [1.114, 0.38]] } },
    next: ['blade', 'tracker'],
  },
  fang: {
    name: 'Fang',
    role: 'a bullet that goes through the enemy',
    tier: 1,
    branch: 'hunt',
    size: 0.84,
    hp: 95,
    speed: 4.8,
    damage: 19,
    range: 16,
    cooldown: 1.1,
    shot: { pattern: 'bolt', nb: 1, speed: 6, pierce: 1, through: 1, hull: 1, power: 1.3684 },
    value: 16,
    color: 0xe83b2e,
    accent: 0x18783f,
    body: { shape: 'quad', length: 1.5, legs: 4, tail: 3, horns: 0, spikes: 0, jaw: true, crest: false, fins: false, neck: 0.45, hit: { x: 0.453, r: 1.121, m: [[-0.37, 0.513], [0.11, 0.513], [0.589, 0.495], [1.069, 0.429], [1.549, 0.456]] } },
    next: ['sting', 'spitter'],
  },
  carapace: {
    name: 'Shell',
    role: 'three bullets in a fan',
    tier: 1,
    branch: 'defense',
    size: 0.84,
    hp: 95,
    speed: 4.32,
    damage: 19,
    range: 12,
    cooldown: 1.01,
    shot: { pattern: 'fan', nb: 3, angle: 0.2, speed: 6, pierce: 1, power: 0.4211 },
    value: 18,
    color: 0xa163f2,
    accent: 0x5b3a90,
    body: { shape: 'bulk', length: 1.3, legs: 4, tail: 2, horns: 0, spikes: 0, jaw: false, crest: false, fins: false, shell: true, hit: { x: 0.636, r: 0.873, m: [[-0.735, 0.464], [-0.325, 0.644], [0.085, 0.668], [0.495, 0.573], [0.905, 0.382]] } },
    next: ['colossus', 'hedgehog'],
  },

  blade: {
    name: 'Blade',
    role: 'a burst of three bullets',
    tier: 2,
    branch: 'speed',
    size: 0.98,
    hp: 180,
    speed: 3.96,
    damage: 34,
    range: 12,
    cooldown: 1.9,
    shot: { pattern: 'burst', burst: 3, burstGap: 0.18, nb: 1, speed: 6.9, pierce: 1, spread: 0.055, power: 0.4706 },
    value: 34,
    color: 0xf8c749,
    accent: 0x14837e,
    body: { shape: 'raptor', length: 1.9, legs: 2, tail: 6, horns: 0, spikes: 6, jaw: true, crest: false, fins: false, wings: true, arms: true, hit: { x: 0.414, r: 0.935, m: [[-0.531, 0.469], [-0.089, 0.469], [0.352, 0.469], [0.794, 0.389], [1.235, 0.396]] } },
    next: ['reaper'],
  },
  sting: {
    name: 'Sting',
    role: 'a poisoned bullet that goes through',
    tier: 2,
    branch: 'hunt',
    size: 0.98,
    hp: 180,
    speed: 3.96,
    damage: 28.9,
    range: 16,
    cooldown: 1.1,
    shot: { pattern: 'bolt', nb: 1, speed: 6, pierce: 1, spread: 0.05, through: 1, hull: 1, power: 0.5 },
    poison: { dps: 10.2, duration: 4 },
    value: 34,
    color: 0xe83b2e,
    accent: 0xd8f24a,
    body: { shape: 'serpent', length: 2.4, legs: 0, tail: 6, horns: 1, spikes: 0, jaw: true, crest: false, fins: true, hit: { x: 0.410, r: 1.033, m: [[-1.158, 0.397], [-0.533, 0.487], [0.093, 0.516], [0.718, 0.495], [1.344, 0.472]] } },
    next: ['viper'],
  },
  tracker: {
    name: 'Tracker',
    role: 'three bullets side by side',
    tier: 2,
    branch: 'speed',
    size: 0.98,
    hp: 180,
    speed: 4.4,
    damage: 34,
    range: 12,
    cooldown: 1.56,
    shot: { pattern: 'bolt', nb: 3, gap: 1.2, speed: 6.9, pierce: 1, power: 0.7059 },
    value: 40,
    color: 0xf8c749,
    accent: 0x146a83,
    body: { shape: 'raptor', length: 1.9, legs: 2, tail: 5, horns: 2, spikes: 0, jaw: true, crest: false, fins: true, arms: true, hit: { x: 0.414, r: 0.935, m: [[-0.531, 0.469], [-0.089, 0.469], [0.352, 0.469], [0.794, 0.389], [1.235, 0.396]] } },
    next: ['alpha'],
  },
  spitter: {
    name: 'Spitter',
    role: 'a heavy shell with recoil',
    tier: 2,
    branch: 'hunt',
    size: 0.98,
    hp: 180,
    speed: 3.35,
    damage: 34,
    range: 16,
    cooldown: 1.56,
    shot: { pattern: 'bolt', nb: 1, speed: 6, pierce: 1, through: 1, gift: 2, fat: 1.5, power: 2.9412 },
    value: 38,
    color: 0xe83b2e,
    accent: 0x0f7a3c,
    body: { shape: 'quad', length: 1.4, legs: 4, tail: 3, horns: 0, spikes: 0, jaw: true, crest: true, fins: true, neck: 0.75, hit: { x: 0.453, r: 1.219, m: [[-0.314, 0.52], [0.197, 0.52], [0.707, 0.41], [1.218, 0.427], [1.729, 0.464]] } },
    next: ['cannon'],
  },
  colossus: {
    name: 'Colossus',
    role: 'four bullets in a fan',
    tier: 2,
    branch: 'defense',
    size: 0.98,
    hp: 180,
    speed: 3.96,
    damage: 34,
    range: 12,
    cooldown: 1.15,
    shot: { pattern: 'fan', nb: 4, angle: 0.19, speed: 6, pierce: 1, power: 0.5882 },
    value: 44,
    color: 0xa163f2,
    accent: 0x452a76,
    body: { shape: 'bulk', length: 1.7, legs: 4, tail: 2, horns: 2, spikes: 4, jaw: true, crest: false, fins: false, shell: true, hit: { x: 0.636, r: 1.009, m: [[-0.968, 0.492], [-0.445, 0.664], [0.077, 0.688], [0.599, 0.595], [1.122, 0.492]] } },
    next: ['titan'],
  },
  hedgehog: {
    name: 'Hedgehog',
    role: 'six bullets all around',
    tier: 2,
    branch: 'defense',
    size: 0.98,
    hp: 180,
    speed: 3.96,
    damage: 34,
    range: 12,
    cooldown: 1.3,
    shot: { pattern: 'nova', nb: 6, speed: 6, pierce: 1, power: 0.6176 },
    value: 42,
    color: 0xa163f2,
    accent: 0x5a2b8c,
    body: { shape: 'blob', length: 1.15, legs: 4, tail: 1, horns: 0, spikes: 18, jaw: false, crest: false, fins: false, shell: true, hit: { x: 0.534, r: 0.734, m: [[-0.749, 0.396], [-0.38, 0.545], [-0.011, 0.565], [0.359, 0.545], [0.728, 0.396]] } },
    next: ['fortress'],
  },

  reaper: {
    name: 'Reaper',
    role: 'a burst of four bullets',
    tier: 3,
    branch: 'speed',
    size: 1.03,
    hp: 300,
    speed: 3.6,
    damage: 55,
    range: 12,
    cooldown: 2.39,
    shot: { pattern: 'burst', burst: 4, burstGap: 0.18, nb: 1, speed: 6.9, pierce: 1, spread: 0.06, power: 0.4364 },
    value: 95,
    color: 0xf8c749,
    accent: 0x0a6f78,
    emissive: 0x0e8f96,
    body: { shape: 'raptor', length: 2.4, legs: 2, tail: 9, horns: 4, spikes: 10, jaw: true, crest: true, fins: false, wings: true, arms: true, hit: { x: 0.414, r: 1.032, m: [[-0.686, 0.487], [-0.167, 0.488], [0.352, 0.488], [0.871, 0.448], [1.39, 0.419]] } },
    next: [],
  },
  viper: {
    name: 'Viper',
    role: 'one poisoned bullet ahead and one behind',
    tier: 3,
    branch: 'hunt',
    size: 1.03,
    hp: 300,
    speed: 3.6,
    damage: 46.8,
    range: 16,
    cooldown: 1.1,
    shot: { pattern: 'nova', nb: 2, speed: 6, pierce: 1, spread: 0.05, through: 1, hull: 1, power: 0.2909 },
    poison: { dps: 15.3, duration: 5 },
    value: 95,
    color: 0xe83b2e,
    accent: 0xe2ff52,
    emissive: 0x2f8f5a,
    body: { shape: 'serpent', length: 3.4, legs: 0, tail: 9, horns: 2, spikes: 6, jaw: true, crest: true, fins: true, hit: { x: 0.410, r: 1.220, m: [[-1.604, 0.481], [-0.796, 0.549], [0.011, 0.575], [0.818, 0.566], [1.626, 0.537]] } },
    next: [],
  },
  alpha: {
    name: 'Alpha',
    role: 'four bullets side by side',
    tier: 3,
    branch: 'speed',
    size: 1.03,
    hp: 300,
    speed: 4.0,
    damage: 55,
    range: 12,
    cooldown: 1.96,
    shot: { pattern: 'bolt', nb: 4, gap: 1.2, speed: 6.9, pierce: 1, power: 0.7273 },
    value: 110,
    color: 0xf8c749,
    accent: 0x0a5578,
    emissive: 0x8f3a06,
    body: { shape: 'raptor', length: 2.4, legs: 2, tail: 8, horns: 5, spikes: 3, jaw: true, crest: true, fins: true, arms: true, hit: { x: 0.414, r: 1.032, m: [[-0.686, 0.487], [-0.167, 0.488], [0.352, 0.488], [0.871, 0.448], [1.39, 0.419]] } },
    next: [],
  },
  cannon: {
    name: 'Cannon',
    role: 'a powerful heavy shell with recoil',
    tier: 3,
    branch: 'hunt',
    size: 1.03,
    hp: 300,
    speed: 3.05,
    damage: 55,
    range: 16,
    cooldown: 2.4,
    shot: { pattern: 'bolt', nb: 1, speed: 6, pierce: 1, through: 2, gift: 2, hull: 1, fat: 1.5, power: 2.7273 },
    value: 105,
    color: 0xe83b2e,
    accent: 0x07743c,
    emissive: 0x9a5c08,
    body: { shape: 'quad', length: 2.1, legs: 4, tail: 5, horns: 4, spikes: 3, jaw: true, crest: true, fins: false, neck: 1.15, hit: { x: 0.453, r: 1.526, m: [[-0.509, 0.57], [0.182, 0.57], [0.873, 0.543], [1.564, 0.457], [2.255, 0.519]] } },
    next: [],
  },
  titan: {
    name: 'Titan',
    role: 'five bullets in a fan',
    tier: 3,
    branch: 'defense',
    size: 1.12,
    hp: 300,
    speed: 3.6,
    damage: 55,
    range: 12,
    cooldown: 1.3,
    shot: { pattern: 'fan', nb: 5, angle: 0.17, speed: 6, pierce: 1, power: 0.3273 },
    value: 125,
    color: 0xa163f2,
    accent: 0x3a1b70,
    emissive: 0x4a1f9e,
    body: { shape: 'bulk', length: 2, legs: 4, tail: 3, horns: 4, spikes: 10, jaw: true, crest: false, fins: false, shell: true, hit: { x: 0.636, r: 1.077, m: [[-1.15, 0.511], [-0.557, 0.678], [0.036, 0.702], [0.628, 0.678], [1.221, 0.511]] } },
    next: [],
  },
  fortress: {
    name: 'Fortress',
    role: 'eight bullets all around',
    tier: 3,
    branch: 'defense',
    size: 1.12,
    hp: 300,
    speed: 3.6,
    damage: 55,
    range: 12,
    cooldown: 1.49,
    shot: { pattern: 'nova', nb: 8, speed: 6, pierce: 1, power: 0.6727 },
    value: 118,
    color: 0xa163f2,
    accent: 0x64259c,
    emissive: 0x6a1f9e,
    body: { shape: 'blob', length: 1.35, legs: 4, tail: 1, horns: 2, spikes: 24, jaw: false, crest: false, fins: false, shell: true, hit: { x: 0.534, r: 0.815, m: [[-0.885, 0.409], [-0.462, 0.554], [-0.039, 0.575], [0.384, 0.554], [0.807, 0.427]] } },
    next: [],
  },
}
