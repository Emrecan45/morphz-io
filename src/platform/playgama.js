import { createBase, loadScript } from './none.js'

const SDK_URL = 'https://bridge.playgama.com/v2/stable/playgama-bridge.js'
const LOAD_WAIT = 8000
const AD_OPEN_WAIT = 10000
const AD_PLAY_WAIT = 300000
const PLACEMENT = 'round_end'

export function createPlatform() {
  return createPlaygama()
}

export function createPlaygama() {
  const api = createBase('playgama')
  let sdk = null
  let host = false
  let readySent = false
  let adWatch = null

  function call(fn) {
    if (!sdk) return
    try {
      fn(sdk)
    } catch {
    }
  }

  function read(fn, fallback) {
    if (!sdk) return fallback
    try {
      const value = fn(sdk)
      return value === undefined ? fallback : value
    } catch {
      return fallback
    }
  }

  function tell(message) {
    call((s) => s.platform.sendMessage(message))
  }

  api.init = async () => {
    if (!window.bridge) {
      try {
        await loadScript(SDK_URL, LOAD_WAIT)
      } catch {
        return
      }
    }
    if (!window.bridge || typeof window.bridge.initialize !== 'function') return
    try {
      await window.bridge.initialize()
      sdk = window.bridge
      host = true
    } catch {
      sdk = null
      host = false
      return
    }
    call((s) => s.advertisement.on(s.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, (state) => adWatch && adWatch(state)))
  }

  api.isHost = () => host

  api.hasAds = () => host

  api.pacesAds = () => true

  api.locale = () => read((s) => (typeof s.platform.language === 'string' ? s.platform.language : null), null)

  api.audioMuted = () => read((s) => s.platform.isAudioEnabled === false, false)

  api.onSettingsChange = (fn) => {
    call((s) => s.platform.on(s.EVENT_NAME.AUDIO_STATE_CHANGED, (enabled) => fn({ muteAudio: !enabled })))
  }

  api.onPause = (fn) => {
    call((s) => s.platform.on(s.EVENT_NAME.PAUSE_STATE_CHANGED, (paused) => fn(!!paused)))
  }

  api.linksAllowed = () => read((s) => s.platform.isExternalLinksAllowed !== false, true)

  api.hasStorage = () => host

  api.loadPrefs = async (keys) => {
    const out = {}
    if (!sdk) return out
    try {
      const values = await sdk.storage.get(keys)
      keys.forEach((key, i) => {
        out[key] = values && values[i] !== undefined ? values[i] : null
      })
    } catch {
    }
    return out
  }

  api.savePref = (key, value) => {
    call((s) => (value === null ? s.storage.delete([key]) : s.storage.set([key], [value])).catch(() => {}))
  }

  api.loadingStop = () => {
    if (readySent || !sdk) return
    readySent = true
    tell('game_ready')
  }

  api.gameplayStart = () => tell('level_started')

  api.gameplayStop = () => tell('level_completed')

  api.happyTime = () => tell('player_got_achievement')

  api.requestMidgameAd = (hooks) => {
    if (!sdk || !host || !api.hasAds()) {
      hooks.onDone()
      return
    }
    let settled = false
    let opened = false
    const done = () => {
      if (settled) return
      settled = true
      adWatch = null
      hooks.onDone()
    }
    adWatch = (state) => {
      if (state === 'opened') {
        opened = true
        setTimeout(done, AD_PLAY_WAIT)
        if (hooks.onStart) hooks.onStart()
        return
      }
      if (state === 'closed' || state === 'failed') done()
    }
    setTimeout(() => {
      if (!opened) done()
    }, AD_OPEN_WAIT)
    try {
      sdk.advertisement.showInterstitial(PLACEMENT)
    } catch {
      done()
    }
  }

  return api
}
