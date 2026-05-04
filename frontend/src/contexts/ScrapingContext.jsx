import { createContext, useContext, useState, useCallback } from 'react'

const ScrapingContext = createContext(null)

export function ScrapingProvider({ children }) {
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeStatus, setScrapeStatus] = useState({})

  const errorCount = scrapeStatus?.errorCount ?? 0

  const pollStatus = useCallback(async () => {
    if (!window.api) return
    try {
      const status = await window.api.scrapeStatus()
      setScrapeStatus(status || {})
    } catch (err) {
      console.error('Poll status error:', err)
    }
  }, [])

  const startScrape = useCallback(async () => {
    if (!window.api) return
    setIsScraping(true)
    try {
      await window.api.scrapeLatest()
      setTimeout(async () => {
        await pollStatus()
      }, 1000)
    } catch (err) {
      console.error('Scrape error:', err)
    } finally {
      setTimeout(() => setIsScraping(false), 3000)
    }
  }, [pollStatus])

  return (
    <ScrapingContext.Provider value={{ isScraping, scrapeStatus, errorCount, startScrape, pollStatus }}>
      {children}
    </ScrapingContext.Provider>
  )
}

export function useScraping() {
  const context = useContext(ScrapingContext)
  if (!context) {
    throw new Error('useScraping must be used within a ScrapingProvider')
  }
  return context
}