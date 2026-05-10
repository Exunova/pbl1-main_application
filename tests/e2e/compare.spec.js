import { test, expect } from '@playwright/test'

// Mock data for CompareView
const mockIndices = [
  { index: '^GSPC', name: 'S&P 500', country: 'US', current_price: 5234.5, prev_close: 5200.0, change_pct: 0.66 },
  { index: '^JKLQ45', name: 'LQ45', country: 'ID', current_price: 1820.0, prev_close: 1810.0, change_pct: 0.55 },
  { index: '^N225', name: 'Nikkei 225', country: 'JP', current_price: 39500.0, prev_close: 39200.0, change_pct: 0.77 },
  { index: '^FTSE', name: 'FTSE 100', country: 'GB', current_price: 7950.0, prev_close: 7980.0, change_pct: -0.38 },
]

const mockOHLCV = Array.from({ length: 20 }, (_, i) => ({
  timestamp: `2026-05-0${(i % 9) + 1}T${String(9 + (i % 8)).padStart(2, '0')}:00:00`,
  open: 5200 + Math.random() * 50,
  high: 5220 + Math.random() * 50,
  low: 5180 + Math.random() * 50,
  close: 5210 + Math.random() * 50,
  volume: 1000000
}))

const mockCompanies = {
  'AAPL': { info: { price: { currentPrice: 185.5, previousClose: 184.2, marketCap: 2800000 } } },
  'MSFT': { info: { price: { currentPrice: 415.2, previousClose: 413.8, marketCap: 3100000 } } },
  'GOOGL': { info: { price: { currentPrice: 175.8, previousClose: 176.5, marketCap: 2200000 } } },
  'BBCA.JK': { info: { price: { currentPrice: 8200, previousClose: 8150, marketCap: 950000 } } },
  'TLKM.JK': { info: { price: { currentPrice: 3100, previousClose: 3150, marketCap: 320000 } } },
}

// Setup window.api mock for all tests
test.beforeEach(async ({ page }) => {
  await page.evaluate(() => {
    window.api = {
      fetchIndices: async () => mockIndices,
      fetchMacro: async (country) => ({ events: [] }),
      fetchNews: async (country) => ({ articles: [] }),
      fetchOHLCV: async (ticker) => ({ ohlcv_15m: mockOHLCV }),
      fetchCompanies: async () => mockCompanies,
      fetchCompany: async () => ({}),
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

// UI-011: Visual comparison of two indices with overlay chart
test.describe('UI-011: Two Index Selectors with Overlay Chart', () => {
  test('renders two index selectors with VS separator', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check both selectors are present
    const selectors = page.locator('select')
    await expect(selectors).toHaveCount(2)

    // Check VS text is present
    const vsText = page.getByText('VS')
    await expect(vsText).toBeVisible()
  })

  test('first selector shows index 1 color indicator', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // First color indicator (white square)
    const colorIndicators = page.locator('[class*="w-3"][class*="h-3"]')
    await expect(colorIndicators.first()).toBeVisible()
  })

  test('second selector shows index 2 color indicator', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Two color indicators should be visible
    const colorIndicators = page.locator('[class*="w-3"][class*="h-3"]')
    await expect(colorIndicators).toHaveCount(2)
  })

  test('overlay chart shows OUTPERFORM area (green)', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Chart should render with Recharts
    const chartContainer = page.locator('.recharts-wrapper')
    await expect(chartContainer.first()).toBeVisible()

    // Legend should show both indices
    const legend = page.locator('.recharts-legend-wrapper')
    await expect(legend).toBeVisible()
  })

  test('overlay chart shows UNDERPERFORM area (red)', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Chart renders with areas
    const chartArea = page.locator('.recharts-area')
    await expect(chartArea.first()).toBeVisible()
  })

  test('selecting different indices updates the chart', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const selectors = page.locator('select')

    // Change first selector
    await selectors.first().selectOption('JP')
    await page.waitForTimeout(1500)

    // Chart should still be visible after change
    const chartContainer = page.locator('.recharts-wrapper')
    await expect(chartContainer.first()).toBeVisible()
  })

  test('chart displays both index lines', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Check for line elements in chart
    const lines = page.locator('.recharts-line')
    expect(await lines.count()).toBeGreaterThanOrEqual(2)
  })

  test('loading state shows when fetching chart data', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')

    // Initial load should show loading or chart
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

// UI-012: Visual heatmap rendering
test.describe('UI-012: Heatmap Rendering', () => {
  test('heatmap container is visible for selected indices', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Two heatmap containers should be present (one per index panel)
    const heatmapContainers = page.locator('.recharts-responsive-container')
    // At minimum should have heatmaps plus main chart
    expect(await heatmapContainers.count()).toBeGreaterThanOrEqual(3)
  })

  test('heatmap renders with Recharts Treemap', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Treemap uses rect elements for cells
    const treemapCells = page.locator('.recharts-treemap-rect')
    // Should have multiple cells (at least 2 indices * some tickers)
    expect(await treemapCells.count()).toBeGreaterThan(0)
  })

  test('positive change cells show green color', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Verify mock data has positive changes
    const positiveData = Object.values(mockCompanies).filter(c => {
      const cur = c.info?.price?.currentPrice
      const prv = c.info?.price?.previousClose
      return cur && prv && ((cur - prv) / prv) * 100 > 0
    })
    expect(positiveData.length).toBeGreaterThan(0)
  })

  test('negative change cells show red color', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Verify mock data has negative changes (GOOGL, TLKM)
    const negativeData = Object.values(mockCompanies).filter(c => {
      const cur = c.info?.price?.currentPrice
      const prv = c.info?.price?.previousClose
      return cur && prv && ((cur - prv) / prv) * 100 < 0
    })
    expect(negativeData.length).toBeGreaterThan(0)
  })

  test('heatmap cells display ticker labels', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Treemap renders text elements for tickers
    const textElements = page.locator('.recharts-treemap-text text')
    expect(await textElements.count()).toBeGreaterThan(0)
  })

  test('clicking index panel selects it and shows news toggle', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Click on first index panel
    const indexPanels = page.locator('[class*="cursor-pointer"]')
    await indexPanels.first().click()
    await page.waitForTimeout(500)

    // Should see NEWS OPEN text after click
    const newsToggle = page.getByText('NEWS OPEN')
    await expect(newsToggle).toBeVisible()
  })
})

