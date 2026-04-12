import { test as base, chromium } from '@playwright/test'

export { expect }

export const test = base.extend({
  appPage: async ({}, use) => {
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    })
    const context = await browser.newContext()
    const page = await context.newPage()

    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    await use({ page, browser, context, errors })

    await browser.close()
  },
})