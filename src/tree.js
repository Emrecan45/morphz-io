import { CREATURES, START, treeTint } from './config.js'
import { creatureThumb } from './preview.js'
import { creatureName, creatureRole } from './i18n.js'

const NS = 'http://www.w3.org/2000/svg'
const SIZE = 2000
const CX = SIZE / 2
const CY = SIZE / 2
const R0 = 210
const RINGS = [
  [R0, 468],
  [468, 726],
  [726, 984],
]
const GAP = 0.028
const BRANCH = 0.05
const EDGE = 10
const LINE = 14
const SPLIT = 0.3
const LABEL = 32
const TARGET = 138
const INK = '#05070b'
const NIGHT = '#12241d'

const shots = new Map()
let ruler = null

function node(kind, attrs) {
  const el = document.createElementNS(NS, kind)
  for (const k in attrs) el.setAttribute(k, attrs[k])
  return el
}

function hex(v) {
  return '#' + v.toString(16).padStart(6, '0')
}

function mix(a, b, k) {
  const part = (d) => [(d >> 16) & 255, (d >> 8) & 255, d & 255]
  const [ar, ag, ab] = part(a)
  const [br, bg, bb] = part(b)
  return (
    (Math.round(ar + (br - ar) * k) << 16) |
    (Math.round(ag + (bg - ag) * k) << 8) |
    Math.round(ab + (bb - ab) * k)
  )
}

function breathe() {
  return new Promise((ok) => requestAnimationFrame(() => ok()))
}

async function shotOf(id) {
  if (shots.has(id)) return shots.get(id)
  await breathe()
  const url = creatureThumb(id)
  const img = new Image()
  await new Promise((ok) => {
    img.onload = ok
    img.onerror = ok
    img.src = url
  })
  const cv = document.createElement('canvas')
  cv.width = img.naturalWidth || 2
  cv.height = img.naturalHeight || 2
  const g = cv.getContext('2d', { willReadFrequently: true })
  g.drawImage(img, 0, 0)
  const px = g.getImageData(0, 0, cv.width, cv.height).data
  let x0 = cv.width
  let y0 = cv.height
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < cv.height; y++) {
    for (let x = 0; x < cv.width; x++) {
      if (px[(y * cv.width + x) * 4 + 3] < 12) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  if (x1 < 0) {
    x0 = 0
    y0 = 0
    x1 = cv.width - 1
    y1 = cv.height - 1
  }
  const out = {
    url,
    w: cv.width,
    h: cv.height,
    box: [x0 / cv.width, y0 / cv.height, (x1 + 1) / cv.width, (y1 + 1) / cv.height],
  }
  shots.set(id, out)
  return out
}

function unitWidth(text, font) {
  if (!ruler) ruler = document.createElement('canvas').getContext('2d')
  ruler.font = '700 100px ' + font
  return ruler.measureText(text).width / 100
}

function point(r, a) {
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)]
}

function arc(r1, r2, a1, a2) {
  const wide = a2 - a1 > Math.PI ? 1 : 0
  const [x1, y1] = point(r1, a1)
  const [x2, y2] = point(r2, a1)
  const [x3, y3] = point(r2, a2)
  const [x4, y4] = point(r1, a2)
  return (
    'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
    ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
    ' A' + r2 + ' ' + r2 + ' 0 ' + wide + ' 1 ' + x3.toFixed(1) + ' ' + y3.toFixed(1) +
    ' L' + x4.toFixed(1) + ' ' + y4.toFixed(1) +
    ' A' + r1 + ' ' + r1 + ' 0 ' + wide + ' 0 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Z'
  )
}

function edge(r, a1, a2) {
  const [x1, y1] = point(r, a1)
  const [x2, y2] = point(r, a2)
  const wide = a2 - a1 > Math.PI ? 1 : 0
  return (
    'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
    ' A' + r + ' ' + r + ' 0 ' + wide + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1)
  )
}

function inSector(x, y, r1, r2, a1, a2) {
  const dx = x - CX
  const dy = CY - y
  const r = Math.hypot(dx, dy)
  if (r < r1 || r > r2) return false
  const turn = Math.PI * 2
  let d = (Math.atan2(dx, dy) - a1) % turn
  if (d < 0) d += turn
  return d <= a2 - a1
}

function boxFits(cx, cy, w, h, r1, r2, a1, a2) {
  const spots = [
    [cx - w / 2, cy - h / 2],
    [cx + w / 2, cy - h / 2],
    [cx - w / 2, cy + h / 2],
    [cx + w / 2, cy + h / 2],
    [cx, cy - h / 2],
    [cx, cy + h / 2],
  ]
  for (const [px, py] of spots) if (!inSector(px, py, r1, r2, a1, a2)) return false
  return true
}

