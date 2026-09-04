import * as THREE from 'three'
import logo1 from './assets/logo-1.png'
import logo2 from './assets/logo-2.png'
import logo3 from './assets/logo-3.png'
import logo4 from './assets/logo-4.png'
import logo5 from './assets/logo-5.png'
import logo6 from './assets/logo-6.png'
import logo7 from './assets/logo-7.png'
import logo8 from './assets/logo-8.png'
import logo9 from './assets/logo-9.png'
import { CREATURES, ARENA, MODES, TEAMS, UPGRADES, BASES, levelThreshold, treeTint } from './config.js'
import { t, language, setLanguage, onLanguage, LANGUAGES, creatureName } from './i18n.js'
import { unlockAudio, toggleMute, musicMuted, onMuteChange } from './audio.js'
import { creatureThumb } from './preview.js'
import { loadProfanity, cleanNickname } from './nickname.js'
import { attachFooter, closePage, discordButton, helpButton } from './footer.js'
import { flagMarkup } from './flags.js'
import { iconMarkup } from './icons.js'
import { GAME_NAME, VERSION } from './brand.js'
import { zoneInfo, holdingTeam } from './zoneview.js'
import { ZONE } from './config.js'
import { enterImmersive } from './quality.js'

function esc(s) {
  return String(s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]))
}

const KEY_MODE = 'morphz.mode'
const DOTS = [1, 2, 3, 2]
const WIDGET_W = 300

function topBar(layer) {
  const bar = document.createElement('div')
  bar.className = 'topbar'

  const wrap = document.createElement('div')
  wrap.className = 'pill-wrap'
  wrap.innerHTML = `<button class="pill sound" type="button"></button>`
  bar.appendChild(wrap)

  const flag = document.createElement('button')
  flag.type = 'button'
  flag.className = 'pill flag'
  bar.appendChild(flag)
  bar.appendChild(helpButton(layer))
  bar.appendChild(discordButton(layer))

  const sound = wrap.querySelector('.sound')
  const paintSound = () => {
    const off = musicMuted()
    sound.innerHTML = iconMarkup(off ? 'musicOff' : 'music', 'pill-ico')
    sound.classList.toggle('off', off)
    sound.title = t(off ? 'musicOffTitle' : 'musicOnTitle')
    sound.setAttribute('aria-label', sound.title)
  }
  sound.addEventListener('click', () => {
    unlockAudio()
    toggleMute()
    paintSound()
  })
  paintSound()
  bar.dropMute = onMuteChange(paintSound)

  flag.addEventListener('click', () => {
    const ids = LANGUAGES.map((l) => l.id)
    const at = ids.indexOf(language())
    setLanguage(ids[(at + 1) % ids.length])
  })

  bar.applyTexts = () => {
    paintSound()
    const here = LANGUAGES.find((l) => l.id === language())
    flag.innerHTML = flagMarkup(language())
    flag.title = t('language') + ' : ' + (here ? here.name : language())
    flag.setAttribute('aria-label', flag.title)
  }
  bar.applyTexts()
  return bar
}

const LOGO_PARTS = [
  [logo1, 1.028, 23.810, 17.936],
  [logo2, 17.982, 22.711, 13.405],
  [logo3, 30.500, 23.443, 10.369],
  [logo4, 39.794, 23.810, 12.844],
  [logo5, 51.658, 4.029, 12.891],
  [logo6, 63.615, 23.810, 13.125],
  [logo7, 75.479, 51.282, 5.979],
  [logo8, 80.663, 4.029, 5.698],
  [logo9, 85.567, 22.711, 13.405],
]

const KEY_LOGO = 'morphz.logo'

let logoSeen = (() => {
  try {
    return sessionStorage.getItem(KEY_LOGO) === '1'
  } catch {
    return false
  }
})()

export function markLogoSeen() {
  try {
    sessionStorage.setItem(KEY_LOGO, '1')
  } catch {}
}

