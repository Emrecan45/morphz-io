import { t, language, onLanguage } from './i18n.js'
import { legalPage } from './pages.js'
import { SUBJECTS, AUTHOR, AUTHOR_URL, DISCORD_URL, onOwnSite } from './brand.js'
import { verifyHuman } from './captcha.js'
import { sendContact } from './net.js'
import { iconMarkup } from './icons.js'

const MAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
const DOTS = [1, 2, 3, 2]
const INTRO_HOLD = 3400

function esc(s) {
  return String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]))
}

function subjectKey(id) {
  return 'subj' + id.charAt(0).toUpperCase() + id.slice(1)
}

let sheet = null
let onGone = null

function onEscape(e) {
  if (e.code !== 'Escape' || !sheet) return
  e.stopPropagation()
  e.preventDefault()
  closePage()
}

export function closePage() {
  if (!sheet) return
  const leaving = sheet
  sheet = null
  leaving.classList.add('leaving')
  setTimeout(() => leaving.remove(), 170)
  document.removeEventListener('keydown', onEscape, true)
  const gone = onGone
  onGone = null
  if (gone) gone()
}

export function openChoice(host, title, text, choices, fallback) {
  const body = openSheet(host, title)
  const x = body.parentElement.querySelector('.page-x')
  const copy = document.createElement('p')
  copy.className = 'ask-copy'
  copy.textContent = text
  body.appendChild(copy)
  const row = document.createElement('div')
  row.className = 'ask-row'
  for (const c of choices) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'primary ask-' + c.tone
    btn.textContent = c.label
    btn.addEventListener('click', () => {
      onGone = null
      closePage()
      c.run()
    })
    row.appendChild(btn)
  }
  body.appendChild(row)
  onGone = fallback || null
  x.focus()
}

function openSheet(host, title) {
  closePage()
  const el = document.createElement('div')
  el.className = 'veil page'
  el.innerHTML = `
    <div class="page-box">
      <button class="page-x" type="button">&#10005;</button>
      <h3 class="page-title"></h3>
      <div class="page-body"></div>
    </div>`
  el.querySelector('.page-title').textContent = title
  const x = el.querySelector('.page-x')
  x.setAttribute('aria-label', t('pageClose'))
  x.addEventListener('click', closePage)
  host.appendChild(el)
  sheet = el
  document.addEventListener('keydown', onEscape, true)
  return el.querySelector('.page-body')
}

function showLegal(host, kind) {
  const page = legalPage(language(), kind)
  openSheet(host, page.title).innerHTML = page.body
}

function showNote(host, title, text) {
  const body = openSheet(host, title)
  const line = document.createElement('p')
  line.className = 'page-note'
  line.textContent = text
  body.appendChild(line)
}

function showContact(host) {
  const body = openSheet(host, t('contactTitle'))
  body.innerHTML = `
    <form class="form" novalidate>
      <label class="field">
        <span class="field-name"></span>
        <select class="f-subject" name="subject">${SUBJECTS.map((id) => `<option value="${id}"></option>`).join('')}</select>
      </label>
      <label class="field">
        <span class="field-name"></span>
        <input class="f-email" name="email" type="email" maxlength="120" autocomplete="email" />
      </label>
      <label class="field">
        <span class="field-name"></span>
        <textarea class="f-message" name="message" maxlength="2000" rows="5"></textarea>
      </label>
      <div class="f-msg">
        <div class="error f-error"></div>
        <div class="done f-done"></div>
      </div>
      <div class="f-slot">
        <button class="primary f-send" type="submit"></button>
        <div class="f-gate"></div>
      </div>
    </form>`

  const form = body.querySelector('.form')
  const subject = body.querySelector('.f-subject')
  const mail = body.querySelector('.f-email')
  const message = body.querySelector('.f-message')
  const error = body.querySelector('.f-error')
  const done = body.querySelector('.f-done')
  const send = body.querySelector('.f-send')
  const gate = body.querySelector('.f-gate')
  const seat = body.querySelector('.f-slot')
  const names = body.querySelectorAll('.field-name')

  let busy = false
  let ticker = null

  const restLabel = () => {
    if (ticker) clearInterval(ticker)
    ticker = null
    send.textContent = t('contactSend')
  }

  const runLabel = () => {
    const word = t('contactSending').replace(/\.+$/, '')
    let step = 0
    const paint = () => {
      send.textContent = word + '.'.repeat(DOTS[step % DOTS.length])
      step++
    }
    paint()
    ticker = setInterval(paint, 500)
  }

  const applyTexts = () => {
    names[0].textContent = t('contactSubject')
    names[1].innerHTML = esc(t('contactEmail')) + ' <em>' + esc(t('contactOptional')) + '</em>'
    names[2].textContent = t('contactMessage')
    if (!busy) send.textContent = t('contactSend')
    subject.querySelectorAll('option').forEach((o) => {
      o.textContent = t(subjectKey(o.value))
    })
  }
  applyTexts()
  onLanguage(() => {
    if (body.isConnected) applyTexts()
  })

  form.addEventListener('keydown', (e) => e.stopPropagation())
  form.addEventListener('keyup', (e) => e.stopPropagation())

  const refuse = (key, field) => {
    error.textContent = t(key)
    field.focus()
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (busy) return
    error.textContent = ''
    done.textContent = ''
    const box = mail.value.trim()
    const text = message.value.trim()
    if (box && !MAIL_RE.test(box)) return refuse('contactBadEmail', mail)
    if (text.length < 10) return refuse('contactBadMessage', message)

    busy = true
    send.disabled = true
    runLabel()
    const watch = window.ResizeObserver
      ? new ResizeObserver(() => seat.classList.toggle('on', gate.offsetHeight > 8))
      : null
    if (watch) watch.observe(gate)
    const token = await verifyHuman(gate)
    if (watch) watch.disconnect()
    seat.classList.remove('on')
    let out = { ok: false }
    if (token) {
      out = await sendContact({ subject: subject.value, email: box, message: text, lang: language(), token })
    }
    busy = false
    if (!form.isConnected) {
      if (ticker) clearInterval(ticker)
      ticker = null
      return
    }
    send.disabled = false
    restLabel()
    if (out.ok) {
      form.reset()
      done.textContent = t('contactOk')
    } else {
      error.textContent = t('contactFail')
    }
  })

  setTimeout(() => message.focus(), 60)
}

