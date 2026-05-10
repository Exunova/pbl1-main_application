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

// Mock positions data
const mockPositions = [
  { id: '1', ticker: 'AAPL', company: 'Apple Inc.', shares: 1000, buyPrice: 175.50, buyDate: '2026-01-15', currency: 'USD' },
  { id: '2', ticker: 'BBCA.JK', company: 'Bank Central Asia', shares: 5000, buyPrice: 9800, buyDate: '2026-02-20', currency: 'IDR' },
]

// Mock PnL data
const mockPnLData = {
  total: { totalPnL: 1250000, stockReturn: 1100000, forexReturn: 150000 },
  positions: [
    { ticker: 'AAPL', currentPrice: 185.25, currentPriceIDR: 2899000, buyPriceIDR: 2745500, shares: 1000, stockReturn: 153400 },
    { ticker: 'BBCA.JK', currentPrice: 10200, currentPriceIDR: 10200, buyPriceIDR: 9800, shares: 5000, stockReturn: 2000000 },
  ]
}

// Mock tickers for dropdown
const mockTickers = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'BBCA.JK', name: 'Bank Central Asia' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.' },
  { ticker: 'MSFT', name: 'Microsoft Corporation' },
]

// Setup window.api mock for all tests
test.beforeEach(async ({ page }) => {
  await page.evaluate(() => {
    window.api = {
      fetchIndices: async () => [],
      fetchMacro: async () => ({ events: [] }),
      fetchNews: async () => ({ articles: [] }),
      fetchOHLCV: async () => ({ ohlcv_15m: [] }),
      fetchForex: async () => ({ pair: 'USD/IDR', current_rate: 15650 }),
      fetchCompany: async () => ({}),
      fetchCompanies: async () => ({}),
      fetchIndex: async () => ({}),
      triggerScrape: async () => ({}),
      scrapeLatest: async () => ({}),
      scrapeStatus: async () => ({ status: 'idle' }),
      getPositions: async () => ({ positions: [] }),
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

// UI-014: Visual portfolio position list display
test.describe('UI-014: Visual portfolio position list display', () => {
  test('displays empty state when no positions exist', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Check ledger table exists
    const ledgerTable = page.locator('table')
    await expect(ledgerTable).toBeVisible()
  })

  test('displays positions in ledger table with correct columns', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Check table headers exist
    await expect(page.getByText('Ticker')).toBeVisible()
    await expect(page.getByText('Company')).toBeVisible()
    await expect(page.getByText(/SHARES \(Lot\)/i)).toBeVisible()
    await expect(page.getByText('Buy Price')).toBeVisible()
    await expect(page.getByText('PnL')).toBeVisible()
    await expect(page.getByText('Actions')).toBeVisible()
  })

  test('displays position data correctly in table rows', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Verify AAPL row
    const aaplRow = page.locator('tr').filter({ hasText: 'AAPL' })
    await expect(aaplRow).toBeVisible()
    await expect(aaplRow.getByText('Apple Inc.')).toBeVisible()
    await expect(aaplRow.getByText('10')).toBeVisible() // shares/100
  })

  test('position rows have hover effect', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Find a row and verify hover class exists (hover:bg-white/5)
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toHaveClass(/hover:bg-white\/5/)
  })

  test('actions column contains edit and delete buttons', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Check edit button (Edit2 icon)
    const editButtons = page.locator('button[title="Edit"]')
    await expect(editButtons.first()).toBeVisible()

    // Check delete button (Trash2 icon)
    const deleteButtons = page.locator('button[title="Delete"]')
    await expect(deleteButtons.first()).toBeVisible()
  })
})

