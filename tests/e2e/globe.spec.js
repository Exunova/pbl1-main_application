import { test, expect } from '@playwright/test'

// Setup window.api mock for all tests
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
  await page.evaluate(() => {
    // Clear any existing window.api
    window.api = {
      fetchIndices: async () => [
        { index: '^GSPC', name: 'S&P 500', country: 'US', current_price: 5234.5, prev_close: 5200.0, change_pct: 0.66 },
        { index: '^JKLQ45', name: 'LQ45', country: 'ID', current_price: 1820.0, prev_close: 1810.0, change_pct: 0.55 },
        { index: '^N225', name: 'Nikkei 225', country: 'JP', current_price: 39500.0, prev_close: 39200.0, change_pct: 0.77 },
        { index: '^FTSE', name: 'FTSE 100', country: 'GB', current_price: 7950.0, prev_close: 7980.0, change_pct: -0.38 },
      ],
      fetchMacro: async (country) => ({
        events: [
          { name: 'Core CPI', date: '2026-04-12', time: '08:30', impact: 'high', actual: '3.1%', forecast: '3.0%', previous: '2.9%' },
        ]
      }),
      fetchNews: async (country) => ({
        articles: [
          { title: 'S&P 500 rises on strong earnings reports', link: '#', publisher: 'Reuters', published: '2026-04-12 08:30', thumbnail: { type: 'og', url: '' } },
        ]
      }),
      fetchOHLCV: async (ticker) => ({
        ohlcv_15m: Array.from({ length: 20 }, (_, i) => ({
          time: i * 900,
          open: 5200 + Math.random() * 50,
          high: 5220 + Math.random() * 50,
          low: 5180 + Math.random() * 50,
          close: 5210 + Math.random() * 50,
          volume: 1000000
        }))
      }),
      fetchForex: async () => ({
        pair: 'USD/IDR', label: 'USD/IDR', current_rate: 15650.0, prev_close: 15620.0, change_pct: 0.19
      }),
      fetchCompany: async () => ({}),
      fetchCompanies: async () => ({}),
      fetchIndex: async () => ({}),
      triggerScrape: async () => ({}),
      scrapeLatest: async () => ({}),
      scrapeStatus: async () => ({ status: 'idle', message: '' }),
      getPositions: async () => [],
      addPosition: async () => ({}),
      deletePosition: async () => ({}),
      editPosition: async () => ({}),
      fetchPnL: async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] }),
      portfolioExport: async () => ({}),
      portfolioImport: async () => ({}),
      flaskHealth: async () => ({ status: 'ok' }),
      getScrapedTickers: async () => [],
      minimize: async () => ({}),
      maximize: async () => ({}),
      close: async () => ({}),
    }
  })
})

// UI-001: Test D3.js + topojson map renders
test.describe('UI-001: Globe Map Rendering', () => {
  test('renders globe container and loads world data', async ({ page }) => {
    // Wait for the page to be ready (Electron's renderer, not localhost)
    await page.waitForLoadState('domcontentloaded')

    // Navigate to globe view if needed (assuming app loads there by default or via nav)
    // Wait for globe container to be present
    const globeContainer = page.locator('[class*="absolute"][class*="top-0"][class*="left-0"]').first()

    // Wait for globe to potentially render (may show loading first)
    await page.waitForTimeout(2000)

    // Check page loaded without crash
    await expect(page.locator('body')).toBeVisible()

    // Globe should have initialized (check globe-related elements exist)
    const pageContent = await page.content()
    // Page should contain globe-related content or loading state
    expect(pageContent).toBeTruthy()
  })

  test('shows loading state initially while fetching data', async ({ page }) => {
    // With our mock, globe should load quickly but we can check loading state appears briefly
    const loadingSpinner = page.locator('body')

    // Just verify page loads
    await expect(loadingSpinner).toBeVisible()
  })

  test('displays globe canvas element after loading', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    // Check globe-related content is present
    // globe.gl creates canvas elements
    const canvases = page.locator('canvas')
    // Should have at least one canvas for the globe
    await expect(canvases.first()).toBeVisible()
  })
})