let grove = null

function warmGuide() {
  const lang = language()
  if (grove && grove.lang === lang) return grove.job
  grove = { lang, job: import('./tree.js').then((mod) => mod.createTree()) }
  return grove.job
}

async function showGuide(host) {
  const page = legalPage(language(), 'guide')
  const tree = await warmGuide()
  const body = openSheet(host, page.title)
  body.parentElement.classList.add('wide')
  body.innerHTML = page.body
  body.appendChild(tree)
}

export function helpButton(layer) {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'pill help'
  btn.innerHTML = iconMarkup('help', 'pill-ico')
  btn.addEventListener('click', () => showGuide(layer))
  const applyTexts = () => {
    btn.title = legalPage(language(), 'guide').title
    btn.setAttribute('aria-label', btn.title)
  }
  applyTexts()
  onLanguage(() => {
    if (!btn.isConnected) return
    applyTexts()
    warmGuide()
  })
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200))
  setTimeout(() => idle(() => warmGuide()), INTRO_HOLD)
  return btn
}

export function discordButton(layer) {
  const chat = document.createElement('button')
  chat.type = 'button'
  chat.className = 'pill discord'
  chat.innerHTML = iconMarkup('discord', 'pill-ico')
  chat.addEventListener('click', () => {
    if (DISCORD_URL) {
      window.open(DISCORD_URL, '_blank', 'noopener')
      return
    }
    showNote(layer, t('discordTitle'), t('discordSoon'))
  })
  const applyTexts = () => {
    chat.title = t('discordTitle')
    chat.setAttribute('aria-label', chat.title)
  }
  applyTexts()
  onLanguage(() => {
    if (chat.isConnected) applyTexts()
  })
  return chat
}

export function attachFooter(host) {
  const bar = document.createElement('div')
  bar.className = 'home-footer'
  bar.innerHTML = `
    <p class="footer-note">
      <span class="footer-by"></span>
      ${onOwnSite() ? `<a class="footer-author" href="${AUTHOR_URL}" target="_blank" rel="noopener">${esc(AUTHOR)}</a>` : `<span class="footer-author">${esc(AUTHOR)}</span>`}
    </p>
    <p class="legal-links">
      <a class="lnk-privacy"></a>
      <span class="legal-sep">-</span>
      <a class="lnk-terms"></a>
      <span class="legal-sep">-</span>
      <a class="lnk-credits"></a>
      <span class="legal-sep">-</span>
      <a class="lnk-contact"></a>
    </p>`
  host.appendChild(bar)

  const privacy = bar.querySelector('.lnk-privacy')
  const terms = bar.querySelector('.lnk-terms')
  const credits = bar.querySelector('.lnk-credits')
  const contact = bar.querySelector('.lnk-contact')
  const layer = host.parentNode || host

  privacy.addEventListener('click', () => showLegal(layer, 'privacy'))
  terms.addEventListener('click', () => showLegal(layer, 'terms'))
  credits.addEventListener('click', () => showLegal(layer, 'credits'))
  contact.addEventListener('click', () => showContact(layer))

  const applyTexts = () => {
    bar.querySelector('.footer-by').textContent = t('footerBy')
    privacy.textContent = t('legalPrivacy')
    terms.textContent = t('legalTerms')
    credits.textContent = t('legalCredits')
    contact.textContent = t('legalContact')
  }
  applyTexts()
  onLanguage(() => {
    if (bar.isConnected) applyTexts()
  })
}
