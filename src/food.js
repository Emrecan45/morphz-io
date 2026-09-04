import * as THREE from 'three'
import { makeFoodField } from './scene.js'
import { pullX, pullZ } from './lift.js'
import {
  SPECIES,
  eatAround,
  scatterLoot,
  markEaten,
  restartRepop,
  resetFood,
  foodValue,
  ringAtPos,
} from './world/food.js'

const TINTS = [
  { color: 0xc2f562, emissive: 0x5f9e1c },
  { color: 0xffe15c, emissive: 0xb08405 },
  { color: 0xcf92ff, emissive: 0x6d18b5 },
]

export {
  eatAround as eatNearby,
  scatterLoot as scatterLoot,
  markEaten,
  restartRepop,
  resetFood,
  ringAtPos as ringAt,
}

export const valueOf = foodValue

export function skinFood(scene, food) {
  food.dummy = new THREE.Object3D()
  for (let i = 0; i < food.groups.length; i++) {
    food.groups[i].mesh = makeFoodField(scene, SPECIES[i].count, TINTS[i].color, TINTS[i].emissive)
  }
  return food
}

export function foodColor(item) {
  return TINTS[item.ring].color
}

export function foodHeight(item) {
  return SPECIES[item.ring].size + 0.4
}

export function drawFood(food, dt) {
  if (!food.dummy) return
  food.t += dt
  const d = food.dummy
  for (const g of food.groups) {
    for (let i = 0; i < g.items.length; i++) {
      const it = g.items[i]
      if (!it.alive) {
        d.position.set(0, -60, 0)
        d.scale.setScalar(0.0001)
        d.updateMatrix()
        g.mesh.setMatrixAt(i, d.matrix)
        g.mesh.userData.outline.setMatrixAt(i, d.matrix)
        continue
      }
      it.scale = Math.min(1, it.scale + dt * 3.4)
      const bob = Math.sin(food.t * 2.1 + it.phase) * 0.16
      const h = g.size + 0.4 + bob
      d.position.set(pullX(it.x, h), h, pullZ(it.z, h))
      d.rotation.set(food.t * 0.7 + it.phase, food.t * 0.9 + it.phase, 0)
      d.scale.setScalar(g.size * it.scale)
      d.updateMatrix()
      g.mesh.setMatrixAt(i, d.matrix)
      g.mesh.userData.outline.setMatrixAt(i, d.matrix)
    }
    g.mesh.instanceMatrix.needsUpdate = true
    g.mesh.userData.outline.instanceMatrix.needsUpdate = true
  }
}