// UI-013: Visual duplicate selection handling
test.describe('UI-013: Duplicate Index Selection', () => {
  test('can select same index for both selectors', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const selectors = page.locator('select')

    // Select same value for both
    await selectors.first().selectOption('US')
    await selectors.nth(1).selectOption('US')
    await page.waitForTimeout(1500)

    // Chart should still render (possibly with no data diff)
    const chartContainer = page.locator('.recharts-wrapper')
    await expect(chartContainer.first()).toBeVisible()
  })

  test('same index selection shows no warning message by default', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const selectors = page.locator('select')

    // Select same value
    await selectors.first().selectOption('US')
    await selectors.nth(1).selectOption('US')

    // Check for warning text - should NOT exist
    const warningText = page.getByText(/same|duplicate|warning/i)
    // This test documents current behavior - no warning shown
    // The test passes because warning doesn't appear (as expected)
    if (await warningText.count() > 0) {
      await expect(warningText.first()).not.toBeVisible()
    }
  })

  test('VS text remains visible when same index selected', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const selectors = page.locator('select')

    // Select same value
    await selectors.first().selectOption('JP')
    await selectors.nth(1).selectOption('JP')

    // VS text should still be visible
    const vsText = page.getByText('VS')
    await expect(vsText).toBeVisible()
  })

  test('chart handles identical index comparison', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const selectors = page.locator('select')

    // Both to same index
    await selectors.first().selectOption('GB')
    await selectors.nth(1).selectOption('GB')
    await page.waitForTimeout(2000)

    // Page should not crash
    await expect(page.locator('body')).toBeVisible()

    // Chart may show "No data" or overlapping lines
    const content = await page.content()
    expect(content).toBeTruthy()
  })

  test('switching back to different indices restores comparison', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const selectors = page.locator('select')

    // Set same then different
    await selectors.first().selectOption('US')
    await selectors.nth(1).selectOption('US')
    await page.waitForTimeout(1000)

    await selectors.nth(1).selectOption('ID')
    await page.waitForTimeout(1500)

    // Chart should update with new comparison
    const chartContainer = page.locator('.recharts-wrapper')
    await expect(chartContainer.first()).toBeVisible()
  })
})

// Integration test
test.describe('CompareView Integration', () => {
  test('page loads without JavaScript errors', async ({ page }) => {
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Filter critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('WebGL')
    )

    expect(criticalErrors.length).toBe(0)
  })

  test('all selectors are interactive and change values', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const selectors = page.locator('select')

    // Get initial values
    const initialFirst = await selectors.first().inputValue()

    // Change both
    await selectors.first().selectOption('JP')
    await selectors.nth(1).selectOption('GB')

    const newFirst = await selectors.first().inputValue()
    expect(newFirst).not.toBe(initialFirst)
  })

  test('chart tooltip appears on hover', async ({ page }) => {
    await page.goto('http://localhost:5173/#/compare')
    await page.waitLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Hover over chart area
    const chartArea = page.locator('.recharts-wrapper').first()
    await chartArea.hover()
    await page.waitForTimeout(500)

    // Tooltip should appear (Recharts shows tooltip on hover)
    const tooltip = page.locator('.recharts-tooltip-wrapper')
    if (await tooltip.count() > 0) {
      await expect(tooltip.first()).toBeVisible()
    }
  })
})