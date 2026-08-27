import { CREATURES } from '../config.js'

const RING_BY_TIER = [1.3, 1.15, 1, 0.85]

const FRAMES = {
  quad: { bodyR: 0.46, legLen: 0.82, standK: 0.52, lenK: 1.75 },
  raptor: { bodyR: 0.42, legLen: 0.92, standK: 0.62, lenK: 1.8 },
  bulk: { bodyR: 0.5, legLen: 0.6, standK: 0.66, lenK: 1.72 },
  serpent: { bodyR: 0.44, legLen: 0, standK: 0, lenK: 2.1 },
  blob: { bodyR: 0.42, legLen: 0.46, standK: 0.78, lenK: 2.3 },
}

export function frame(b) {
  const f = FRAMES[b.shape] || FRAMES.blob
  const round = f === FRAMES.blob
  const legLen = round ? (b.legs > 0 ? f.legLen : 0) : f.legLen
  let stand
  if (b.shape === 'serpent') stand = f.bodyR * 0.92
  else if (round) stand = b.legs > 0 ? legLen + f.bodyR * 0.78 : f.bodyR * 1.02
  else stand = legLen + f.bodyR * f.standK
  return { bodyR: f.bodyR, legLen, stand, bodyLen: f.bodyR * b.length * f.lenK }
}

function standRadius(def) {
  const b = def.body
  const f = frame(b)
  if (!b.legs || f.legLen <= 0) return b.hit.r * RING_BY_TIER[def.tier]
  const reach = Math.max(0.28, (f.stand - f.bodyR * 0.42) / 1.14)
  const pairs = Math.max(1, Math.round(b.legs / 2))
  let far = 0
  for (let p = 0; p < pairs; p++) {
    const t = pairs === 1 ? 0.35 : p / (pairs - 1)
    const z = Math.abs(f.bodyLen * (0.46 - t * 0.9))
    const r = Math.hypot(f.bodyR * 0.78 + reach * 0.26, z + reach * 0.5)
    if (r > far) far = r
  }
  return far * 1.06
}

const TIER_RING = []
for (const d of Object.values(CREATURES)) {
  const r = standRadius(d) * d.size
  if (!(TIER_RING[d.tier] >= r)) TIER_RING[d.tier] = r
}

export function ringRadius(def) {
  return TIER_RING[def.tier]
}
