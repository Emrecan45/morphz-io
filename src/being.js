import * as THREE from 'three'
import { CAM, GOLD, cssHex, teamLook } from './config.js'
import { pullX, pullZ } from './lift.js'
import { buildCreature, animateCreature, disposeCreature } from './creature.js'
import { ringRadius, frame } from './world/stance.js'

const LIFT = {}

export function liftOf(b) {
  if (b.lift !== undefined) return b.lift
  let v = LIFT[b.defId]
  if (v === undefined) {
    v = frame(b.def.body).stand * b.def.size
    LIFT[b.defId] = v
  }
  return v
}
import {
  morphBeingState,
  placeBeingState,
  stepBeingState,
  sameTeam,
  applyMods,
  spendPoint,
  shapeLevel,
  canEvolve,
  addXp,
  spreadOf,
  tryAttack,
  pushOutOfBlocks,
  damageBeing,
  killReward,
  killBeing,
  spawnSafely,
  separate,
} from './world/being.js'

export {
  sameTeam,
  applyMods,
  spendPoint,
  shapeLevel,
  canEvolve,
  addXp,
  spreadOf,
  tryAttack,
  pushOutOfBlocks,
  damageBeing,
  killReward,
  killBeing,
  spawnSafely,
  separate,
}

const RING_GEO = new THREE.RingGeometry(0.82, 1, 28)

function ringScale(b) {
  return ringRadius(b.def)
}
const WHITE = new THREE.Color(0xffffff)
const GREY = new THREE.Color(0x39414b)
const VENOM = new THREE.Color(0x54c23b)
RING_GEO.rotateX(-Math.PI / 2)

const BAR_GEO = new THREE.PlaneGeometry(1, 1)

function makeLabel(text, color) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const g = c.getContext('2d')
  let size = 40
  const font = () => 'bold ' + size + 'px Segoe UI, system-ui, sans-serif'
  g.font = font()
  while (g.measureText(text).width > 214 && size > 20) {
    size -= 2
    g.font = font()
  }
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.shadowColor = 'rgba(0, 0, 0, 0.9)'
  g.shadowBlur = 9
  g.shadowOffsetY = 2
  g.fillStyle = color
  g.fillText(text, 128, 34)
  g.fillText(text, 128, 34)
  g.shadowBlur = 0
  g.shadowOffsetY = 0
  g.fillText(text, 128, 34)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }))
  sprite.scale.set(4.2, 1.05, 1)
  sprite.renderOrder = 10
  return sprite
}

function makeBar() {
  const group = new THREE.Group()
  const back = new THREE.Mesh(BAR_GEO, new THREE.MeshBasicMaterial({ color: 0x14181f, depthTest: false, depthWrite: false, transparent: true, opacity: 0.85 }))
  back.scale.set(2.6, 0.3, 1)
  back.renderOrder = 11
  const fill = new THREE.Mesh(BAR_GEO, new THREE.MeshBasicMaterial({ color: 0x5fd07a, depthTest: false, depthWrite: false, transparent: true }))
  fill.scale.set(2.5, 0.22, 1)
  fill.renderOrder = 12
  fill.position.z = 0.01
  group.add(back)
  group.add(fill)
  group.userData = { fill, width: 2.5 }
  return group
}

export function outlineColor(b) {
  if (b.isPlayer) return GOLD
  return teamLook(false, b.team).color
}

export function skinBeing(scene, b) {
  if (b.mesh) return b
  const def = b.def
  const isPlayer = b.isPlayer
  const team = b.team
  const name = b.name
  b.mesh = buildCreature(def, teamLook(isPlayer, team))
  scene.add(b.mesh)

  const ring = new THREE.Mesh(
    RING_GEO,
    new THREE.MeshBasicMaterial({
      color: isPlayer ? 0xffe07a : teamLook(false, team).color,
      transparent: true,
      opacity: isPlayer ? 0.85 : 0.4,
      depthWrite: false,
    })
  )
  ring.position.y = 0.07
  ring.renderOrder = 1
  ring.scale.setScalar(ringScale(b))
  ring.userData.base = ringScale(b)
  scene.add(ring)
  b.ring = ring

  b.labelTint = isPlayer ? cssHex(GOLD) : cssHex(teamLook(false, team).color)
  b.label = makeLabel(name, b.labelTint)
  scene.add(b.label)
  b.bar = makeBar()
  scene.add(b.bar)
  return b
}

export function placeBeing(b, x, z) {
  placeBeingState(b, x, z)
  if (!b.mesh) return
  const h = liftOf(b)
  const dx = pullX(x, h)
  const dz = pullZ(z, h)
  b.mesh.position.set(dx, 0, dz)
  b.ring.position.set(dx, 0.05, dz)
}

