import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'electron/main.js')
        },
        external: ['better-sqlite3']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          preload: resolve(__dirname, 'electron/preload.js')
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname),
    server: {
      port: 5173,
      strictPort: true,
    },
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src')
      }
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'index.html')
      }
    }
  }
})