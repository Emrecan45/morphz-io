import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { outlineMaterial, CREATURE_OUTLINE } from './outline.js'
import { toonMaterial } from './toon.js'
import { ARENA, ROCKS, TREES, BUSHES, BASES, TEAMS, CAM_PULL } from './config.js'
import { buildStaticWorld, WALL_COUNT } from './world/decor.js'
import { QUALITY, renderScale } from './quality.js'

const FOV = 42
const REF_ASPECT = 16 / 9
const FOV_HALF = Math.tan((FOV * Math.PI) / 360)

const SKY_TOP = new THREE.Color(0x4ec3de)
const SKY_LOW = new THREE.Color(0xe8dcb4)
const SEA_TROUGH = 0x184a6d
const SEA_DEEP = 0x1f5c88
const SEA = 0x2d78ad
const SEA_LIT = 0x59a6d8
const SEA_FOAM = 0xc9e6f4
const SEA_INK = 0x05070b
const SEA_STROKE = CREATURE_OUTLINE * 0.8
const SEA_IN = 97
const SEA_OUT = 140
const SEA_LEVEL = -0.55
const SEA_DIR = [0.6600, 0.7513]
const SEA_AMP = 1.05
const SEA_ROWS = QUALITY.seaRows
const SEA_COLS = QUALITY.seaCols

function makeSky() {
  const geo = new THREE.SphereGeometry(520, 32, 20)
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      up: { value: SKY_TOP },
      down: { value: SKY_LOW },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 up;
      uniform vec3 down;
      varying vec3 vPos;
      void main() {
        float h = clamp(vPos.y / 320.0 + 0.35, 0.0, 1.0);
        gl_FragColor = vec4(mix(down, up, pow(h, 0.85)), 1.0);
      }`,
  })
  return new THREE.Mesh(geo, mat)
}

function grainTexture() {
  const size = 512
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const g = c.getContext('2d')
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, size, size)

  const wrapped = (x, y, r, draw) => {
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        const px = x + dx
        const py = y + dy
        if (px < -r || px > size + r || py < -r || py > size + r) continue
        draw(px, py)
      }
    }
  }

  for (let i = 0; i < 150; i++) {
    const r = 26 + Math.random() * 84
    const dark = Math.random() < 0.55
    const tint = dark ? '0,0,0' : '255,255,255'
    const force = dark ? 0.08 + Math.random() * 0.07 : 0.09 + Math.random() * 0.08
    wrapped(Math.random() * size, Math.random() * size, r, (px, py) => {
      const grad = g.createRadialGradient(px, py, 0, px, py, r)
      grad.addColorStop(0, `rgba(${tint},${force})`)
      grad.addColorStop(1, `rgba(${tint},0)`)
      g.fillStyle = grad
      g.fillRect(px - r, py - r, r * 2, r * 2)
    })
  }

  for (let i = 0; i < 220; i++) {
    const r = 7 + Math.random() * 17
    const dark = Math.random() < 0.6
    const tint = dark ? '0,0,0' : '255,255,255'
    const force = dark ? 0.09 + Math.random() * 0.08 : 0.1 + Math.random() * 0.09
    wrapped(Math.random() * size, Math.random() * size, r, (px, py) => {
      const grad = g.createRadialGradient(px, py, 0, px, py, r)
      grad.addColorStop(0, `rgba(${tint},${force})`)
      grad.addColorStop(0.65, `rgba(${tint},${force * 0.5})`)
      grad.addColorStop(1, `rgba(${tint},0)`)
      g.fillStyle = grad
      g.fillRect(px - r, py - r, r * 2, r * 2)
    })
  }

  for (let i = 0; i < 170; i++) {
    const w = 2.4 + Math.random() * 3.4
    const h = w * (0.7 + Math.random() * 0.6)
    const angle = Math.random() * Math.PI
    const dark = Math.random() < 0.62
    const tint = dark ? '30,26,14' : '255,252,224'
    const force = dark ? 0.17 + Math.random() * 0.13 : 0.14 + Math.random() * 0.12
    wrapped(Math.random() * size, Math.random() * size, w + 2, (px, py) => {
      g.save()
      g.translate(px, py)
      g.rotate(angle)
      g.fillStyle = `rgba(${tint},${force})`
      g.beginPath()
      g.ellipse(0, 0, w, h, 0, 0, Math.PI * 2)
      g.fill()
      g.restore()
    })
  }

  for (let i = 0; i < 260; i++) {
    const len = 7 + Math.random() * 15
    const angle = Math.random() * Math.PI
    const dark = Math.random() < 0.5
    const tint = dark ? '24,34,14' : '236,255,206'
    const force = dark ? 0.1 + Math.random() * 0.09 : 0.09 + Math.random() * 0.08
    wrapped(Math.random() * size, Math.random() * size, len, (px, py) => {
      g.save()
      g.translate(px, py)
      g.rotate(angle)
      g.strokeStyle = `rgba(${tint},${force})`
      g.lineWidth = 1.6 + Math.random() * 1.2
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(-len / 2, 0)
      g.quadraticCurveTo(0, len * 0.14, len / 2, 0)
      g.stroke()
      g.restore()
    })
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

function seaTone(hex) {
  const c = new THREE.Color(hex)
  return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`
}

