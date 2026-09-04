import { createBase } from './platform/none.js'
import { createPlatform } from 'virtual:platform'

const AD_GAP = 180000
const AD_FLOOR = 60000

let portal = createBase('none')
let started = false
let lastAd = 0

export async function initSdk() {
  portal = createPlatform()
  try {
    await portal.init()
  } catch {
    portal = createBase('none')
  }
  lastAd = performance.now()
  return portal.name
}

export function portalLocale() {
  return portal.locale()
}

export function portalMuted() {
  return portal.audioMuted()
}

export function onPortalSettings(fn) {
  portal.onSettingsChange(fn)
}

export function loadingStart() {
  portal.loadingStart()
}

export function loadingStop() {
  portal.loadingStop()
}

export function gameplayStart() {
  if (started) return
  started = true
  portal.gameplayStart()
}

export function gameplayStop() {
  if (!started) return
  started = false
  portal.gameplayStop()
}

export function happyTime() {
  portal.happyTime()
}

export function adReady() {
  if (!portal.isHost()) return false
  return performance.now() - lastAd >= (portal.pacesAds() ? AD_FLOOR : AD_GAP)
}

export function midgameAd(hooks) {
  if (!adReady()) return Promise.resolve(false)
  lastAd = performance.now()
  return new Promise((resolve) => {
    let shown = false
    portal.requestMidgameAd({
      onStart: () => {
        shown = true
        if (hooks && hooks.onStart) hooks.onStart()
      },
      onDone: () => {
        if (hooks && hooks.onDone) hooks.onDone()
        resolve(shown)
      },
    })
  })
}
