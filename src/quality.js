function ask(query) {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(query).matches
}

export const COARSE = ask('(pointer: coarse)') || ask('(hover: none)')

const PROFILES = {
  high: { pixelRatio: 2, samples: 4, antialias: true, shadowMap: 3072, softShadow: true, shadowSpan: 30, bloom: true, seaRows: 40, seaCols: 640, leaf: 1, spin: 55, cull: 62 },
  floor: { pixelRatio: 1, samples: 0, antialias: false, shadowMap: 1536, softShadow: false, shadowSpan: 30, bloom: false, seaRows: 40, seaCols: 640, leaf: 1, spin: 55, cull: 62 },
}

const KEY = 'morphz.gfx'

function stored() {
  try {
    const v = localStorage.getItem(KEY)
    return PROFILES[v] ? v : ''
  } catch {
    return ''
  }
}

let tier = stored() || 'floor'
let onShift = null

export function qualityTier() {
  return tier
}

export const QUALITY = { ...PROFILES[tier] }

export function onQualityChange(fn) {
  onShift = fn
}

export function chooseTier(name) {
  if (!PROFILES[name] || name === tier) return
  tier = name
  Object.assign(QUALITY, PROFILES[name])
  try {
    localStorage.setItem(KEY, name)
  } catch {}
  scale = 1
  since = 0
  times.length = 0
  strikes = 0
  if (onShift) onShift(name)
}

const SCALES = [1, 0.75, 0.5]
const SLOW = 33
const WINDOW = 45
const GRACE = 3000

let scale = 1
let since = 0
let strikes = 0
const times = []

export function renderScale() {
  return scale
}

export function feedFrame(ms) {
  if (tier !== 'floor' || scale === SCALES[SCALES.length - 1]) return
  const now = performance.now()
  if (!since) since = now
  if (now - since < GRACE) return
  times.push(ms)
  if (times.length < WINDOW) return
  const sorted = times.slice().sort((a, b) => a - b)
  const mid = sorted[sorted.length >> 1]
  times.length = 0
  if (mid <= SLOW) {
    strikes = 0
    return
  }
  strikes++
  if (strikes < 2) return
  strikes = 0
  scale = SCALES[SCALES.indexOf(scale) + 1]
  since = now
  if (onShift) onShift(tier)
}

export function markTouch() {
  if (COARSE) document.body.classList.add('touch')
  window.addEventListener('touchstart', () => document.body.classList.add('touch'), {
    once: true,
    passive: true,
  })
  blockDoubleTap()
}

const TAP_GAP = 340
const TAP_NEAR = 34

function blockDoubleTap() {
  let last = 0
  let lx = 0
  let ly = 0
  window.addEventListener(
    'touchend',
    (e) => {
      const t = e.changedTouches[0]
      if (!t) return
      const now = performance.now()
      const near = Math.abs(t.clientX - lx) < TAP_NEAR && Math.abs(t.clientY - ly) < TAP_NEAR
      if (now - last < TAP_GAP && near && e.cancelable) e.preventDefault()
      last = now
      lx = t.clientX
      ly = t.clientY
    },
    { passive: false }
  )
  document.addEventListener('gesturestart', (e) => e.preventDefault())
  document.addEventListener('dblclick', (e) => e.preventDefault())
}

function lockLandscape() {
  const lock = screen.orientation && screen.orientation.lock
  if (!lock) return
  try {
    const done = lock.call(screen.orientation, 'landscape')
    if (done && done.catch) done.catch(() => {})
  } catch {}
}

export function enterImmersive() {
  if (!COARSE) return
  const root = document.documentElement
  const go = root.requestFullscreen || root.webkitRequestFullscreen
  if (!go || document.fullscreenElement) {
    lockLandscape()
    return
  }
  try {
    const done = go.call(root, { navigationUI: 'hide' })
    if (done && done.then) done.then(lockLandscape, lockLandscape)
    else lockLandscape()
  } catch {
    lockLandscape()
  }
}
