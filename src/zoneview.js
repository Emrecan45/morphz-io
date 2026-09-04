import * as THREE from 'three'
import { TEAMS, ZONE } from './config.js'
import { holdingTeam, readZone } from './world/zone.js'

export { holdingTeam }
export const zoneInfo = readZone

export function skinZone(scene, state) {
  if (!state || state.group) return state
  const g = new THREE.Group()

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false })
  )
  ground.geometry.rotateX(-Math.PI / 2)
  ground.position.y = 0.015
  ground.renderOrder = -8

  const gauge = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false })
  )
  gauge.geometry.rotateX(-Math.PI / 2)
  gauge.position.y = 0.02
  gauge.renderOrder = -7

  const edge = new THREE.Mesh(
    new THREE.RingGeometry(0.94, 1, 64),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false })
  )
  edge.geometry.rotateX(-Math.PI / 2)
  edge.position.y = 0.025
  edge.renderOrder = -6

  g.add(ground)
  g.add(gauge)
  g.add(edge)
  g.visible = false
  scene.add(g)

  state.group = g
  state.ground = ground
  state.gauge = gauge
  state.edge = edge
  return state
}

export function refreshZone(state) {
  if (!state || !state.group) return
  const z = state.active
  if (!z) {
    state.group.visible = false
    return
  }
  state.group.visible = true
  state.group.position.set(z.x, 0, z.z)
  state.group.scale.set(ZONE.radius, 1, ZONE.radius)
  const part = Math.abs(z.gauge) / 100
  const side = z.gauge >= 0 ? 'blue' : 'red'
  const team = holdingTeam(z)
  state.ground.material.color.setHex(ZONE.neutral)
  state.ground.material.opacity = 0.08
  state.edge.material.color.setHex(team ? TEAMS[team].color : ZONE.neutral)
  state.edge.material.opacity = team ? 0.92 : 0.75
  state.gauge.visible = part > 0.01
  state.gauge.material.color.setHex(TEAMS[side].color)
  state.gauge.material.opacity = 0.18
  state.gauge.scale.set(Math.max(0.001, part), 1, Math.max(0.001, part))
}

export function applyRemoteZone(state, data) {
  if (!state) return null
  if (!data) {
    state.active = null
    refreshZone(state)
    return null
  }
  if (!state.active) state.active = { x: 0, z: 0, gauge: 0, contested: false, hold: { red: 0, blue: 0 } }
  const z = state.active
  z.x = data[0]
  z.z = data[1]
  z.gauge = data[2]
  z.hold.red = data[3]
  z.hold.blue = data[4]
  refreshZone(state)
  return z
}
