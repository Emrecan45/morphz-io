import { createBase } from './platform/none.js'
import { createPlatform } from 'virtual:platform'

const AD_GAP = 180000
const AD_FLOOR = 60000
const BANNER_GAP = 30000

let portal = createBase('none')
let started = false
let lastAd = 0
let ready = false
let adBusy = false
let lastBanner = 0
let bannerDead = false

export async function initSdk() {
  portal = createPlatform()
  try {
    await portal.init()
  } catch {
    portal = createBase('none')
  }
  lastAd = performance.now() - AD_GAP
  ready = true
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
  if (!portal.isHost() || !portal.hasAds()) return false
  return performance.now() - lastAd >= (portal.pacesAds() ? AD_FLOOR : AD_GAP)
}

export function midgameAd(hooks) {
  if (!adReady()) return Promise.resolve(false)
  lastAd = performance.now()
  adBusy = true
  return new Promise((resolve) => {
    let shown = false
    portal.requestMidgameAd({
      onStart: () => {
        shown = true
        if (hooks && hooks.onStart) hooks.onStart()
      },
      onDone: () => {
        adBusy = false
        if (hooks && hooks.onDone) hooks.onDone()
        resolve(shown)
      },
    })
  })
}

export function bannerOffered() {
  return ready && portal.isHost() && portal.hasBanner()
}

export function bannerState() {
  if (bannerDead) return 'off'
  if (!ready || adBusy) return 'wait'
  if (!portal.isHost() || !portal.hasBanner()) return 'off'
  if (lastBanner && performance.now() - lastBanner < BANNER_GAP) return 'wait'
  return 'go'
}

export function showBanner(el) {
  if (!el || bannerState() !== 'go') return Promise.resolve(false)
  lastBanner = performance.now()
  return portal.showBanner(el).then((verdict) => {
    if (verdict === 'stop') bannerDead = true
    return verdict === 'ok'
  })
}

export function clearBanners() {
  portal.clearBanners()
}
