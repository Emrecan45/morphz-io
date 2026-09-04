import * as THREE from 'three'
import { ARENA, CAM, CAM_PULL, CAM_PITCH, UPGRADES, BUSHES, ZONE, GOLD, CREATURES, cssHex, teamLook } from './config.js'
import { createView, moveSun, makeBases, fadeBush, smoothGeo, stepSea } from './scene.js'
import { buildStaticWorld } from './world/decor.js'
import { outlineMaterial, SHOT_OUTLINE } from './outline.js'
import { toonMaterial } from './toon.js'
import { forEachBlock } from './blocks.js'
import { skinZone, refreshZone, applyRemoteZone, holdingTeam } from './zoneview.js'
import {
  skinFood,
  drawFood,
  markEaten,
  resetFood,
  foodColor,
  foodHeight,
} from './food.js'
import { t, onLanguage, suggestLanguage } from './i18n.js'
import { openChoice } from './footer.js'
import { networkAvailable, findRoom, connect, liveRooms, hasPass } from './net.js'
import {
  verifyHuman,
  prepareToken,
  lastReason,
  captchaBusy,
  onCaptchaState,
  setCaptchaSlot,
  spendToken,
} from './captcha.js'
import { INPUT_RATE, decodeShot, shapeFrom, teamFrom, applyFood } from './online.js'
import { createMatch } from './world/match.js'
import { createBeingState } from './world/being.js'
import { aimCamera, pullX, pullZ } from './lift.js'
import { ringRadius } from './world/stance.js'
import {
  skinBeing,
  removeBeing,
  morphBeing,
  retintBeing,
  placeBeing,
  stepBeing,
  updateOverlay,
  spawnBeat,
  killReward,
  overlayAlpha,
  updateGrey,
  veilBeing,
  followRemote,
  placeVisual,
  relabelBeing,
  spendPoint,
  applyMods,
  canEvolve,
} from './being.js'
import { createInput, inputVector } from './input.js'
import {
  createStart,
  createHud,
  updateHud,
  showChoices,
  hideChoices,
  floatText,
  showPause,
  markLogoSeen,
} from './hud.js'
import { unlockAudio, toggleMute, musicMuted } from './audio.js'
import { markTouch } from './quality.js'
import {
  initSdk,
  loadingStart,
  loadingStop,
  gameplayStart,
  gameplayStop,
  happyTime,
  adReady,
  midgameAd,
  portalLocale,
  portalMuted,
  onPortalSettings,
  bannerOffered,
} from './sdk.js'

const layer = document.getElementById('layer')
const canvas = document.getElementById('canvas')

document.documentElement.style.setProperty('--gold', cssHex(GOLD))

const AGE_MAX = 0.2
const DEAD_ZONE = 0.04
const DEATH_PAUSE = 1500
const CATCH_UP = 5
const FOLLOW_RATE = 16
const SHOT_FADE = 0.3
const CULL_RADIUS = 62
const LIVE_WINDOW = 700
let bootAt = 0
let shown = false
let painted = 0
let warmed = false

const HEAT_WAIT = 1500
const VENOM_TINT = 0x3ecf2a
const VENOM_RING = 0.16
const SHOT_FLOOR = 1.45
const JOIN_WAIT = 4500

let spawnDone = null
let spawnTimer = null

const game = {
  view: null,
  world: null,
  match: null,
  mode: 'solo',
  inGame: false,
  watching: false,
  anchor: null,
  camPending: false,
  zones: null,
  cause: null,
  pause: false,
  player: null,
  hud: null,
  input: null,
  kills: 0,
  running: false,
  dressed: true,
  pendingOptions: null,
  fading: [],
}

const net = {
  socket: null,
  active: false,
  sync: false,
  pending: null,
  pendingAt: 0,
  name: '',
  myNetId: 0,
  inputClock: 0,
  watching: false,
  watchBeat: 0,
  fromServer: false,
  joining: null,
  byId: new Map(),
}

let shotPool = null
let particles = null
let auras = null
let bases = null
let offScreen = null
let last = 0

const rayc = new THREE.Raycaster()
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const ndc = new THREE.Vector2()
const impact = new THREE.Vector3()

function aimFace() {
  const inp = game.input
  const p = game.player
  if (!inp || !p) return null
  if (inp.aimStick) return { x: inp.aimDX, z: inp.aimDZ, snap: true }
  if (!inp.aimedAt) return null
  ndc.set(inp.aimX, inp.aimY)
  rayc.setFromCamera(ndc, game.view.camera)
  if (!rayc.ray.intersectPlane(groundPlane, impact)) return null
  const dx = impact.x - p.x
  const dz = impact.z - p.z
  if (Math.hypot(dx, dz) < 0.4) return { x: Math.sin(p.yaw), z: Math.cos(p.yaw), snap: true }
  return { x: dx, z: dz, snap: true }
}

function makeShotPool(scene) {
  const geo = new THREE.SphereGeometry(1, 16, 12)
  const outlineGeo = smoothGeo(geo)
  const outlineMat = outlineMaterial(SHOT_OUTLINE)
  const venomMat = outlineMaterial(VENOM_RING)
  const pool = []
  for (let i = 0; i < 460; i++) {
    const skin = toonMaterial({ color: 0xffffff, emissive: 0x000000, emissiveIntensity: 1.25 })
    skin.transparent = true
    const edge = outlineMat.clone()
    edge.transparent = true
    const m = new THREE.Mesh(geo, skin)
    m.add(new THREE.Mesh(outlineGeo, edge))
    const glow = venomMat.clone()
    glow.transparent = true
    glow.depthWrite = false
    glow.uniforms.tint.value.setHex(VENOM_TINT)
    const halo = new THREE.Mesh(outlineGeo, glow)
    halo.renderOrder = -1
    halo.visible = false
    m.add(halo)
    m.visible = false
    scene.add(m)
    pool.push(m)
  }
  return pool
}

function makeParticles(scene) {
  const count = 260
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) pos[i * 3 + 1] = -100
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const mat = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false
  scene.add(points)
  return {
    points,
    count,
    next: 0,
    data: new Array(count).fill(null).map(() => ({ life: 0, max: 1, vx: 0, vy: 0, vz: 0, r: 0, g: 0, b: 0 })),
  }
}

