import { CREATURES, ARENA, EDGE, TIER_LEVEL, BOTS, EASY, LOOT, REGEN, SHOT, SPAWN, UPGRADES, BASES, squarePoint, levelForXp, teamLook } from '../config.js'
import { forEachBlock, spotTaken } from '../blocks.js'
import { forEachNear } from './near.js'
import { hitbox } from './hitbox.js'
import { ringRadius } from './stance.js'

export function createBeingState(defId, name, isPlayer, team) {
  const def = CREATURES[defId]
  const g = hitbox(def.body)
  const comp = {}
  for (const c of UPGRADES.list) comp[c.id] = 0
  const mods = {}
  for (const c of UPGRADES.list) mods[c.id] = 1
  return {
    defId,
    def,
    name,
    isPlayer,
    team: team || null,
    comp,
    mods,
    points: 0,
    level: 1,
    regen: 0,
    total: 0,
    mesh: null,
    ring: null,
    label: null,
    bar: null,
    x: 0,
    z: 0,
    yaw: 0,
    vx: 0,
    vz: 0,
    hp: def.hp,
    maxHp: def.hp,
    radius: g.footprint * def.size,
    bodyRadius: g.body * def.size,
    bound: g.bound * def.size,
    stand: ringRadius(def),
    mask: g.mask.map((c) => [c[0] * def.size, c[1] * def.size]),
    xp: 0,
    tier: def.tier,
    cd: 0,
    bush: null,
    hidden: false,
    veil: 0,
    swing: 0,
    kx: 0,
    kz: 0,
    burstLeft: 0,
    burstWait: 0,
    hurt: 0,
    poison: null,
    immune: 0,
    alive: true,
    moveRatio: 0,
    pendingMorph: false,
    ai: null,
  }
}

export function morphBeingState(b, defId) {
  b.burstLeft = 0
  const def = CREATURES[defId]
  const g = hitbox(def.body)
  const before = b.maxHp
  if (def.tier > b.tier) b.points += UPGRADES.pointsPerMorph
  b.defId = defId
  b.def = def
  b.tier = def.tier
  b.maxHp = Math.round(def.hp * b.mods.hpStat)
  b.hp = Math.max(1, Math.min(b.maxHp, b.hp + b.maxHp - before))
  b.pendingMorph = false
  b.radius = g.footprint * def.size
  b.bound = g.bound * def.size
  b.stand = ringRadius(def)
  b.mask = g.mask.map((c) => [c[0] * def.size, c[1] * def.size])
  b.bodyRadius = g.body * def.size
  return b
}

export function placeBeingState(b, x, z) {
  b.x = x
  b.z = z
  b.vx = 0
  b.vz = 0
}

export function sameTeam(a, b) {
  return !!a && !!b && !!a.team && a.team === b.team
}

export function applyMods(b) {
  const mods = {}
  for (const c of UPGRADES.list) mods[c.id] = 1 + (b.comp[c.id] || 0) * c.step
  const ratio = b.maxHp ? b.hp / b.maxHp : 1
  b.mods = mods
  b.maxHp = Math.round(b.def.hp * mods.hpStat)
  b.hp = Math.min(b.maxHp, Math.max(1, b.maxHp * ratio))
}

export function spendPoint(b, id) {
  if (b.points <= 0 || b.comp[id] === undefined) return false
  if (b.comp[id] >= UPGRADES.max) return false
  b.comp[id]++
  b.points--
  applyMods(b)
  return true
}

export function shapeLevel(b) {
  const t = b.tier + 1
  return t < TIER_LEVEL.length ? TIER_LEVEL[t] : Infinity
}

export function canEvolve(b) {
  return b.def.next.length > 0 && b.level >= shapeLevel(b)
}

export function addXp(b, amount) {
  b.xp += amount
  b.total += amount
  const n = levelForXp(b.xp)
  if (n > b.level) {
    b.points += (n - b.level) * UPGRADES.pointsPerLevel
    b.level = n
  }
  if (canEvolve(b)) b.pendingMorph = true
}