function logoMarkup() {
  const parts = LOGO_PARTS.map(
    ([src, left, top, width], i) =>
      `<img class="letter" src="${src}" alt="" style="--l:${left}%;--t:${top}%;--w:${width}%;--i:${i}" />`
  ).join('')
  const still = logoSeen ? ' still' : ''
  logoSeen = true
  return `
      <div class="logo${still}" role="img" aria-label="${GAME_NAME}">
        ${parts}
        <b class="version">${VERSION}</b>
      </div>`
}

export function createStart(layer, onStart, netApi) {
  const el = document.createElement('div')
  el.className = 'veil home' + (logoSeen ? ' still' : '')
  el.innerHTML = `
    <div class="stack">
      ${logoMarkup()}
      <div class="box">
        <input class="nickname" name="nickname" autocomplete="off" maxlength="12" />
        <div class="error"></div>
        <div class="modes"></div>
        <div class="slot">
          <button class="primary"></button>
          <div class="gate"></div>
        </div>
      </div>
    </div>`
  layer.appendChild(el)
  el.appendChild(topBar(layer))
  attachFooter(el)
  const input = el.querySelector('.nickname')
  const btn = el.querySelector('.primary')
  const error = el.querySelector('.error')
  const available = !!(netApi && netApi.available)
  let mode = localStorage.getItem(KEY_MODE) === 'team' ? 'team' : 'solo'
  loadProfanity()

  el.querySelector('.modes').innerHTML = Object.keys(MODES)
    .map((id) => `<button class="mode ${id === mode ? 'active' : ''}" data-mode="${id}"><b></b></button>`)
    .join('')
  el.querySelectorAll('.mode').forEach((b) => {
    b.addEventListener('click', () => {
      mode = b.dataset.mode
      localStorage.setItem(KEY_MODE, mode)
      el.querySelectorAll('.mode').forEach((o) => o.classList.toggle('active', o === b))
    })
  })

  const applyTexts = () => {
    input.placeholder = t('nicknamePh')
    btn.textContent = t('play')
    el.querySelectorAll('.mode').forEach((b) => {
      b.querySelector('b').textContent = b.dataset.mode === 'team' ? t('modeTeam') : t('modeSolo')
    })
    error.textContent = ''
  }
  applyTexts()
  onLanguage(() => {
    if (el.isConnected) {
      applyTexts()
      const p = el.querySelector('.topbar')
      if (p && p.applyTexts) p.applyTexts()
    }
  })

  let unwatch = null
  const dismiss = () => {
    if (unwatch) unwatch()
    unwatch = null
    const bar = el.querySelector('.topbar')
    if (bar && bar.dropMute) bar.dropMute()
    if (netApi && netApi.slot) netApi.slot(null)
    closePage()
    el.remove()
  }

  input.value = localStorage.getItem('morphz.name') || ''
  let busy = false
  const shake = () => {
    el.classList.add('still')
    el.classList.add('reject')
    setTimeout(() => el.classList.remove('reject'), 400)
  }

  const go = async () => {
    if (busy || btn.disabled) return
    const verdict = cleanNickname(input.value)
    if (!verdict.ok) {
      error.textContent = t(verdict.key)
      shake()
      input.focus()
      return
    }
    localStorage.setItem('morphz.name', verdict.name)
    enterImmersive()
    busy = true
    el.classList.add('busy')
    let dots = null
    const label = setTimeout(() => {
      btn.classList.add('timeout')
      let step = 0
      const paint = () => {
        btn.textContent = t('checking') + '.'.repeat(DOTS[step % DOTS.length])
        step++
      }
      paint()
      dots = setInterval(paint, 500)
    }, 220)
    const stop = () => {
      clearTimeout(label)
      if (dots) clearInterval(dots)
      dots = null
    }
    const release = () => {
      stop()
      busy = false
      el.classList.remove('busy')
      btn.classList.remove('timeout')
      btn.textContent = t('play')
    }
    let token = null
    if (available && netApi && netApi.verify) token = await netApi.verify()
    const started = await onStart(verdict.name, mode, token)
    stop()
    if (started === false) {
      release()
      return
    }
    dismiss()
  }
  btn.addEventListener('click', go)
  input.addEventListener('keydown', (e) => {
    if (e.code === 'Enter') go()
    e.stopPropagation()
  })
  if (netApi && netApi.onBusy) {
    const nest = el.querySelector('.gate')
    if (netApi.slot) netApi.slot(nest)
    const fit = () => {
      const w = btn.offsetWidth
      if (!w) return
      nest.style.setProperty('--fit', Math.min(1, w / WIDGET_W).toFixed(4))
    }
    if (window.ResizeObserver) new ResizeObserver(fit).observe(btn)
    const gate = () => {
      const waiting = netApi.busy()
      fit()
      btn.disabled = waiting || busy
      const shown = waiting && !!nest.firstElementChild && nest.firstElementChild.offsetHeight > 8
      btn.classList.toggle('away', shown)
      nest.classList.toggle('on', shown)
    }
    gate()
    const eye = window.ResizeObserver ? new ResizeObserver(gate) : null
    const spy = new MutationObserver(() => {
      if (eye && nest.firstElementChild) eye.observe(nest.firstElementChild)
      gate()
    })
    spy.observe(nest, { childList: true })
    const loose = netApi.onBusy(gate)
    unwatch = () => {
      loose()
      spy.disconnect()
      if (eye) eye.disconnect()
    }
  }
  setTimeout(() => input.focus(), 60)
}

