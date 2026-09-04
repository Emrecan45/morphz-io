import * as THREE from 'three'
import { outlineMaterial, creatureOutline, CREATURE_OUTLINE } from './outline.js'
import { toonMaterial } from './toon.js'
import { hitbox } from './world/hitbox.js'
import { frame } from './world/stance.js'

const SPHERE = new THREE.SphereGeometry(1, 22, 16)
const CAPSULE = new THREE.CapsuleGeometry(1, 1.4, 8, 18)
const CONE = new THREE.ConeGeometry(1, 1, 14)

const matCache = new Map()
let OUTLINE_CFG = outlineMaterial(CREATURE_OUTLINE)
let CLAW = null

function mat(color, emissive) {
  const key = `${color}|${emissive || 0}`
  let m = matCache.get(key)
  if (!m) {
    m = toonMaterial({
      color,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissive ? 0.45 : 0,
    })
    matCache.set(key, m)
  }
  return m
}

function part(geo, material, x, y, z, sx, sy, sz) {
  const m = new THREE.Mesh(geo, material)
  m.position.set(x, y, z)
  m.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz)
  m.castShadow = true
  m.add(new THREE.Mesh(geo, OUTLINE_CFG))
  return m
}

function thin(m) {
  m.castShadow = false
  return m
}

function trim(m) {
  m.castShadow = false
  m.remove(m.children[m.children.length - 1])
  return m
}

function addEyes(parent, z, y, spread, size) {
  const white = mat(0xf8faf5, 0, 0.35)
  const pupil = mat(0x11141a, 0, 0.28)
  for (const s of [-1, 1]) {
    parent.add(trim(part(SPHERE, white, s * spread, y, z, size)))
    parent.add(trim(part(SPHERE, pupil, s * spread * 1.03, y + size * 0.06, z + size * 0.7, size * 0.54)))
  }
}

function addHorns(parent, material, count, z, y, spread, len) {
  for (let i = 0; i < count; i++) {
    const row = i < 2 ? 0 : 1
    const s = count === 1 ? 0 : i % 2 === 0 ? -1 : 1
    const h = part(
      CONE,
      material,
      s * spread * (1 - row * 0.3),
      y + len * 0.5 - row * len * 0.26,
      z - row * len * 0.8,
      len * 0.32,
      len,
      len * 0.32
    )
    h.rotation.z = -s * 0.4
    h.rotation.x = -0.28 - row * 0.16
    parent.add(thin(h))
  }
}

function addSpikes(parent, material, count, top, len, zFrom, zTo) {
  const quills = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const z = zFrom + (zTo - zFrom) * t
    const wob = (i % 2 === 0 ? 1 : -1) * 0.2
    const sc = len * (0.95 + Math.sin(t * Math.PI) * 0.85)
    const s = part(CONE, material, wob * len, top + sc * 0.32, z, sc * 0.32, sc, sc * 0.32)
    s.rotation.x = -0.2
    s.rotation.z = -wob * 0.55
    s.userData.rest = s.scale.clone()
    s.userData.lean = s.rotation.x
    parent.add(thin(s))
    quills.push(s)
  }
  return quills
}

function addFins(parent, material, y, z, size) {
  for (const s of [-1, 1]) {
    const f = part(CONE, material, s * size * 0.9, y, z, size * 0.2, size * 0.95, size * 0.55)
    f.rotation.z = s * 1.4
    f.rotation.x = 0.28
    parent.add(thin(f))
  }
}

function addCrest(parent, material, y, z, size, len) {
  const c = part(CONE, material, 0, y + len * 0.42, z, size * 0.16, len, size * 1.15)
  c.rotation.x = -0.42
  parent.add(thin(c))
}