export function stepBeingState(b, dt, dirX, dirZ, world, face) {
  if (!b.alive) return
  const def = b.def

  if (b.poison) {
    b.poison.t -= dt
    b.hp -= b.poison.dps * dt
    if (b.poison.t <= 0) b.poison = null
    if (b.hp <= 0) return
  }

  const vmax = def.speed * b.mods.speed
  const mag = Math.hypot(dirX, dirZ)
  const accel = vmax * 7
  if (mag > 0.02) {
    b.vx += (dirX / mag) * accel * dt
    b.vz += (dirZ / mag) * accel * dt
  }

  let fx = face ? face.x : dirX
  let fz = face ? face.z : dirZ
  const fm = Math.hypot(fx, fz)
  if (fm > 0.02) {
    const target = Math.atan2(fx / fm, fz / fm)
    let diff = target - b.yaw
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    b.yaw += diff * Math.min(1, dt * (face ? (face.snap ? 38 : 16) : 11))
  }

  const sp = Math.hypot(b.vx, b.vz)
  const max = vmax
  if (sp > max) {
    b.vx = (b.vx / sp) * max
    b.vz = (b.vz / sp) * max
  }
  const friction = Math.pow(0.0015, dt)
  b.vx *= friction
  b.vz *= friction

  b.x += b.vx * dt
  b.z += b.vz * dt

  if (b.kx || b.kz) {
    b.x += b.kx * dt
    b.z += b.kz * dt
    const drag = Math.pow(SHOT.recoilFade, dt)
    b.kx *= drag
    b.kz *= drag
    if (Math.abs(b.kx) + Math.abs(b.kz) < 0.05) {
      b.kx = 0
      b.kz = 0
    }
  }

  const limit = ARENA.half - 0.6
  if (b.x > limit || b.x < -limit) {
    b.x = Math.max(-limit, Math.min(limit, b.x))
    b.vx *= 0.4
  }
  if (b.z > limit || b.z < -limit) {
    b.z = Math.max(-limit, Math.min(limit, b.z))
    b.vz *= 0.4
  }

  pushOutOfBlocks(b, world.grid, b.bodyRadius)

  b.moveRatio = Math.min(1, Math.hypot(b.vx + b.kx, b.vz + b.kz) / max)
  b.regen = Math.max(0, b.regen - dt)
  if (b.regen <= 0 && b.hp < b.maxHp && !b.poison) {
    b.hp = Math.min(b.maxHp, b.hp + b.maxHp * REGEN.rate * b.mods.regen * dt)
  }
  b.cd = Math.max(0, b.cd - dt)
  b.swing = Math.max(0, b.swing - dt * 4.5)
  b.hurt = Math.max(0, b.hurt - dt * 3)
  b.immune = Math.max(0, b.immune - dt)

}

export function spreadOf(def, mods) {
  const base = def.shot.spread || 0
  if (!base) return 0
  const extra = (1 / def.cooldown) * ((mods ? mods.fireRate : 1) - 1)
  return Math.min(SHOT.maxSpread, base + Math.max(0, extra * SHOT.perShot))
}

function volleyOf(def, pattern) {
  const t = def.shot
  const nb = t.nb || 1
  const out = []
  if (pattern === 'nova') {
    for (let i = 0; i < nb; i++) out.push({ turn: (i / nb) * Math.PI * 2, lateral: 0 })
    return out
  }
  const angle = pattern === 'fan' ? t.angle || 0.2 : t.angle || 0
  const gap = t.gap || 0
  for (let i = 0; i < nb; i++) {
    const rank = i - (nb - 1) / 2
    out.push({ turn: rank * angle, lateral: rank * gap })
  }
  return out
}

function fireVolley(b, world, pattern) {
  const def = b.def
  const t = def.shot
  const flight = t.speed * b.mods.bullet
  const damage = def.damage * (t.power || 1) * b.mods.damage * (b.isBot ? BOTS.damage * (b.weak ? EASY.damage : 1) : 1)
  const reach = (def.range * b.mods.range) / flight
  const tint = teamLook(b.isPlayer, b.team).color
  const side = { x: Math.cos(b.yaw), z: -Math.sin(b.yaw) }
  const wobble = (Math.random() * 2 - 1) * spreadOf(def, b.mods)
  const radius = SHOT.radiusPerTier[def.tier] * (t.fat || 1)
  const ring = pattern === 'nova'
  const muzzle = b.stand
  const frontX = Math.sin(b.yaw)
  const frontZ = Math.cos(b.yaw)
  b.swing = 1
  const recoil = t.fat ? SHOT.recoilPerTier[def.tier] || 0 : 0
  if (recoil) {
    b.kx -= frontX * recoil
    b.kz -= frontZ * recoil
  }
  for (const shot of volleyOf(def, pattern)) {
    const yaw = b.yaw + shot.turn + wobble
    const dirX = Math.sin(yaw)
    const dirZ = Math.cos(yaw)
    const outX = ring ? dirX : frontX
    const outZ = ring ? dirZ : frontZ
    world.shots.push({
      id: ++world.shotCounter,
      x: b.x + outX * muzzle + side.x * shot.lateral,
      z: b.z + outZ * muzzle + side.z * shot.lateral,
      px: b.x + side.x * shot.lateral,
      pz: b.z + side.z * shot.lateral,
      y: def.size * 1.15,
      vx: dirX * flight,
      vz: dirZ * flight,
      life: reach,
      radius: radius,
      pierce: (t.pierce || 1) + (b.comp.pierce || 0) + (t.gift || 0) + (t.hull || 0),
      pass: t.through || 0,
      damage: damage,
      poison: def.poison || null,
      owner: b,
      team: b.team,
      color: tint,
    })
  }
}

export function tryAttack(b, world, hooks) {
  if (!b.alive || b.cd > 0) return false
  const t = b.def.shot
  const pattern = t.pattern || 'bolt'
  b.cd = b.def.cooldown / b.mods.fireRate
  if (pattern === 'burst') {
    b.burstLeft = Math.max(0, (t.burst || 3) - 1)
    b.burstWait = t.burstGap || 0.09
  }
  fireVolley(b, world, pattern)
  hooks.onShot(b)
  return true
}