function seaRing(rIn, rOut, rows, cols, from, to) {
  const head = from || 0
  const tail = to === undefined ? cols : to
  const span = tail - head
  const pos = new Float32Array((rows + 1) * (span + 1) * 3)
  const idx = new Uint32Array(rows * span * 6)
  let k = 0
  for (let j = 0; j <= rows; j++) {
    const r = rIn + ((rOut - rIn) * j) / rows
    for (let i = head; i <= tail; i++) {
      const s = (4 * i) / cols
      let x = -1
      let z = -1
      if (s < 1) {
        x = s * 2 - 1
      } else if (s < 2) {
        x = 1
        z = (s - 1) * 2 - 1
      } else if (s < 3) {
        x = 1 - (s - 2) * 2
        z = 1
      } else {
        z = 1 - (s - 3) * 2
      }
      pos[k++] = x * r
      pos[k++] = 0
      pos[k++] = z * r
    }
  }
  let t = 0
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < span; i++) {
      const a = j * (span + 1) + i
      const b = a + span + 1
      idx[t++] = a
      idx[t++] = b
      idx[t++] = a + 1
      idx[t++] = a + 1
      idx[t++] = b
      idx[t++] = b + 1
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(new THREE.BufferAttribute(idx, 1))
  return geo
}

const SEA_FIELD = `
  uniform float seaTime;
  varying vec3 vSeaPos;

  float seaHash(vec2 c) {
    return fract(sin(dot(c, vec2(41.3, 289.1))) * 43758.5453);
  }

  float seaNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = seaHash(i);
    float b = seaHash(i + vec2(1.0, 0.0));
    float c = seaHash(i + vec2(0.0, 1.0));
    float d = seaHash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float seaShore(vec2 p) {
    return max(abs(p.x), abs(p.y)) - ${ARENA.half.toFixed(1)};
  }

  vec2 seaAway(vec2 p) {
    return abs(p.x) > abs(p.y) ? vec2(sign(p.x), 0.0) : vec2(0.0, sign(p.y));
  }

  vec3 seaTrain(vec2 p, vec2 dir, float len, float amp, float speed) {
    float k = 6.2831853 / len;
    float a = (dot(p, dir) - seaTime * speed) * k;
    return vec3(amp * sin(a), amp * cos(a) * k * dir);
  }

  vec3 seaRoll(float phase, vec2 dir, float len, float amp, float speed) {
    float k = 6.2831853 / len;
    float a = (phase - seaTime * speed) * k;
    float s = sin(a) * 0.5 + 0.5;
    return vec3(amp * (2.0 * s * s - 1.0), amp * 2.0 * s * cos(a) * k * dir);
  }

  vec3 seaSwell(vec2 p) {
    vec3 a = seaTrain(p, vec2(0.8607, 0.5091), 26.0, 1.70, 0.5);
    vec3 b = seaTrain(p, vec2(-0.4188, 0.9081), 14.5, 0.60, 0.4);
    vec3 c = seaTrain(p, vec2(0.9872, -0.1596), 8.2, 0.22, 0.3);
    vec2 dir = vec2(${SEA_DIR[0].toFixed(4)}, ${SEA_DIR[1].toFixed(4)});
    float phase = dot(p, dir) + a.x + b.x + c.x;
    return seaRoll(phase, dir + a.yz + b.yz + c.yz, 16.0, ${SEA_AMP.toFixed(3)}, 2.9);
  }

  vec3 seaChop(vec2 p) {
    vec3 a = seaTrain(p, vec2(0.6202, -0.7845), 4.2, 0.013, 1.1);
    a += seaTrain(p, vec2(-0.9511, -0.3090), 2.6, 0.007, 0.9);
    return a;
  }

  float seaGrow(float edge) {
    float a = smoothstep(0.0, 6.0, edge);
    float b = smoothstep(41.0, 49.5, edge);
    return (0.22 + 0.78 * a) * (1.0 - b);
  }

  float seaGrowSlope(float edge) {
    float a = clamp(edge / 6.0, 0.0, 1.0);
    float b = clamp((edge - 41.0) / 8.5, 0.0, 1.0);
    float sa = 0.22 + 0.78 * a * a * (3.0 - 2.0 * a);
    float sb = 1.0 - b * b * (3.0 - 2.0 * b);
    float ga = 0.78 * 6.0 * a * (1.0 - a) / 6.0;
    float gb = 6.0 * b * (1.0 - b) / 8.5;
    return ga * sb - sa * gb;
  }

  float seaHeight(vec2 p) {
    return (seaSwell(p).x + seaChop(p).x) * seaGrow(seaShore(p));
  }
`