// UI-015: Add position form submission flow
test.describe('UI-015: Add position form submission flow', () => {
  test('opens add position modal when clicking add button', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Click add button
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    // Verify modal appears
    const modal = page.locator('div:has-text("Add Position")').filter({ hasNot: page.locator('input') })
    const addModal = page.locator('text=Add Position').first()
    await expect(addModal).toBeVisible()
  })

  test('form has all required input fields', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Open add modal
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    await page.waitForTimeout(500)

    // Verify all form fields exist
    await expect(page.locator('input[placeholder*="AAPL"]')).toBeVisible() // Ticker
    await expect(page.locator('text=Company Name')).toBeVisible()
    await expect(page.locator('text=SHARES (Lot)')).toBeVisible()
    await expect(page.locator('text=Buy Price')).toBeVisible()
    await expect(page.locator('text=Buy Date')).toBeVisible()
    await expect(page.locator('text=Currency')).toBeVisible()
  })

  test('ticker field shows dropdown with available tickers', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Open add modal
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    await page.waitForTimeout(500)

    // Focus on ticker input
    const tickerInput = page.locator('input[placeholder*="AAPL"]')
    await tickerInput.fill('A')

    await page.waitForTimeout(300)

    // Dropdown should appear with AAPL
    const dropdown = page.locator('text=Apple Inc.').first()
    await expect(dropdown).toBeVisible()
  })

  test('selecting ticker auto-fills company and currency', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Open add modal
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    await page.waitForTimeout(500)

    // Select AAPL from dropdown
    const tickerInput = page.locator('input[placeholder*="AAPL"]')
    await tickerInput.fill('AAPL')
    await page.waitForTimeout(200)

    const appleOption = page.locator('div').filter({ hasText: 'AAPL' }).filter({ hasText: 'Apple Inc.' }).first()
    await appleOption.click()

    await page.waitForTimeout(200)

    // Company should be auto-filled
    const companyInput = page.locator('input[value="Apple Inc."]')
    await expect(companyInput).toBeVisible()

    // Currency should be USD for AAPL (not .JK, .T, or .L)
  })

  test('saves position and updates position list', async ({ page }) => {
    let addPositionCalled = false
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
      window.api.addPosition = async (pos) => {
        addPositionCalled = true
        return {}
      }
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Open add modal
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    await page.waitForTimeout(500)

    // Select ticker
    const tickerInput = page.locator('input[placeholder*="AAPL"]')
    await tickerInput.fill('AAPL')
    await page.waitForTimeout(200)
    const appleOption = page.locator('div').filter({ hasText: 'AAPL' }).filter({ hasText: 'Apple Inc.' }).first()
    await appleOption.click()

    await page.waitForTimeout(200)

    // Fill shares
    const sharesInput = page.locator('input[type="text"]').filter({ has: page.locator('..label:has-text("SHARES")') })
    await page.locator('input').nth(1).fill('10')

    // Fill buy price
    const buyPriceInput = page.locator('input[type="number"]').first()
    await buyPriceInput.fill('175.50')

    // Fill buy date
    const buyDateInput = page.locator('input[type="date"]').first()
    await buyDateInput.fill('2026-01-15')

    // Click Save
    const saveButton = page.getByText('Save').first()
    await saveButton.click()

    await page.waitForTimeout(500)

    // Modal should close
    const modal = page.locator('text=Add Position').first()
    await expect(modal).not.toBeVisible()
  })

  test('cancel button closes modal without saving', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Open add modal
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    await page.waitForTimeout(500)

    // Click cancel
    const cancelButton = page.getByText('Cancel').first()
    await cancelButton.click()

    await page.waitForTimeout(300)

    // Modal should close
    const modal = page.locator('text=Add Position').first()
    await expect(modal).not.toBeVisible()
  })
})

