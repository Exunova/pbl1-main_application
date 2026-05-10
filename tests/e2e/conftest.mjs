import { test as base, _electron } from '@playwright/test'

export { expect }

let electronApp

// Launch Electron app once before all tests
beforeAll(async () => {
  electronApp = await _electron.launch({
    executablePath: 'C:\\Users\\user\\Project\\pbl1-main_application\\frontend\\node_modules\\electron\\dist\\electron.exe',
    args: ['.'],
    cwd: 'C:\\Users\\user\\Project\\pbl1-main_application\\frontend',
  })
})

// Clean up after all tests
afterAll(async () => {
  if (electronApp) {
    await electronApp.close()
  }
})

export const test = base.extend({
  appPage: async ({}, use) => {
    // Get the first window from Electron app
    const page = await electronApp.newWindow()

    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    // Wait for the page to be ready (Electron's renderer, not localhost)
    await page.waitForTimeout(3000)

    await use({ page, electronApp, errors })

    // Close the window (not the whole app since we reuse it)
    await page.close()
  },
})