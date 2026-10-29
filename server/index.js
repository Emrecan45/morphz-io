import { Arena } from './arena.js'
import { createApp, roomGate, adminAllowed, json } from './app.js'
import LOGO_PNG from './logo.png'

export { Arena }

const app = createApp(LOGO_PNG)

const LOCAL = new Set(['/contact', '/logo.png'])

function forward(request, env, path) {
  const url = new URL(request.url)
  const target = new URL(path || url.pathname + url.search, env.ARENA_ORIGIN)
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.set('x-morphz-relay', env.RELAY_KEY || '')
  headers.set('x-morphz-ip', request.headers.get('cf-connecting-ip') || '')
  const body = request.method === 'GET' || request.method === 'HEAD' ? null : request.body
  return fetch(new Request(target, { method: request.method, headers, body, redirect: 'manual' }))
}

async function relay(request, env) {
  const url = new URL(request.url)
  if (request.method === 'OPTIONS' || LOCAL.has(url.pathname)) return app.fetch(request, env)
  if (url.pathname === '/room') {
    const gate = await roomGate(request, env)
    if (!gate.ok) return json({ error: 'captcha' }, 403)
    const mode = url.searchParams.get('mode') === 'team' ? 'team' : 'solo'
    const rep = await forward(request, env, '/room?mode=' + mode)
    if (!rep.ok) return rep
    const room = await rep.json()
    return json(gate.pass ? { ...room, pass: gate.pass } : room)
  }
  if (url.pathname === '/admin/stats') {
    if (!(await adminAllowed(request, env))) return json({ error: 'pin' }, 403)
    return forward(request, env, '/admin/stats')
  }
  return forward(request, env)
}

export default {
  async fetch(request, env) {
    if (env.ARENA_ORIGIN && env.RELAY_KEY) return relay(request, env)
    return app.fetch(request, env)
  },
}
