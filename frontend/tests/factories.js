/**
 * Test Factory Functions for Vitest Component Testing
 *
 * Provides consistent mock data builders for common test scenarios.
 * Use these factories instead of inline mock objects in tests.
 */

import { MARKETS } from '../../src/data/mockData.js'

/**
 * Economic Calendar Event Factory
 */
export function createMockEvent(overrides = {}) {
  return {
    name: 'Core CPI',
    date: '2026-04-12',
    time: '08:30',
    impact: 'high',
    actual: '3.1%',
    forecast: '3.0%',
    previous: '2.9%',
    ...overrides,
  }
}

export function createMockEvents(count = 3, impact = 'high') {
  return Array.from({ length: count }, (_, i) =>
    createMockEvent({
      name: `Event ${i + 1}`,
      date: `2026-04-${12 + i}`.padStart(10, '0'),
      time: `${8 + i}:30`,
      impact,
    })
  )
}

/**
 * Macro News Article Factory
 */
export function createMockArticle(overrides = {}) {
  return {
    title: 'S&P 500 rises on strong earnings',
    link: 'https://example.com/article',
    publisher: 'Reuters',
    published: '2026-04-12 08:30',
    thumbnail: null,
    ...overrides,
  }
}

export function createMockArticles(count = 2) {
  return Array.from({ length: count }, (_, i) =>
    createMockArticle({
      title: `Article ${i + 1}`,
      publisher: i === 0 ? 'Reuters' : 'Bloomberg',
    })
  )
}

/**
 * OHLCV Candlestick Data Factory
 */
export function createMockCandle(overrides = {}) {
  return {
    timestamp: '2026-04-12 09:00',
    open: 100,
    close: 105,
    high: 110,
    low: 98,
    ...overrides,
  }
}

export function createMockCandles(count = 5, startPrice = 100) {
  return Array.from({ length: count }, (_, i) => {
    const open = startPrice + i * 5
    const close = open + (i % 2 === 0 ? 5 : -3)
    return createMockCandle({
      timestamp: `2026-04-12 09:${String(i * 15).padStart(2, '0')}`,
      open,
      close,
      high: open + 10,
      low: open - 5,
    })
  })
}

/**
 * Forex Data Factory
 */
export function createMockForex(overrides = {}) {
  return {
    pair: 'IDR_USD',
    label: 'USD/IDR',
    current_rate: 15650.0,
    change_pct: 0.0019,
    ...overrides,
  }
}

export function createMockForexPairs(pairs = ['IDR_USD', 'JPY_USD', 'GBP_USD']) {
  const rates = {
    IDR_USD: { label: 'USD/IDR', rate: 15650.0, change: 0.0019 },
    JPY_USD: { label: 'USD/JPY', rate: 149.5, change: -0.002 },
    GBP_USD: { label: 'GBP/USD', rate: 0.79, change: 0.0013 },
  }
  return pairs.map(pair => createMockForex({
    pair,
    label: rates[pair]?.label || pair,
    current_rate: rates[pair]?.rate || 1,
    change_pct: rates[pair]?.change || 0,
  }))
}

/**
 * Market Index Factory
 */
export function createMockIndex(overrides = {}) {
  return {
    index: '^GSPC',
    name: 'S&P 500',
    country: 'US',
    current_price: 5234.5,
    change_pct: 0.66,
    ...overrides,
  }
}

export function createMockIndices(count = 4) {
  const defaults = [
    { index: '^GSPC', name: 'S&P 500', country: 'US', current_price: 5234.5, change_pct: 0.66 },
    { index: '^JKLQ45', name: 'LQ45', country: 'ID', current_price: 1820.0, change_pct: 0.55 },
    { index: '^N225', name: 'Nikkei 225', country: 'JP', current_price: 38250.0, change_pct: -0.32 },
    { index: '^FTSE', name: 'FTSE 100', country: 'GB', current_price: 8120.0, change_pct: 0.15 },
  ]
  return defaults.slice(0, count)
}

/**
 * Company Info Factory
 */
export function createMockCompanyInfo(overrides = {}) {
  return {
    info: {
      identity: { longName: 'NVIDIA Corp' },
      sector: 'Technology',
      industry: 'Semiconductors',
      price: { currentPrice: 876.50 },
      marketCap: 2.1e12,
      valuation: { trailingPE: 45.2 },
      dividend: { dividendYield: 0.0003 },
      analyst: { recommendationKey: 'buy', targetMeanPrice: 900 },
      ...overrides.info,
    },
    ...overrides,
  }
}

/**
 * Sparkline Data Factory
 */
export function createMockSparklineData(length = 6, trend = 'up') {
  const base = trend === 'up' ? 10 : 40
  const delta = trend === 'up' ? 5 : -5
  return Array.from({ length }, (_, i) => base + i * delta)
}

/**
 * Market Heatmap Data Factory
 */
export function createMockHeatmapTickerData(changePct = 2.5) {
  return {
    change_pct: changePct,
    marketCap: 1e12,
  }
}

export function createMockHeatmapData(tickers = ['NVDA', 'AAPL']) {
  const changes = [2.5, -1.3, 0.8, -2.1, 1.5]
  return tickers.reduce((acc, ticker, i) => {
    acc[ticker] = createMockHeatmapTickerData(changes[i % changes.length])
    return acc
  }, {})
}

/**
 * Portfolio Position Factory
 */
export function createMockPosition(overrides = {}) {
  return {
    ticker: 'NVDA',
    shares: 100,
    avgPrice: 450.0,
    purchaseDate: '2025-01-15',
    ...overrides,
  }
}

/**
 * Market selection using existing MARKETS data
 */
export { MARKETS }