export function createHud(layer, cb) {
  const el = document.createElement('div')
  el.className = 'hud faded'
  el.innerHTML = `
    <div class="board">
      <div class="board-title"></div>
      <div class="ranks"></div>
    </div>
    <div class="curtain"></div>
    <button class="pause-btn" type="button">${iconMarkup('pause', 'pause-ico')}</button>
    <canvas class="minimap" width="336" height="336"></canvas>
    <div class="skills">
      <div class="skill-title"><span class="skill-name"></span> <b class="points">0</b>${iconMarkup('chevron', 'fold-ico')}</div>
      <div class="skill-list"></div>
    </div>
    <div class="zone-banner">
      <b class="zpart red">0%</b>
      <span class="zbar"><i></i></span>
      <b class="zpart blue">0%</b>
    </div>
    <div class="compass">
      <svg class="arrow" viewBox="0 0 46 32" aria-hidden="true">
        <path d="M3 12 H25 V2 L43 16 L25 30 V20 H3 Z" fill="currentColor" stroke="#05070b" stroke-width="2.2" stroke-linejoin="round" />
      </svg>
    </div>
    <div class="progression">
      <div class="bar xp"><i></i><span></span></div>
    </div>
    <div class="floats"></div>
    <div class="pause-box">
      <div class="pause-actions">
        <button class="primary resume-btn" type="button"></button>
        <button class="primary muted quit-btn" type="button"></button>
      </div>
    </div>`
  layer.appendChild(el)

  const choice = document.createElement('div')
  choice.className = 'choice invisible'
  choice.innerHTML = '<div class="choice-title"></div><div class="cards"></div>'
  layer.appendChild(choice)

  const skills = el.querySelector('.skills')
  skills.classList.add('folded')
  const foldBtn = el.querySelector('.skill-title')
  const pauseBtn = el.querySelector('.pause-btn')
  el.querySelector('.resume-btn').addEventListener('click', () => cb.onPause(false))
  for (const b of el.querySelectorAll('.quit-btn')) {
    b.addEventListener('click', () => cb.onQuit())
  }

  const list = el.querySelector('.skill-list')
  list.innerHTML = UPGRADES.list
    .map(
      (c, i) => `<button class="skill ${c.id}" data-id="${c.id}" type="button">
        <kbd>${i + 1}</kbd><span>${statLabel(c.id)}</span>
        <i class="pips">${'<u></u>'.repeat(UPGRADES.max)}</i>
        <b>+</b>
      </button>`
    )
    .join('')

  const onTap = (node, run) => {
    let live = null
    let mark = null
    const drop = () => {
      live = null
      mark = null
    }
    node.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      live = e.pointerId
      mark = e.target
    })
    node.addEventListener('pointerup', (e) => {
      if (e.pointerId !== live) return
      const from = mark
      drop()
      if (from) run(e, from)
    })
    node.addEventListener('pointercancel', drop)
    node.addEventListener('pointerleave', drop)
  }

  const noGrab = (e) => {
    if (e.pointerType === 'mouse' && e.target.closest('button')) e.preventDefault()
  }
  el.addEventListener('pointerdown', noGrab)
  choice.addEventListener('pointerdown', noGrab)

  onTap(foldBtn, () => skills.classList.toggle('folded'))
  onTap(pauseBtn, () => cb.onPause(true))
  onTap(list, (e, from) => {
    const b = from.closest('.skill')
    if (b && e.target.closest('.skill') === b) cb.onUpgrade(b.dataset.id)
  })

  const hud = {
    el,
    choice,
    onTap,
    cb,
    hidden: {},
    refs: {
      xp: el.querySelector('.xp i'),
      xpTxt: el.querySelector('.xp span'),
      ranks: el.querySelector('.ranks'),
      floaters: el.querySelector('.floats'),
      cards: choice.querySelector('.cards'),
      zone: el.querySelector('.zone-banner'),
      zfill: el.querySelector('.zbar i'),
      zred: el.querySelector('.zpart.red'),
      zblue: el.querySelector('.zpart.blue'),
      compass: el.querySelector('.compass'),
      arrow: el.querySelector('.compass .arrow'),
      minimap: el.querySelector('.minimap'),
      points: el.querySelector('.points'),
      upgradeId: el.querySelector('.skills'),
      comps: [...el.querySelectorAll('.skill')],
      boardTitle: el.querySelector('.board-title'),
      upgradeTitle: el.querySelector('.skill-name'),
      choiceTitle: choice.querySelector('.choice-title'),
      resume: el.querySelector('.resume-btn'),
      quitButtons: [...el.querySelectorAll('.quit-btn')],
    },
  }

  const applyTexts = () => {
    const r = hud.refs
    r.boardTitle.textContent = t('leaderboard')
    r.upgradeTitle.textContent = t('upgrades')
    r.choiceTitle.textContent = t('chooseShape')
    r.resume.textContent = t('resume')
    for (const b of r.quitButtons) b.textContent = t('quit')
    r.comps.forEach((btn, i) => {
      btn.querySelector('span').textContent = statLabel(UPGRADES.list[i].id)
    })
    hud.hidden = {}
  }
  applyTexts()
  onLanguage(applyTexts)

  return hud
}