function makeAuras(scene) {
  const arcGeo = new THREE.RingGeometry(0.78, 1, 26, 1, 0, 0.86)
  const discGeo = new THREE.RingGeometry(0, 1, 34)
  const waveGeo = new THREE.RingGeometry(0.88, 1, 44)
  const rigs = []
  for (let i = 0; i < 3; i++) {
    const group = new THREE.Group()
    const skin = (glow) =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending,
        side: THREE.DoubleSide,
      })
    const halo = new THREE.Mesh(discGeo, skin(true))
    halo.rotation.x = -Math.PI / 2
    halo.position.y = 0.06
    halo.renderOrder = 2
    group.add(halo)
    const wave = new THREE.Mesh(waveGeo, skin(true))
    wave.rotation.x = -Math.PI / 2
    wave.position.y = 0.08
    wave.renderOrder = 2
    group.add(wave)
    const arcs = []
    for (let j = 0; j < 6; j++) {
      const pivot = new THREE.Group()
      pivot.rotation.y = (j / 6) * Math.PI * 2
      const m = new THREE.Mesh(arcGeo, skin(false))
      m.rotation.x = -Math.PI / 2
      m.renderOrder = 3
      pivot.add(m)
      group.add(pivot)
      arcs.push(m)
    }
    group.visible = false
    group.frustumCulled = false
    scene.add(group)
    rigs.push({ group, halo, wave, arcs, life: 0, max: 1, size: 1, foot: 1, target: null })
  }
  return rigs
}

function auraFlash(b) {
  if (!auras) return 0
  for (const r of auras) {
    if (r.target !== b || r.life <= 0) continue
    const elapsed = r.max - r.life
    if (elapsed >= 0.18) return 0
    const f = 1 - elapsed / 0.18
    return f * f * 0.62
  }
  return 0
}

function restoreScale(b) {
  if (b && b.mesh) b.mesh.scale.setScalar(b.def.size)
}

function aura(b, color, force) {
  if (!auras) return
  let rig = auras.find((r) => r.target === b) || auras.find((r) => r.life <= 0)
  if (!rig) rig = auras[0]
  if (rig.target && rig.target !== b) restoreScale(rig.target)
  rig.max = 0.62 * force
  rig.life = rig.max
  rig.size = b.def.size
  rig.foot = ringRadius(b.def)
  rig.target = b
  rig.group.rotation.y = Math.random() * Math.PI
  rig.group.position.set(b.x, 0, b.z)
  rig.group.visible = true
  rig.halo.material.color.setHex(color)
  rig.wave.material.color.setHex(color)
  for (const a of rig.arcs) a.material.color.setHex(color)
}

function updateAuras(dt) {
  if (!auras) return
  for (const r of auras) {
    if (r.life <= 0) continue
    r.life -= dt
    if (r.life <= 0) {
      r.group.visible = false
      restoreScale(r.target)
      r.target = null
      continue
    }
    const k = 1 - r.life / r.max
    const elapsed = r.max - r.life
    const target = r.target
    if (target) r.group.position.set(target.x, 0, target.z)
    const left = 1 - k
    r.group.rotation.y += dt * (4.4 + 7.6 * left * left)
    const fade = k < 0.62 ? 1 : Math.cos(((k - 0.62) / 0.38) * Math.PI * 0.5)

    const w = Math.min(1, elapsed / 0.3)
    r.wave.scale.setScalar(r.foot * (0.94 + (1 - (1 - w) * (1 - w)) * 1.72))
    r.wave.material.opacity = 0.8 * (1 - w) * (1 - w) * (1 - w)

    const breath = Math.sin(k * Math.PI * 2.6) * 0.05
    r.halo.scale.setScalar(r.foot * (1.06 + breath))
    r.halo.material.opacity = 0.22 * Math.min(1, elapsed * 16) * fade

    if (target && target.mesh) {
      const pop = Math.sin(Math.min(1, elapsed / 0.26) * Math.PI) * 0.17
      target.mesh.scale.setScalar(target.def.size * (1 + pop))
    }

    for (let j = 0; j < r.arcs.length; j++) {
      const a = r.arcs[j]
      const p = (k / 0.42 + j / 6) % 1
      const e = 1 - (1 - p) * (1 - p)
      const large = 1 + ((j % 3) - 1) * 0.07
      a.position.y = 0.14 + e * r.size * 1.5
      a.scale.setScalar(r.size * large * (1.95 - e * 0.55))
      a.material.opacity = Math.sin(Math.PI * p) * 0.96 * fade
    }
  }
}

function evolveFx(b, force) {
  aura(b, tintOf(b), force)
}

function burst(x, y, z, color, n, power) {
  if (!particles) return
  const c = new THREE.Color(color)
  for (let i = 0; i < n; i++) {
    const idx = particles.next
    particles.next = (particles.next + 1) % particles.count
    const p = particles.data[idx]
    const a = Math.random() * Math.PI * 2
    const up = 0.35 + Math.random() * 0.9
    const s = power * (0.4 + Math.random() * 0.9)
    p.life = 0.4 + Math.random() * 0.4
    p.max = p.life
    p.vx = Math.cos(a) * s
    p.vy = up * power * 0.85
    p.vz = Math.sin(a) * s
    p.r = c.r
    p.g = c.g
    p.b = c.b
    particles.points.geometry.attributes.position.setXYZ(idx, x, y, z)
  }
}

function updateParticles(dt) {
  const pos = particles.points.geometry.attributes.position
  const col = particles.points.geometry.attributes.color
  for (let i = 0; i < particles.count; i++) {
    const p = particles.data[i]
    if (p.life <= 0) {
      col.setXYZ(i, 0, 0, 0)
      continue
    }
    p.life -= dt
    p.vy -= 22 * dt
    pos.setXYZ(i, pos.getX(i) + p.vx * dt, Math.max(0.1, pos.getY(i) + p.vy * dt), pos.getZ(i) + p.vz * dt)
    const k = Math.max(0, p.life / p.max)
    col.setXYZ(i, p.r * k, p.g * k, p.b * k)
  }
  pos.needsUpdate = true
  col.needsUpdate = true
}

function tintOf(b) {
  return teamLook(b === game.player || b === game.leaving, b.team).color
}

function distToView(x, z) {
  const seen = game.player || game.anchor
  if (!seen) return Infinity
  return Math.hypot(x - seen.x, z - seen.z)
}

function bushAt(x, z) {
  let inside = null
  forEachBlock(game.world.bushGrid, x, z, 0.2, (bush) => {
    const dx = x - bush.x
    const dz = z - bush.z
    if (dx * dx + dz * dz <= bush.rv * bush.rv) {
      inside = bush
      return false
    }
    return true
  })
  return inside
}