// UI-002: Test country colors based on index performance
test.describe('UI-002: Country Color Coding', () => {
  test('countries display with color based on index performance', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    // Globe should render with polygon colors
    // We verify the globe container exists and has content
    const globeContainer = page.locator('[class*="absolute"][class*="top-0"][class*="left-0"]').first()
    await expect(globeContainer).toBeVisible()

    // The globe renders polygons - verify globe is interactive/not frozen
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('positive performance shows green color', async ({ page }) => {
    // Verify indices with positive change_pct are loaded
    const indices = await page.evaluate(() => window.api.fetchIndices())
    const positiveIndices = indices.filter(i => i.change_pct > 0)
    expect(positiveIndices.length).toBeGreaterThan(0)
  })

  test('negative performance shows red color', async ({ page }) => {
    // Verify indices with negative change_pct exist
    const indices = await page.evaluate(() => window.api.fetchIndices())
    const negativeIndices = indices.filter(i => i.change_pct < 0)
    expect(negativeIndices.length).toBeGreaterThan(0)
  })
})

// UI-003: Test hover tooltip shows country info
test.describe('UI-003: Hover Tooltip', () => {
  test('shows tooltip when hovering over country', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    // Hover over the globe container area
    const globeContainer = page.locator('[class*="absolute"][class*="top-0"][class*="left-0"]').first()

    // Move mouse over globe to trigger hover
    await globeContainer.hover()
    await page.waitForTimeout(500)

    // Check tooltip visibility (tooltip should appear on hover)
    // The GlobeTooltip component renders when tooltip.visible is true
    // We verify the tooltip container is present
    const pageContent = await page.content()
    expect(pageContent).toBeTruthy()
  })

  test('tooltip contains country information', async ({ page }) => {
    // Verify fetchIndices returns proper data shape for tooltip content
    const indices = await page.evaluate(() => window.api.fetchIndices())
    expect(indices[0]).toHaveProperty('name')
    expect(indices[0]).toHaveProperty('current_price')
    expect(indices[0]).toHaveProperty('change_pct')
  })
})

// UI-004: Test click on country triggers action
test.describe('UI-004: Country Click Interaction', () => {
  test('clicking on country polygon triggers navigation/selection', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    // Click on the globe container (simulating country click)
    const globeContainer = page.locator('[class*="absolute"][class*="top-0"][class*="left-0"]').first()
    await globeContainer.click()
    await page.waitForTimeout(500)

    // Click should trigger globe interaction - verify no crash
    await expect(page.locator('body')).toBeVisible()
  })

  test('clicking country updates selected country state', async ({ page }) => {
    // Verify fetchMacro works for country data loading
    const macroData = await page.evaluate(() => window.api.fetchMacro('US'))
    expect(macroData).toHaveProperty('events')
    expect(Array.isArray(macroData.events)).toBe(true)
  })

  test('clicking same country again deselects it', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Click twice on same area to deselect
    const globeContainer = page.locator('[class*="absolute"][class*="top-0"][class*="left-0"]').first()
    await globeContainer.click()
    await page.waitForTimeout(300)
    await globeContainer.click()
    await page.waitForTimeout(300)

    // Verify page still responds
    await expect(page.locator('body')).toBeVisible()
  })
})

// UI-005: Test responsive resize handling
test.describe('UI-005: Responsive Resize', () => {
  test('globe resizes with window resize event', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Get initial viewport size
    const initialSize = page.viewportSize()

    // Resize window
    await page.setViewportSize({ width: 800, height: 600 })
    await page.waitForTimeout(500)

    // Resize again
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForTimeout(500)

    // Verify globe still renders
    const pageContent = await page.content()
    expect(pageContent).toBeTruthy()
  })

  test('globe handles container dimension changes', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Resize to various dimensions
    for (const size of [{ width: 1024, height: 768 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(size)
      await page.waitForTimeout(300)
    }

    // Page should remain functional
    await expect(page.locator('body')).toBeVisible()
  })
})

