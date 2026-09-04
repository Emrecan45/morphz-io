export function hitbox(b) {
  const h = b.hit
  let bound = 0
  for (const c of h.m) {
    const e = Math.abs(c[0]) + c[1]
    if (e > bound) bound = e
  }
  return { footprint: h.r, body: h.x, mask: h.m, bound }
}

export function maskSweep(b, x0, z0, x1, z1, r) {
  const c = Math.cos(b.yaw)
  const s = Math.sin(b.yaw)
  const ax = x0 - b.x
  const az = z0 - b.z
  const bx = x1 - b.x
  const bz = z1 - b.z
  const px = ax * c - az * s
  const pz = ax * s + az * c
  const qx = bx * c - bz * s
  const qz = bx * s + bz * c
  const dx = qx - px
  const dz = qz - pz
  const len = dx * dx + dz * dz
  for (const part of b.mask) {
    const q = part[1] + r
    const ex = px
    const ez = pz - part[0]
    if (len < 1e-9) {
      if (ex * ex + ez * ez <= q * q) return true
      continue
    }
    let k = -(ex * dx + ez * dz) / len
    if (k < 0) k = 0
    else if (k > 1) k = 1
    const nx = ex + dx * k
    const nz = ez + dz * k
    if (nx * nx + nz * nz <= q * q) return true
  }
  return false
}
