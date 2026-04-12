import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')
const FRONTEND = resolve(ROOT, 'frontend')

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
      },
    },
  ],
  webServers: [
    {
      command: 'xvfb-run -a node node_modules/.bin/electron-vite dev --port 5173',
      port: 5173,
      reuseExistingServer: false,
      timeout: 60000,
      cwd: FRONTEND,
    },
  ],
  timeout: 60000,
})