const SEA_PARTS = 24

function makeSea() {
  const seaTime = { value: 0 }
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  mat.userData.seaTime = seaTime
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.seaTime = seaTime
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        ${SEA_FIELD}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vSeaPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        transformed.y += seaHeight(vSeaPos.xz);`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        ${SEA_FIELD}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 sp = vSeaPos.xz;
        float edge = seaShore(sp);
        float grow = seaGrow(edge);
        vec3 swell = seaSwell(sp);
        vec3 chop = seaChop(sp);
        vec2 tilt = (swell.yz * 1.8 + chop.yz * 1.1) * grow
          + (swell.x + chop.x) * seaGrowSlope(edge) * seaAway(sp) * 1.8;

        float px = max(
          max(length(vec2(dFdx(sp.x), dFdy(sp.x))), length(vec2(dFdx(sp.y), dFdy(sp.y)))),
          0.002
        );
        float crisp = smoothstep(1.1, 0.32, px);

        vec3 nrm = normalize(vec3(-tilt.x, 1.0, -tilt.y));
        float lam = clamp(dot(nrm, vec3(0.3902, 0.8705, 0.3002)), 0.0, 1.0);
        float aa = clamp(fwidth(lam), 0.004, 0.055);
        vec3 col = ${seaTone(SEA_TROUGH)};
        col = mix(col, ${seaTone(SEA_DEEP)}, smoothstep(0.58 - aa, 0.58 + aa, lam));
        col = mix(col, ${seaTone(SEA)}, smoothstep(0.80 - aa, 0.80 + aa, lam));
        col = mix(col, ${seaTone(SEA_LIT)}, smoothstep(0.93 - aa, 0.93 + aa, lam));
        col = mix(col, col * 0.74, smoothstep(10.0, 90.0, edge));

        float show = smoothstep(0.28, 0.62, grow) * crisp;
        float thick = max(${(SEA_STROKE * 1.3).toFixed(3)}, px * 1.4);

        float gate = seaNoise(sp * 0.05 + vec2(seaTime * 0.02, 0.0));
        float cap = (0.50 + 0.42 * gate) * ${SEA_AMP.toFixed(3)};
        float lift = (swell.x - cap) / max(length(swell.yz), 1e-4);
        float ink = (1.0 - smoothstep(thick - px, thick + px, abs(lift))) * show;
        float foam = smoothstep(-px, px, lift) * smoothstep(0.54, 0.32, gate) * show;

        col = mix(col, ${seaTone(SEA_FOAM)}, foam);
        col = mix(col, ${seaTone(SEA_INK)}, ink);

        diffuseColor.rgb = col;`)
  }
  const g = new THREE.Group()
  const parts = Math.max(1, Math.min(SEA_PARTS, SEA_COLS))
  for (let p = 0; p < parts; p++) {
    const head = Math.round((SEA_COLS * p) / parts)
    const tail = Math.round((SEA_COLS * (p + 1)) / parts)
    if (tail <= head) continue
    const geo = seaRing(SEA_IN, SEA_OUT, SEA_ROWS, SEA_COLS, head, tail)
    geo.computeBoundingSphere()
    geo.boundingSphere.radius += SEA_AMP * 2
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.y = SEA_LEVEL
    g.add(mesh)
  }
  g.userData.seaTime = seaTime
  return g
}