function addLegs(parent, material, count, bodyR, bodyLen, pivotY) {
  if (!CLAW) CLAW = mat(0xe8ede4, 0, 0.32)
  const legs = []
  const pairs = Math.max(1, Math.round(count / 2))
  const reach = Math.max(0.28, pivotY / 1.14)
  for (let p = 0; p < pairs; p++) {
    const t = pairs === 1 ? 0.35 : p / (pairs - 1)
    const z = bodyLen * (0.46 - t * 0.9)
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group()
      pivot.position.set(s * bodyR * 0.78, pivotY, z)
      const thigh = part(CAPSULE, material, 0, -reach * 0.3, 0, reach * 0.23, reach * 0.24, reach * 0.23)
      pivot.add(thigh)
      const shin = part(CAPSULE, material, 0, -reach * 0.72, 0, reach * 0.18, reach * 0.2, reach * 0.18)
      pivot.add(shin)
      const foot = part(SPHERE, material, 0, -reach * 0.98, reach * 0.16, reach * 0.26, reach * 0.16, reach * 0.34)
      pivot.add(foot)
      for (let d = -1; d <= 1; d++) {
        const claw = trim(part(
          CONE,
          CLAW,
          d * reach * 0.15,
          -reach * 1.04,
          reach * 0.34,
          reach * 0.07,
          reach * 0.16,
          reach * 0.07
        ))
        claw.rotation.x = Math.PI / 2.1
        pivot.add(claw)
      }
      pivot.userData.phase = (p * 1.9 + (s > 0 ? Math.PI : 0)) % (Math.PI * 2)
      pivot.userData.lead = pairs === 1 ? 1 : 1 - t
      parent.add(thin(pivot))
      legs.push(pivot)
    }
  }
  return legs
}

function addTail(parent, material, segments, y, z, radius) {
  const segs = []
  let node = parent
  for (let i = 0; i < segments; i++) {
    const g = new THREE.Group()
    const t = i / segments
    const r = radius * (1 - t * 0.7)
    g.position.set(0, i === 0 ? y : 0, i === 0 ? z : -r * 2.05)
    g.add(part(SPHERE, material, 0, 0, -r * 1.02, r, r * 0.92, r * 1.22))
    node.add(thin(g))
    node = g
    segs.push(g)
  }
  return segs
}

