const cache = new Map()
let remote = null

function local() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function prefGet(key) {
  if (cache.has(key)) return cache.get(key)
  const store = local()
  if (!store) return null
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

export function prefSet(key, value) {
  const text = value === null || value === undefined ? null : String(value)
  cache.set(key, text)
  if (remote) {
    remote(key, text)
    return
  }
  const store = local()
  if (!store) return
  try {
    if (text === null) store.removeItem(key)
    else store.setItem(key, text)
  } catch {
  }
}

export function bindPrefs(loaded, save) {
  for (const [key, value] of Object.entries(loaded || {})) {
    cache.set(key, value === undefined || value === null ? null : String(value))
  }
  remote = typeof save === 'function' ? save : null
}
