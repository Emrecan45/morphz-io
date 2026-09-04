function onLocalhost() {
  const h = location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]'
}

const LOCAL_URL = (import.meta.env.VITE_ARENA_LOCAL || '').replace(/\/+$/, '')
const REMOTE_URL = (import.meta.env.VITE_ARENA_URL || '').replace(/\/+$/, '')
const BASE = onLocalhost() && LOCAL_URL ? LOCAL_URL : REMOTE_URL

export function networkAvailable() {
  return !!BASE
}

function urlWs(suffix) {
  return BASE.replace(/^http/, 'ws') + suffix
}

let pass = ''

export function hasPass() {
  return !!pass
}

const ROOM_WAIT = 3500
const MAIL_WAIT = 15000

function briefFetch(url, wait) {
  const stop = new AbortController()
  const timer = setTimeout(() => stop.abort(), wait)
  return fetch(url, { signal: stop.signal }).finally(() => clearTimeout(timer))
}

export async function findRoom(mode, token) {
  if (!BASE) return null
  const proof = pass ? 'pass=' + encodeURIComponent(pass) : 'token=' + encodeURIComponent(token || '')
  try {
    const rep = await briefFetch(BASE + '/room?mode=' + mode + '&' + proof, ROOM_WAIT)
    if (rep.status === 403) {
      pass = ''
      return { refused: true }
    }
    if (!rep.ok) return null
    const data = await rep.json()
    if (data && data.pass) pass = data.pass
    return data
  } catch {
    return null
  }
}

export async function sendContact(body) {
  if (!BASE) return { ok: false }
  const stop = new AbortController()
  const timer = setTimeout(() => stop.abort(), MAIL_WAIT)
  try {
    const rep = await fetch(BASE + '/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: stop.signal,
    })
    const data = await rep.json()
    return { ok: !!(data && data.ok) }
  } catch {
    return { ok: false }
  } finally {
    clearTimeout(timer)
  }
}

export async function liveRooms() {
  if (!BASE) return null
  try {
    const rep = await briefFetch(BASE + '/live', ROOM_WAIT)
    if (!rep.ok) return null
    return await rep.json()
  } catch {
    return null
  }
}

export function connect(mode, room, handlers, watch) {
  const ws = new WebSocket(urlWs('/play?mode=' + mode + '&room=' + room + (watch ? '&watch=1' : '')))
  let alive = true

  ws.addEventListener('open', () => {
    if (handlers.onOpen) handlers.onOpen()
  })
  ws.addEventListener('message', (evt) => {
    let msg = null
    try {
      msg = JSON.parse(evt.data)
    } catch {
      return
    }
    if (Array.isArray(msg) && handlers.onMessage) handlers.onMessage(msg[0], msg[1])
  })
  ws.addEventListener('close', () => {
    if (!alive) return
    alive = false
    if (handlers.onClose) handlers.onClose()
  })
  ws.addEventListener('error', () => {
    if (!alive) return
    alive = false
    if (handlers.onClose) handlers.onClose()
  })

  return {
    get ready() {
      return ws.readyState === WebSocket.OPEN
    },
    send(type, data) {
      if (ws.readyState !== WebSocket.OPEN) return
      ws.send(JSON.stringify([type, data]))
    },
    close() {
      alive = false
      try {
        ws.close()
      } catch {
      }
    },
  }
}
