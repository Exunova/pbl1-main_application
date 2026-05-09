import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { GEO_JSON_URL, COUNTRY_INDEX_MAP, ISO2_TO_ISO3, COUNTRY_CURRENCY, MAJOR_CURRENCIES } from '../utils/globeUtils'
import { useScraping } from '../contexts/ScrapingContext'

export function useGlobeData() {
  const [worldData, setWorldData] = useState(null)
  const [indicesData, setIndicesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedCountry, setSelectedCountry] = useState(null) // ISO2
  const [selectedPoint, setSelectedPoint] = useState(null) // {lat, lng}
  const [bubbles, setBubbles] = useState([])
  const [isZooming, setIsZooming] = useState(false)

  const [chartHeight, setChartHeight] = useState(220)
  const [isResizing, setIsResizing] = useState(false)
  const [panelWidth, setPanelWidth] = useState(320)
  const [isResizingPanel, setIsResizingPanel] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const [calendarEvents, setCalendarEvents] = useState([])
  const [newsArticles, setNewsArticles] = useState([])
  const [panelLoading, setPanelLoading] = useState(false)

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null })
  const [ohlcvData, setOhlcvData] = useState([])
  
  // Destructure context
  const { isScraping, startScrape, pollStatus, scrapeStatus } = useScraping() || {}

  const countriesFeatRef = useRef([])
  const indexMapRef = useRef({})

  const fetchMapData = useCallback(async () => {
    try {
      const res = await fetch(GEO_JSON_URL)
      if (!res.ok) throw new Error('Failed to fetch world topology')
      const data = await res.json()
      setWorldData(data)
      const countries = data.features.filter(d => d.properties.ISO_A3 !== 'AQ')
      countriesFeatRef.current = countries
      return data
    } catch (err) {
      setError(err.message)
      setLoading(false)
      return null
    }
  }, [])

  const fetchIndexData = useCallback(async () => {
    if (!window.api) { setIndicesData([]); return [] }
    try {
      const indices = await window.api.fetchIndices()
      setIndicesData(indices || [])
      return indices
    } catch (err) {
      console.error('Fetch index data error:', err)
      setIndicesData([]); return []
    }
  }, [])

  const loadCountryData = useCallback(async (iso2) => {
    if (!window.api) {
      setCalendarEvents([]); setNewsArticles([]); setPanelLoading(false); return
    }
    setPanelLoading(true)
    try {
      const [macroData, newsData] = await Promise.all([
        window.api.fetchMacro(iso2),
        window.api.fetchNews(iso2),
      ])
      setCalendarEvents(macroData?.events || [])
      setNewsArticles(newsData?.articles || [])
    } catch (err) {
      console.error('Load country data error:', err)
      setCalendarEvents([]); setNewsArticles([])
    } finally {
      setPanelLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const init = async () => {
      await Promise.all([fetchMapData(), fetchIndexData()])
      if (mounted) setLoading(false)
    }
    init()
    return () => { mounted = false }
  }, [fetchMapData, fetchIndexData])

  useEffect(() => {
    const map = {}
    indicesData.forEach(idx => {
      const iso3 = ISO2_TO_ISO3[idx.country]
      if (iso3) map[iso3] = idx
    })
    indexMapRef.current = map
  }, [indicesData])

  useEffect(() => {
    if (!selectedCountry || !window.api) {
      setOhlcvData([]);
      return;
    }
    const indexTicker = COUNTRY_INDEX_MAP[selectedCountry]?.index;
    if (!indexTicker) return;
    
    let cancelled = false;
    window.api.fetchOHLCV(indexTicker).then(d => {
      if (cancelled) return;
      const resp = d?.data || d;
      setOhlcvData(resp?.ohlcv_15m || []);
    }).catch(() => {});
    
    return () => { cancelled = true; };
  }, [selectedCountry]);

  // Resize chart and panel handlers logic
  useEffect(() => {
    if (!isResizing && !isResizingPanel) return
    const onMouseMove = e => {
      const container = document.body
      if (!container) return
      const rect = container.getBoundingClientRect()
      if (isResizing) {
        const newH = Math.max(120, Math.min(400, rect.bottom - e.clientY))
        setChartHeight(newH)
      }
      if (isResizingPanel) {
        const newW = Math.max(250, Math.min(600, rect.right - e.clientX))
        setPanelWidth(newW)
      }
    }
    const onMouseUp = () => { setIsResizing(false); setIsResizingPanel(false); }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isResizing, isResizingPanel])

  const chartData = useMemo(() => {
    if (ohlcvData.length > 0) {
      return ohlcvData.map((c, i) => ({
        time: i,
        close: c.close
      }));
    }
    let p = 1000;
    return Array.from({ length: 60 }, (_, i) => {
      p += (Math.random() - 0.49) * p * 0.008;
      return { time: i, close: p };
    });
  }, [ohlcvData]);

  const selectedIndexData = useMemo(() => {
    if (!selectedCountry) return null
    return indicesData.find(i => i.country === selectedCountry) || null
  }, [selectedCountry, indicesData])

  const dynamicForexRates = useMemo(() => {
    if (!selectedCountry) return []
    const base = COUNTRY_CURRENCY[ISO2_TO_ISO3[selectedCountry]] || 'USD'
    return MAJOR_CURRENCIES.filter(c => c !== base).slice(0, 8).map(c => {
      let rate = (Math.random() + 0.5).toFixed(4)
      if (base === 'IDR') rate = (Math.random() * 0.0001).toFixed(6)
      if (base === 'JPY' && c === 'USD') rate = (1 / (150 + Math.random())).toFixed(5)
      if (c === 'IDR') rate = (Math.random() * 16000 + 1000).toFixed(2)
      if (c === 'JPY') rate = (Math.random() * 150 + 10).toFixed(2)
      return { pair: `${base}/${c}`, rate, chg: (Math.random() * 1.5 - 0.75) }
    })
  }, [selectedCountry])

  return {
    worldData, indicesData, loading, error,
    selectedCountry, setSelectedCountry,
    selectedPoint, setSelectedPoint,
    bubbles, setBubbles,
    isZooming, setIsZooming,
    chartHeight, setChartHeight,
    isResizing, setIsResizing,
    panelWidth, setPanelWidth,
    isResizingPanel, setIsResizingPanel,
    searchQuery, setSearchQuery,
    isSearchOpen, setIsSearchOpen,
    calendarEvents, newsArticles, panelLoading,
    tooltip, setTooltip,
    chartData, selectedIndexData, dynamicForexRates,
    countriesFeatRef, indexMapRef,
    loadCountryData
  }
}