const STAT_KEYS = {
  regen: 'statRegen',
  hpStat: 'statHp',
  damage: 'statDamage',
  pierce: 'statPierce',
  range: 'statRange',
  bullet: 'statBullet',
  fireRate: 'statFireRate',
  speed: 'statSpeed',
}

function statLabel(id) {
  return t(STAT_KEYS[id] || id)
}

const worldPoint = new THREE.Vector3()

function updateCompass(r, c, game, p) {
  const z = game.mode === 'team' && game.zones ? game.zones.active : null
  const cam = game.view ? game.view.camera : null
  if (!z || !cam || !p || !p.alive) {
    if (c.compass !== false) {
      c.compass = false
      r.compass.classList.remove('visible')
    }
    return
  }

  cam.updateMatrixWorld()
  worldPoint.set(z.x, 0.6, z.z).project(cam)
  const behind = worldPoint.z > 1
  const w = window.innerWidth
  const h = window.innerHeight
  let px = (behind ? -worldPoint.x : worldPoint.x) * w * 0.5
  let py = (behind ? worldPoint.y : -worldPoint.y) * h * 0.5

  const edge = Math.min(w, h) * 0.17

  if (!behind && Math.abs(px) < w * 0.5 - edge && Math.abs(py) < h * 0.5 - edge) {
    if (c.compass !== false) {
      c.compass = false
      r.compass.classList.remove('visible')
    }
    return
  }

  const orbitX = Math.min(w, h) * 0.4
  const orbitY = Math.max(70, Math.min(orbitX, h * 0.5 - 125))
  const gap = Math.max(0.001, Math.hypot(px, py))
  px = (px / gap) * orbitX
  py = (py / gap) * orbitY

  if (c.compass !== true) {
    c.compass = true
    r.compass.classList.add('visible')
  }
  r.compass.style.transform = `translate(${Math.round(px)}px, ${Math.round(py)}px)`
  r.arrow.style.transform = `rotate(${Math.atan2(py, px).toFixed(3)}rad)`

  const team = holdingTeam(z) || 'neutral'
  if (c.compassTeam !== team) {
    c.compassTeam = team
    r.compass.className = 'compass visible ' + team
  }
}

