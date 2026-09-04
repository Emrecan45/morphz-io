import { ARENA } from '../config.js'

const CELL = 10

function slot(v, sides) {
  const c = Math.floor((v + ARENA.half) / CELL)
  return c < 0 ? 0 : c >= sides ? sides - 1 : c
}

export function makeSwarm() {
  const sides = Math.ceil((ARENA.half * 2) / CELL)
  const cells = new Array(sides * sides)
  for (let i = 0; i < cells.length; i++) cells[i] = []
  return { sides, cells, reach: 0 }
}

export function fillSwarm(swarm, list, reachOf) {
  const { sides, cells } = swarm
  for (let i = 0; i < cells.length; i++) cells[i].length = 0
  let reach = 0
  for (let i = 0; i < list.length; i++) {
    const it = list[i]
    if (it.alive === false) continue
    const r = reachOf(it)
    if (r > reach) reach = r
    cells[slot(it.z, sides) * sides + slot(it.x, sides)].push(it)
  }
  swarm.reach = reach
  return swarm
}

export function forEachNear(swarm, x, z, radius, fn) {
  const { sides, cells } = swarm
  const span = radius + swarm.reach
  const x0 = slot(x - span, sides)
  const x1 = slot(x + span, sides)
  const z0 = slot(z - span, sides)
  const z1 = slot(z + span, sides)
  for (let cz = z0; cz <= z1; cz++) {
    const line = cz * sides
    for (let cx = x0; cx <= x1; cx++) {
      const batch = cells[line + cx]
      for (let i = 0; i < batch.length; i++) {
        if (fn(batch[i]) === false) return
      }
    }
  }
}
