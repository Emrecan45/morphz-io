import musicUrl from './assets/audio/music.ogg'

const KEY_MUTE = 'morphz.mute'
const LEVEL = 0.13

let ctx = null
let master = null
let musicBus = null

function readMuted() {
  try {
    return localStorage.getItem(KEY_MUTE) === '1'
  } catch {
    return false
  }
}

let muted = readMuted()

function applyVolume(instant) {
  if (!ctx) return
  const t = ctx.currentTime
  const level = muted ? 0 : LEVEL
  if (instant) {
    musicBus.gain.cancelScheduledValues(t)
    musicBus.gain.value = level
    return
  }
  musicBus.gain.setTargetAtTime(level, t, 0.05)
}

let watchers = []

export function onMuteChange(fn) {
  watchers.push(fn)
  return () => {
    watchers = watchers.filter((w) => w !== fn)
  }
}

export function musicMuted() {
  return muted
}

export function toggleMute(on) {
  muted = on === undefined ? !muted : !!on
  try {
    localStorage.setItem(KEY_MUTE, muted ? '1' : '0')
  } catch {
  }
  applyVolume()
  if (!muted) startMusic()
  for (const fn of watchers) fn(muted)
  return muted
}

export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return
  }
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.72
  master.connect(ctx.destination)
  musicBus = ctx.createGain()
  musicBus.connect(master)
  applyVolume(true)
  if (!muted) startMusic()
}

let musicSource = null
let musicBuffer = null
let musicFetch = null
let musicWanted = false

function loadMusic() {
  if (musicBuffer || musicFetch || !ctx) return
  musicFetch = fetch(musicUrl)
    .then((rep) => rep.arrayBuffer())
    .then((raw) => ctx.decodeAudioData(raw))
    .then((buf) => {
      musicBuffer = buf
      if (musicWanted) startMusic()
    })
    .catch(() => {})
}

function startMusic() {
  if (!ctx) return
  musicWanted = true
  if (!musicBuffer) {
    loadMusic()
    return
  }
  if (musicSource) return
  musicSource = ctx.createBufferSource()
  musicSource.buffer = musicBuffer
  musicSource.loop = true
  musicSource.connect(musicBus)
  musicSource.start()
}