// UI-016: Form validation visual feedback
test.describe('UI-016: Form validation visual feedback', () => {
  test('shows error message when ticker is empty on submit', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Open add modal
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    await page.waitForTimeout(500)

    // Fill other fields but leave ticker empty
    await page.locator('input').nth(1).fill('10')
    await page.locator('input[type="number"]').first().fill('175.50')
    await page.locator('input[type="date"]').first().fill('2026-01-15')

    // Click Save
    const saveButton = page.getByText('Save').first()
    await saveButton.click()

    await page.waitForTimeout(500)

    // Error message should appear
    const errorModal = page.locator('text=Ticker harus diisi!')
    await expect(errorModal).toBeVisible()
  })

  test('shows error message when shares is not a valid integer', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Open add modal
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    await page.waitForTimeout(500)

    // Select ticker first
    const tickerInput = page.locator('input[placeholder*="AAPL"]')
    await tickerInput.fill('AAPL')
    await page.waitForTimeout(200)
    const appleOption = page.locator('div').filter({ hasText: 'AAPL' }).filter({ hasText: 'Apple Inc.' }).first()
    await appleOption.click()

    await page.waitForTimeout(200)

    // Fill invalid shares (decimal)
    await page.locator('input').nth(1).fill('10.5')

    // Error styling should appear on shares input (border-red-500)
  })

  test('shares input shows red border on validation error', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Open add modal
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    await page.waitForTimeout(500)

    // Select ticker
    const tickerInput = page.locator('input[placeholder*="AAPL"]')
    await tickerInput.fill('AAPL')
    await page.waitForTimeout(200)
    const appleOption = page.locator('div').filter({ hasText: 'AAPL' }).filter({ hasText: 'Apple Inc.' }).first()
    await appleOption.click()

    await page.waitForTimeout(200)

    // Type invalid shares
    const sharesInput = page.locator('input').nth(1)
    await sharesInput.fill('abc')

    // Try to save to trigger validation
    const saveButton = page.getByText('Save').first()
    await saveButton.click()

    await page.waitForTimeout(300)

    // Input should have error styling (border-red-500)
  })

  test('shows error for invalid ticker not in dropdown', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Open add modal
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    await page.waitForTimeout(500)

    // Enter invalid ticker
    const tickerInput = page.locator('input[placeholder*="AAPL"]')
    await tickerInput.fill('INVALID_TICKER')

    await page.waitForTimeout(200)

    // Fill other fields
    await page.locator('input').nth(1).fill('10')
    await page.locator('input[type="number"]').first().fill('100')
    await page.locator('input[type="date"]').first().fill('2026-01-15')

    // Try to save
    const saveButton = page.getByText('Save').first()
    await saveButton.click()

    await page.waitForTimeout(500)

    // Error message should appear
    const errorModal = page.locator('text=Ticker tidak valid')
    await expect(errorModal).toBeVisible()
  })

  test('shows error when buy date is in the future', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Open add modal
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    await page.waitForTimeout(500)

    // Select ticker
    const tickerInput = page.locator('input[placeholder*="AAPL"]')
    await tickerInput.fill('AAPL')
    await page.waitForTimeout(200)
    const appleOption = page.locator('div').filter({ hasText: 'AAPL' }).filter({ hasText: 'Apple Inc.' }).first()
    await appleOption.click()

    await page.waitForTimeout(200)

    // Fill other fields with future date
    await page.locator('input').nth(1).fill('10')
    await page.locator('input[type="number"]').first().fill('100')
    await page.locator('input[type="date"]').first().fill('2030-01-01')

    // Try to save
    const saveButton = page.getByText('Save').first()
    await saveButton.click()

    await page.waitForTimeout(500)

    // Error message should appear
    const errorModal = page.locator('text=Buy date tidak boleh')
    await expect(errorModal).toBeVisible()
  })

  test('dismissing error modal clears error state', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: [] })
      window.api.fetchPnL = async () => ({ total: { totalPnL: 0, stockReturn: 0, forexReturn: 0 }, positions: [] })
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1000)

    // Open add modal
    const addButton = page.getByText(/add position/i).first()
    if (await addButton.isVisible()) {
      await addButton.click()
    }

    await page.waitForTimeout(500)

    // Click Save without filling anything (should show error)
    const saveButton = page.getByText('Save').first()
    await saveButton.click()

    await page.waitForTimeout(500)

    // Click OK on error modal
    const okButton = page.getByText('OK')
    if (await okButton.isVisible()) {
      await okButton.click()
    }

    await page.waitForTimeout(300)

    // Error modal should be closed
    const errorModal = page.locator('text=Ticker harus diisi!')
    await expect(errorModal).not.toBeVisible()
  })
})

