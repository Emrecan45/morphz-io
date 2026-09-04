import { onOwnSite } from './brand.js'

const STORE_KEY = onOwnSite() ? import.meta.env.VITE_TURNSTILE_KEY || '' : ''
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let loading = null
let host = null
let tokenReady = null
let tokenDate = 0
let pendingToken = null
export let lastReason = ''

const TOKEN_TTL = 240000

let slot = null
let watchers = []

export function setCaptchaSlot(el) {
  slot = el || null
}

export function spendToken() {
  tokenReady = null
  tokenDate = 0
}

export function captchaBusy() {
  return !!pendingToken
}

export function onCaptchaState(fn) {
  watchers.push(fn)
  return () => {
    watchers = watchers.filter((w) => w !== fn)
  }
}

function announce() {
  for (const fn of watchers) fn(!pendingToken)
}

export function prepareToken() {
  if (!STORE_KEY) return
  preloadCaptcha()
  if (pendingToken || (tokenReady && Date.now() - tokenDate < TOKEN_TTL)) return
  pendingToken = getToken()
    .then((v) => {
      if (v) {
        tokenReady = v
        tokenDate = Date.now()
      }
      pendingToken = null
      announce()
      return v
    })
    .catch(() => {
      pendingToken = null
      announce()
      return null
    })
  announce()
}

export function preloadCaptcha() {
  if (!STORE_KEY || loading) return
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT
    s.async = true
    s.defer = true
    s.onload = () => resolve(true)
    s.onerror = () => reject(new Error('script'))
    document.head.appendChild(s)
  })
}

function waitForApi() {
  return new Promise((resolve, reject) => {
    const begin = Date.now()
    const tickFn = setInterval(() => {
      if (window.turnstile) {
        clearInterval(tickFn)
        resolve(window.turnstile)
        return
      }
      if (Date.now() - begin > 8000) {
        clearInterval(tickFn)
        reject(new Error('script'))
      }
    }, 60)
  })
}

function waitForSlot() {
  return new Promise((resolve) => {
    if (slot && slot.isConnected) {
      resolve(slot)
      return
    }
    const begin = Date.now()
    const tickFn = setInterval(() => {
      if (slot && slot.isConnected) {
        clearInterval(tickFn)
        resolve(slot)
        return
      }
      if (Date.now() - begin > 6000) {
        clearInterval(tickFn)
        resolve(null)
      }
    }, 80)
  })
}

function openHost(nest) {
  if (host && host.isConnected && host.parentElement === nest) return host
  host = document.createElement('div')
  host.className = 'captcha inline'
  nest.appendChild(host)
  return host
}

function dropHost(dead, api, widgetId) {
  if (!dead) return
  if (host === dead) host = null
  const drop = () => {
    if (api && widgetId !== null && widgetId !== undefined) {
      try {
        api.remove(widgetId)
      } catch {
      }
    }
    dead.remove()
  }
  if (window.requestIdleCallback) requestIdleCallback(drop, { timeout: 2500 })
  else setTimeout(drop, 600)
}

export async function verifyHuman(nest) {
  lastReason = ''
  if (!STORE_KEY) return 'local'
  if (nest) return getToken(nest)
  if (tokenReady && Date.now() - tokenDate < TOKEN_TTL) return tokenReady
  if (pendingToken) {
    const v = await pendingToken
    tokenReady = null
    if (v) return v
  }
  return getToken()
}

async function getToken(seat) {
  preloadCaptcha()
  let target = null
  try {
    await loading
    const api = await waitForApi()
    const nest = seat || (await waitForSlot())
    if (!nest || !nest.isConnected) {
      lastReason = 'slot'
      return null
    }
    target = openHost(nest)
    let widgetId = null
    const token = await new Promise((resolve) => {
      let done = false
      const over = (v) => {
        if (done) return
        done = true
        resolve(v)
      }
      try {
        widgetId = api.render(target, {
          sitekey: STORE_KEY,
          theme: 'dark',
          size: 'flexible',
          appearance: seat ? 'interaction-only' : 'always',
          retry: 'never',
          callback: (v) => over(v),
          'error-callback': () => over(null),
          'timeout-callback': () => over(null),
        })
      } catch {
        over(null)
        return
      }
      setTimeout(() => over(null), 45000)
    })
    dropHost(target, api, widgetId)
    if (!token) {
      lastReason = 'token'
      return null
    }
    return token
  } catch {
    dropHost(target, null, null)
    lastReason = 'script'
    return null
  }
}
