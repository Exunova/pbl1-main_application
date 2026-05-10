import { describe, it, expect } from 'vitest'
import { MARKETS, COUNTRY_INDEX_MAP, MOCK_INDICES, MOCK_FOREX, MOCK_EVENTS, MOCK_NEWS, stockScreenerData, generateSparklineData } from '../../src/data/mockData.js'

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

  describe('COUNTRY_INDEX_MAP export', () => {
    it('has entries for all 4 markets', () => {
      const keys = Object.keys(COUNTRY_INDEX_MAP)
      expect(keys.length).toBe(4)
      expect(keys).toContain('US')
      expect(keys).toContain('ID')
      expect(keys).toContain('JP')
      expect(keys).toContain('GB')
    })

    it('each entry has index and name', () => {
      Object.entries(COUNTRY_INDEX_MAP).forEach(([key, val]) => {
        expect(val).toHaveProperty('index')
        expect(val).toHaveProperty('name')
        expect(typeof val.index).toBe('string')
        expect(typeof val.name).toBe('string')
      })
    })

    it('US maps to S&P 500', () => {
      expect(COUNTRY_INDEX_MAP.US.index).toBe('^GSPC')
      expect(COUNTRY_INDEX_MAP.US.name).toBe('S&P 500')
    })
  })

  describe('MOCK_INDICES export', () => {
    it('is an array with 4 entries', () => {
      expect(Array.isArray(MOCK_INDICES)).toBe(true)
      expect(MOCK_INDICES.length).toBe(4)
    })

    it('each entry has required fields', () => {
      MOCK_INDICES.forEach(idx => {
        expect(idx).toHaveProperty('index')
        expect(idx).toHaveProperty('name')
        expect(idx).toHaveProperty('country')
        expect(idx).toHaveProperty('current_price')
        expect(idx).toHaveProperty('change_pct')
      })
    })

    it('has entries for all 4 countries', () => {
      const countries = MOCK_INDICES.map(i => i.country)
      expect(countries).toContain('US')
      expect(countries).toContain('ID')
      expect(countries).toContain('JP')
      expect(countries).toContain('GB')
    })

    it('US entry matches S&P 500 structure', () => {
      const us = MOCK_INDICES.find(i => i.country === 'US')
      expect(us.index).toBe('^GSPC')
      expect(us.name).toBe('S&P 500')
      expect(typeof us.current_price).toBe('number')
      expect(typeof us.change_pct).toBe('number')
    })
  })

  describe('MOCK_FOREX export', () => {
    it('is an object with forex pairs', () => {
      expect(typeof MOCK_FOREX).toBe('object')
      expect(MOCK_FOREX).toHaveProperty('IDR_USD')
      expect(MOCK_FOREX).toHaveProperty('JPY_USD')
      expect(MOCK_FOREX).toHaveProperty('GBP_USD')
    })

    it('each pair has required fields', () => {
      Object.values(MOCK_FOREX).forEach(pair => {
        expect(pair).toHaveProperty('pair')
        expect(pair).toHaveProperty('label')
        expect(pair).toHaveProperty('current_rate')
        expect(pair).toHaveProperty('change_pct')
      })
    })

    it('IDR_USD has correct values', () => {
      const idr = MOCK_FOREX.IDR_USD
      expect(idr.pair).toBe('IDR_USD')
      expect(idr.label).toBe('USD/IDR')
      expect(typeof idr.current_rate).toBe('number')
      expect(typeof idr.change_pct).toBe('number')
    })
  })

  describe('MOCK_EVENTS export', () => {
    it('is an object keyed by country code', () => {
      expect(typeof MOCK_EVENTS).toBe('object')
      expect(MOCK_EVENTS).toHaveProperty('US')
      expect(MOCK_EVENTS).toHaveProperty('ID')
      expect(MOCK_EVENTS).toHaveProperty('JP')
      expect(MOCK_EVENTS).toHaveProperty('GB')
    })

    it('each country events is an array', () => {
      Object.values(MOCK_EVENTS).forEach(events => {
        expect(Array.isArray(events)).toBe(true)
      })
    })

    it('each event has required fields', () => {
      const allEvents = Object.values(MOCK_EVENTS).flat()
      allEvents.forEach(event => {
        expect(event).toHaveProperty('name')
        expect(event).toHaveProperty('date')
        expect(event).toHaveProperty('time')
        expect(event).toHaveProperty('impact')
        expect(event).toHaveProperty('actual')
        expect(event).toHaveProperty('forecast')
        expect(event).toHaveProperty('previous')
      })
    })

    it('impact is one of high/medium/low', () => {
      const allEvents = Object.values(MOCK_EVENTS).flat()
      allEvents.forEach(event => {
        expect(['high', 'medium', 'low']).toContain(event.impact)
      })
    })
  })

  describe('MOCK_NEWS export', () => {
    it('is an object keyed by country code', () => {
      expect(typeof MOCK_NEWS).toBe('object')
      expect(MOCK_NEWS).toHaveProperty('US')
      expect(MOCK_NEWS).toHaveProperty('ID')
      expect(MOCK_NEWS).toHaveProperty('JP')
      expect(MOCK_NEWS).toHaveProperty('GB')
    })

    it('each country news is an array', () => {
      Object.values(MOCK_NEWS).forEach(news => {
        expect(Array.isArray(news)).toBe(true)
      })
    })

    it('each article has required fields', () => {
      const allNews = Object.values(MOCK_NEWS).flat()
      allNews.forEach(article => {
        expect(article).toHaveProperty('title')
        expect(article).toHaveProperty('link')
        expect(article).toHaveProperty('publisher')
        expect(article).toHaveProperty('published')
        expect(article).toHaveProperty('thumbnail')
      })
    })

    it('thumbnail has type and url', () => {
      const allNews = Object.values(MOCK_NEWS).flat()
      allNews.forEach(article => {
        expect(article.thumbnail).toHaveProperty('type')
        expect(article.thumbnail).toHaveProperty('url')
      })
    })
  })

  describe('stockScreenerData export', () => {
    it('is an array', () => {
      expect(Array.isArray(stockScreenerData)).toBe(true)
    })

    it('has 40 entries (10 per market x 4 markets)', () => {
      expect(stockScreenerData.length).toBe(40)
    })

    it('each stock has required fields', () => {
      stockScreenerData.forEach(stock => {
        expect(stock).toHaveProperty('ticker')
        expect(stock).toHaveProperty('name')
        expect(stock).toHaveProperty('price')
        expect(stock).toHaveProperty('change')
        expect(stock).toHaveProperty('region')
        expect(stock).toHaveProperty('sector')
        expect(stock).toHaveProperty('industry')
      })
    })

    it('all 40 US tickers are present', () => {
      const usTickers = MARKETS.US.tickers
      usTickers.forEach(ticker => {
        expect(stockScreenerData.some(s => s.ticker === ticker && s.region === 'US')).toBe(true)
      })
    })

    it('all 10 ID tickers are present', () => {
      const idTickers = MARKETS.ID.tickers
      idTickers.forEach(ticker => {
        expect(stockScreenerData.some(s => s.ticker === ticker && s.region === 'ID')).toBe(true)
      })
    })

    it('all 10 JP tickers are present', () => {
      const jpTickers = MARKETS.JP.tickers
      jpTickers.forEach(ticker => {
        expect(stockScreenerData.some(s => s.ticker === ticker && s.region === 'JP')).toBe(true)
      })
    })

    it('all 10 GB tickers are present', () => {
      const gbTickers = MARKETS.GB.tickers
      gbTickers.forEach(ticker => {
        expect(stockScreenerData.some(s => s.ticker === ticker && s.region === 'GB')).toBe(true)
      })
    })
  })

  describe('generateSparklineData export', () => {
    it('is a function', () => {
      expect(typeof generateSparklineData).toBe('function')
    })

    it('returns an array', () => {
      const result = generateSparklineData()
      expect(Array.isArray(result)).toBe(true)
    })

    it('returns array of numbers', () => {
      const result = generateSparklineData()
      result.forEach(val => {
        expect(typeof val).toBe('number')
      })
    })
  })
})