function ask(query) {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(query).matches
}

export const COARSE = ask('(pointer: coarse)') || ask('(hover: none)')

export const LOW = COARSE

export const QUALITY = LOW
  ? { pixelRatio: 1.5, samples: 0, antialias: false, shadowMap: 1024, softShadow: false, shadowSpan: 24 }
  : { pixelRatio: 2, samples: 4, antialias: true, shadowMap: 3072, softShadow: true, shadowSpan: 30 }

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
