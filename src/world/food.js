import { ARENA, FOOD, arenaDist, squarePoint } from '../config.js'
import { spotTaken } from '../blocks.js'
import { makeSwarm, fillSwarm, forEachNear } from './near.js'

export const SPECIES = [
  { count: 700, size: 0.36 },
  { count: 300, size: 0.5 },
  { count: 85, size: 0.68 },
]

let rng = Math.random

function ringIndex(d) {
  for (let i = 0; i < ARENA.rings.length; i++) {
    const r = ARENA.rings[i]
    if (d >= r.from && d <= r.to) return i
  }
  return 0
}

function placeInRing(idx, grid, radius) {
  const r = ARENA.rings[idx]
  let fallbackPt = null
  for (let attempt = 0; attempt < 24; attempt++) {
    const d = Math.sqrt(r.from * r.from + rng() * (r.to * r.to - r.from * r.from))
    const p = squarePoint(d, rng)
    if (!spotTaken(grid, p[0], p[1], radius)) return p
    if (!fallbackPt) fallbackPt = p
  }
  if (fallbackPt) return fallbackPt
  const d = Math.sqrt(r.from * r.from + rng() * (r.to * r.to - r.from * r.from))
  return squarePoint(d, rng)
}

export function createFood(grid) {
  let seed = 987654321
  rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const groups = SPECIES.map((espece, ring) => {
    const items = []
    for (let i = 0; i < espece.count; i++) {
      const [x, z] = placeInRing(ring, grid, espece.size)
      items.push({ x, z, ix: x, iz: z, ring, slot: i, size: espece.size, phase: rng() * 9, alive: true, timer: 0, scale: 1 })
    }
    return { items, ring, size: espece.size }
  })
  rng = Math.random
  return { groups, t: 0, grid, hive: null, local: true, onEatEvent: null, onRepop: null }
}

export function foodValue(item) {
  return ARENA.rings[item.ring].food
}

function sortFood(food) {
  if (!food.hive) food.hive = makeSwarm()
  const all = []
  for (const g of food.groups) {
    for (let i = 0; i < g.items.length; i++) all.push(g.items[i])
  }
  fillSwarm(food.hive, all, sizeOf)
  return food.hive
}

function sizeOf(it) {
  return it.size
}

export function updateFood(food, dt) {
  if (!food.local) return
  for (const g of food.groups) {
    for (let i = 0; i < g.items.length; i++) {
      const it = g.items[i]
      if (it.alive) continue
      it.timer -= dt
      if (it.timer > 0) continue
      const [x, z] = placeInRing(g.ring, food.grid, g.size)
      it.x = x
      it.z = z
      it.alive = true
      it.scale = 0
      if (food.onRepop) food.onRepop(g.ring, i, x, z)
    }
  }
  sortFood(food)
}

export function eatAround(food, being, onEat) {
  const hive = food.hive || sortFood(food)
  forEachNear(hive, being.x, being.z, being.stand, (it) => {
    if (!it.alive) return true
    const reach = being.stand + it.size
    const dx = it.x - being.x
    const dz = it.z - being.z
    if (dx * dx + dz * dz > reach * reach) return true
    it.alive = false
    it.timer = FOOD.respawn
    if (food.onEatEvent) food.onEatEvent(it.ring, it.slot)
    onEat(foodValue(it), it)
    return true
  })
}

export function resetFood(food) {
  for (const g of food.groups) {
    for (const it of g.items) {
      it.x = it.ix
      it.z = it.iz
      it.alive = true
      it.timer = 0
      it.scale = 1
    }
  }
}

export function markEaten(food, group, index) {
  const g = food.groups[group]
  if (!g) return
  const it = g.items[index]
  if (!it || !it.alive) return
  it.alive = false
  it.timer = FOOD.respawn
}

export function restartRepop(food) {
  for (const g of food.groups) {
    for (const it of g.items) {
      if (!it.alive && it.timer > FOOD.respawn) it.timer = FOOD.respawn
    }
  }
}

export function scatterLoot(food, x, z, repartition) {
  for (let ring = 0; ring < repartition.length; ring++) {
    if (repartition[ring] > 0) scatterFood(food, x, z, repartition[ring], ring)
  }
}

export function scatterFood(food, x, z, count, ring) {
  const g = food.groups[Math.min(food.groups.length - 1, ring)]
  const picked = []
  for (let i = 0; i < g.items.length && picked.length < count; i++) {
    if (!g.items[i].alive) picked.push(i)
  }
  if (picked.length < count) {
    const far = []
    for (let i = 0; i < g.items.length; i++) {
      const it = g.items[i]
      if (!it.alive) continue
      far.push([i, (it.x - x) * (it.x - x) + (it.z - z) * (it.z - z)])
    }
    far.sort((a, b) => b[1] - a[1])
    for (let i = 0; i < far.length && picked.length < count; i++) picked.push(far[i][0])
  }
  for (const i of picked) {
    const it = g.items[i]
    let px = x
    let pz = z
    for (let attempt = 0; attempt < 8; attempt++) {
      const a = Math.random() * Math.PI * 2
      const rad = 1.5 + Math.random() * 4
      px = x + Math.cos(a) * rad
      pz = z + Math.sin(a) * rad
      if (!spotTaken(food.grid, px, pz, g.size)) break
    }
    it.x = px
    it.z = pz
    it.alive = true
    it.scale = 0
    it.timer = 0
    if (food.onRepop) food.onRepop(g.ring, i, px, pz)
  }
}

export function ringAtPos(x, z) {
  return ringIndex(arenaDist(x, z))
}
