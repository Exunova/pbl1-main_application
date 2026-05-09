import { useState, useEffect } from 'react'
import { stockScreenerData, MARKETS } from '../data/mockData'

export function useScreener() {
  const [selectedStock, setSelectedStock] = useState(null)
  const [region, setRegion]               = useState('US')
  const [search, setSearch]               = useState('')

  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    if (!isResizing) return
    const onMouseMove = e => {
      const newW = Math.max(150, Math.min(500, e.clientX))
      setSidebarWidth(newW)
    }
    const onMouseUp = () => setIsResizing(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isResizing])

  const availableTickers = MARKETS[region]?.tickers || [];
  
  const stocks = stockScreenerData.filter(s =>
    availableTickers.includes(s.ticker) &&
    (!search || s.ticker.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
  )

  const regionKeys = Object.keys(MARKETS);

  return {
    selectedStock, setSelectedStock,
    region, setRegion,
    search, setSearch,
    sidebarWidth, setSidebarWidth,
    isResizing, setIsResizing,
    availableTickers,
    stocks,
    regionKeys
  }
}