const viewHooks = {
  onSpawn(b) {
    skinBeing(game.view.scene, b)
  },
  onVanish(b) {
    removeBeing(game.view.scene, b)
  },
  onMorph(b, defId) {
    morphBeing(game.view.scene, b, defId)
  },
  onHit(target) {
    burst(target.x, target.def.size * 1.1, target.z, tintOf(target), 6, 6)
  },
  onKill(victim, killer) {
    burst(victim.x, victim.def.size * 1.2, victim.z, tintOf(victim), 26, 11)
    if (killer && killer === game.player && game.hud) {
      game.kills++
      floatText(game.hud, '+' + Math.round(killReward(victim)), 'xp')
    }
    if (victim === game.player) finishPlayer()
  },
  onEat(b, value, item) {
    if (distToView(item.x, item.z) > 42) return
    burst(item.x, foodHeight(item), item.z, foodColor(item), 5, 3.4)
  },
  onBotMorph(b) {
    if (distToView(b.x, b.z) > 60) return
    evolveFx(b, 1)
  },
  onBurst(s) {
    burst(s.x, s.y, s.z, s.color, 5, 5)
  },
  onFade(s) {
    startFade(s)
  },
  onZoneOpen(z) {
    if (!game.hud) return
    floatText(game.hud, t('zoneOpened'), 'gain')
    burst(z.x, 2, z.z, 0xffd45e, 20, 9)
  },
  onZoneTaken(team) {
    if (!game.player || !game.hud) return
    const mine = team === game.player.team
    floatText(game.hud, mine ? t('zoneWon') : t('zoneLost'), game.player.team || 'gain')
  },
  onRoster() {},
}

let hushTimer = null

function hushScene() {
  if (hushTimer) clearTimeout(hushTimer)
  hushTimer = setTimeout(() => {
    hushTimer = null
  }, 520)
}

let deathTimer = null
let adHold = false

function finishPlayer() {
  const p = game.player
  const spot = p ? { x: p.x, z: p.z, def: p.def } : null
  hideChoices(game.hud)
  game.pendingOptions = null
  if (deathTimer) clearTimeout(deathTimer)
  deathTimer = setTimeout(() => {
    deathTimer = null
    const linked = net.active && net.sync && game.player
    const localTeam = !net.active && game.mode === 'team' && game.player
    if (linked || localTeam) watchMatch(spot)
    else quit(spot)
  }, DEATH_PAUSE)
}

function watchMatch(spot) {
  const linked = !!(net.active && net.sync && game.player)
  const again = game.mode === 'team' && !!game.player && (linked || !net.active)
  game.pendingOptions = null
  if (game.hud) {
    hideChoices(game.hud)
    showPause(game.hud, false)
    if (!again) game.hud.el.classList.add('faded')
  }
  game.pause = false
  if (again) {
    game.inGame = true
    game.watching = false
    game.player.first = true
    if (hushTimer) clearTimeout(hushTimer)
    hushTimer = null
    breakForAd(() => {
      if (!game.player) return
      if (linked) {
        if (!net.socket) return
        net.socket.send('respawn', 0)
        waitSpawn()
        return
      }
      game.match.respawn(game.player, true)
      snapCamera(game.player)
      game.hud.el.classList.remove('faded')
    })
    return
  }
  game.watching = true
  game.inGame = false
  hushScene()
  if (spot) {
    game.anchor = spot
    snapCamera(spot)
  }
  openMenu()
}

function leaveWatch() {
  game.watching = false
  const dead = game.player
  dropNetwork()
  game.match.adopt(dead)
  game.player = null
}

function startFade(s) {
  if (game.fading.length >= 90) return
  game.fading.push({ x: s.x, y: s.y, z: s.z, vx: s.vx, vz: s.vz, radius: s.radius, color: s.color, poison: s.poison, t: SHOT_FADE })
}

function stepFades(dt) {
  const list = game.fading
  for (let i = list.length - 1; i >= 0; i--) {
    const f = list[i]
    f.t -= dt
    f.x += f.vx * dt
    f.z += f.vz * dt
    if (f.t <= 0) list.splice(i, 1)
  }
}

function paintShot(m, x, y, z, radius, color, alpha, venom) {
  const h = y < SHOT_FLOOR ? SHOT_FLOOR : y
  m.visible = true
  m.position.set(pullX(x, h), h, pullZ(z, h))
  m.scale.setScalar(radius)
  m.material.color.setHex(color)
  m.material.emissive.setHex(color).multiplyScalar(0.45)
  m.material.opacity = alpha
  m.children[0].material.uniforms.alpha.value = alpha
  const halo = m.children[1]
  halo.visible = !!venom
  if (venom) halo.material.uniforms.alpha.value = alpha
}

function drawShots() {
  const shots = game.world.shots
  let n = 0
  for (let i = 0; i < shots.length && n < shotPool.length; i++, n++) {
    const s = shots[i]
    paintShot(shotPool[n], s.x, s.y, s.z, s.radius, s.color, 1, s.poison)
  }
  for (let i = 0; i < game.fading.length && n < shotPool.length; i++, n++) {
    const f = game.fading[i]
    paintShot(shotPool[n], f.x, f.y, f.z, f.radius, f.color, f.t / SHOT_FADE, f.poison)
  }
  for (; n < shotPool.length; n++) shotPool[n].visible = false
}

function advanceRemoteShots(dt) {
  const shots = game.world.shots
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i]
    s.life -= dt
    s.x += s.vx * dt
    s.z += s.vz * dt
    const done = s.life <= 0 || Math.abs(s.x) > ARENA.half || Math.abs(s.z) > ARENA.half
    if (done) {
      if (s.life <= 0) startFade(s)
      else burst(s.x, s.y, s.z, s.color, 5, 5)
      shots.splice(i, 1)
    }
  }
}

function camHeight(b) {
  return CAM.height + b.def.size * CAM.sizeFactor
}

function snapCamera(b) {
  const cam = game.view.camera
  const h = camHeight(b)
  cam.position.set(b.x, h, b.z + h * CAM_PULL)
  cam.rotation.set(CAM_PITCH, 0, 0)
}

function cameraSubject() {
  if (game.watching) return game.anchor || game.player
  return game.player || game.anchor
}

function updateCamera(dt) {
  const p = cameraSubject()
  if (!p || game.camPending) return
  const cam = game.view.camera
  const k = 1 - Math.exp(-CAM.lerp * dt)
  const h = camHeight(p)
  cam.position.x += (p.x - cam.position.x) * k
  cam.position.y += (h - cam.position.y) * k
  cam.position.z += (p.z + cam.position.y * CAM_PULL - cam.position.z) * k
  cam.rotation.set(CAM_PITCH, 0, 0)
}

