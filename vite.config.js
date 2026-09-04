import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'url'
import path from 'path'

const root = path.dirname(fileURLToPath(import.meta.url))

const ADAPTERS = {
  y8: 'y8.js',
  crazygames: 'crazygames.js',
}

const REQUIRED = {
  'y8.js': ['VITE_Y8_GAME_ID'],
}

export default defineConfig((config) => {
  const adapter = ADAPTERS[String(config.mode).toLowerCase()] || 'none.js'
  const needed = REQUIRED[adapter]
  if (needed && config.command === 'build') {
    const env = loadEnv(config.mode, root, 'VITE_')
    for (const name of needed) {
      if (!env[name] && !process.env[name]) {
        throw new Error(name + ' is missing for the ' + config.mode + ' build')
      }
    }
  }
  return {
    base: './',
    build: {
      target: 'es2020',
      assetsDir: 'assets',
      chunkSizeWarningLimit: 1200,
    },
    resolve: {
      alias: {
        'virtual:platform': path.resolve(root, 'src/platform', adapter),
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5180,
    },
  }
})
