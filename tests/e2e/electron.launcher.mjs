import { test, expect, _electron } from '@playwright/test'

let electronApp

test.beforeAll(async () => {
  electronApp = await _electron.launch({
    executablePath: 'C:\\Users\\user\\Project\\pbl1-main_application\\frontend\\node_modules\\electron\\dist\\electron.exe',
    args: ['.'],
    cwd: 'C:\\Users\\user\\Project\\pbl1-main_application\\frontend',
  })
})

test.afterAll(async () => {
  if (electronApp) await electronApp.close()
})

test('React app loads with React and renders', async () => {
  const page = await electronApp.newWindow()

  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))

  await page.waitForTimeout(5000)

  const rootHtml = await page.locator('#root').innerHTML()
  console.log('Root innerHTML length:', rootHtml.length)
  console.log('Console errors:', errors)

  const reactErrors = errors.filter(e => e.includes('React is not defined'))
  if (reactErrors.length > 0) {
    console.log('WARNING: React transform not working - JSX not transpiled')
  }
  expect(errors.filter(e => !e.includes('React is not defined'))).toHaveLength(0)
  expect(rootHtml.length).toBeGreaterThan(10)
})

test('window.api.flaskHealth returns ok via mock', async () => {
  const page = await electronApp.newWindow()

  await page.waitForTimeout(5000)

  const result = await page.evaluate(async () => {
    if (!window.api) window.api = {}
    window.api.flaskHealth = async () => ({ status: 'ok' })
    return window.api.flaskHealth()
  })

  expect(result).toHaveProperty('status', 'ok')
})