export function buildCreature(def, tint) {
  OUTLINE_CFG = outlineMaterial(creatureOutline(def.size))
  const root = new THREE.Group()
  const bob = new THREE.Group()
  root.add(bob)

  const b = def.body
  const t = tint || def
  const skin = mat(t.color, t.emissive)
  const dark = mat(t.accent, t.emissive ? t.accent : 0)
  const shape = b.shape
  const len = b.length
  const spine = []

  const f = frame(b)
  const bodyR = f.bodyR
  const legLen = f.legLen
  const stand = f.stand
  const bodyLen = f.bodyLen
  let headZ = 0.6
  let headR = 0.34
  let headY = 0.6
  let head = [1, 1, 1]

  if (shape === 'quad') {
    const body = part(CAPSULE, skin, 0, stand, 0, bodyR, bodyR * len * 0.52, bodyR)
    body.rotation.x = Math.PI / 2
    bob.add(body)
    bob.add(part(SPHERE, skin, 0, stand + bodyR * 0.34, -bodyR * 0.15, bodyR * 0.92, bodyR * 0.6, bodyR * len * 0.7))
    headR = bodyR * 0.86
    headZ = bodyLen * 0.56 + headR * 0.5
    headY = stand + bodyR * 0.4
    bob.add(part(SPHERE, skin, 0, stand + bodyR * 0.2, headZ * 0.55, bodyR * 0.62, bodyR * 0.6, bodyR * 0.66))
    head = [0.9, 0.84, 1.15]
  } else if (shape === 'raptor') {
    const body = part(CAPSULE, skin, 0, stand, 0, bodyR, bodyR * len * 0.56, bodyR * 0.94)
    body.rotation.x = Math.PI / 2 - 0.2
    bob.add(body)
    headR = bodyR * 0.8
    headZ = bodyLen * 0.56 + headR * 0.6
    headY = stand + bodyR * 0.62
    bob.add(part(SPHERE, skin, 0, stand + bodyR * 0.34, headZ * 0.5, bodyR * 0.52, bodyR * 0.6, bodyR * 0.62))
    head = [0.82, 0.8, 1.3]
  } else if (shape === 'bulk') {
    bob.add(part(SPHERE, skin, 0, stand, 0, bodyR * 0.9, bodyR * 0.74, bodyR * len * 0.98))
    bob.add(part(SPHERE, dark, 0, stand + bodyR * 0.4, -bodyR * 0.18, bodyR * 0.62, bodyR * 0.36, bodyR * 0.86))
    headR = bodyR * 0.62
    headZ = bodyLen * 0.58 + headR * 0.4
    headY = stand - bodyR * 0.06
    head = [1.04, 0.94, 1.1]
  } else if (shape === 'serpent') {
    const n = Math.max(5, Math.round(len * 3))
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      const r = bodyR * (1 - t * 0.5) * (0.72 + Math.sin(t * Math.PI) * 0.46)
      const s = part(
        SPHERE,
        i % 2 === 0 ? skin : dark,
        0,
        stand + Math.sin(t * 3.4) * 0.07,
        bodyLen * 0.42 - t * bodyLen,
        r,
        r * 0.9,
        r * 1.18
      )
      bob.add(s)
      spine.push(s)
    }
    headR = bodyR * 0.82
    headZ = bodyLen * 0.42 + headR * 0.7
    headY = stand + bodyR * 0.16
    head = [0.92, 0.8, 1.28]
  } else {
    const rings = 3
    for (let i = 0; i < rings; i++) {
      const t = i / (rings - 1)
      const r = bodyR * (1.05 - t * 0.34)
      const seg = part(
        SPHERE,
        i % 2 === 0 ? skin : dark,
        0,
        stand + Math.sin(t * 2.2) * bodyR * 0.06,
        bodyLen * 0.3 - t * bodyLen * 0.72,
        r,
        r * 0.86,
        bodyLen * 0.3
      )
      bob.add(seg)
    }
    headR = bodyR * 0.58
    headZ = bodyLen * 0.46 + headR * 0.5
    headY = stand + bodyR * 0.16
    head = [1, 0.9, 1.16]
  }

  const throat = []
  const neck = b.neck || 0
  if (neck > 0) {
    const seg = 3 + Math.round(neck * 3)
    const rising = bodyR * neck * 2
    const advance = bodyR * neck * 1.9
    for (let i = 0; i <= seg; i++) {
      const t = i / seg
      const r = bodyR * (0.5 - t * 0.16)
      const node = part(SPHERE, skin, 0, headY + rising * t, headZ + advance * t, r, r, r * 1.15)
      node.userData.lead = t
      node.userData.rest = node.position.z
      bob.add(node)
      throat.push(node)
    }
    headY += rising
    headZ += advance
  }

  const skull = new THREE.Group()
  skull.position.set(0, headY, headZ)
  bob.add(skull)
  skull.add(part(SPHERE, skin, 0, 0, 0, headR * head[0], headR * head[1], headR * head[2]))
  addEyes(skull, headR * 0.5, headR * 0.3, headR * 0.54, headR * 0.44)

  if (b.shell) {
    const wide = bodyR * 1.2
    const up = bodyR * 0.92
    const depthVal = bodyLen * 0.78
    const yc = stand + bodyR * 0.16
    const zc = -bodyLen * 0.03
    bob.add(part(SPHERE, dark, 0, yc, zc, wide, up, depthVal))
    bob.add(part(SPHERE, skin, 0, yc - up * 0.42, zc, wide * 1.06, up * 0.22, depthVal * 1.05))
    bob.add(part(SPHERE, skin, 0, yc + up * 0.44, zc, wide * 0.36, up * 0.28, depthVal * 0.36))
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6
      bob.add(
        part(
          SPHERE,
          skin,
          Math.sin(a) * wide * 0.62,
          yc + up * 0.3,
          zc + Math.cos(a) * depthVal * 0.6,
          wide * 0.25,
          up * 0.24,
          depthVal * 0.25
        )
      )
    }
  }

  if (b.wings) {
    for (const s of [-1, 1]) {
      const wing = part(SPHERE, dark, s * bodyR * 1.5, stand + bodyR * 0.68, -bodyLen * 0.1, bodyR * 1.75, bodyR * 0.13, bodyLen * 0.52)
      wing.rotation.z = s * 0.55
      wing.rotation.y = -s * 0.42
      bob.add(thin(wing))
    }
  }

  if (b.arms) {
    for (const s of [-1, 1]) {
      const arms = part(CAPSULE, dark, s * bodyR * 0.68, stand + bodyR * 0.06, bodyLen * 0.26, bodyR * 0.15, bodyR * 0.26, bodyR * 0.15)
      arms.rotation.x = 0.7
      bob.add(arms)
    }
  }

  let jaw = null
  if (b.jaw) {
    jaw = new THREE.Group()
    jaw.position.set(0, -headR * 0.2, -headZ * 0.1)
    jaw.add(part(SPHERE, dark, 0, -headR * 0.16, headR * 0.55, headR * 0.76, headR * 0.32, headR * 1.1))
    for (let i = 0; i < 3; i++) {
      jaw.add(
        trim(part(
          CONE,
          mat(0xf4f7f0, 0, 0.3),
          (i - 1) * headR * 0.4,
          headR * 0.06,
          headR * 1.02,
          headR * 0.12,
          headR * 0.32,
          headR * 0.12
        ))
      )
    }
    skull.add(jaw)
  }

  if (b.horns) addHorns(skull, dark, b.horns, -headR * 0.2, headR * 0.42, headR * 0.7, headR * 2.35)
  const quills = b.spikes
    ? addSpikes(bob, dark, b.spikes, stand + bodyR * (b.shell ? 1.02 : 0.72), bodyR * 0.72, -bodyLen * 0.42, bodyLen * 0.4)
    : []
  if (b.crest) addCrest(bob, dark, stand + bodyR * 0.5, headZ * 0.2, bodyR, bodyR * 1.85)
  if (b.fins) addFins(bob, dark, stand, -bodyLen * 0.12, bodyR)

  const legs = b.legs > 0 && legLen > 0 ? addLegs(bob, dark, b.legs, bodyR, bodyLen, stand - bodyR * 0.42) : []
  const tail = b.tail > 0 ? addTail(bob, skin, b.tail, stand, -bodyLen * 0.5, bodyR * 0.5) : []

  const style = (def.shot && def.shot.pattern) || 'bolt'
  const heavy = !!(def.shot && def.shot.fat)
  const g = hitbox(b)
  root.userData = {
    bob,
    legs,
    tail,
    spine,
    jaw,
    skull,
    throat,
    quills,
    headZ,
    bodyR,
    style,
    heavy,
    beat: (BEAT[style] || BEAT.bolt) / (heavy ? 1.5 : 1),
    fire: 0,
    flip: 1,
    wasSwing: 0,
    t: Math.random() * 12,
    footprint: g.footprint,
    body: g.body,
  }
  root.scale.setScalar(def.size)
  return root
}

