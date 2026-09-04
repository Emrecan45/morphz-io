import { ARENA, ZONE } from '../config.js'
import { addXp } from './being.js'

export function createZoneState() {
  return { active: null, nextIn: ZONE.firstDelay, captures: 0, previous: null }
}

function placeZone(state) {
  const range = ARENA.half - ZONE.radius - 6
  for (let i = 0; i < 30; i++) {
    const z = (Math.random() * 2 - 1) * range
    if (state.previous && Math.abs(state.previous.z - z) < range * 0.5) continue
    return { x: 0, z }
  }
  return { x: 0, z: (Math.random() * 2 - 1) * range }
}

function insiders(world, zone) {
  const inside = { red: [], blue: [] }
  const r2 = ZONE.radius * ZONE.radius
  for (const b of world.beings) {
    if (!b.alive || !b.team) continue
    const dx = b.x - zone.x
    const dz = b.z - zone.z
    if (dx * dx + dz * dz <= r2) inside[b.team].push(b)
  }
  return inside
}

export function stepZone(state, dt, world, match, hooks) {
  if (!state.active) {
    world.activeZone = null
    state.nextIn -= dt
    if (state.nextIn <= 0 && match.clock > 25) {
      const p = placeZone(state)
      state.active = { x: p.x, z: p.z, gauge: 0, contested: false, hold: { red: 0, blue: 0 } }
      state.previous = p
      hooks.onZoneOpen(state.active)
    }
    return
  }

  const z = state.active
  const inside = insiders(world, z)
  const n = { red: inside.red.length, blue: inside.blue.length }
  const alone = n.red > 0 && n.blue === 0 ? 'red' : n.blue > 0 && n.red === 0 ? 'blue' : null
  z.contested = n.red > 0 && n.blue > 0
  const before = alone ? z.hold[alone] : 0

  if (alone) {
    const dir = alone === 'blue' ? 1 : -1
    const presentCount = alone === 'blue' ? n.blue : n.red
    z.gauge += dir * ZONE.speed * (1 + Math.min(2, presentCount - 1) * 0.35) * dt
    z.gauge = Math.max(-100, Math.min(100, z.gauge))
  } else if (!z.contested) {
    const decay = ZONE.decayRate * dt
    if (z.gauge > 0) z.gauge = Math.max(0, z.gauge - decay)
    else if (z.gauge < 0) z.gauge = Math.min(0, z.gauge + decay)
  }

  const holder = z.contested ? null : holdingTeam(z)
  if (holder) z.hold[holder] = Math.min(100, z.hold[holder] + (dt / ZONE.holdTime) * 100)

  if (alone && z.hold[alone] > before) {
    z.beat = (z.beat || 0) + dt
    while (z.beat >= 1) {
      z.beat -= 1
      for (const b of inside[alone]) addXp(b, ZONE.hold)
    }
  } else {
    z.beat = 0
  }

  if (holder && z.hold[holder] >= 100) {
    state.captures++
    for (const b of world.beings) {
      if (b.alive && b.team === holder) addXp(b, ZONE.capture)
    }
    state.active = null
    state.nextIn = ZONE.between
    world.activeZone = null
    hooks.onZoneTaken(holder)
    return
  }

  world.activeZone = z
}

export function holdingTeam(z) {
  if (Math.abs(z.gauge) < 99.5) return null
  return z.gauge >= 0 ? 'blue' : 'red'
}

export function readZone(state) {
  const z = state && state.active
  if (!z) return null
  return {
    part: Math.round(Math.abs(z.gauge)),
    side: z.gauge >= 0 ? 'blue' : 'red',
    team: holdingTeam(z),
    red: Math.round(z.hold.red),
    blue: Math.round(z.hold.blue),
  }
}