function tickOffline(dt) {
  const p = game.player
  if (p && p.alive) {
    let ix = 0, iz = 0, face = null, attack = 0
    if (!game.pause && !game.watching) {
      const v = inputVector(game.input)
      ix = v[0]
      iz = v[1]
      face = aimFace()
      attack = game.input.attack ? 1 : 0
    }
    game.match.input(p, [ix, iz, face ? face.x : 0, face ? face.z : 0, attack])
  }
  game.match.tick(dt)
  game.match.drainEvents()
  if (game.mode === 'team') refreshZone(game.zones)
  if (p && p.alive && p.pendingMorph && !game.pendingOptions && p.def.next.length) offerShapes()
}

function tickOnline(dt) {
  const p = game.player
  if (p && p.alive) {
    if (!game.pause && !game.watching) stepBeing(p, dt, ...inputVector(game.input), game.world, aimFace())
    else stepBeing(p, dt, 0, 0, game.world, null)
    reconcile(p, dt)
  }
  const k = 1 - Math.exp(-FOLLOW_RATE * dt)
  for (const b of game.world.beings) {
    if (b === p || b.targetX === undefined || !b.alive || !b.seen) continue
    if (b.targetAge < AGE_MAX) {
      b.targetAge += dt
      b.targetX += b.targetVx * dt
      b.targetZ += b.targetVz * dt
    }
    followRemote(b, dt, b.targetX, b.targetZ, b.targetYaw, k)
  }
  advanceRemoteShots(dt)
  sendInput(dt)
  for (const b of game.world.beings) {
    if (!b.alive) {
      b.bush = null
      b.hidden = false
      continue
    }
    b.bush = bushAt(b.x, b.z)
    b.hidden = !!b.bush
  }
}

function reconcile(p, dt) {
  if (p.targetX === undefined) return
  if (p.targetAge < AGE_MAX) {
    p.targetAge += dt
    p.targetX += p.targetVx * dt
    p.targetZ += p.targetVz * dt
  }
  const dx = p.targetX - p.x
  const dz = p.targetZ - p.z
  const d2 = dx * dx + dz * dz
  if (d2 > 25) {
    placeBeing(p, p.targetX, p.targetZ)
    p.yaw = p.targetYaw
    return
  }
  if (d2 < DEAD_ZONE) return
  const k = 1 - Math.exp(-CATCH_UP * dt)
  p.x += dx * k
  p.z += dz * k
}

let zoneBeat = 0

function foeInZone(z, team) {
  const r2 = ZONE.radius * ZONE.radius
  for (const b of game.world.beings) {
    if (!b.alive || !b.team || b.team === team) continue
    const dx = b.x - z.x
    const dz = b.z - z.z
    if (dx * dx + dz * dz <= r2) return true
  }
  return false
}

function zonePulse(dt) {
  const p = game.player
  const z = game.zones && game.zones.active
  if (!game.hud || !p || !p.alive || !p.team || !z) {
    zoneBeat = 0
    return
  }
  const dx = p.x - z.x
  const dz = p.z - z.z
  if (dx * dx + dz * dz > ZONE.radius * ZONE.radius || holdingTeam(z) !== p.team) {
    zoneBeat = 0
    return
  }
  if (foeInZone(z, p.team)) {
    zoneBeat = 0
    return
  }
  zoneBeat += dt
  while (zoneBeat >= 1) {
    zoneBeat -= 1
    floatText(game.hud, '+' + ZONE.hold, 'xp')
  }
}

function stage(b, on) {
  if (!b.mesh) return
  if (on) {
    if (!b.mesh.parent) game.view.scene.add(b.mesh)
  } else if (b.mesh.parent) {
    game.view.scene.remove(b.mesh)
  }
}

function present(dt) {
  aimCamera(game.view.camera)
  const p = game.player
  const world = game.world
  const pulse = spawnBeat()
  const me = p && p.alive ? p : null
  fadeBush(game.view, me && me.hidden ? me.bush : null)

  for (const b of world.beings) {
    if (!b.mesh) continue
    if (!b.alive || (net.sync && !b.seen && b !== p) || (b !== p && distToView(b.x, b.z) > CULL_RADIUS)) {
      b.veil = b.hidden && b !== p ? 1 : 0
      b.label.visible = false
      b.bar.visible = false
      b.ring.visible = false
      b.mesh.visible = false
      stage(b, false)
      continue
    }
    let shown = true
    if (b.hidden && b !== p) {
      shown = false
      if (me) {
        if (me.bush && me.bush === b.bush) shown = true
        else if (Math.hypot(me.x - b.x, me.z - b.z) < BUSHES.reveal) shown = true
      }
    }
    b.veil = shown ? 0 : 1
    if (b.veil >= 1) {
      b.label.visible = false
      b.bar.visible = false
      b.ring.visible = false
      b.mesh.visible = false
      stage(b, false)
      continue
    }
    b.label.visible = true
    b.ring.visible = true
    b.mesh.visible = true
    stage(b, true)
    placeVisual(b, dt)
    updateOverlay(b, game.view.camera)
    overlayAlpha(b, (b === p && b.hidden ? 0.38 : 1) * (1 - b.veil))
    veilBeing(b, b.veil)
    let grey = 0
    if (b.hidden && b === p) grey = 0.72
    else if (b.immune > 0) grey = pulse ? 0.62 : 0
    updateGrey(b, grey, b.poison || b.venom ? 0.28 : 0, auraFlash(b))
  }

  stepFades(dt)
  drawShots()
  stepSea(game.view, dt)
  drawFood(world.food, dt)
  updateParticles(dt)
  updateAuras(dt)
  zonePulse(dt)
  updateCamera(dt)
  const seen = cameraSubject()
  if (seen) moveSun(game.view, seen.x, seen.z)
  if (game.inGame && game.hud && game.player && !offScreen) updateHud(game.hud, game)
}

function mountRotate() {
  const el = document.createElement('div')
  el.id = 'rotate'
  el.innerHTML =
    '<svg viewBox="0 0 32 48" aria-hidden="true"><rect x="2" y="2" width="28" height="44" rx="5" fill="none" stroke="currentColor" stroke-width="3.4"/><circle cx="16" cy="39" r="2.6" fill="currentColor"/></svg><span></span>'
  const line = el.querySelector('span')
  const applyTexts = () => {
    line.textContent = t('rotate')
  }
  applyTexts()
  onLanguage(applyTexts)
  document.body.appendChild(el)
}