export function stepSea(view, dt) {
  if (view.seaTime) view.seaTime.value += dt
}

function makeGround(renderer) {
  const g = new THREE.Group()
  const grain = grainTexture()
  const anis = renderer.capabilities.getMaxAnisotropy()

  const sea = makeSea()
  g.add(sea)
  g.userData.seaTime = sea.userData.seaTime

  ARENA.rings.forEach((ring, i) => {
    const tex = i === 0 ? grain : grain.clone()
    tex.needsUpdate = true
    tex.repeat.set(1 / 26, 1 / 26)
    tex.anisotropy = anis
    const geo = band(ring.to, ring.from)
    geo.rotateX(-Math.PI / 2)
    const mesh = new THREE.Mesh(geo, toonMaterial({ color: ring.color, map: tex }))
    mesh.receiveShadow = true
    g.add(mesh)
  })
  return g
}

function square(path, r) {
  path.moveTo(-r, -r)
  path.lineTo(r, -r)
  path.lineTo(r, r)
  path.lineTo(-r, r)
  path.closePath()
}

function band(outer, inner) {
  const shape = new THREE.Shape()
  square(shape, outer)
  if (inner > 0) {
    const hole = new THREE.Path()
    square(hole, inner)
    shape.holes.push(hole)
  }
  return new THREE.ShapeGeometry(shape)
}

function frame(r, thickness) {
  return band(r + thickness, r - thickness)
}

function makeRingMarks() {
  const g = new THREE.Group()
  for (let i = 1; i < ARENA.rings.length; i++) {
    const r = ARENA.rings[i].to
    const geo = frame(r, 0.7)
    geo.rotateX(-Math.PI / 2)
    const m = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        color: 0xfff1d0,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    )
    m.position.y = 0.02
    m.renderOrder = -14
    g.add(m)
  }
  return g
}

const LEAVES = 7
const EMPTY = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001).setPosition(0, -500, 0)

function paintLeaf(set, at, m) {
  const part = set.meshFor[at]
  if (!part) return
  part.setMatrixAt(set.slotFor[at], m)
  part.instanceMatrix.needsUpdate = true
}

export function fadeBush(view, bu) {
  const fx = view && view.fx
  if (!fx || fx.current === bu) return
  if (fx.current) {
    for (let j = 0; j < LEAVES; j++) {
      const m = fx.current.mats[j]
      paintLeaf(fx.leaf, fx.current.base + j, m)
      paintLeaf(fx.line, fx.current.base + j, m)
    }
  }
  if (bu) {
    for (let j = 0; j < LEAVES; j++) {
      paintLeaf(fx.leaf, bu.base + j, EMPTY)
      paintLeaf(fx.line, bu.base + j, EMPTY)
      fx.tuftsFadedDepth.setMatrixAt(j, bu.mats[j])
      fx.tuftsFaded.setMatrixAt(j, bu.mats[j])
      fx.tuftsFadedLine.setMatrixAt(j, bu.mats[j])
    }
    fx.tuftsFadedDepth.instanceMatrix.needsUpdate = true
    fx.tuftsFaded.instanceMatrix.needsUpdate = true
    fx.tuftsFadedLine.instanceMatrix.needsUpdate = true
  }
  const shown = bu ? LEAVES : 0
  fx.tuftsFadedDepth.count = shown
  fx.tuftsFaded.count = shown
  fx.tuftsFadedLine.count = shown
  fx.current = bu
}