function setText(node, key, value, hidden) {
  if (hidden[key] === value) return
  hidden[key] = value
  node.textContent = value
}

const MAP_CFG = 336
const MARGIN = 12

function mapBack(game) {
  const c = document.createElement('canvas')
  c.width = MAP_CFG
  c.height = MAP_CFG
  const g = c.getContext('2d')
  const side = MAP_CFG - MARGIN * 2
  const k = side / (ARENA.half * 2)
  const toward = (v) => MAP_CFG / 2 + v * k
  for (let i = 0; i < ARENA.rings.length; i++) {
    const d = ARENA.rings[i].to * k
    g.fillStyle = '#' + ARENA.rings[i].color.toString(16).padStart(6, '0')
    g.fillRect(MAP_CFG / 2 - d, MAP_CFG / 2 - d, d * 2, d * 2)
  }
  for (let i = 1; i < ARENA.rings.length; i++) {
    const d = ARENA.rings[i].to * k
    g.strokeStyle = 'rgba(255,241,208,0.5)'
    g.lineWidth = 1.5
    g.strokeRect(MAP_CFG / 2 - d, MAP_CFG / 2 - d, d * 2, d * 2)
  }
  if (game.mode === 'team') {
    const p = BASES.depth * k
    g.fillStyle = 'rgba(255,90,90,0.3)'
    g.fillRect(MARGIN, MARGIN, p, side)
    g.fillStyle = 'rgba(90,168,255,0.3)'
    g.fillRect(MAP_CFG - MARGIN - p, MARGIN, p, side)
  }
  if (game.world.blocks) {
    for (const b of game.world.blocks) {
      if (b.type === 'wall') continue
      g.fillStyle = b.type === 'tree' ? 'rgba(22,60,26,0.55)' : 'rgba(30,40,48,0.5)'
      g.beginPath()
      g.arc(toward(b.x), toward(b.z), Math.max(1.2, b.r * k), 0, Math.PI * 2)
      g.fill()
    }
  }
  g.strokeStyle = 'rgba(255,241,208,0.7)'
  g.lineWidth = 3
  g.strokeRect(MARGIN, MARGIN, side, side)
  return c
}

function drawMap(hud, game) {
  const p = game.player
  const cv = hud.refs.minimap
  if (!cv) return
  if (!hud.back) hud.back = mapBack(game)
  const g = cv.getContext('2d')
  const k = (MAP_CFG - MARGIN * 2) / (ARENA.half * 2)
  const x = MAP_CFG / 2 + p.x * k
  const y = MAP_CFG / 2 + p.z * k
  g.clearRect(0, 0, MAP_CFG, MAP_CFG)
  g.drawImage(hud.back, 0, 0)
  const zone = game.zones && game.zones.active
  if (zone) {
    const zx = MAP_CFG / 2 + zone.x * k
    const zy = MAP_CFG / 2 + zone.z * k
    const zr = ZONE.radius * k
    g.strokeStyle = zone.team
      ? '#' + TEAMS[zone.team].color.toString(16).padStart(6, '0')
      : 'rgba(255,255,255,0.92)'
    g.lineWidth = 3
    g.beginPath()
    g.arc(zx, zy, zr, 0, Math.PI * 2)
    g.stroke()
  }

  g.save()
  g.translate(x, y)
  g.rotate(Math.PI - p.yaw)
  g.fillStyle = '#ffe07a'
  g.strokeStyle = '#05070b'
  g.lineWidth = 5
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(0, -13)
  g.lineTo(9, 9)
  g.lineTo(-9, 9)
  g.closePath()
  g.stroke()
  g.fill()
  g.restore()
}

