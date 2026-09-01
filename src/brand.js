export const GAME_NAME = 'morphz.io'
export const VERSION = 'beta'
export const AUTHOR = 'Emrecan45'
export const AUTHOR_URL = 'https://emrecan45.github.io'
export const DISCORD_URL = ''
export const SUBJECTS = ['bug', 'idea', 'player', 'partner', 'press', 'other']

export const HOME_HOSTS = ['morphz.io', 'localhost', '127.0.0.1']

export function onOwnSite() {
  if (typeof window === 'undefined') return false
  try {
    if (window.top !== window.self) return false
  } catch {
    return false
  }
  const host = window.location.hostname
  return HOME_HOSTS.some((d) => host === d || host.endsWith('.' + d))
}
