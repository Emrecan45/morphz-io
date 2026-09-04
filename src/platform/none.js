export function createBase(name) {
  return {
    name,
    init() {
      return Promise.resolve()
    },
    isHost() {
      return false
    },
    locale() {
      return null
    },
    audioMuted() {
      return false
    },
    onSettingsChange() {},
    pacesAds() {
      return false
    },
    loadingStart() {},
    loadingStop() {},
    gameplayStart() {},
    gameplayStop() {},
    happyTime() {},
    requestMidgameAd(hooks) {
      hooks.onDone()
    },
  }
}

export function createPlatform() {
  return createBase('none')
}

export function loadScript(src, wait) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[data-portal="' + src + '"]')) {
      resolve()
      return
    }
    const node = document.createElement('script')
    node.src = src
    node.async = true
    node.setAttribute('data-portal', src)
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error('timeout'))
    }, wait)
    node.addEventListener('load', () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve()
    })
    node.addEventListener('error', () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(new Error('load'))
    })
    document.head.appendChild(node)
  })
}
