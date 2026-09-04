import { Arena } from './arena.js'
import { BOTS, CREATURES, UPGRADES, START, TIER_LEVEL } from '../src/config.js'
import { GAME_NAME } from '../src/brand.js'
import { SUBJECT_LABELS, mailHtml, mailText } from './mail.js'
import LOGO_PNG from './logo.png'

export { Arena }

const ROOM_CEILING = 512

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
}

function json(data, code) {
  return new Response(JSON.stringify(data), {
    status: code || 200,
    headers: { 'content-type': 'application/json', ...CORS },
  })
}

const HOME_HOSTS = ['morphz.io', 'localhost', '127.0.0.1']
const PORTAL_HOSTS = ['crazygames.com', 'y8.com']

function askedBy(request) {
  const raw = request.headers.get('origin') || request.headers.get('referer') || ''
  if (!raw) return ''
  try {
    return new URL(raw).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function listed(host, names) {
  return names.some((d) => host === d || host.endsWith('.' + d))
}

function portalsOf(env) {
  const extra = String(env.PORTAL_HOSTS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return PORTAL_HOSTS.concat(extra)
}

async function checkToken(token, env, ip, request) {
  if (!env.TURNSTILE_SECRET) return 'ok'
  const host = askedBy(request)
  if (!host) return 'refused'
  if (listed(host, portalsOf(env))) return 'ok'
  if (!listed(host, HOME_HOSTS)) return 'refused'
  if (!token || token === 'local') return 'refused'
  const form = new FormData()
  form.append('secret', env.TURNSTILE_SECRET)
  form.append('response', token)
  if (ip) form.append('remoteip', ip)
  try {
    const rep = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    const data = await rep.json()
    return data.success ? 'ok' : 'refused'
  } catch {
    return 'down'
  }
}

async function verifyToken(token, env, ip, request) {
  return (await checkToken(token, env, ip, request)) === 'ok'
}

const PASS_TTL = 7200000

function passKey(env) {
  return env.TURNSTILE_SECRET || ''
}

async function signPass(env, until) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passKey(env)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const raw = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(until)))
  const bytes = new Uint8Array(raw)
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return until + '.' + hex.slice(0, 40)
}

async function mintPass(env) {
  if (!passKey(env)) return ''
  return signPass(env, Date.now() + PASS_TTL)
}

async function readPass(env, value) {
  if (!passKey(env) || !value) return false
  const cut = String(value).indexOf('.')
  if (cut < 1) return false
  const until = parseInt(String(value).slice(0, cut), 10)
  if (!Number.isFinite(until) || until < Date.now()) return false
  const wanted = await signPass(env, until)
  return sameSecret(wanted, String(value))
}

function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const MAIL_FROM = GAME_NAME + ' <contact@morphz.io>'

function parseFrom(value) {
  const pair = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value)
  if (pair) return { name: pair[1] || GAME_NAME, email: pair[2] }
  return { name: GAME_NAME, email: String(value).trim() }
}

function trim(value, max) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)
}

function publicLogo(request, env) {
  const origin = new URL(request.url).origin
  const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(origin)
  if (!local) return origin + '/logo.png'
  const site = (env.SITE_URL || '').replace(/\/+$/, '')
  return site ? site + '/logo.png' : ''
}

async function handleContact(request, env) {
  let data = null
  try {
    data = await request.json()
  } catch {
    return json({ ok: false }, 400)
  }

  const key = SUBJECT_LABELS[data && data.subject] ? data.subject : 'other'
  const email = trim(data && data.email, 120)
  const message = String((data && data.message) || '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, 4000)

  if (message.length < 10) return json({ ok: false }, 400)
  if (email && !validEmail(email)) return json({ ok: false }, 400)

  const verdict = await checkToken(data && data.token, env, request.headers.get('cf-connecting-ip'), request)
  if (verdict === 'refused') return json({ ok: true })

  if (!env.RESEND_KEY) return json({ ok: false }, 500)

  const letter = {
    label: SUBJECT_LABELS[key],
    email,
    message,
    date: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    site: env.SITE_URL || '',
    logo: env.MAIL_LOGO || publicLogo(request, env),
  }
  letter.subject = '[' + letter.label + '] ' + (email || 'no reply address')
  letter.html = mailHtml(letter)
  letter.text = mailText(letter)

  let sent = await postMail(env, letter, !!email)
  if (!sent && email) sent = await postMail(env, letter, false)
  if (!sent) return json({ ok: false }, 502)
  return json({ ok: true })
}

async function postMail(env, letter, copy) {
  const from = parseFrom(env.MAIL_FROM || MAIL_FROM)
  const to = env.MAIL_TO || ''
  if (!to || !env.RESEND_KEY) return false
  try {
    const rep = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + env.RESEND_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: from.name + ' <' + from.email + '>',
        to: [to],
        cc: copy ? [letter.email] : undefined,
        reply_to: letter.email || undefined,
        subject: letter.subject,
        html: letter.html,
        text: letter.text,
      }),
    })
    return rep.ok
  } catch {
    return false
  }
}

async function readCount(env, mode, room) {
  try {
    const rep = await stub(env, mode, room).fetch('https://arena/count')
    const data = await rep.json()
    return data.humans || 0
  } catch {
    return 0
  }
}

