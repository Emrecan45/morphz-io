import { createBase, loadScript } from './none.js'

const SDK_URL = 'https://html5.api.gamedistribution.com/main.min.js'
const LOAD_WAIT = 8000
const READY_WAIT = 8000
const AD_OPEN_WAIT = 10000
const AD_PLAY_WAIT = 300000

export function createPlatform() {
  return createGd(import.meta.env.VITE_GD_GAME_ID || '')
}

export function createGd(gameId) {
  const api = createBase('gd')
  let sdk = null
  let ready = false
  let live = null
  let woke = null

  function report(name) {
    if (name === 'SDK_READY' || name === 'SDK_ERROR') {
      const wake = woke
      woke = null
      if (wake) wake(name === 'SDK_READY')
      return
    }
    if (!live) return
    if (name === 'SDK_GAME_PAUSE') live.open()
    else if (name === 'SDK_GAME_START') live.shut()
  }

  api.init = async () => {
    if (!gameId) return
    const settled = new Promise((resolve) => {
      woke = resolve
      setTimeout(() => {
        if (!woke) return
        woke = null
        resolve(false)
      }, READY_WAIT)
    })
    window.GD_OPTIONS = {
      gameId,
      advertisementSettings: { autoplay: true },
      onEvent: (e) => {
        try {
          report(e && e.name)
        } catch {
        }
      },
    }
    try {
      await loadScript(SDK_URL, LOAD_WAIT)
    } catch {
      return
    }
    if (!(await settled)) return
    if (!window.gdsdk || typeof window.gdsdk.showAd !== 'function') return
    sdk = window.gdsdk
    ready = true
  }

  api.isHost = () => ready

  api.hasAds = () => true

  api.pacesAds = () => true

  api.hasBanner = () => true

  api.showBanner = async (el) => {
    if (!ready || !el || !el.id) return 'stop'
    const kind = (sdk.AdType && sdk.AdType.Display) || 'display'
    try {
      await sdk.showAd(kind, { containerId: el.id })
      return 'ok'
    } catch {
      return 'retry'
    }
  }

  api.requestMidgameAd = (hooks) => {
    if (!ready) {
      hooks.onDone()
      return
    }
    let settled = false
    let opened = false
    const shut = () => {
      if (settled) return
      settled = true
      live = null
      hooks.onDone()
    }
    const open = () => {
      if (opened) return
      opened = true
      setTimeout(shut, AD_PLAY_WAIT)
      if (hooks.onStart) hooks.onStart()
    }
    live = { open, shut }
    setTimeout(() => {
      if (!opened) shut()
    }, AD_OPEN_WAIT)
    try {
      sdk.showAd().then(shut, shut)
    } catch {
      shut()
    }
  }

  return api
}