export function stepBeing(b, dt, dirX, dirZ, world, face) {
  stepBeingState(b, dt, dirX, dirZ, world, face)
}

export function placeVisual(b, dt) {
  if (!b.mesh) return
  const h = liftOf(b)
  const dx = pullX(b.x, h)
  const dz = pullZ(b.z, h)
  b.mesh.position.set(dx, 0, dz)
  b.mesh.rotation.y = b.yaw
  b.ring.position.set(dx, 0.07, dz)
  if (b.moveShown === undefined) b.moveShown = b.moveRatio
  b.moveShown += (b.moveRatio - b.moveShown) * (1 - Math.exp(-11 * dt))
  animateCreature(b.mesh, dt, b.moveShown, b.swing)
}

function retintLabel(scene, b) {
  const want = b.isPlayer ? cssHex(GOLD) : cssHex(teamLook(false, b.team).color)
  if (b.labelTint === want) return
  b.labelTint = want
  scene.remove(b.label)
  if (b.label.material.map) b.label.material.map.dispose()
  b.label.material.dispose()
  b.label = makeLabel(b.name, want)
  scene.add(b.label)
}

export function relabelBeing(scene, b) {
  if (!b.label) return
  scene.remove(b.label)
  if (b.label.material.map) b.label.material.map.dispose()
  b.label.material.dispose()
  b.label = makeLabel(b.name, b.labelTint)
  scene.add(b.label)
}

export function retintBeing(scene, b, team) {
  if (b.team === team) return b
  b.team = team
  if (!b.mesh) return b
  const x = b.x
  const z = b.z
  const yaw = b.yaw
  removeBeing(scene, b)
  b.mesh = null
  b.fadedMesh = null
  skinBeing(scene, b)
  const h = liftOf(b)
  const dx = pullX(x, h)
  const dz = pullZ(z, h)
  b.mesh.position.set(dx, 0, dz)
  b.mesh.rotation.y = yaw
  b.ring.position.set(dx, 0.07, dz)
  return b
}

export function morphBeing(scene, b, defId) {
  if (!b.mesh) {
    morphBeingState(b, defId)
    return b
  }
  scene.remove(b.mesh)
  disposeCreature(b.mesh)
  morphBeingState(b, defId)
  b.mesh = buildCreature(b.def, teamLook(b.isPlayer, b.team))
  const h = liftOf(b)
  b.mesh.position.set(pullX(b.x, h), 0, pullZ(b.z, h))
  b.mesh.rotation.y = b.yaw
  scene.add(b.mesh)
  b.ring.material.color.setHex(outlineColor(b))
  b.ring.scale.setScalar(ringScale(b))
  b.ring.userData.base = ringScale(b)
  b.fadedMesh = null
  retintLabel(scene, b)
  return b
}

export function removeBeing(scene, b) {
  if (!b.mesh) return
  if (b.ownMats) for (const m of b.ownMats) m.dispose()
  b.ownMats = null
  b.greyMats = null
  b.fadedMesh = null
  scene.remove(b.mesh)
  scene.remove(b.ring)
  scene.remove(b.label)
  scene.remove(b.bar)
  disposeCreature(b.mesh)
  if (b.label.material.map) b.label.material.map.dispose()
  b.label.material.dispose()
}

export function followRemote(b, dt, cx, cz, cyaw, k) {
  b.x += (cx - b.x) * k
  b.z += (cz - b.z) * k
  let diff = cyaw - b.yaw
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  b.yaw += diff * k
  b.swing = Math.max(0, b.swing - dt * 4.5)
  b.hurt = Math.max(0, b.hurt - dt * 3)
  b.immune = Math.max(0, b.immune - dt)
}

function ownMaterials(b) {
  if (b.fadedMesh === b.mesh) return
  if (b.ownMats) for (const m of b.ownMats) m.dispose()
  b.fadedMesh = b.mesh
  b.ownMats = []
  b.greyMats = []
  b.rimParts = []
  b.castParts = []
  const made = new Map()
  b.mesh.traverse((o) => {
    if (!o.isMesh || !o.material) return
    if (o.castShadow) b.castParts.push(o)
    let m = made.get(o.material)
    if (!m) {
      m = o.material.clone()
      m.userData = {
        tint: m.color ? m.color.getHex() : 0,
        emis: m.emissive ? m.emissive.getHex() : 0,
      }
      made.set(o.material, m)
      b.ownMats.push(m)
      if (m.color) b.greyMats.push(m)
    }
    o.material = m
    if (m.uniforms) b.rimParts.push(o)
  })
  b.greyPart = -1
  b.venomPart = -1
  b.flashPart = -1
  b.veilPart = -1
  b.veilCast = true
}

