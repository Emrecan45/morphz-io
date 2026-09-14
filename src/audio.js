import musicUrl from './assets/audio/music.ogg'
import { prefGet, prefSet } from './prefs.js'

const KEY_MUTE = 'morphz.mute'
const LEVEL = 0.13

let ctx = null
let master = null
let musicBus = null

function readMuted() {
  return prefGet(KEY_MUTE) === '1'
}

let muted = readMuted()
const hushes = new Set()

function applyVolume(instant) {
  if (!ctx) return
  const t = ctx.currentTime
  const level = muted || hushes.size ? 0 : LEVEL
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

export function audioSilent() {
  return muted || hushes.size > 0
}

export function toggleMute(on) {
  muted = on === undefined ? !muted : !!on
  prefSet(KEY_MUTE, muted ? '1' : '0')
  applyVolume()
  if (!muted) startMusic()
  notify()
  return muted
}

function notify() {
  const silent = muted || hushes.size > 0
  for (const fn of watchers) fn(silent)
}

export function reloadMute() {
  const kept = readMuted()
  if (kept !== muted) toggleMute(kept)
}

export function hushAudio(on, why) {
  const key = why || 'host'
  if (on) hushes.add(key)
  else hushes.delete(key)
  applyVolume()
  if (!muted && !hushes.size) startMusic()
  notify()
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