function heatShaders(view) {
  const r = view.renderer
  const done = () => {
    warmed = true
    last = performance.now()
  }
  if (!r.compileAsync) {
    done()
    return
  }
  r.compileAsync(view.scene, view.camera).then(done, done)
  setTimeout(done, HEAT_WAIT)
}

function readyToShow() {
  return painted >= 1
}

function holdForRotate() {
  return document.body.classList.contains('touch') && window.matchMedia('(orientation: portrait)').matches
}

function revealWorld() {
  if (shown) return
  if (holdForRotate()) return
  shown = true
  markLogoSeen()
  loadingStop()
  document.body.classList.add('ready')
  const veil = document.getElementById('boot')
  if (!veil) return
  veil.classList.add('gone')
  setTimeout(() => veil.remove(), 320)
}

function update(dt) {
  if (!shown && readyToShow()) revealWorld()
  if (net.pending && performance.now() - net.pendingAt > 2500) openWorld()
  if (net.active && net.sync) tickOnline(dt)
  else if (!net.fromServer) tickOffline(dt)
  if (net.watching && net.socket) {
    net.watchBeat -= dt
    if (net.watchBeat <= 0) {
      net.watchBeat = 5
      net.socket.send('watch', 1)
    }
  }
  present(dt)
}

function frame(now) {
  if (!game.running || offScreen) return
  if (adHold) {
    last = now
    requestAnimationFrame(frame)
    return
  }
  if (!warmed) {
    last = now
    requestAnimationFrame(frame)
    return
  }
  let leftOver = Math.min(0.5, (now - last) / 1000) || 0
  last = now
  while (leftOver > 0.0005) {
    const stepDt = Math.min(0.05, leftOver)
    update(stepDt)
    leftOver -= stepDt
  }
  game.view.composer.render()
  if (painted < 2) painted++
  requestAnimationFrame(frame)
}

function backRing() {
  if (!game.running) return
  const now = performance.now()
  let leftOver = Math.min(6, (now - last) / 1000) || 0
  last = now
  while (leftOver > 0.0005) {
    const stepDt = Math.min(0.05, leftOver)
    update(stepDt)
    leftOver -= stepDt
  }
}

function watchVisibility() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      gameplayStop()
      if (!offScreen) offScreen = setInterval(backRing, 33)
      return
    }
    if (offScreen) {
      clearInterval(offScreen)
      offScreen = null
    }
    if (game.inGame && game.player) gameplayStart()
    last = performance.now()
    requestAnimationFrame(frame)
  })
}

function offerShapes() {
  const p = game.player
  game.pendingOptions = p.def.next.slice()
  showChoices(game.hud, game.pendingOptions, p.def, pickShape)
}

function pickShape(id) {
  if (!game.pendingOptions || !game.pendingOptions.includes(id)) return
  const p = game.player
  game.pendingOptions = null
  hideChoices(game.hud)
  if (net.active) {
    net.socket.send('choose', id)
  } else {
    game.match.pickShape(p, id)
  }
  evolveFx(p, 1.35)
  if (CREATURES[id] && CREATURES[id].tier >= 3) happyTime()
}

function raiseUpgrade(id) {
  const p = game.player
  if (!p) return false
  if (net.active) {
    if (p.points <= 0 || p.comp[id] >= UPGRADES.max) return false
    net.socket.send('upgrade', id)
    return spendPoint(p, id)
  }
  return spendPoint(p, id)
}

function sendInput(dt) {
  if (!net.socket) return
  net.inputClock -= dt
  if (net.inputClock > 0) return
  net.inputClock = INPUT_RATE
  const p = game.player
  if (!p) return
  if (game.watching || game.pause) {
    net.socket.send('input', [0, 0, 0, 0, 0])
    return
  }
  const [ix, iz] = inputVector(game.input)
  const face = aimFace()
  net.socket.send('input', [
    Math.round(ix * 100) / 100,
    Math.round(iz * 100) / 100,
    face ? Math.round(face.x * 100) / 100 : 0,
    face ? Math.round(face.z * 100) / 100 : 0,
    game.input.attack ? 1 : 0,
  ])
}

function beingById(id) {
  return net.byId.get(id) || null
}

function clearWorld() {
  for (const b of [...game.world.beings]) removeBeing(game.view.scene, b)
  game.world.beings.length = 0
  game.world.shots.length = 0
  net.byId.clear()
  net.fromServer = false
  game.player = null
}

function restoreLocalWorld() {
  if (!net.fromServer) return
  dropNetwork()
  clearWorld()
  game.match.reset()
  warmWorld(9 + Math.random() * 7)
}

function applyRoster(list) {
  const seenSet = new Set()
  for (const [id, name, shape, team, bot] of list) {
    seenSet.add(id)
    let b = beingById(id)
    if (b) {
      b.name = name
      retintBeing(game.view.scene, b, teamFrom(team))
      continue
    }
    const me = id === net.myNetId
    b = createBeingState(shapeFrom(shape), name, me, teamFrom(team))
    b.netId = id
    b.isBot = !!bot
    b.first = true
    skinBeing(game.view.scene, b)
    net.byId.set(id, b)
    game.world.beings.push(b)
    placeBeing(b, 0, -600)
    if (me) {
      game.player = b
      game.anchor = null
    }
  }
  for (const b of [...game.world.beings]) {
    if (!b.netId || seenSet.has(b.netId)) continue
    removeBeing(game.view.scene, b)
    net.byId.delete(b.netId)
    const i = game.world.beings.indexOf(b)
    if (i >= 0) game.world.beings.splice(i, 1)
  }
}