function updateUpgrades(hud, p) {
  const r = hud.refs
  const c = hud.hidden
  const key = p.points + ':' + UPGRADES.list.map((u) => p.comp[u.id]).join(',')
  if (c.comp === key) return
  c.comp = key
  r.points.textContent = p.points
  r.upgradeId.classList.toggle('ready', p.points > 0)
  r.comps.forEach((btn, i) => {
    const u = UPGRADES.list[i]
    const n = p.comp[u.id]
    btn.classList.toggle('full', n >= UPGRADES.max)
    btn.classList.toggle('open', p.points > 0 && n < UPGRADES.max)
    const pips = btn.querySelectorAll('.pips u')
    for (let j = 0; j < pips.length; j++) pips[j].classList.toggle('on', j < n)
  })
}

export function updateHud(hud, game) {
  const p = game.player
  const r = hud.refs
  const c = hud.hidden

  const down = levelThreshold(p.level - 1)
  const up = levelThreshold(p.level)
  const atMax = p.level >= UPGRADES.maxLevel
  const ratio = atMax ? 1 : Math.min(1, Math.max(0, (p.xp - down) / Math.max(1, up - down)))
  if (c.xp !== ratio) {
    c.xp = ratio
    r.xp.style.width = (ratio * 100).toFixed(1) + '%'
  }
  setText(
    r.xpTxt,
    'xpTxt',
    atMax
      ? `${t('level', { n: p.level })} - ${t('levelMax')}`
      : `${t('level', { n: p.level })} - ${Math.floor(p.xp)} / ${up}`,
    c
  )
  updateUpgrades(hud, p)
  drawMap(hud, game)

  if (c.modeClass !== game.mode) {
    c.modeClass = game.mode
    hud.el.classList.toggle('mode-team', game.mode === 'team')
    hud.back = null
    c.zoneTxt = ''
    r.zone.classList.remove('active')
  }

  updateCompass(r, c, game, p)

  if (game.mode === 'team') {
    const info = zoneInfo(game.zones)
    const key = info ? `${info.part}|${info.side}|${info.red}|${info.blue}` : ''
    if (c.zoneTxt !== key) {
      c.zoneTxt = key
      r.zone.classList.toggle('active', !!info)
      if (info) {
        r.zfill.style.transform = `scaleX(${(info.part / 100).toFixed(3)})`
        r.zfill.className = info.side
        r.zred.textContent = info.red + '%'
        r.zblue.textContent = info.blue + '%'
      }
    }
  }

  const board = game.world.beings
    .filter((b) => b.alive)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10)
  const html = board
    .map(
      (b, i) =>
        `<div class="${b.isPlayer ? 'me' : ''} ${b.team || ''}"><i>${i + 1}.</i><span>${esc(b.name)}</span><b>${Math.floor(b.xp)}</b></div>`
    )
    .join('')
  if (c.board !== html) {
    c.board = html
    r.ranks.innerHTML = html
  }
}

export function showChoices(hud, options, current, onPick) {
  const box = hud.refs.cards
  box.innerHTML = ''
  options.forEach((id, i) => {
    const def = CREATURES[id]
    const card = document.createElement('button')
    card.className = 'card b-' + def.branch
    card.style.setProperty('--tint', treeTint(def.color))
    card.innerHTML = `
      <div class="thumb-img"><img alt="" src="${creatureThumb(id)}" /></div>
      <div class="card-name">${esc(creatureName(id, def.name))}</div>
      <div class="key-num">${i + 1}</div>`
    hud.onTap(card, () => onPick(id))
    box.appendChild(card)
  })
  hud.choice.classList.remove('invisible')
}

export function hideChoices(hud) {
  hud.choice.classList.add('invisible')
}

export function floatText(hud, text, kind) {
  const d = document.createElement('div')
  d.className = 'float ' + (kind || '')
  d.textContent = text
  d.style.setProperty('--slot', hud.refs.floaters.childElementCount * 19 + 'px')
  hud.refs.floaters.appendChild(d)
  setTimeout(() => d.classList.add('spent'), 40)
  setTimeout(() => d.remove(), 1400)
}

export function showPause(hud, on) {
  hud.el.classList.toggle('paused', on)
}