export function smoothGeo(geo) {
  const bare = geo.clone()
  bare.deleteAttribute('normal')
  bare.deleteAttribute('uv')
  const soft = mergeVertices(bare)
  soft.computeVertexNormals()
  return soft
}

function makeWall(stones) {
  const g = new THREE.Group()
  const geo = new THREE.IcosahedronGeometry(1, 0)
  const mat = toonMaterial({ color: 0x6d7b88 })
  const n = WALL_COUNT
  const mesh = new THREE.InstancedMesh(geo, mat, n)
  const outline = new THREE.InstancedMesh(smoothGeo(geo), outlineMaterial(CREATURE_OUTLINE), n)
  const d = new THREE.Object3D()
  for (let i = 0; i < n; i++) {
    const p = stones[i]
    d.position.set(p.x, p.y, p.z + p.y * CAM_PULL)
    d.rotation.set(p.rx, p.ry, p.rz)
    d.scale.set(p.s, p.s * 1.5, p.s)
    d.updateMatrix()
    mesh.setMatrixAt(i, d.matrix)
    outline.setMatrixAt(i, d.matrix)
  }
  mesh.castShadow = true
  mesh.receiveShadow = true
  g.add(mesh)
  g.add(outline)
  return { group: g }
}

const CHUNK = 34

function chunkPlan(src, count, groupSize) {
  const m = new THREE.Matrix4()
  const buckets = new Map()
  for (let i = 0; i < count; i += groupSize) {
    src.getMatrixAt(i, m)
    const y = m.elements[13]
    const key = y < -100 ? 'vide' : Math.floor(m.elements[12] / CHUNK) + ':' + Math.floor(m.elements[14] / CHUNK)
    let list = buckets.get(key)
    if (!list) {
      list = []
      buckets.set(key, list)
    }
    for (let j = 0; j < groupSize && i + j < count; j++) list.push(i + j)
  }
  return [...buckets.values()]
}

function chunkMeshes(src, plan, count) {
  const m = new THREE.Matrix4()
  const meshes = []
  const meshFor = new Array(count)
  const slotFor = new Int32Array(count)
  for (const list of plan) {
    const part = new THREE.InstancedMesh(src.geometry, src.material, list.length)
    part.castShadow = src.castShadow
    part.receiveShadow = src.receiveShadow
    part.renderOrder = src.renderOrder
    for (let at = 0; at < list.length; at++) {
      const g = list[at]
      src.getMatrixAt(g, m)
      part.setMatrixAt(at, m)
      meshFor[g] = part
      slotFor[g] = at
    }
    part.instanceMatrix.needsUpdate = true
    part.computeBoundingSphere()
    meshes.push(part)
  }
  return { meshes, meshFor, slotFor }
}

function spread(host, src, count, groupSize, plan) {
  const cut = plan || chunkPlan(src, count, groupSize)
  const built = chunkMeshes(src, cut, count)
  for (const part of built.meshes) host.add(part)
  built.plan = cut
  return built
}

