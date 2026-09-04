import { ARENA } from './config.js'

const CELL = 16

export function makeGrid(blocks) {
  const sides = Math.ceil((ARENA.half * 2) / CELL)
  const cells = new Array(sides * sides)
  for (let i = 0; i < cells.length; i++) cells[i] = []
  const grid = { sides, cells, blocks }
  for (const b of blocks) {
    const x0 = cell(b.x - b.r, sides)
    const x1 = cell(b.x + b.r, sides)
    const z0 = cell(b.z - b.r, sides)
    const z1 = cell(b.z + b.r, sides)
    for (let cz = z0; cz <= z1; cz++) {
      for (let cx = x0; cx <= x1; cx++) cells[cz * sides + cx].push(b)
    }
  }
  return grid
}

function cell(v, sides) {
  const c = Math.floor((v + ARENA.half) / CELL)
  return c < 0 ? 0 : c >= sides ? sides - 1 : c
}

export function forEachBlock(grid, x, z, radius, fn) {
  if (!grid) return
  const { sides, cells } = grid
  const x0 = cell(x - radius, sides)
  const x1 = cell(x + radius, sides)
  const z0 = cell(z - radius, sides)
  const z1 = cell(z + radius, sides)
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

export function lineBlocked(grid, x0, z0, x1, z1, radius) {
  const dx = x1 - x0
  const dz = z1 - z0
  const len = dx * dx + dz * dz
  const span = Math.sqrt(len) / 2 + radius
  let hit = false
  forEachBlock(grid, (x0 + x1) / 2, (z0 + z1) / 2, span, (b) => {
    const min = b.r + radius
    const ex = b.x - x0
    const ez = b.z - z0
    let k = len < 1e-9 ? 0 : (ex * dx + ez * dz) / len
    if (k < 0) k = 0
    else if (k > 1) k = 1
    const nx = ex - dx * k
    const nz = ez - dz * k
    if (nx * nx + nz * nz < min * min) {
      hit = true
      return false
    }
    return true
  })
  return hit
}

export function spotTaken(grid, x, z, radius) {
  let keyCode = false
  forEachBlock(grid, x, z, radius, (b) => {
    const dx = b.x - x
    const dz = b.z - z
    const min = b.r + radius
    if (dx * dx + dz * dz < min * min) {
      keyCode = true
      return false
    }
    return true
  })
  return keyCode
}
