let camX = 0
let camY = 24
let camZ = 0

export function aimCamera(cam) {
  if (cam.position.y < 1) return
  camX = cam.position.x
  camY = cam.position.y
  camZ = cam.position.z
}

export function pullX(x, h) {
  return x + (h / camY) * (camX - x)
}

export function pullZ(z, h) {
  return z + (h / camY) * (camZ - z)
}