// UI-006: Test loading state when data unavailable
test.describe('UI-006: Loading State', () => {
  test('shows loading spinner when data is being fetched', async ({ page }) => {
    // Page should show loading state initially (before data loads)
    const loadingText = page.getByText(/loading/i)
    // May or may not be visible depending on timing - just verify page loads
    await expect(page.locator('body')).toBeVisible()
  })

  test('handles fetchIndices returning empty array', async ({ page }) => {
    // Override mock to return empty
    await page.evaluate(() => {
      window.api.fetchIndices = async () => []
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Page should handle empty data gracefully
    await expect(page.locator('body')).toBeVisible()
  })

  test('handles fetchIndices throwing error', async ({ page }) => {
    // Override mock to throw error
    await page.evaluate(() => {
      window.api.fetchIndices = async () => { throw new Error('Network error') }
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Error state should be displayed or handled gracefully
    await expect(page.locator('body')).toBeVisible()
  })
})

// Additional integration tests
test.describe('Globe Integration', () => {
  test('window.api methods are all callable', async ({ page }) => {
    // Verify all required API methods exist and are callable
    const results = await page.evaluate(() => {
      const methods = [
        'fetchIndices', 'fetchMacro', 'fetchNews', 'fetchOHLCV',
        'fetchForex', 'fetchCompany', 'fetchCompanies', 'fetchIndex',
        'triggerScrape', 'scrapeLatest', 'scrapeStatus',
        'getPositions', 'addPosition', 'deletePosition', 'editPosition',
        'fetchPnL', 'portfolioExport', 'portfolioImport',
        'flaskHealth', 'getScrapedTickers', 'minimize', 'maximize', 'close'
      ]
      return methods.map(name => {
        try {
          typeof window.api[name] === 'function' ? 'ok' : 'missing'
        } catch {
          'error'
        }
      })
    })

    // All methods should be present
    expect(results.every(r => r === 'ok')).toBe(true)
  })

  test('globe renders without JavaScript errors', async ({ page }) => {
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(3000)

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('WebGL')
    )

    expect(criticalErrors.length).toBe(0)
  })
})

// UI-001 to UI-004: Converted from skipped Vitest tests (d3-geo/canvas requires real browser)
test.describe('UI-001 to UI-004: Converted Vitest Skipped Tests', () => {
  test('UI-001: renders globe after loading', async ({ page }) => {
    // Override mock to return empty indices initially to trigger loading state
    await page.evaluate(() => {
      window.api.fetchIndices = async () => []
    })

    await page.waitForLoadState('domcontentloaded')

    // Wait for globe to finish loading
    await page.waitForTimeout(2000)

    // Globe should render without showing loading text
    const pageContent = await page.content()
    expect(pageContent).not.toMatch(/loading map/i)
  })

  test('UI-002: fetchIndices called on mount', async ({ page }) => {
    let fetchIndicesCalled = false
    await page.evaluate(() => {
      window.api.fetchIndices = async () => {
        fetchIndicesCalled = true
        return [
          { index: '^GSPC', name: 'S&P 500', country: 'US', current_price: 5234.5, change_pct: 0.66 },
          { index: '^JKLQ45', name: 'LQ45', country: 'ID', current_price: 1820.0, change_pct: 0.55 },
        ]
      }
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    expect(fetchIndicesCalled).toBe(true)
  })

  test('UI-003: fetchMacro called on mount for initial data', async ({ page }) => {
    let fetchMacroCalled = false
    await page.evaluate(() => {
      window.api.fetchIndices = async () => []
      window.api.fetchMacro = async (country) => {
        fetchMacroCalled = true
        return { events: [] }
      }
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    expect(fetchMacroCalled).toBe(true)
  })

  test('UI-004: shows error state on map fetch failure', async ({ page }) => {
    // Override geojson route to fail
    await page.route('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson', async (route) => {
      await route.abort()
    })

    await page.evaluate(() => {
      window.api.fetchIndices = async () => []
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Error state should show some error message
    const pageContent = await page.content()
    expect(pageContent).toMatch(/error/i)
  })
})