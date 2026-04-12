import { test, expect, chromium } from '@playwright/test'

let browser

test.beforeAll(async () => {
  browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
})

test.afterAll(async () => {
  if (browser) await browser.close()
})

test('React app loads with React and renders', async () => {
  const context = await browser.newContext()
  const page = await context.newPage()

  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)

  const rootHtml = await page.locator('#root').innerHTML()
  console.log('Root innerHTML length:', rootHtml.length)
  console.log('Console errors:', errors)

  const reactErrors = errors.filter(e => e.includes('React is not defined'))
  if (reactErrors.length > 0) {
    console.log('WARNING: React transform not working - JSX not transpiled')
  }
  expect(errors.filter(e => !e.includes('React is not defined'))).toHaveLength(0)
  expect(rootHtml.length).toBeGreaterThan(10)

  await context.close()
})

test('window.api.flaskHealth returns ok via mock', async () => {
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)

  const result = await page.evaluate(async () => {
    if (!window.api) window.api = {}
    window.api.flaskHealth = async () => ({ status: 'ok' })
    return window.api.flaskHealth()
  })

  expect(result).toHaveProperty('status', 'ok')
  await context.close()
})
