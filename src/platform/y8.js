import { createBase, loadScript } from './none.js'

const SDK_URL = 'https://cdn.y8.com/minimal-sdk/2-0/y8.min.js'
const LOAD_WAIT = 8000
const READY_WAIT = 8000
const AD_OPEN_WAIT = 10000
const AD_PLAY_WAIT = 300000

export function createPlatform() {
  return createY8(import.meta.env.VITE_Y8_GAME_ID || '', import.meta.env.VITE_Y8_APP_ID || '')
}

export function createY8(gameId, appId) {
  const api = createBase('y8')
  let sdk = null
  let ready = false
  let tongue = null

  function waitForReady() {
    return new Promise((resolve) => {
      let settled = false
      const done = () => {
        if (settled) return
        settled = true
        resolve()
      }
      window.addEventListener('y8sdk.ready', done, { once: true })
      setTimeout(done, READY_WAIT)
      if (window.y8 && window.y8.emitReadyEvent) window.y8.emitReadyEvent()
    })
  }

  api.init = async () => {
    if (!gameId && !appId) return
    try {
      await loadScript(SDK_URL, LOAD_WAIT)
    } catch {
      return
    }
    await waitForReady()
    if (!window.y8 || typeof window.y8.sdk !== 'function') return
    const ads = gameId ? { gameId, preloadAdBreaks: 'on', sound: 'on', onReady: () => {} } : null
    try {
      sdk = window.y8.sdk()
      sdk.init({ appId, autoLogin: false }, ads)
    } catch {
      sdk = null
      return
    }
    ready = true
    try {
      tongue = await sdk.getPlatformLocale()
    } catch {
    }
  }

  api.isHost = () => ready

  api.hasAds = () => true

  api.pacesAds = () => true

  api.locale = () => (typeof tongue === 'string' && tongue ? tongue : null)

  api.requestMidgameAd = (hooks) => {
    if (!ready || !gameId) {
      hooks.onDone()
      return
    }
    let settled = false
    let opened = false
    const done = () => {
      if (settled) return
      settled = true
      hooks.onDone()
    }
    setTimeout(() => {
      if (!opened) done()
    }, AD_OPEN_WAIT)
    try {
      sdk
        .showAd({
          type: 'next',
          name: 'round-end',
          beforeAd: () => {
            opened = true
            setTimeout(done, AD_PLAY_WAIT)
            if (hooks.onStart) hooks.onStart()
          },
          afterAd: done,
          adBreakDone: done,
        })
        .catch(done)
    } catch {
      done()
    }
  }

  return api
}