export function veilBeing(b, part) {
  if (!b.mesh) return
  if (!b.ownMats && !part) return
  ownMaterials(b)
  if (b.veilPart === part) return
  b.veilPart = part
  const clear = part > 0.001
  const alpha = 1 - part
  for (const m of b.ownMats) {
    if (m.uniforms) {
      m.uniforms.alpha.value = alpha
      m.depthWrite = !clear
    } else {
      m.opacity = alpha
    }
    m.transparent = clear
  }
  for (const o of b.rimParts) o.renderOrder = clear ? 2 : 0
  const cast = part < 0.5
  if (b.veilCast !== cast) {
    b.veilCast = cast
    for (const o of b.castParts) o.castShadow = cast
  }
}

export function updateGrey(b, part, venom, flash) {
  const lit = flash || 0
  if (!b.greyMats && !part && !venom && !lit) return
  ownMaterials(b)
  if (b.greyPart === part && b.venomPart === venom && b.flashPart === lit) return
  b.greyPart = part
  b.venomPart = venom
  b.flashPart = lit
  for (const m of b.greyMats) {
    m.color.setHex(m.userData.tint).lerp(VENOM, venom).lerp(GREY, part).lerp(WHITE, lit)
    if (m.emissive) m.emissive.setHex(m.userData.emis).multiplyScalar(1 - part)
  }
}

export function overlayAlpha(b, alpha) {
  if (b.alphaOverlay === alpha) return
  b.alphaOverlay = alpha
  b.label.material.opacity = alpha
  const back = b.bar.children[0]
  back.material.opacity = 0.85 * alpha
  b.bar.userData.fill.material.opacity = alpha
}

export function spawnBeat() {
  return Math.sin(performance.now() * 0.011) >= 0
}

export function updateOverlay(b, camera) {
  const size = b.def.size
  const k = camera.position.y / CAM.overlayRef
  const w = (1.5 + size * 0.5) * k
  const h = liftOf(b)
  const barX = pullX(b.x, h)
  const barZ = pullZ(b.z, h) - (size * 1.02 + 0.34) - 0.07 * k
  b.label.scale.set(w * 1.08, w * 0.27, 1)
  b.label.position.set(barX, 0.6, barZ - w * 0.135 - 0.16 * k)
  b.bar.position.set(barX, 0.6, barZ)
  b.bar.quaternion.copy(camera.quaternion)
  const ratio = Math.max(0, b.hp / b.maxHp)
  const u = b.bar.userData
  const fw = w * ratio
  u.fill.scale.set(Math.max(0.001, fw), 0.17 * k, 1)
  u.fill.position.x = -(w - fw) / 2
  b.bar.children[0].scale.set(w + 0.09 * k, 0.25 * k, 1)
  u.fill.material.color.setHex(ratio < 0.3 ? 0xe0533f : ratio < 0.6 ? 0xe8b13a : 0x5fd07a)
  const venom = !!(b.poison || b.venom)
  if (b.barVenom !== venom) {
    b.barVenom = venom
    b.bar.children[0].material.color.setHex(venom ? 0x1d6b2f : 0x14181f)
  }
  b.bar.visible = true
  const baseScale = b.ring.userData.base
  const veil = b.veil || 0
  if (b.ringVeiled !== b.hidden) {
    b.ringVeiled = b.hidden
    b.ring.renderOrder = b.hidden ? 0 : 1
    b.ringBlinking = true
  }
  if (b.immune > 0) {
    const beat = spawnBeat() ? 1 : 0
    b.ring.material.opacity = (beat ? 1 : 0.7) * (1 - veil)
    if (beat) b.ring.material.color.setHex(0xffffff)
    else b.ring.material.color.setHex(outlineColor(b))
    b.ring.scale.setScalar(baseScale)
    b.ringBlinking = true
  } else if (b.ringBlinking || veil > 0 || b.ring.scale.x !== baseScale) {
    b.ringBlinking = veil > 0
    const full = b.isPlayer ? 0.85 : 0.55
    const dim = b.isPlayer ? 0.72 : 0.42
    b.ring.material.opacity = (b.hidden ? dim : full) * (1 - veil)
    b.ring.material.color.setHex(outlineColor(b))
    if (b.hidden) b.ring.material.color.lerp(GREY, b.isPlayer ? 0.24 : 0.72)
    b.ring.scale.setScalar(baseScale)
  }
}