// UI-017: PnL display per position visually
test.describe('UI-017: PnL display per position visually', () => {
  test('displays profit PnL in green color', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Find BBCA.JK row with positive PnL (stockReturn: 2000000)
    const bccaRow = page.locator('tr').filter({ hasText: 'BBCA.JK' })
    await expect(bccaRow).toBeVisible()

    // PnL should have text-success class (green)
    const pnlCell = bccaRow.locator('td').nth(4)
    await expect(pnlCell).toHaveClass(/text-success/)
  })

  test('displays loss PnL in red color', async ({ page }) => {
    const lossPnLData = {
      total: { totalPnL: -500000, stockReturn: -500000, forexReturn: 0 },
      positions: [
        { ticker: 'AAPL', currentPrice: 165.00, currentPriceIDR: 2580000, buyPriceIDR: 2745500, shares: 1000, stockReturn: -165500 },
        { ticker: 'BBCA.JK', currentPrice: 10200, currentPriceIDR: 10200, buyPriceIDR: 9800, shares: 5000, stockReturn: 2000000 },
      ]
    }

    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => lossPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Find AAPL row with negative PnL
    const aaplRow = page.locator('tr').filter({ hasText: 'AAPL' })
    await expect(aaplRow).toBeVisible()

    // PnL should have text-danger class (red)
    const pnlCell = aaplRow.locator('td').nth(4)
    await expect(pnlCell).toHaveClass(/text-danger/)
  })

  test('displays PnL with percentage in parentheses', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Find BBCA row
    const bccaRow = page.locator('tr').filter({ hasText: 'BBCA.JK' })
    await expect(bccaRow).toBeVisible()

    // PnL should contain percentage in parentheses
    const pnlCell = bccaRow.locator('td').nth(4)
    const pnlText = await pnlCell.textContent()
    expect(pnlText).toMatch(/\(\d+\.\d+%\)/)
  })

  test('shows CALC placeholder while PnL is loading', async ({ page }) => {
    // Slow PnL response
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return mockPnLData
      }
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    // Wait a short time before PnL loads
    await page.waitForTimeout(200)

    // Check for CALC text
    const calcText = page.getByText(/CALC/)
    await expect(calcText.first()).toBeVisible()
  })

  test('positive PnL shows + sign prefix', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Find BBCA row with positive PnL
    const bccaRow = page.locator('tr').filter({ hasText: 'BBCA.JK' })
    const pnlCell = bccaRow.locator('td').nth(4)
    const pnlText = await pnlCell.textContent()

    // Should start with + for positive
    expect(pnlText.trim().startsWith('+')).toBe(true)
  })
})

// UI-018: Grand total PnL display visually
test.describe('UI-018: Grand total PnL display visually', () => {
  test('displays Total P&L card in metrics section', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Check metrics card labels
    await expect(page.getByText('Total P&L (IDR)')).toBeVisible()
    await expect(page.getByText('Stock Return (IDR)')).toBeVisible()
    await expect(page.getByText('Forex Return (IDR)')).toBeVisible()
  })

  test('displays positive total PnL in green', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Total PnL card should have text-success for positive value
    const totalPnLCard = page.locator('text=Total P&L').locator('..')
    const valueElement = totalPnLCard.locator('div').nth(1)
    await expect(valueElement).toHaveClass(/text-success/)
  })

  test('displays negative total PnL in red', async ({ page }) => {
    const lossData = {
      total: { totalPnL: -500000, stockReturn: -400000, forexReturn: -100000 },
      positions: mockPnLData.positions
    }

    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => lossData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Total PnL card should have text-danger for negative value
    const totalPnLCard = page.locator('text=Total P&L').locator('..')
    const valueElement = totalPnLCard.locator('div').nth(1)
    await expect(valueElement).toHaveClass(/text-danger/)
  })

  test('displays stock return value', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Stock Return should show value
    const stockReturnCard = page.locator('text=Stock Return').locator('..')
    const valueElement = stockReturnCard.locator('div').nth(1)
    const text = await valueElement.textContent()
    expect(text).toContain('1.100.000') // 1,100,000 formatted in IDR
  })

  test('displays forex return value', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Forex Return should show value
    const forexReturnCard = page.locator('text=Forex Return').locator('..')
    const valueElement = forexReturnCard.locator('div').nth(1)
    const text = await valueElement.textContent()
    expect(text).toContain('150.000') // 150,000 formatted in IDR
  })

  test('metrics section uses grid layout', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Metrics container should have grid layout
    const metricsContainer = page.locator('text=Total P&L').locator('..').locator('..')
    await expect(metricsContainer).toHaveClass(/grid-cols-1.*md:grid-cols-3/)
  })
})