function makeDecor(plan) {
  const g = new THREE.Group()
  const rockGeo = new THREE.DodecahedronGeometry(1, 0)
  const rockMat = toonMaterial({ color: 0x7d8894 })
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, ROCKS.count)
  const rocksTrait = new THREE.InstancedMesh(smoothGeo(rockGeo), outlineMaterial(CREATURE_OUTLINE), ROCKS.count)
  const tuftGeo = new THREE.ConeGeometry(1, 1, 6)
  const tuftMat = toonMaterial({ color: 0x4f9448 })
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, TREES.count)
  const tuftsTrait = new THREE.InstancedMesh(smoothGeo(tuftGeo), outlineMaterial(CREATURE_OUTLINE), TREES.count)
  const trunkGeo = new THREE.CylinderGeometry(0.19, 0.27, 1, 6)
  const trunkMat = toonMaterial({ color: 0x7a5330 })
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, TREES.count)
  const trunksLine = new THREE.InstancedMesh(smoothGeo(trunkGeo), outlineMaterial(CREATURE_OUTLINE), TREES.count)
  const leafGeo = new THREE.IcosahedronGeometry(1, QUALITY.leaf)
  const leafMat = toonMaterial({ color: 0x2f7550 })
  const leafDepth = new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true })
  const leafFade = new THREE.MeshBasicMaterial({
    color: 0x4d9b6f,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    depthFunc: THREE.EqualDepth,
  })
  const total = BUSHES.count * LEAVES
  const bushLeaves = new THREE.InstancedMesh(leafGeo, leafMat, total)
  const tuftsLine = new THREE.InstancedMesh(smoothGeo(leafGeo), outlineMaterial(CREATURE_OUTLINE), total)
  const outlineFaded = outlineMaterial(CREATURE_OUTLINE).clone()
  outlineFaded.transparent = true
  outlineFaded.depthWrite = false
  outlineFaded.uniforms.alpha.value = 0.92
  const tuftsFadedDepth = new THREE.InstancedMesh(leafGeo, leafDepth, LEAVES)
  const tuftsFaded = new THREE.InstancedMesh(leafGeo, leafFade, LEAVES)
  const tuftsFadedLine = new THREE.InstancedMesh(smoothGeo(leafGeo), outlineFaded, LEAVES)
  tuftsFadedDepth.frustumCulled = false
  tuftsFaded.frustumCulled = false
  tuftsFadedLine.frustumCulled = false
  tuftsFadedDepth.count = 0
  tuftsFaded.count = 0
  tuftsFadedLine.count = 0
  tuftsFadedDepth.renderOrder = 1
  tuftsFaded.renderOrder = 2
  tuftsFadedLine.renderOrder = 3
  const d = new THREE.Object3D()
  for (let i = 0; i < ROCKS.count; i++) {
    const p = plan.rocks[i]
    if (!p.ok) {
      d.position.set(0, -400, 0)
      d.rotation.set(0, 0, 0)
      d.scale.setScalar(0.001)
      d.updateMatrix()
      rocks.setMatrixAt(i, d.matrix)
      rocksTrait.setMatrixAt(i, d.matrix)
      continue
    }
    d.position.set(p.x, p.y, p.z + p.y * CAM_PULL)
    d.rotation.set(p.rx, p.ry, p.rz)
    d.scale.set(p.s, p.s * 1.1, p.s)
    d.updateMatrix()
    rocks.setMatrixAt(i, d.matrix)
    rocksTrait.setMatrixAt(i, d.matrix)
  }
  for (let i = 0; i < TREES.count; i++) {
    const p = plan.trees[i]
    if (!p.ok) {
      d.position.set(0, -400, 0)
      d.rotation.set(0, 0, 0)
      d.scale.setScalar(0.001)
      d.updateMatrix()
      tufts.setMatrixAt(i, d.matrix)
      tuftsTrait.setMatrixAt(i, d.matrix)
      trunks.setMatrixAt(i, d.matrix)
      trunksLine.setMatrixAt(i, d.matrix)
      continue
    }
    const s = p.s
    d.position.set(p.x, s * 0.66, p.z)
    d.rotation.set(0, 0, 0)
    d.scale.set(s * 1.38, s * 1.32, s * 1.38)
    d.updateMatrix()
    trunks.setMatrixAt(i, d.matrix)
    trunksLine.setMatrixAt(i, d.matrix)
    d.position.set(p.x, s * 2.17, p.z)
    d.rotation.set(0, p.ry, p.rz)
    d.scale.set(s * 0.75, s * 2.3, s * 0.75)
    d.updateMatrix()
    tufts.setMatrixAt(i, d.matrix)
    tuftsTrait.setMatrixAt(i, d.matrix)
  }
  for (let i = 0; i < BUSHES.count; i++) {
    const p = plan.plans[i]
    const mats = []
    for (let j = 0; j < LEAVES; j++) {
      const f = p.leaves[j]
      d.position.set(f.x, f.y, f.z)
      d.rotation.set(f.rx, f.ry, f.rz)
      d.scale.set(f.t, f.t * 0.74, f.t)
      d.updateMatrix()
      mats.push(d.matrix.clone())
      if (!p.ok) d.matrix.copy(EMPTY)
      bushLeaves.setMatrixAt(i * LEAVES + j, d.matrix)
      tuftsLine.setMatrixAt(i * LEAVES + j, d.matrix)
    }
    if (p.ok) {
      const bu = plan.bushes.find((o) => o.base === p.base)
      if (bu) bu.mats = mats
    }
  }
  const blocks = plan.blocks
  const bushes = plan.bushes
  tufts.castShadow = true
  tufts.receiveShadow = true
  trunks.castShadow = true
  trunks.receiveShadow = true
  rocks.castShadow = true
  rocks.receiveShadow = false
  bushLeaves.castShadow = true
  bushLeaves.receiveShadow = true

  const rockCut = chunkPlan(rocks, ROCKS.count, 1)
  spread(g, rocks, ROCKS.count, 1, rockCut)
  spread(g, rocksTrait, ROCKS.count, 1, rockCut)
  const treeCut = chunkPlan(tufts, TREES.count, 1)
  spread(g, tufts, TREES.count, 1, treeCut)
  spread(g, tuftsTrait, TREES.count, 1, treeCut)
  spread(g, trunks, TREES.count, 1, treeCut)
  spread(g, trunksLine, TREES.count, 1, treeCut)
  const leafCut = chunkPlan(bushLeaves, total, LEAVES)
  const leaf = spread(g, bushLeaves, total, LEAVES, leafCut)
  const line = spread(g, tuftsLine, total, LEAVES, leafCut)

  g.add(tuftsFadedDepth)
  g.add(tuftsFaded)
  g.add(tuftsFadedLine)

  return {
    group: g,
    blocks,
    bushes,
    fx: { leaf, line, tuftsFadedDepth, tuftsFaded, tuftsFadedLine, current: null },
  }
}

