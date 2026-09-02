import { CAM } from './config.js'

const SQUASH = Math.cos(CAM.tilt)
const DEAD = 0.24

const KEYS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
}

export function createInput(layer, canvas, actions) {
  const state = {
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    x: 0,
    z: 0,
    aimX: 0,
    aimY: 0,
    aimedAt: false,
    aimStick: false,
    aimDX: 0,
    aimDZ: 1,
  }

  function onKey(e, down) {
    const slot = KEYS[e.code]
    if (slot) {
      state[slot] = down
      e.preventDefault()
      actions.onFirstInput()
      return
    }
    if (e.code === 'Space') {
      state.attack = down
      e.preventDefault()
      actions.onFirstInput()
      return
    }
    if (!down) return
    if (e.code === 'KeyM') actions.onMute()
    else if (e.code === 'Escape') actions.onEscape()
  }

  window.addEventListener('keydown', (e) => onKey(e, true))
  window.addEventListener('keyup', (e) => onKey(e, false))
  window.addEventListener('blur', () => {
    state.up = state.down = state.left = state.right = state.attack = false
  })

  function setAim(e) {
    if (e.pointerType === 'touch') return
    const r = canvas.getBoundingClientRect()
    state.aimX = ((e.clientX - r.left) / r.width) * 2 - 1
    state.aimY = -((e.clientY - r.top) / r.height) * 2 + 1
    state.aimedAt = true
    state.aimStick = false
  }

  canvas.addEventListener('pointermove', setAim)

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || e.button !== 0) return
    setAim(e)
    state.attack = true
    actions.onFirstInput()
  })
  window.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'touch' || e.button !== 0) return
    state.attack = false
  })
  canvas.addEventListener('contextmenu', (e) => e.preventDefault())

  const pad = document.createElement('div')
  pad.className = 'pad'
  pad.innerHTML =
    '<div class="base move"><div class="thumb"></div></div>' +
    '<div class="base aim"><div class="thumb"></div></div>'
  layer.appendChild(pad)

  function makeStick(el, onVec, onEnd) {
    const knob = el.querySelector('.thumb')
    let held = null

    function move(e) {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      let dx = e.clientX - cx
      let dy = e.clientY - cy
      const max = r.width * 0.42
      const d = Math.hypot(dx, dy)
      if (d > max) {
        dx = (dx / d) * max
        dy = (dy / d) * max
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`
      onVec(dx / max, dy / max, Math.min(1, d / max))
    }

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      held = e.pointerId
      el.setPointerCapture(e.pointerId)
      el.classList.add('held')
      move(e)
      actions.onFirstInput()
    })
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== held) return
      e.preventDefault()
      move(e)
    })
    const release = (e) => {
      if (e.pointerId !== held) return
      held = null
      el.classList.remove('held')
      knob.style.transform = 'translate(0px, 0px)'
      onEnd()
    }
    el.addEventListener('pointerup', release)
    el.addEventListener('pointercancel', release)
    el.addEventListener('lostpointercapture', release)
  }

  makeStick(
    pad.querySelector('.base.move'),
    (x, y) => {
      state.x = x
      state.z = y
    },
    () => {
      state.x = 0
      state.z = 0
    }
  )

  makeStick(
    pad.querySelector('.base.aim'),
    (x, y, force) => {
      if (force > DEAD) {
        state.aimDX = x
        state.aimDZ = y / SQUASH
        state.aimStick = true
      }
      state.attack = true
    },
    () => {
      state.attack = false
    }
  )

  return state
}

export function inputVector(state) {
  let x = state.x
  let z = state.z
  if (state.left) x -= 1
  if (state.right) x += 1
  if (state.up) z -= 1
  if (state.down) z += 1
  const m = Math.hypot(x, z)
  if (m > 1) {
    x /= m
    z /= m
  }
  return [x, z]
}