export function stepBursts(b, dt, world, hooks) {
  if (!b.burstLeft) return
  if (!b.alive) {
    b.burstLeft = 0
    return
  }
  b.burstWait -= dt
  while (b.burstLeft > 0 && b.burstWait <= 0) {
    b.burstLeft--
    b.burstWait += b.def.shot.burstGap || 0.09
    fireVolley(b, world, 'burst')
    hooks.onShot(b)
  }
}

export function pushOutOfBlocks(b, grid, radius) {
  forEachBlock(grid, b.x, b.z, radius, (r) => {
    const dx = b.x - r.x
    const dz = b.z - r.z
    const min = r.r + radius
    const d2 = dx * dx + dz * dz
    if (d2 > min * min || d2 < 0.0001) return true
    const d = Math.sqrt(d2)
    const nx = dx / d
    const nz = dz / d
    b.x = r.x + nx * min
    b.z = r.z + nz * min
    const toward = b.vx * nx + b.vz * nz
    if (toward < 0) {
      b.vx -= nx * toward
      b.vz -= nz * toward
    }
    return true
  })
}

export function damageBeing(target, amount, source, world, hooks) {
  if (!target.alive || target.immune > 0) return
  if (sameTeam(source, target)) return
  target.regen = REGEN.delay
  target.hp -= amount
  target.hurt = 1
  hooks.onHit(target, amount, source)
  if (target.hp <= 0) killBeing(target, source, world, hooks)
}

export function keptTeamXp(xp) {
  if (xp <= SPAWN.keepFloor) return Math.floor(xp)
  return Math.floor(SPAWN.keepFloor + (xp - SPAWN.keepFloor) * SPAWN.keptXp)
}

export function killReward(victim) {
  if (!victim.team) return Math.max(LOOT.min, Math.round(victim.xp * LOOT.killShare))
  return Math.max(LOOT.min, Math.round(victim.xp - keptTeamXp(victim.xp)))
}

export function killBeing(victim, killer, world, hooks) {
  if (!victim.alive) return
  victim.alive = false
  if (killer && killer.alive) addXp(killer, killReward(victim))
  hooks.onKill(victim, killer)
}

function quietSpot(b, world, x, z) {
  let foe = Infinity
  let mate = Infinity
  for (const o of world.beings) {
    if (o === b || !o.alive) continue
    const d = Math.hypot(o.x - x, o.z - z)
    if (o.team === b.team) {
      if (d < mate) mate = d
    } else if (d < foe) {
      foe = d
    }
  }
  let score = Math.min(foe, SPAWN.watch)
  if (mate < SPAWN.mate) score -= (SPAWN.mate - mate) * SPAWN.crowding
  return score
}

function lonelySpot(b, world, x, z) {
  let near = Infinity
  for (const o of world.beings) {
    if (o === b || !o.alive) continue
    const d = Math.hypot(o.x - x, o.z - z)
    if (d < near) near = d
  }
  return near
}

export function spawnSafely(b, world, minDist, attempts) {
  let best = null
  let bestScore = -Infinity
  const aimedAt = b.team ? SPAWN.watch : minDist
  const edge = ARENA.half * 0.92
  const rim = ARENA.rings[0].from + 4
  for (let i = 0; i < attempts; i++) {
    let x
    let z = (Math.random() * 2 - 1) * edge
    if (b.team) {
      const inside = EDGE + 2 + Math.random() * (BASES.depth - EDGE - 5)
      x = b.team === 'red' ? -ARENA.half + inside : ARENA.half - inside
    } else {
      const p = squarePoint(rim + Math.random() * (edge - rim))
      x = p[0]
      z = p[1]
    }
    let score = b.team ? quietSpot(b, world, x, z) : lonelySpot(b, world, x, z)
    if (spotTaken(world.grid, x, z, b.radius * 2.2)) score = -1e6
    if (score > bestScore) {
      bestScore = score
      best = [x, z]
    }
    if (score >= aimedAt) break
  }
  return best || [0, 0]
}

export function separate(world, dt, swarm) {
  const list = world.beings
  for (let i = 0; i < list.length; i++) {
    const a = list[i]
    if (!a.alive) continue
    forEachNear(swarm, a.x, a.z, a.radius, (c) => {
      if (!c.alive || c.tag <= a.tag) return true
      const dx = c.x - a.x
      const dz = c.z - a.z
      const min = a.radius + c.radius
      const d = Math.hypot(dx, dz)
      if (d > min || d < 0.0001) return true
      const push = (min - d) * 0.5
      const nx = dx / d
      const nz = dz / d
      const wa = c.radius / (a.radius + c.radius)
      const wc = 1 - wa
      a.x -= nx * push * wa * 2
      a.z -= nz * push * wa * 2
      c.x += nx * push * wc * 2
      c.z += nz * push * wc * 2
      return true
    })
  }
}
