import { createBase, loadScript } from './none.js'

const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js'
const LOAD_WAIT = 8000
const AD_OPEN_WAIT = 10000
const AD_PLAY_WAIT = 300000
const ADS = import.meta.env.VITE_CG_ADS !== 'off'
const BANNER_DEAD = ['bannersDisabledBasicLaunch', 'bannersDisabledMobileApp', 'maxRefreshReached']

export function createPlatform() {
  return createCrazyGames()
}

export function createCrazyGames() {
  const api = createBase('crazygames')
  let sdk = null
  let host = false

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

  api.init = async () => {
    if (!window.CrazyGames) {
      try {
        await loadScript(SDK_URL, LOAD_WAIT)
      } catch {
        return
      }
    }
    if (!window.CrazyGames || !window.CrazyGames.SDK) return
    sdk = window.CrazyGames.SDK
    try {
      await sdk.init()
      host = sdk.environment === 'crazygames'
    } catch {
      sdk = null
      host = false
    }
  }

  api.isHost = () => host

  api.hasAds = () => ADS

  api.pacesAds = () => true

  api.locale = () => {
    const info = read((s) => s.user.systemInfo, null)
    return info && typeof info.locale === 'string' ? info.locale : null
  }

  api.audioMuted = () => read((s) => s.game.settings.muteAudio === true, false)

  api.onSettingsChange = (fn) => {
    call((s) => s.game.addSettingsChangeListener(fn))
  }

  api.loadingStart = () => {
    call((s) => s.game.loadingStart())
  }

  api.loadingStop = () => {
    call((s) => s.game.loadingStop())
  }

  api.gameplayStart = () => {
    call((s) => s.game.gameplayStart())
  }

  api.gameplayStop = () => {
    call((s) => s.game.gameplayStop())
  }

  api.happyTime = () => {
    call((s) => s.game.happytime())
  }

  if (ADS) {
    api.hasBanner = () => true

    api.showBanner = async (el) => {
      if (!sdk || !host || !el || !el.id) return 'stop'
      try {
        await sdk.banner.requestResponsiveBanner(el.id)
        return 'ok'
      } catch (e) {
        return BANNER_DEAD.includes(e && e.code) ? 'stop' : 'retry'
      }
    }

    api.clearBanners = () => {
      call((s) => s.banner.clearAllBanners())
    }

    api.requestMidgameAd = (hooks) => {
      if (!sdk || !host) {
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
        sdk.ad.requestAd('midgame', {
          adStarted: () => {
            opened = true
            setTimeout(done, AD_PLAY_WAIT)
            if (hooks.onStart) hooks.onStart()
          },
          adFinished: done,
          adError: done,
        })
      } catch {
        done()
      }
    }
  }

  return api
}
