import { describe, it, expect } from 'vitest'
import { MARKETS } from '../../src/data/mockData.js'

describe('mockData.js', () => {
  describe('MARKETS export', () => {
    it('has 4 market entries (US/ID/JP/GB)', () => {
      const marketKeys = Object.keys(MARKETS)
      expect(marketKeys.length).toBe(4)
      expect(marketKeys).toContain('US')
      expect(marketKeys).toContain('ID')
      expect(marketKeys).toContain('JP')
      expect(marketKeys).toContain('GB')
    })

    it('US market has correct structure', () => {
      expect(MARKETS.US).toHaveProperty('index')
      expect(MARKETS.US).toHaveProperty('label')
      expect(MARKETS.US).toHaveProperty('tickers')
      expect(MARKETS.US.index).toBe('^GSPC')
      expect(MARKETS.US.label).toBe('S&P 500')
    })

    it('ID market has correct structure', () => {
      expect(MARKETS.ID).toHaveProperty('index')
      expect(MARKETS.ID).toHaveProperty('label')
      expect(MARKETS.ID).toHaveProperty('tickers')
      expect(MARKETS.ID.index).toBe('^JKLQ45')
      expect(MARKETS.ID.label).toBe('LQ45')
    })

    it('JP market has correct structure', () => {
      expect(MARKETS.JP).toHaveProperty('index')
      expect(MARKETS.JP).toHaveProperty('label')
      expect(MARKETS.JP).toHaveProperty('tickers')
      expect(MARKETS.JP.index).toBe('^N225')
      expect(MARKETS.JP.label).toBe('Nikkei 225')
    })

    it('GB market has correct structure', () => {
      expect(MARKETS.GB).toHaveProperty('index')
      expect(MARKETS.GB).toHaveProperty('label')
      expect(MARKETS.GB).toHaveProperty('tickers')
      expect(MARKETS.GB.index).toBe('^FTSE')
      expect(MARKETS.GB.label).toBe('FTSE 100')
    })

    it('each market has index and tickers array', () => {
      Object.values(MARKETS).forEach(market => {
        expect(typeof market.index).toBe('string')
        expect(Array.isArray(market.tickers)).toBe(true)
        expect(typeof market.label).toBe('string')
      })
    })

    it('each market has 10 tickers', () => {
      expect(MARKETS.US.tickers.length).toBe(10)
      expect(MARKETS.ID.tickers.length).toBe(10)
      expect(MARKETS.JP.tickers.length).toBe(10)
      expect(MARKETS.GB.tickers.length).toBe(10)
    })

    it('US market has valid tickers including NVDA', () => {
      expect(MARKETS.US.tickers).toContain('NVDA')
      expect(MARKETS.US.tickers).toContain('AAPL')
      expect(MARKETS.US.tickers).toContain('GOOGL')
      expect(MARKETS.US.tickers).toContain('MSFT')
      expect(MARKETS.US.tickers).toContain('AMZN')
    })

    it('ID market has valid tickers including BBCA.JK', () => {
      expect(MARKETS.ID.tickers).toContain('BBCA.JK')
      expect(MARKETS.ID.tickers).toContain('BBRI.JK')
      expect(MARKETS.ID.tickers).toContain('BMRI.JK')
    })

    it('JP market has valid tickers including 7203.T', () => {
      expect(MARKETS.JP.tickers).toContain('7203.T')
      expect(MARKETS.JP.tickers).toContain('8306.T')
      expect(MARKETS.JP.tickers).toContain('6758.T')
    })

    it('GB market has valid tickers including AZN.L', () => {
      expect(MARKETS.GB.tickers).toContain('AZN.L')
      expect(MARKETS.GB.tickers).toContain('HSBA.L')
      expect(MARKETS.GB.tickers).toContain('SHEL.L')
    })
  })
})