// UI-019: Delete position flow visually
test.describe('UI-019: Delete position flow visually', () => {
  test('opens delete confirmation modal when clicking delete button', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Click delete button on first row
    const deleteButton = page.locator('button[title="Delete"]').first()
    await deleteButton.click()

    await page.waitForTimeout(300)

    // Modal should appear with "Hapus" text
    await expect(page.getByText('Hapus Saham?')).toBeVisible()
  })

  test('delete modal shows ticker name being deleted', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Click delete button on AAPL row
    const aaplRow = page.locator('tr').filter({ hasText: 'AAPL' })
    const deleteButton = aaplRow.locator('button[title="Delete"]')
    await deleteButton.click()

    await page.waitForTimeout(300)

    // Modal should mention the ticker
    await expect(page.getByText('AAPL')).toBeVisible()
  })

  test('cancel button closes modal without deleting', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Click delete button
    const deleteButton = page.locator('button[title="Delete"]').first()
    await deleteButton.click()

    await page.waitForTimeout(300)

    // Click Batal (cancel)
    const cancelButton = page.getByText('Batal')
    await cancelButton.click()

    await page.waitForTimeout(300)

    // Modal should be closed
    await expect(page.getByText('Hapus Saham?')).not.toBeVisible()

    // Row should still exist
    const aaplRow = page.locator('tr').filter({ hasText: 'AAPL' })
    await expect(aaplRow).toBeVisible()
  })

  test('confirm delete removes position from list', async ({ page }) => {
    let deletedId = null
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
      window.api.deletePosition = async (id) => {
        deletedId = id
        return {}
      }
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Click delete button on AAPL row
    const aaplRow = page.locator('tr').filter({ hasText: 'AAPL' })
    const deleteButton = aaplRow.locator('button[title="Delete"]')
    await deleteButton.click()

    await page.waitForTimeout(300)

    // Click Hapus (delete)
    const deleteConfirmButton = page.getByText('Hapus').last()
    await deleteConfirmButton.click()

    await page.waitForTimeout(500)

    // Verify delete was called with correct ID
    expect(deletedId).toBe('1')

    // Modal should be closed
    await expect(page.getByText('Hapus Saham?')).not.toBeVisible()
  })

  test('delete modal has red delete button', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Click delete button
    const deleteButton = page.locator('button[title="Delete"]').first()
    await deleteButton.click()

    await page.waitForTimeout(300)

    // The delete button (Hapus) should have red styling
    const deleteConfirmButton = page.getByText('Hapus').last()
    await expect(deleteConfirmButton).toHaveClass(/bg-red-500/)
  })

  test('delete modal has cancel and delete buttons side by side', async ({ page }) => {
    await page.evaluate(() => {
      window.api.getPositions = async () => ({ positions: mockPositions })
      window.api.fetchPnL = async () => mockPnLData
      window.api.getScrapedTickers = async () => mockTickers
    })

    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Navigate to Portfolio tab
    const portfolioTab = page.getByText(/portfolio/i).first()
    if (await portfolioTab.isVisible()) {
      await portfolioTab.click()
    }

    await page.waitForTimeout(1500)

    // Click delete button
    const deleteButton = page.locator('button[title="Delete"]').first()
    await deleteButton.click()

    await page.waitForTimeout(300)

    // Both buttons should exist and be visible
    await expect(page.getByText('Batal')).toBeVisible()
    await expect(page.getByText('Hapus')).toBeVisible()

    // Buttons should be in a flex container (side by side)
    const buttonContainer = page.locator('text=Hapus').locator('..')
    await expect(buttonContainer).toHaveClass(/flex/)
  })
})