function place(id, name, font, cx0, cy0, mid, r1, r2, a1, a2, round) {
  const m = shots.get(id)
  const [bx0, by0, bx1, by1] = m.box
  const ratio = m.w / m.h
  const tall = by1 - by0
  const base = TARGET / Math.sqrt(ratio * (bx1 - bx0) * tall)
  const unit = unitWidth(name, font)

  const plan = (cy, hi, ta) => {
    const wi = hi * ratio
    const hSeen = hi * tall
    const wSeen = wi * (bx1 - bx0)
    const hText = ta * 1.02
    const total = hSeen + ta * SPLIT + hText
    const top = cy - total / 2
    return {
      wi,
      hSeen,
      wSeen,
      hText,
      top,
      cyImage: top + hSeen / 2,
      cyText: top + hSeen + ta * SPLIT + hText / 2,
      wText: unit * ta,
    }
  }

  const fits = (cx, cy, hi, ta) => {
    const p = plan(cy, hi, ta)
    if (round) {
      const inside = (px, py, dw, dh) => {
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            if (Math.hypot(px + (sx * dw) / 2 - CX, py + (sy * dh) / 2 - CY) > r2) return false
          }
        }
        return true
      }
      return inside(cx, p.cyImage, p.wSeen, p.hSeen) && inside(cx, p.cyText, p.wText, p.hText)
    }
    return (
      boxFits(cx, p.cyImage, p.wSeen, p.hSeen, r1 + EDGE, r2 - EDGE, a1, a2) &&
      boxFits(cx, p.cyText, p.wText, p.hText, r1 + EDGE, r2 - EDGE, a1, a2)
    )
  }

  const rm = Math.hypot(cx0 - CX, cy0 - CY)
  const steps = []
  for (let d = 0; d <= 90; d += 3) {
    steps.push(d)
    if (d) steps.push(-d)
  }
  const tracks = round ? [0] : steps

  let cx = cx0
  let cy = cy0
  let hi = base
  let ta = LABEL
  let done = false
  for (const d of tracks) {
    const rr = rm + d
    if (!round && (rr < r1 + 45 || rr > r2 - 45)) continue
    const [px, py] = round ? [cx0, cy0] : point(rr, mid)
    if (fits(px, py, hi, ta)) {
      cx = px
      cy = py
      done = true
      break
    }
  }

  if (!done) {
    const picks = []
    for (const d of tracks) {
      const rr = rm + d
      if (!round && (rr < r1 + 45 || rr > r2 - 45)) continue
      const [px, py] = round ? [cx0, cy0] : point(rr, mid)
      let h = base
      let s = LABEL
      let n = 0
      while (!fits(px, py, h, s) && h > base * 0.82 && n < 40) {
        h *= 0.97
        n++
      }
      while (!fits(px, py, h, s) && s > LABEL * 0.84 && n < 70) {
        s *= 0.985
        n++
      }
      while (!fits(px, py, h, s) && n < 130) {
        h *= 0.97
        s *= 0.975
        n++
      }
      picks.push({ px, py, h, s })
    }
    picks.sort((a, b) => b.s - a.s || b.h - a.h)
    const best = picks[0]
    cx = best.px
    cy = best.py
    hi = best.h
    ta = best.s
  }

  const p = plan(cy, hi, ta)
  return {
    x: cx - p.wi / 2,
    y: p.top - by0 * hi,
    w: p.wi,
    h: hi,
    tx: cx,
    ty: p.top + p.hSeen + ta * SPLIT + ta * 0.78,
    size: ta,
    cx,
    cy,
  }
}