export function makeBases() {
  const g = new THREE.Group()
  const p = BASES.depth
  const grain = grainTexture()
  const span = ARENA.half * 2
  for (const [team, def] of Object.entries(TEAMS)) {
    const sign = team === 'red' ? -1 : 1
    const tex = grain.clone()
    tex.needsUpdate = true
    tex.repeat.set(p / 26, span / 26)
    const geo = new THREE.PlaneGeometry(p, span)
    geo.rotateX(-Math.PI / 2)
    const ground = new THREE.Mesh(geo, toonMaterial({ color: def.color, map: tex }))
    ground.position.set(sign * (ARENA.half - p / 2), 0.014, 0)
    ground.receiveShadow = true
    g.add(ground)

    const edge = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, span),
      new THREE.MeshBasicMaterial({ color: 0xfff1d0, transparent: true, opacity: 0.7, depthWrite: false })
    )
    edge.geometry.rotateX(-Math.PI / 2)
    edge.position.set(sign * (ARENA.half - p), 0.018, 0)
    edge.renderOrder = -12
    g.add(edge)
  }
  return g
}

export function freezeStatic(node) {
  node.updateMatrixWorld(true)
  node.traverse((o) => {
    o.matrixAutoUpdate = false
  })
  return node
}

export function createView(canvas, statics) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: QUALITY.antialias, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(QUALITY.pixelRatio, window.devicePixelRatio || 1))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = QUALITY.shadowMap > 0
  renderer.shadowMap.type = QUALITY.softShadow ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0xd6e7d2, 0.0034)
  scene.add(freezeStatic(makeSky()))

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.4, 900)

  const hemi = new THREE.HemisphereLight(0xcfeaf6, 0x6f7a4e, 0.82)
  scene.add(hemi)

  const sun = new THREE.DirectionalLight(0xfff3d8, 2.3)
  sun.position.set(26, 58, 20)
  sun.castShadow = QUALITY.shadowMap > 0
  sun.shadow.mapSize.set(QUALITY.shadowMap || 512, QUALITY.shadowMap || 512)
  sun.shadow.camera.near = 12
  sun.shadow.camera.far = 110
  sun.shadow.camera.left = -QUALITY.shadowSpan
  sun.shadow.camera.right = QUALITY.shadowSpan
  sun.shadow.camera.top = QUALITY.shadowSpan
  sun.shadow.camera.bottom = -QUALITY.shadowSpan
  sun.shadow.radius = QUALITY.softShadow ? 3 : 1
  sun.shadow.bias = -0.0002
  sun.shadow.normalBias = 0.006
  scene.add(sun)
  scene.add(sun.target)

  const fill = new THREE.DirectionalLight(0x9fd0e8, 0.35)
  fill.position.set(-30, 20, -24)
  scene.add(fill)

  const ground = makeGround(renderer)
  scene.add(freezeStatic(ground))
  scene.add(freezeStatic(makeRingMarks()))
  const plan = statics || buildStaticWorld()
  scene.add(freezeStatic(makeWall(plan.wall.stones).group))
  const decor = makeDecor(plan.decor)
  scene.add(freezeStatic(decor.group))

  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: QUALITY.samples })
  const composer = new EffectComposer(renderer, target)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.4, 0.62, 0.86)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  const view = { renderer, scene, camera, composer, sun, bloom, canvas, seaTime: ground.userData.seaTime, blocks: decor.blocks, bushes: decor.bushes, fx: decor.fx }
  resizeView(view)
  window.addEventListener('resize', () => resizeView(view))
  return view
}

