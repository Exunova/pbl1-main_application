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

  const SAFETY_TIMEOUT_MS = 5 * 60 * 1000

  const startScrape = useCallback(async () => {
    if (!window.api) return
    setIsScraping(true)
    const startedAt = Date.now()

    try {
      await window.api.scrapeLatest()
      await pollStatus()

      const pollUntilComplete = async () => {
        try {
          const status = await window.api.scrapeStatus()
          setScrapeStatus(status || {})

          const allDone = Object.values(status || {}).every(
            v => v === 'done' || (typeof v === 'string' && v.startsWith('failed'))
          )

          if (allDone) {
            setIsScraping(false)
            return
          }
        } catch (err) {
          console.error('Poll status error:', err)
        }

        if (Date.now() - startedAt > SAFETY_TIMEOUT_MS) {
          setIsScraping(false)
          return
        }

        setTimeout(pollUntilComplete, 2000)
      }

      setTimeout(pollUntilComplete, 2000)
    } catch (err) {
      console.error('Scrape error:', err)
      setIsScraping(false)
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