export async function createTree() {
  const font = getComputedStyle(document.body).fontFamily || 'Fredoka, sans-serif'
  for (const id of Object.keys(CREATURES)) await shotOf(id)

  const cells = []
  const lines = []

  const paint = (id, tier, a1, a2) => {
    const c = CREATURES[id]
    const [r1, r2] = RINGS[tier - 1]
    const g1 = a1 + GAP
    const g2 = a2 - GAP
    const mid = (g1 + g2) / 2
    const rm = (r1 + r2) / 2
    const [px, py] = point(rm, mid)
    const spot = place(id, creatureName(id, c.name), font, px, py, mid, r1, r2, g1, g2, false)
    cells.push({ id, tier, shape: arc(r1, r2, g1, g2), spot, fill: treeTint(c.color) })
    lines.push(edge(r2, g1, g2))
    const kids = c.next || []
    if (!kids.length) return
    const step = (a2 - a1) / kids.length
    kids.forEach((k, i) => paint(k, tier + 1, a1 + i * step, a1 + (i + 1) * step))
  }

  const roots = CREATURES[START].next
  const span = (Math.PI * 2) / roots.length
  roots.forEach((id, i) => {
    const a = -Math.PI / 2 + i * span
    paint(id, 1, a + BRANCH, a + span - BRANCH)
  })

  const seed = CREATURES[START]
  const spot = place(START, creatureName(START, seed.name), font, CX, CY, 0, 0, R0 - 22, 0, Math.PI * 2, true)
  cells.unshift({ id: START, tier: 0, round: true, spot, fill: treeTint(seed.color) })

  const svg = node('svg', {
    viewBox: '0 0 ' + SIZE + ' ' + SIZE,
    class: 'tree-svg',
    role: 'img',
  })
  const bed = node('g', {})
  const rails = node('g', {})
  const top = node('g', {})
  svg.appendChild(bed)
  svg.appendChild(rails)
  svg.appendChild(top)

  for (const d of lines) {
    rails.appendChild(node('path', { d, fill: 'none', stroke: INK, 'stroke-width': LINE }))
  }

  const band = node('path', { class: 'tree-flash', fill: 'none' })
  const halo = node('circle', { class: 'tree-flash', fill: 'none', cx: CX, cy: CY, r: R0 })
  top.appendChild(band)
  top.appendChild(halo)

  const wrap = document.createElement('div')
  wrap.className = 'tree'
  const info = document.createElement('div')
  info.className = 'tree-info off'
  info.innerHTML = '<b class="tree-name"></b><span class="tree-role"></span>'
  const label = info.querySelector('.tree-name')
  const role = info.querySelector('.tree-role')

  const touch = document.body.classList.contains('touch')
  let locked = null

  const clear = () => {
    band.classList.remove('on')
    halo.classList.remove('on')
  }

  const show = (id) => {
    if (!id) {
      info.classList.add('off')
      return
    }
    const c = CREATURES[id]
    label.textContent = creatureName(id, c.name)
    label.style.color = hex(mix(c.color, 0xffffff, 0.34))
    role.textContent = creatureRole(id, c.role)
    info.classList.remove('off')
  }

  for (const cell of cells) {
    const g = node('g', { class: 'tree-cell', 'data-id': cell.id })
    if (cell.round) {
      g.appendChild(
        node('circle', { cx: CX, cy: CY, r: R0, fill: cell.fill, stroke: INK, 'stroke-width': LINE })
      )
    } else {
      g.appendChild(node('path', { d: cell.shape, fill: cell.fill, stroke: INK, 'stroke-width': LINE }))
    }
    const s = cell.spot
    const img = node('image', {
      x: s.x.toFixed(1),
      y: s.y.toFixed(1),
      width: s.w.toFixed(1),
      height: s.h.toFixed(1),
      preserveAspectRatio: 'xMidYMid meet',
    })
    img.setAttribute('href', shots.get(cell.id).url)
    g.appendChild(img)
    const text = node('text', {
      x: s.tx.toFixed(1),
      y: s.ty.toFixed(1),
      'text-anchor': 'middle',
      'font-size': s.size.toFixed(1),
      'font-weight': '700',
      fill: NIGHT,
    })
    text.textContent = creatureName(cell.id, CREATURES[cell.id].name)
    g.appendChild(text)

    const light = () => {
      clear()
      if (cell.round) {
        halo.classList.add('on')
      } else {
        band.setAttribute('d', cell.shape)
        band.classList.add('on')
      }
    }
    if (touch) {
      g.addEventListener('click', () => {
        light()
        locked = cell.id
        show(cell.id)
      })
    } else {
      g.addEventListener('pointerenter', () => {
        light()
        show(cell.id)
      })
      g.addEventListener('pointerleave', () => {
        clear()
        show(locked)
      })
    }
    bed.appendChild(g)
  }

  if (touch) {
    const away = (e) => {
      if (!wrap.isConnected) {
        document.removeEventListener('pointerdown', away, true)
        return
      }
      if (e.target.closest && e.target.closest('.tree-cell')) return
      locked = null
      clear()
      show(null)
    }
    document.addEventListener('pointerdown', away, true)
  } else {
    svg.addEventListener('pointerleave', () => {
      clear()
      show(locked)
    })
  }

  show(locked)
  wrap.appendChild(svg)
  wrap.appendChild(info)
  return wrap
}