function applyState(packet) {
  const [zone, beings] = packet
  if (game.zones) applyRemoteZone(game.zones, zone)
  for (const b of game.world.beings) {
    b.wasSeen = b.seen
    b.seen = false
  }
  for (const e of beings) {
    const b = beingById(e[0])
    if (!b) continue
    if (!b.wasSeen) b.first = true
    b.seen = true
    const shape = shapeFrom(e[1])
    if (b.defId !== shape) {
      const before = b.def.tier
      morphBeing(game.view.scene, b, shape)
      if (b !== game.player && b.def.tier > before && distToView(b.x, b.z) < 60) evolveFx(b, 1)
    }
    const isAlive = (e[9] & 1) !== 0
    if (b.alive && !isAlive) {
      burst(b.x, b.def.size * 1.2, b.z, tintOf(b), 26, 11)
      b.alive = false
    } else if (!b.alive && isAlive) {
      b.alive = true
      b.first = true
    }
    b.targetVx = e[11] || 0
    b.targetVz = e[12] || 0
    b.targetX = e[2]
    b.targetZ = e[3]
    b.targetYaw = e[4]
    b.targetAge = 0
    b.hp = e[5]
    b.maxHp = e[6]
    b.xp = e[7]
    b.level = e[8]
    b.immune = e[9] & 2 ? 0.4 : 0
    b.venom = (e[9] & 8) !== 0
    b.moveRatio = e[10]
    if (b === game.player) {
      if (b.first) {
        placeBeing(b, e[2], e[3])
        b.yaw = e[4]
        b.first = false
        game.camPending = false
        snapCamera(b)
      }
      if (canEvolve(b)) b.pendingMorph = true
      if (spawnDone && b.alive) spawnDone()
    } else if (b.first) {
      placeBeing(b, e[2], e[3])
      b.yaw = e[4]
      b.first = false
    }
  }
  if (!game.player && game.camPending) {
    game.camPending = false
    holdAnchor()
  }
}

function openWorld() {
  const data = net.pending
  if (!data) return
  if (net.watching && !game.inGame && !game.player && performance.now() > bootAt + LIVE_WINDOW) {
    net.pending = null
    dropNetwork()
    return
  }
  net.pending = null
  net.myNetId = data.id
  clearWorld()
  game.world.food.local = false
  resetFood(game.world.food)
  applyRoster(data.roster)
  applyFood(game.world.food, data.food)
  net.fromServer = true
  net.sync = true
  game.camPending = true
  alignMode(data.mode)
}

function receive(type, data) {
  if (type === 'welcome') {
    net.pending = data
    net.pendingAt = performance.now()
    return
  }
  if (net.pending) {
    if (type !== 'state') return
    openWorld()
  }
  if (!net.sync) return
  if (type === 'roster') {
    applyRoster(data)
    return
  }
  if (type === 'state') {
    applyState(data)
    return
  }
  if (type === 'digest') {
    for (const [id, xp, isAlive, total] of data) {
      const b = beingById(id)
      if (!b || b.seen) continue
      b.xp = xp
      b.total = total
      b.alive = !!isAlive
    }
    return
  }
  if (type === 'shots') {
    const heard = new Set()
    for (const line of data) {
      const s = decodeShot(line, beingById)
      s.color = s.owner ? tintOf(s.owner) : teamLook(false, s.team).color
      game.world.shots.push(s)
      if (heard.has(s.owner)) continue
      heard.add(s.owner)
      if (s.owner) s.owner.swing = 1
    }
    return
  }
  if (type === 'bursts' || type === 'fades' || type === 'vanishes') {
    const lost = new Set(data)
    const shots = game.world.shots
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i]
      if (!lost.has(s.id)) continue
      if (type !== 'vanishes' && distToView(s.x, s.z) < 46) {
        if (type === 'bursts') burst(s.x, s.y, s.z, s.color, 5, 5)
        else startFade(s)
      }
      shots.splice(i, 1)
    }
    return
  }
  if (type === 'eaten') {
    for (const [g, i] of data) {
      const group = game.world.food.groups[g]
      const item = group ? group.items[i] : null
      if (item && item.alive && distToView(item.x, item.z) < 42) {
        burst(item.x, foodHeight(item), item.z, foodColor(item), 5, 3.4)
      }
      markEaten(game.world.food, g, i)
    }
    return
  }
  if (type === 'repops') {
    applyFood(game.world.food, data.map((r) => [r[0], r[1], 1, r[2], r[3]]), true)
    return
  }
  if (type === 'zonewon') {
    if (game.hud) {
      const mine = data === (game.player ? game.player.team : '')
      floatText(game.hud, mine ? t('zoneWon') : t('zoneLost'), (game.player && game.player.team) || 'gain')
    }
    return
  }
  if (type === 'self') {
    const p = game.player
    if (!p) return
    p.points = data[0]
    UPGRADES.list.forEach((u, i) => {
      p.comp[u.id] = data[1][i]
    })
    applyMods(p)
    return
  }
  if (type === 'options') {
    game.pendingOptions = data.slice()
    showChoices(game.hud, game.pendingOptions, game.player.def, pickShape)
    return
  }
  if (type === 'death') {
    const victim = beingById(data[0])
    const killer = beingById(data[1])
    if (victim === game.player) {
      finishPlayer()
    } else if (killer === game.player && victim && game.hud) {
      game.kills++
      floatText(game.hud, '+' + Math.round(killReward(victim)), 'xp')
    }
    return
  }
}

function dropNetwork() {
  if (net.socket) net.socket.close()
  if (net.joining) net.joining.close()
  net.socket = null
  net.joining = null
  net.active = false
  net.sync = false
  net.pending = null
  net.myNetId = 0
  net.watching = false
  net.byId.clear()
  game.camPending = false
}

function backToOffline(keep) {
  dropNetwork()
  if (keep) {
    game.match.adopt(keep)
    return
  }
  clearWorld()
  game.match.reset()
  warmWorld(9 + Math.random() * 7)
}

function askOffline(name, token) {
  if (spawnTimer) clearTimeout(spawnTimer)
  spawnTimer = null
  openChoice(
    layer,
    t('offlineTitle'),
    t('offlineBody'),
    [
      { tone: 'offline', label: t('offlinePlay'), run: () => fallbackOffline(name) },
      {
        tone: 'retry',
        label: t('offlineRetry'),
        run: () => {
          spawnTimer = setTimeout(() => askOffline(name, token), 9000)
          connectNetwork(name, token)
        },
      },
    ],
    cancelSpawn
  )
}

