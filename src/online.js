import { CREATURES } from './config.js'

const SHAPES = Object.keys(CREATURES)
const SHAPE_INDEX = {}
SHAPES.forEach((id, i) => {
  SHAPE_INDEX[id] = i
})

export const STATE_RATE = 1 / 13
export const INPUT_RATE = 1 / 18
export const DIGEST_RATE = 1 / 3
export const VIEW_RADIUS = 78

const TEAM_IDS = [null, 'red', 'blue']

function teamIdOf(team) {
  return team === 'red' ? 1 : team === 'blue' ? 2 : 0
}

function r2(v) {
  return Math.round(v * 100) / 100
}

export function encodeRoster(beings) {
  const list = []
  for (const b of beings) {
    if (!b.netId) continue
    list.push([b.netId, b.name, SHAPE_INDEX[b.defId], teamIdOf(b.team), b.isBot ? 1 : 0])
  }
  return list
}

export function encodeDigest(game) {
  const list = []
  for (const b of game.world.beings) {
    if (!b.netId) continue
    list.push([b.netId, Math.round(b.xp), b.alive ? 1 : 0, Math.floor(b.total)])
  }
  return list
}

export function encodeState(game, around) {
  const beings = []
  const range = VIEW_RADIUS * VIEW_RADIUS
  for (const b of game.world.beings) {
    if (!b.netId) continue
    if (around && b !== around) {
      const dx = b.x - around.x
      const dz = b.z - around.z
      if (dx * dx + dz * dz > range) continue
    }
    let flags = 0
    if (b.alive) flags |= 1
    if (b.immune > 0) flags |= 2
    if (b.hidden) flags |= 4
    if (b.poison) flags |= 8
    beings.push([
      b.netId,
      SHAPE_INDEX[b.defId],
      r2(b.x),
      r2(b.z),
      Math.round(b.yaw * 1000) / 1000,
      Math.round(b.hp),
      b.maxHp,
      Math.round(b.xp),
      b.level,
      flags,
      Math.round(b.moveRatio * 100) / 100,
      r2(b.vx),
      r2(b.vz),
    ])
  }
  const z = game.zones && game.zones.active
  const zone = z ? [r2(z.x), r2(z.z), r2(z.gauge), r2(z.hold.red), r2(z.hold.blue)] : null
  return [zone, beings]
}

export function encodeShot(s) {
  return [
    s.owner && s.owner.netId ? s.owner.netId : 0,
    r2(s.x),
    r2(s.z),
    r2(s.y),
    r2(s.vx),
    r2(s.vz),
    r2(s.life),
    s.radius,
    s.pierce,
    s.damage,
    s.color,
    teamIdOf(s.team),
    s.poison ? s.poison.dps : 0,
    s.poison ? s.poison.duration : 0,
    s.id || 0,
  ]
}

export function decodeShot(t, byId) {
  return {
    x: t[1],
    z: t[2],
    y: t[3],
    vx: t[4],
    vz: t[5],
    life: t[6],
    radius: t[7],
    pierce: t[8],
    damage: t[9],
    color: t[10],
    team: TEAM_IDS[t[11]],
    poison: t[12] ? { dps: t[12], duration: t[13] } : null,
    id: t[14] || 0,
    owner: byId(t[0]) || null,
    remote: true,
  }
}

export function shapeFrom(index) {
  return SHAPES[index] || SHAPES[0]
}

export function shapeIndex(id) {
  return SHAPE_INDEX[id] || 0
}

export function teamFrom(index) {
  return TEAM_IDS[index] || null
}

export function encodeFood(food) {
  const diff = []
  for (let g = 0; g < food.groups.length; g++) {
    const items = food.groups[g].items
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const moving = Math.abs(it.x - it.ix) > 0.01 || Math.abs(it.z - it.iz) > 0.01
      if (it.alive && !moving) continue
      diff.push([g, i, it.alive ? 1 : 0, r2(it.x), r2(it.z)])
    }
  }
  return diff
}

export function applyFood(food, diff, animate) {
  for (const [g, i, alive, x, z] of diff) {
    const group = food.groups[g]
    if (!group) continue
    const it = group.items[i]
    if (!it) continue
    it.alive = !!alive
    if (alive) {
      it.x = x
      it.z = z
      it.scale = animate ? 0 : 1
    } else {
      it.timer = 9999
    }
  }
}