const BEAT = { bolt: 3.6, burst: 6.6, fan: 3.2, nova: 3.0 }

function pulse(p, sharp) {
  return Math.sin(Math.PI * Math.pow(p, sharp))
}

export function animateCreature(root, dt, moveRatio, attack) {
  const u = root.userData
  if (!u) return
  u.t += dt * (1 + moveRatio * 2.4)
  const walk = u.t * 5.4
  const amp = 0.08 + moveRatio * 0.92

  if (attack > u.wasSwing + 0.02) {
    u.flip = -u.flip
    u.fire = 1
  }
  u.wasSwing = attack
  if (u.fire > 0) u.fire = Math.max(0, u.fire - dt * u.beat)

  const p = 1 - u.fire
  const snap = pulse(p, 0.3)
  const swell = pulse(p, 0.62)
  const trail = pulse(p, 1.9)
  const kick = snap - trail * 0.42
  const reach = u.bodyR

  let by = (Math.sin(walk) * 0.5 + 0.5) * 0.032 * amp
  let bz = 0
  let rx = 0
  let ry = 0
  let rz = Math.sin(walk * 0.5) * 0.028 * moveRatio
  let sx = 1
  let sy = 1
  let sz = 1
  let lunge = 0
  let flare = 0
  let brace = 0
  let whip = 0

  if (u.style === 'nova') {
    const puff = 1 + snap * 0.15
    sx = puff
    sy = puff - snap * 0.06
    sz = puff
    by += snap * 0.16 * reach
    ry = snap * 0.5 * u.flip
    rx = -swell * 0.06
    lunge = -snap * 0.1 * reach
    flare = snap
    brace = -snap * 0.5
    whip = swell * 0.55
  } else if (u.style === 'fan') {
    sx = 1 + snap * 0.18
    sy = 1 - snap * 0.13
    sz = 1 - snap * 0.05
    bz = kick * 0.14 * reach
    rx = -kick * 0.14
    ry = swell * 0.11 * u.flip
    lunge = snap * 0.34 * reach
    flare = swell * 0.55
    brace = kick * 0.45
    whip = swell * 0.75
  } else if (u.style === 'burst') {
    bz = -kick * 0.12 * reach
    rx = -snap * 0.1
    ry = snap * 0.14 * u.flip
    rz += snap * 0.06 * u.flip
    lunge = snap * 0.2 * reach
    brace = snap * 0.22
    whip = snap * 0.6 * u.flip
  } else {
    const weight = u.heavy ? 1.55 : 1
    bz = -kick * 0.26 * reach * weight
    by += snap * 0.05 * reach * weight
    rx = -kick * 0.17 * (1 + (weight - 1) * 0.5)
    ry = trail * 0.05 * u.flip
    lunge = snap * 0.22 * reach
    brace = kick * 0.55
    whip = trail * 0.6
  }

  u.bob.position.set(0, by, bz)
  u.bob.rotation.set(rx, ry, rz)
  u.bob.scale.set(sx, sy, sz)

  for (let i = 0; i < u.legs.length; i++) {
    const leg = u.legs[i]
    const d = leg.userData
    leg.rotation.x = Math.sin(walk + d.phase) * 0.68 * moveRatio - brace * (d.lead - 0.5) * 1.15
  }

  for (let i = 0; i < u.tail.length; i++) {
    const seg = u.tail[i]
    seg.rotation.y = Math.sin(u.t * 2.4 - i * 0.72) * (0.15 + moveRatio * 0.17) + whip * Math.sin(p * 4.2 - i * 0.85) * (0.34 + i * 0.2)
    seg.rotation.x = Math.sin(u.t * 1.8 - i * 0.5) * 0.05 - whip * 0.14
  }

  for (let i = 0; i < u.spine.length; i++) {
    u.spine[i].position.x = Math.sin(u.t * 2.2 - i * 0.85) * 0.06 * (0.4 + moveRatio) + whip * 0.09 * Math.sin(i * 0.8 - p * 4.6)
  }

  for (let i = 0; i < u.throat.length; i++) {
    const node = u.throat[i]
    node.position.z = node.userData.rest + lunge * node.userData.lead
  }

  for (let i = 0; i < u.quills.length; i++) {
    const q = u.quills[i]
    const rest = q.userData.rest
    q.scale.set(rest.x * (1 + flare * 0.26), rest.y * (1 + flare * 0.5), rest.z * (1 + flare * 0.26))
    q.rotation.x = q.userData.lean - flare * 0.35
  }

  u.skull.position.z = u.headZ + lunge
  u.skull.rotation.x = -lunge * 2.2

  if (u.jaw) u.jaw.rotation.x = snap * 0.95
}

export function disposeCreature(root) {
  root.traverse((o) => {
    if (o.isMesh && o.geometry && o.geometry !== SPHERE && o.geometry !== CAPSULE && o.geometry !== CONE) o.geometry.dispose()
  })
}