async function connectNetwork(name, token) {
  const room = await findRoom(game.mode, token)
  if (!room || !room.room) {
    if (room && room.refused) spendToken()
    askOffline(name, token)
    return
  }
  spendToken()
  net.name = name
  const old = net.socket
  let hello = null
  let guard = null
  const rate = () => {
    if (net.joining !== next) return
    net.joining = null
    if (guard) clearTimeout(guard)
    guard = null
    next.close()
    askOffline(name, token)
  }
  const next = connect(game.mode, room.room, {
    onOpen: () => {
      next.send('join', { name })
    },
    onMessage: (type, data) => {
      if (net.socket === next) {
        receive(type, data)
        return
      }
      if (net.joining !== next) return
      if (type === 'welcome') {
        hello = data
        return
      }
      if (type !== 'state' || !hello) return
      if (guard) clearTimeout(guard)
      guard = null
      if (old) old.close()
      net.joining = null
      net.socket = next
      net.active = true
      net.watching = false
      game.watching = false
      net.sync = false
      net.pending = null
      net.myNetId = 0
      receive('welcome', hello)
      receive('state', data)
    },
    onClose: () => {
      if (net.socket !== next) {
        rate()
        return
      }
      if (net.joining) return
      const wasSync = net.sync
      if (game.watching) {
        leaveWatch()
        return
      }
      dropNetwork()
      if (!game.inGame) {
        if (spawnDone) spawnDone()
        return
      }
      if (wasSync) {
        clearWorld()
        game.match.reset()
        fallbackOffline(net.name)
        return
      }
      askOffline(net.name, token)
    },
  })
  net.joining = next
  guard = setTimeout(rate, JOIN_WAIT)
}

function fallbackOffline(name) {
  if (!game.inGame || game.player) return
  startOffline(name !== undefined && name !== null ? name : net.name || '')
}

function bindKeyboard() {
  const DIGITS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8']
  window.addEventListener('keydown', (e) => {
    if (!game.player) return
    const n = DIGITS.indexOf(e.code)
    if (n < 0) return
    if (game.pendingOptions) {
      const id = game.pendingOptions[n]
      if (id) pickShape(id)
      return
    }
    const comp = UPGRADES.list[n]
    if (comp) raiseUpgrade(comp.id)
  })
}

function togglePause(on) {
  if (!game.player || !game.running) return
  game.pause = on === undefined ? !game.pause : on
  showPause(game.hud, game.pause)
  if (game.pause) gameplayStop()
  else gameplayStart()
}

function setupHud() {
  if (game.hud) return
  game.hud = createHud(layer, {
    onUpgrade: (id) => {
      if (raiseUpgrade(id)) updateHud(game.hud, game)
    },
    onPause: (on) => togglePause(on),
    onQuit: quit,
  })
  game.input = createInput(game.hud.el, canvas, {
    onFirstInput: unlockAudio,
    onEscape: () => togglePause(),
  })
  bindKeyboard()
}

function waitSpawn(onStall) {
  return new Promise((resolve) => {
    let over = false
    const finish = (ok) => {
      if (over) return
      over = true
      if (spawnDone === finish) spawnDone = null
      if (spawnTimer) clearTimeout(spawnTimer)
      spawnTimer = null
      if (game.hud && game.player && game.player.alive) game.hud.el.classList.remove('faded')
      resolve(ok !== false)
    }
    spawnDone = finish
    spawnTimer = setTimeout(onStall || finish, 9000)
  })
}

function cancelSpawn() {
  game.inGame = false
  dropNetwork()
  restoreLocalWorld()
  if (game.hud) {
    hideChoices(game.hud)
    showPause(game.hud, false)
    game.hud.el.classList.add('faded')
  }
  game.pause = false
  if (spawnDone) spawnDone(false)
}

function enterGame(name, mode, token) {
  const wanted = mode === 'team' ? 'team' : 'solo'
  const online = !!token && networkAvailable()
  const memeMode = wanted === game.mode
  if (!memeMode) switchMode(wanted)

  setupHud()
  if (deathTimer) clearTimeout(deathTimer)
  deathTimer = null
  game.kills = 0
  if (hushTimer) clearTimeout(hushTimer)
  hushTimer = null
  hideChoices(game.hud)
  showPause(game.hud, false)
  game.pause = false

  if (memeMode && game.watching && net.active && net.sync && game.player) {
    game.watching = false
    game.inGame = true
    game.player.first = true
    net.socket.send('respawn', 1)
    gameplayStart()
    return waitSpawn()
  }

  game.inGame = true
  gameplayStart()
  if (online) {
    game.hud.el.classList.add('faded')
    net.name = name
    connectNetwork(name, token)
    return waitSpawn(() => askOffline(name, token))
  }
  if (networkAvailable()) {
    game.hud.el.classList.add('faded')
    const wait = waitSpawn()
    askOffline(name, token)
    return wait
  }
  startOffline(name)
  game.hud.el.classList.remove('faded')
  return Promise.resolve(true)
}

function startOffline(name) {
  restoreLocalWorld()
  dressMode()
  maskBots(true)
  const player = game.match.addPlayer(name, true)
  game.player = player
  game.anchor = null
  game.camPending = false
  snapCamera(player)
  if (spawnDone) spawnDone()
}

function quit(anchorAt) {
  const manual = !anchorAt
  if (deathTimer) clearTimeout(deathTimer)
  deathTimer = null
  const p = game.player
  const target = anchorAt || p
  const anchor = target ? { x: target.x, z: target.z, def: target.def } : null
  if (p && p.alive) {
    game.leaving = p
    game.player = null
    game.match.kill(p)
    game.leaving = null
  }

  if (net.active) {
    backToOffline(p)
  } else if (p) {
    game.match.adopt(p)
  }

  const wasInGame = game.inGame || game.watching

  game.watching = false
  game.player = null
  game.inGame = false
  game.pendingOptions = null
  if (game.hud) {
    hideChoices(game.hud)
    showPause(game.hud, false)
    game.hud.el.classList.add('faded')
  }
  game.pause = false
  hushScene()
  if (anchor) {
    game.anchor = anchor
    snapCamera(anchor)
  } else pickAnchor()
  
  if (wasInGame) {
    gameplayStop()
    if (manual) {
      setTimeout(() => {
        openMenu()
        breakForAd()
      }, 1500)
    } else {
      openMenu()
      breakForAd()
    }
  }
}

let adVeil = null
let adVeilTimer = null

function showAdWait() {
  if (adVeil || adVeilTimer) return
  adVeilTimer = setTimeout(() => {
    adVeilTimer = null
    if (adVeil) return
    adVeil = document.createElement('div')
    adVeil.className = 'adwait'
    adVeil.innerHTML = '<div class="adwait-ring"></div><p class="adwait-text"></p>'
    adVeil.querySelector('.adwait-text').textContent = t('adWait')
    layer.appendChild(adVeil)
  }, 250)
}

function hideAdWait() {
  if (adVeilTimer) clearTimeout(adVeilTimer)
  adVeilTimer = null
  if (!adVeil) return
  adVeil.remove()
  adVeil = null
}

