import * as THREE from 'three'

let ramp = null

export function toonRamp() {
  if (ramp) return ramp
  const steps = new Uint8Array([96, 168, 214, 255])
  ramp = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat)
  ramp.minFilter = THREE.NearestFilter
  ramp.magFilter = THREE.NearestFilter
  ramp.generateMipmaps = false
  ramp.needsUpdate = true
  return ramp
}

export function toonMaterial(options) {
  return new THREE.MeshToonMaterial({ gradientMap: toonRamp(), ...options })
}