async function openRoom(env, mode) {
  const first = await readCount(env, mode, 1)
  if (first < BOTS.population) return { room: 1, players: first }
  let from = 2
  let width = 4
  while (from <= ROOM_CEILING) {
    const to = Math.min(ROOM_CEILING, from + width - 1)
    const lot = []
    for (let r = from; r <= to; r++) lot.push(readCount(env, mode, r))
    const counts = await Promise.all(lot)
    for (let i = 0; i < counts.length; i++) {
      if (counts[i] < BOTS.population) return { room: from + i, players: counts[i] }
    }
    from = to + 1
    width *= 4
  }
  return { room: 1, players: BOTS.population }
}

function roomParam(url) {
  const n = parseInt(url.searchParams.get('room') || '1', 10)
  if (!Number.isFinite(n)) return 1
  return Math.max(1, Math.min(ROOM_CEILING, n))
}

const ADMIN_SCAN = 6

const META_FIELDS = ['picks', 'offers', 'kills', 'deaths', 'ms', 'xp', 'lives']

function addMeta(into, part) {
  if (!part) return
  for (const camp of ['humans', 'bots']) {
    const src = part[camp]
    if (!src) continue
    if (!into[camp]) into[camp] = {}
    for (const id of Object.keys(src)) {
      if (!into[camp][id]) {
        into[camp][id] = {}
        for (const f of META_FIELDS) into[camp][id][f] = 0
      }
      for (const f of META_FIELDS) into[camp][id][f] += src[id][f] || 0
    }
  }
}

async function adminStats(env) {
  const jobs = []
  for (const mode of ['solo', 'team']) {
    for (let room = 1; room <= ADMIN_SCAN; room++) {
      jobs.push(
        stub(env, mode, room)
          .fetch('https://arena/stats')
          .then((rep) => rep.json())
          .then((st) => ({ mode, room, ...st }))
          .catch(() => null)
      )
    }
  }
  const answers = (await Promise.all(jobs)).filter((r) => r)
  const meta = { humans: {}, bots: {} }
  for (const r of answers) {
    addMeta(meta, r.meta)
    delete r.meta
  }
  const all = answers.filter((r) => r.running || r.joins > 0)
  return json({ at: Date.now(), scanned: ADMIN_SCAN * 2, cap: BOTS.population, rooms: all, meta })
}

function adminCreatures() {
  const list = []
  for (const id of Object.keys(CREATURES)) {
    const c = CREATURES[id]
    const shot = c.shot || {}
    const burstSize = shot.pattern === 'burst' ? shot.burst || 3 : 1
    const volley = (shot.nb || 1) * burstSize
    const perShot = Math.round(c.damage * (shot.power || 1))
    list.push({
      id,
      name: c.name,
      role: c.role || '',
      tier: c.tier,
      branch: c.branch,
      size: c.size,
      hp: c.hp,
      speed: c.speed,
      damage: c.damage,
      perShot,
      range: c.range,
      cooldown: c.cooldown,
      dps: Math.round(((perShot * volley) / c.cooldown) * 10) / 10,
      pattern: shot.pattern || 'bolt',
      volley,
      burst: burstSize,
      nb: shot.nb || 1,
      bulletSpeed: shot.speed || 0,
      hull: shot.hull || 1,
      through: shot.through || 0,
      spread: shot.spread || 0,
      poison: c.poison ? c.poison.dps + ' dps x ' + c.poison.duration + ' s' : '',
      value: c.value,
      color: '#' + c.color.toString(16).padStart(6, '0'),
      next: c.next || [],
    })
  }
  return json({
    at: Date.now(),
    start: START,
    tierLevel: TIER_LEVEL,
    upgrades: UPGRADES.list.map((u) => ({ id: u.id, name: u.name, step: u.step })),
    max: UPGRADES.max,
    creatures: list,
  })
}

function stub(env, mode, room) {
  const id = env.ARENA_DO.idFromName('morphz-' + mode + '-' + room)
  return env.ARENA_DO.get(id)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    const mode = url.searchParams.get('mode') === 'team' ? 'team' : 'solo'

    if (url.pathname === '/live') {
      const [solo, team] = await Promise.all([readCount(env, 'solo', 1), readCount(env, 'team', 1)])
      return json({ solo, team })
    }

    if (url.pathname === '/logo.png') {
      return new Response(LOGO_PNG, {
        headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=604800', ...CORS },
      })
    }

    if (url.pathname === '/contact') {
      if (request.method !== 'POST') return json({ ok: false }, 405)
      return handleContact(request, env)
    }

    if (url.pathname === '/room') {
      const held = url.searchParams.get('pass') || ''
      let pass = ''
      if (!(await readPass(env, held))) {
        const token = url.searchParams.get('token') || ''
        const ok = await verifyToken(token, env, request.headers.get('cf-connecting-ip'), request)
        if (!ok) return json({ error: 'captcha' }, 403)
        pass = await mintPass(env)
      }
      const room = await openRoom(env, mode)
      return json(pass ? { ...room, pass } : room)
    }

    if (url.pathname === '/admin/stats') {
      return adminStats(env)
    }

    if (url.pathname === '/admin/creatures') {
      return adminCreatures()
    }

    if (url.pathname === '/play') {
      const room = roomParam(url)
      return stub(env, mode, room).fetch(request)
    }

    return new Response(GAME_NAME, { headers: CORS })
  },
}