function breakForAd(after) {
  const go = () => {
    if (after) after()
  }
  if (!adReady()) {
    go()
    return
  }
  const quiet = musicMuted()
  showAdWait()
  midgameAd({
    onStart: () => {
      hideAdWait()
      adHold = true
      if (!quiet) toggleMute(true)
    },
    onDone: () => {
      hideAdWait()
      adHold = false
      last = performance.now()
      if (!quiet) toggleMute(false)
      go()
    },
  })
}

function viewSpan() {
  const cam = game.view.camera
  const deep = Math.max(14, cam.position.y) * 0.42
  return [deep * (cam.aspect || 1.8), deep]
}

function crowdAt(x, z, dx, dz) {
  let n = 0
  for (const b of game.world.beings) {
    if (!b.alive) continue
    if (Math.abs(b.x - x) > dx || Math.abs(b.z - z) > dz) continue
    n++
    if (b.ai && b.ai.state === 'chase') n += 2
  }
  return n
}

function busiestSpot() {
  const [dx, dz] = viewSpan()
  let best = null
  let most = 0
  for (const b of game.world.beings) {
    if (!b.alive) continue
    const n = crowdAt(b.x, b.z, dx, dz)
    if (n > most) {
      most = n
      best = b
    }
  }
  return best ? { x: best.x, z: best.z, def: best.def, crowd: most } : null
}

function holdAnchor() {
  const cam = game.view.camera
  game.anchor = {
    x: cam.position.x,
    z: cam.position.z - cam.position.y * CAM_PULL,
    def: { size: (cam.position.y - CAM.height) / CAM.sizeFactor },
  }
}

function pickAnchor() {
  const spot = busiestSpot()
  if (!spot) return
  game.anchor = spot
  snapCamera(spot)
}

function openMenu() {
  createStart(
    layer,
    (name, mode, token) => {
      unlockAudio()
      return enterGame(name, mode, token)
    },
    {
      available: networkAvailable(),
      verify: () => {
        if (hasPass()) return 'pass'
        prepareToken()
        return verifyHuman()
      },
      reason: () => lastReason,
      busy: captchaBusy,
      onBusy: onCaptchaState,
      slot: setCaptchaSlot,
    }
  )
}

function warmWorld(seconds) {
  const warmStep = 0.16
  const turns = Math.round(seconds / warmStep)
  for (let i = 0; i < turns; i++) {
    game.match.tick(warmStep)
    game.match.drainEvents()
  }
}

function showMode() {
  if (bases) bases.visible = game.mode === 'team'
  if (game.zones && game.zones.group) game.zones.group.visible = false
}

function switchMode(mode) {
  const wanted = mode === 'team' ? 'team' : 'solo'
  if (wanted === game.mode) return
  game.mode = wanted
  game.match.setMode(wanted)
  game.dressed = false
}

function maskBots(on) {
  if (!game.match) return
  game.match.setBotSkill(on)
  const touched = game.match.setBotMask(on)
  if (!game.view) return
  for (const b of touched) relabelBeing(game.view.scene, b)
}

function dressMode() {
  if (game.dressed) return
  game.dressed = true
  game.match.softReset()

  for (const b of game.world.beings) {
    if (b.isBot) morphBeing(game.view.scene, b, b.defId)
  }

  if (game.zones) {
    game.zones.active = null
    refreshZone(game.zones)
  }
  game.player = null
  showMode()
}

function alignMode(served) {
  const wanted = served === 'team' ? 'team' : 'solo'
  game.dressed = true
  if (wanted !== game.mode) {
    game.mode = wanted
    game.match.setMode(wanted)
  }
  if (game.zones) {
    game.zones.active = null
    refreshZone(game.zones)
  }
  showMode()
}

const livePeek = networkAvailable() ? liveRooms() : null

async function watchLive() {
  if (!livePeek || game.inGame || net.active) return
  const live = await livePeek
  if (!live) return
  const mode = live.solo > 0 ? 'solo' : live.team > 0 ? 'team' : null
  if (!mode || game.inGame || net.active) return
  net.watching = true
  net.watchBeat = 5
  net.socket = connect(
    mode,
    1,
    {
      onOpen: () => {
        net.active = true
        net.socket.send('watch', 1)
      },
      onMessage: receive,
      onClose: () => {
        if (game.inGame || game.player) return
        backToOffline(null)
        holdAnchor()
      },
    },
    true
  )
  return true
}

function buildWorld(mode) {
  game.mode = mode === 'team' ? 'team' : 'solo'
  game.dressed = true
  const statics = buildStaticWorld()
  game.view = createView(canvas, statics)
  aimCamera(game.view.camera)
  const scene = game.view.scene
  bases = makeBases()
  scene.add(bases)
  shotPool = makeShotPool(scene)
  particles = makeParticles(scene)
  auras = makeAuras(scene)

  game.match = createMatch(game.mode, { hooks: viewHooks, statics })
  game.world = game.match.world
  skinFood(scene, game.world.food)
  game.zones = skinZone(scene, game.match.match.zones)
  showMode()

  game.running = true
  warmWorld(9 + Math.random() * 7)
  pickAnchor()
  heatShaders(game.view)

  if (import.meta.env.DEV) window.__morphz = game
  watchLive()
  last = performance.now()
  bootAt = last
  watchVisibility()
  setTimeout(revealWorld, 5000)
  requestAnimationFrame(frame)
}

function armMute() {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (!e.key || e.key.toLowerCase() !== 'm') return
    const at = e.target
    if (at && (at.tagName === 'INPUT' || at.tagName === 'TEXTAREA' || at.isContentEditable)) return
    unlockAudio()
    toggleMute()
  })
}

function armAudio() {
  const go = () => {
    unlockAudio()
    document.removeEventListener('pointerdown', go, true)
    document.removeEventListener('keydown', go, true)
    document.removeEventListener('touchstart', go, true)
  }
  document.addEventListener('pointerdown', go, true)
  document.addEventListener('keydown', go, true)
  document.addEventListener('touchstart', go, true)
  unlockAudio()
}

function bootPortal() {
  initSdk().then(() => {
    if (bannerOffered()) document.body.classList.add('portal-banner')
    loadingStart()
    suggestLanguage(portalLocale())
    if (portalMuted()) toggleMute(true)
    onPortalSettings((s) => toggleMute(!!(s && s.muteAudio)))
    if (shown) loadingStop()
  })
}

markTouch()
mountRotate()
armAudio()
armMute()
bootPortal()
buildWorld('solo')
openMenu()
