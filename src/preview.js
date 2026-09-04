import * as THREE from 'three'
import { CREATURES } from './config.js'
import { buildCreature } from './creature.js'
import { TEAMS } from './config.js'

const EYE = new THREE.Vector3(3.1, 2.5, 4.2)
const AIM = new THREE.Vector3(0, 0.95, 0)
const NEAREST = 4.2
const TURN = Math.atan2(EYE.x, EYE.z) + Math.PI / 4

const hidden = new Map()
let renderer = null
let scene = null
let camera = null

function init() {
  if (renderer) return
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setSize(220, 180)
  renderer.setPixelRatio(2)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(38, 220 / 180, 0.1, 60)
  camera.position.copy(EYE)
  camera.lookAt(AIM)
  scene.add(new THREE.HemisphereLight(0xbfdcf5, 0x30323a, 1.5))
  const key = new THREE.DirectionalLight(0xffeccc, 2.4)
  key.position.set(4, 6, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x7fc6ff, 1.5)
  rim.position.set(-5, 2, -4)
  scene.add(rim)
}

function frameModel(model) {
  const ball = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere())
  const half = (camera.fov * Math.PI) / 360
  const flat = Math.atan(Math.tan(half) * camera.aspect)
  const need = (ball.radius * 1.06) / Math.sin(Math.min(half, flat))
  camera.position.copy(EYE).setLength(Math.max(NEAREST, need)).add(ball.center)
  camera.lookAt(ball.center)
}

export function creatureThumb(defId) {
  if (hidden.has(defId)) return hidden.get(defId)
  init()
  const def = CREATURES[defId]
  const model = buildCreature(def, TEAMS.blue)
  model.scale.setScalar(1)
  model.rotation.y = TURN
  model.traverse((o) => {
    o.castShadow = false
  })
  scene.add(model)
  frameModel(model)
  renderer.render(scene, camera)
  const url = renderer.domElement.toDataURL('image/png')
  scene.remove(model)
  hidden.set(defId, url)
  return url
}
