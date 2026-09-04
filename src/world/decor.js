import { ARENA, ROCKS, TREES, BUSHES } from '../config.js'

export const WALL_MARGIN = 2
export const WALL_COUNT = 460
export const LEAVES = 7

export function generateWall() {
  const stones = []
  const blocks = []
  for (let i = 0; i < WALL_COUNT; i++) {
    const t = (i / WALL_COUNT) * 4
    const side = Math.floor(t)
    const u = ((t % 1) * 2 - 1) * (ARENA.half + 5)
    const s = 3 + Math.sin(i * 2.3) * 1.1
    const radius = s * 0.94
    const outside = ARENA.half - WALL_MARGIN + radius
    const x = side === 1 ? outside : side === 3 ? -outside : u
    const z = side === 0 ? -outside : side === 2 ? outside : u
    stones.push({
      x,
      y: Math.sin(i * 1.7) * 0.8 + 1.4,
      z,
      rx: Math.sin(i * 1.9) * 0.12,
      ry: i * 1.3,
      rz: Math.sin(i * 2.7) * 0.12,
      s,
    })
    blocks.push({ x, z, r: radius, type: 'wall' })
  }
  return { stones, blocks }
}

export function generateDecor(blocsInitiaux) {
  let seed = 1337
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }

  const blocks = blocsInitiaux ? blocsInitiaux.slice() : []
  const bushes = []
  const rocks = []
  const trees = []
  const clampTo = ARENA.half - 6

  const free = (x, z, r) => {
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i]
      const dx = b.x - x
      const dz = b.z - z
      const min = b.r + r + 0.6
      if (dx * dx + dz * dz < min * min) return false
    }
    return true
  }

  const placeZone = (r) => {
    let x = 0
    let z = 0
    for (let attempt = 0; attempt < 40; attempt++) {
      x = (rnd() * 2 - 1) * clampTo
      z = (rnd() * 2 - 1) * clampTo
      if (Math.max(Math.abs(x), Math.abs(z)) > 14 && free(x, z, r)) return [x, z, true]
    }
    return [x, z, false]
  }

  for (let i = 0; i < ROCKS.count; i++) {
    const s = ROCKS.min + rnd() * (ROCKS.max - ROCKS.min)
    const [x, z, ok] = placeZone(s * 0.9)
    if (!ok) {
      rocks.push({ ok: false })
      continue
    }
    rocks.push({
      ok: true,
      x,
      y: s * 0.42,
      z,
      rx: rnd() * 0.4,
      ry: rnd() * 6.3,
      rz: rnd() * 0.4,
      s,
    })
    blocks.push({ x, z, r: s * 0.9, type: 'rock' })
  }

  for (let i = 0; i < TREES.count; i++) {
    const s = TREES.min + rnd() * (TREES.max - TREES.min)
    const [x, z, ok] = placeZone(s * 0.68)
    if (!ok) {
      trees.push({ ok: false })
      continue
    }
    trees.push({ ok: true, x, z, s, ry: rnd() * 6.3, rz: (rnd() - 0.5) * 0.1 })
    blocks.push({ x, z, r: s * 0.37, type: 'tree' })
  }

  const freeOfBush = (x, z, r) => {
    if (!free(x, z, r)) return false
    for (let i = 0; i < bushes.length; i++) {
      const bu = bushes[i]
      const dx = bu.x - x
      const dz = bu.z - z
      const min = bu.r + r + 1.5
      if (dx * dx + dz * dz < min * min) return false
    }
    return true
  }

  const plans = []
  for (let i = 0; i < BUSHES.count; i++) {
    const s = BUSHES.min + rnd() * (BUSHES.max - BUSHES.min)
    let x = 0
    let z = 0
    let ok = false
    for (let attempt = 0; attempt < 40; attempt++) {
      x = (rnd() * 2 - 1) * clampTo
      z = (rnd() * 2 - 1) * clampTo
      if (Math.max(Math.abs(x), Math.abs(z)) > 18 && freeOfBush(x, z, s)) {
        ok = true
        break
      }
    }
    const leaves = []
    for (let j = 0; j < LEAVES; j++) {
      const crown = j < 5
      const a = crown ? (j / 5) * Math.PI * 2 + rnd() * 0.6 : ((j - 5) / 2) * Math.PI * 2 + rnd() * 2
      const gap = crown ? s * 0.44 : s * 0.17
      const t = s * (crown ? 0.34 + rnd() * 0.1 : 0.32 + rnd() * 0.08)
      const up = crown ? t * 0.82 : t * 1.16
      leaves.push({
        x: x + Math.cos(a) * gap,
        y: up,
        z: z + Math.sin(a) * gap,
        rx: rnd() * 0.3,
        ry: rnd() * 6.3,
        rz: rnd() * 0.3,
        t,
      })
    }
    plans.push({ ok, x, z, s, leaves, base: i * LEAVES })
    if (ok) bushes.push({ x, z, r: s, rv: s * 0.86, base: i * LEAVES })
  }

  return { rocks, trees, bushes, plans, blocks }
}

export function buildStaticWorld() {
  const wall = generateWall()
  const decor = generateDecor(wall.blocks)
  return { wall, decor, blocks: decor.blocks, bushes: decor.bushes }
}
