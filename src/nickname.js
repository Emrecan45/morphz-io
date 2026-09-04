const SOURCES = [
  'https://cdn.jsdelivr.net/gh/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words@master/fr',
  'https://cdn.jsdelivr.net/gh/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words@master/en',
]
const STORE_KEY = 'morphz.profanity'
const DURATION = 24 * 3600 * 1000

const FALLBACK = [
  'connard', 'connasse', 'enculer', 'encule', 'salope', 'putain', 'pute', 'merde',
  'nique', 'niquer', 'batard', 'pedale', 'pd', 'tapette', 'bite', 'couille',
  'chatte', 'nazi', 'hitler', 'negre', 'bougnoule', 'youpin', 'fuck', 'shit',
  'bitch', 'cunt', 'nigger', 'faggot', 'whore', 'rape', 'retard',
]

const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '+': 't' }

let words = FALLBACK.slice()

export function normalize(txt) {
  return String(txt)
    .normalize('NFD')
    .toLowerCase()
    .replace(/[0134578@$!+]/g, (c) => LEET[c])
    .replace(/[^a-z]/g, '')
}

function read() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (!cached || !Array.isArray(cached.words) || !cached.words.length) return null
    return cached
  } catch {
    return null
  }
}

function remember(list) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ t: Date.now(), words: list }))
  } catch {
  }
}

async function download() {
  const batches = await Promise.all(
    SOURCES.map((url) =>
      fetch(url, { cache: 'no-cache' })
        .then((r) => (r.ok ? r.text() : ''))
        .catch(() => '')
    )
  )
  const seenSet = new Set()
  for (const batch of batches) {
    for (const line of batch.split('\n')) {
      const m = normalize(line)
      if (m.length >= 2) seenSet.add(m)
    }
  }
  return [...seenSet]
}

export function loadProfanity() {
  const cached = read()
  if (cached) words = cached.words.concat(FALLBACK)
  if (cached && Date.now() - cached.t < DURATION) return Promise.resolve(words)
  return download()
    .then((list) => {
      if (list.length < 50) return words
      remember(list)
      words = list.concat(FALLBACK)
      return words
    })
    .catch(() => words)
}

export function isProfane(nickname) {
  const n = normalize(nickname)
  if (!n) return false
  for (const word of words) {
    if (word.length <= 3) {
      if (n === word) return true
    } else if (n.includes(word)) {
      return true
    }
  }
  return false
}

export function cleanNickname(nickname) {
  const clean = String(nickname || '').replace(/\s+/g, ' ').trim().slice(0, 12)
  if (!clean) return { ok: true, name: '' }
  if (isProfane(clean)) return { ok: false, key: 'errorRude' }
  return { ok: true, name: clean }
}
