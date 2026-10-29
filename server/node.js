import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { timingSafeEqual } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'
import { Arena } from './arena.js'
import { createApp, roomParam } from './app.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const DATA = process.env.ARENA_DATA || join(HERE, '..', 'data')
const PORT = Number(process.env.PORT || 8787)
const HOST = process.env.HOST || '127.0.0.1'
const BODY_MAX = 64 * 1024
const STATUS = { 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict', 503: 'Service Unavailable' }

mkdirSync(DATA, { recursive: true })

function storage(name) {
  const file = join(DATA, name.replace(/[^a-z0-9-]/gi, '_') + '.json')
  let cache = {}
  try {
    cache = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
  }
  return {
    async get(key) {
      return cache[key]
    },
    async put(key, value) {
      cache[key] = value
      writeFileSync(file + '.tmp', JSON.stringify(cache))
      renameSync(file + '.tmp', file)
    },
  }
}

const arenas = new Map()

function arenaFor(name) {
  let arena = arenas.get(name)
  if (!arena) {
    const state = { storage: storage(name), blockConcurrencyWhile: (fn) => fn() }
    arena = new Arena(state, env)
    arenas.set(name, arena)
  }
  return arena
}

const env = {
  ...process.env,
  ARENA_DO: {
    idFromName: (name) => name,
    get: (name) => ({
      fetch: (input) => arenaFor(name).fetch(typeof input === 'string' ? new Request(input) : input),
    }),
  },
}

const app = createApp(readFileSync(join(HERE, 'logo.png')))

const RELAY = Buffer.from(process.env.RELAY_KEY || '')

function fromRelay(req) {
  if (!RELAY.length) return true
  const given = Buffer.from(String(req.headers['x-morphz-relay'] || ''))
  return given.length === RELAY.length && timingSafeEqual(given, RELAY)
}

function clientIp(req) {
  const raw = req.headers['x-morphz-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
  return String(raw).split(',')[0].trim()
}

function readBody(req) {
  return new Promise((done, fail) => {
    const parts = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > BODY_MAX) {
        fail(new Error('body too large'))
        req.destroy()
        return
      }
      parts.push(chunk)
    })
    req.on('end', () => done(Buffer.concat(parts)))
    req.on('error', fail)
  })
}

const server = createServer(async (req, res) => {
  if (!fromRelay(req)) {
    res.writeHead(403)
    res.end()
    return
  }
  try {
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value != null) headers.set(key, Array.isArray(value) ? value.join(', ') : value)
    }
    headers.set('cf-connecting-ip', clientIp(req))
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
    const body = hasBody ? await readBody(req) : undefined
    const request = new Request('http://' + (req.headers.host || 'localhost') + req.url, { method: req.method, headers, body })
    const response = await app.fetch(request, env)
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(Buffer.from(await response.arrayBuffer()))
  } catch (error) {
    console.error('request failed', error)
    if (!res.headersSent) res.writeHead(500)
    res.end()
  }
})

const sockets = new WebSocketServer({ noServer: true, maxPayload: BODY_MAX })

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://localhost')
  const refuse = (code, message) => {
    socket.write('HTTP/1.1 ' + code + ' ' + (STATUS[code] || 'Error') + '\r\nConnection: close\r\nContent-Type: text/plain\r\n\r\n' + message)
    socket.destroy()
  }
  if (!fromRelay(req)) return refuse(403, 'forbidden')
  if (url.pathname !== '/play') return refuse(404, 'not found')
  const mode = url.searchParams.get('mode') === 'team' ? 'team' : 'solo'
  const arena = arenaFor('morphz-' + mode + '-' + roomParam(url))
  const refused = arena.admit(url)
  if (refused) return refuse(refused.status, refused.message)
  sockets.handleUpgrade(req, socket, head, (ws) => arena.attachSocket(ws))
})

function shutdown() {
  for (const arena of arenas.values()) {
    try {
      arena.saveMeta(true)
    } catch {
    }
  }
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 3000).unref()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

server.listen(PORT, HOST, () => console.log('morphz arena listening on ' + HOST + ':' + PORT))