export function fovFor(aspect) {
  const half = FOV_HALF * Math.min(1, REF_ASPECT / aspect)
  const fov = (Math.atan(half) * 360) / Math.PI
  return Math.min(75, Math.max(12, fov))
}

export function applyQuality(view) {
  const q = QUALITY
  const r = view.renderer
  r.setPixelRatio(Math.min(q.pixelRatio, window.devicePixelRatio || 1) * renderScale())
  view.bloom.enabled = q.bloom
  const wantShadow = q.shadowMap > 0
  const wantType = q.softShadow ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap
  if (r.shadowMap.enabled !== wantShadow || r.shadowMap.type !== wantType) {
    r.shadowMap.enabled = wantShadow
    r.shadowMap.type = wantType
    view.scene.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh) return
      const list = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      for (const m of list) m.needsUpdate = true
    })
  }
  view.sun.castShadow = wantShadow
  if (view.sun.shadow.mapSize.x !== q.shadowMap && wantShadow) {
    if (view.sun.shadow.map) {
      view.sun.shadow.map.dispose()
      view.sun.shadow.map = null
    }
    view.sun.shadow.mapSize.set(q.shadowMap, q.shadowMap)
  }
  view.sun.shadow.radius = q.softShadow ? 3 : 1
  const cam = view.sun.shadow.camera
  cam.left = -q.shadowSpan
  cam.right = q.shadowSpan
  cam.top = q.shadowSpan
  cam.bottom = -q.shadowSpan
  cam.updateProjectionMatrix()
  resizeView(view)
}

export function paintView(view) {
  if (view.bloom.enabled) view.composer.render()
  else view.renderer.render(view.scene, view.camera)
}

export function resizeView(view) {
  const w = view.canvas.clientWidth || window.innerWidth
  const h = view.canvas.clientHeight || window.innerHeight
  view.renderer.setSize(w, h, false)
  view.composer.setSize(w, h)
  view.camera.aspect = w / h
  view.camera.fov = fovFor(view.camera.aspect)
  view.camera.updateProjectionMatrix()
}

export function moveSun(view, x, z) {
  view.sun.position.set(x + 26, 58, z + 20)
  view.sun.target.position.set(x, 0, z)
  view.sun.target.updateMatrixWorld()
}

export function makeFoodField(scene, count, color, emissive) {
  const geo = new THREE.IcosahedronGeometry(1, 0)
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 1.15,
    roughness: 0.22,
    metalness: 0.18,
    flatShading: true,
  })
  const mesh = new THREE.InstancedMesh(geo, mat, count)
  mesh.castShadow = false
  mesh.frustumCulled = false
  scene.add(mesh)

  const outline = new THREE.InstancedMesh(smoothGeo(geo), outlineMaterial(CREATURE_OUTLINE), count)
  outline.frustumCulled = false
  scene.add(outline)
  mesh.userData.outline = outline

  return mesh
}

