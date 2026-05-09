import { useEffect, useState } from 'react'
import { MARKETS } from '../../../data/mockData'

export default function useTickerData() {
  const [tickerData, setTickerData] = useState({})

  useEffect(() => {
    if (!window.api) return

    const allTickers = Object.values(MARKETS)
      .flatMap(m => m.tickers)

    window.api.fetchCompanies(allTickers)
      .then(results => {
        const td = {}

        Object.entries(results?.data || {}).forEach(([ticker, data]) => {
          const price = data?.info?.price

          if (!price) return

          td[ticker] = {
            change_pct:
              price.regularMarketChangePercent || 0,
            marketCap:
              price.marketCap || 0
          }
        })

        setTickerData(td)
      })
  }, [])

  return tickerData
}