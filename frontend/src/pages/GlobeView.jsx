import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Globe from 'globe.gl'
import { ResponsiveContainer, YAxis, BarChart, Bar, Cell, XAxis, Tooltip, CartesianGrid } from 'recharts'
import EconomicCalendar from '../components/EconomicCalendar'
import MacroNewsPanel from '../components/MacroNewsPanel'

// ─── Constants ───────────────────────────────────────────────────────────────

const GEO_JSON_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'

const COUNTRY_INDEX_MAP = {
  US: { index: '^GSPC', name: 'S&P 500' },
  ID: { index: '^JKLQ45', name: 'LQ45' },
  JP: { index: '^N225', name: 'Nikkei 225' },
  GB: { index: '^FTSE', name: 'FTSE 100' },
}

const COUNTRY_NAMES = {
  US: 'United States',
  ID: 'Indonesia',
  JP: 'Japan',
  GB: 'United Kingdom',
}

const ISO2_TO_ISO3 = { US: 'USA', ID: 'IDN', JP: 'JPN', GB: 'GBR' }
const ISO3_TO_ISO2 = { USA: 'US', IDN: 'ID', JPN: 'JP', GBR: 'GB' }

const COUNTRY_CURRENCY = { USA: 'USD', IDN: 'IDR', JPN: 'JPY', GBR: 'GBP' }
const MAJOR_CURRENCIES  = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'SGD', 'HKD', 'IDR']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCountryColor(changePct) {
  if (changePct === null || changePct === undefined) return 'rgba(55,65,81,0.6)'
  if (changePct > 1)  return 'rgba(22,101,52,0.75)'
  if (changePct > 0)  return 'rgba(74,222,128,0.55)'
  if (changePct < -1) return 'rgba(153,27,27,0.75)'
  return 'rgba(248,113,113,0.55)'
}

function isPointInPolygon(point, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    const intersect =
      (yi > point[1]) !== (yj > point[1]) &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function isPointInCountry(point, geometry) {
  if (geometry.type === 'Polygon')
    return isPointInPolygon(point, geometry.coordinates[0])
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates.some(poly => isPointInPolygon(point, poly[0]))
  return false
}

// ─── Candlestick subcomponent ────────────────────────────────────────────────

const Candlestick = props => {
  const { x, y, width, height, payload } = props
  if (!payload) return null
  const isUp = payload.close >= payload.open
  const color = isUp ? '#089981' : '#f23645'
  const range = payload.high - payload.low
  const openY  = range === 0 ? y : y + height * ((payload.high - payload.open) / range)
  const closeY = range === 0 ? y : y + height * ((payload.high - payload.close) / range)
  const highY  = y
  const lowY   = y + height
  const bodyTop    = Math.min(openY, closeY)
  const bodyBottom = Math.max(openY, closeY)
  const bodyHeight = Math.max(1, bodyBottom - bodyTop)
  const midX = x + width / 2
  return (
    <g>
      <line x1={midX} y1={highY} x2={midX} y2={lowY} stroke={color} strokeWidth={1} />
      <rect x={x} y={bodyTop} width={width} height={bodyHeight} fill={color} stroke={color} />
    </g>
  )
}

function generateCandlestickData(count = 60) {
  let open = 1000
  return Array.from({ length: count }, (_, i) => {
    const close  = open + (Math.random() - 0.5) * 40
    const high   = Math.max(open, close) + Math.random() * 15
    const low    = Math.min(open, close) - Math.random() * 15
    const volume = Math.random() * 50000 + 10000
    const data   = { time: i, open, high, low, close, volume, bounds: [low, high] }
    open = close
    return data
  })
}

// ─── getPointOfView ───────────────────────────────────────────────────────────

function getPointOfView(feature) {
  if (feature.properties.ISO_A3 === 'USA') {
    return { povLat: 38, povLng: -97 + 2.0 * 20, altitude: 2.0, centerLat: 40, centerLng: -97 }
  }
  let coords = []
  if (feature.geometry.type === 'Polygon') {
    coords = feature.geometry.coordinates[0]
  } else if (feature.geometry.type === 'MultiPolygon') {
    feature.geometry.coordinates.forEach(poly => {
      if (poly[0].length > (coords.length || 0)) coords = poly[0]
    })
  }
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
  coords.forEach(([lng, lat]) => {
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat)
    minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng)
  })
  let latC = feature.properties.LABEL_Y ?? (minLat + maxLat) / 2
  let lngC = feature.properties.LABEL_X ?? (minLng + maxLng) / 2
  if (feature.properties.ISO_A3 === 'IDN') { latC = -2.0; lngC = 121.0 }
  const maxSpread = Math.max(maxLat - minLat, maxLng - minLng)
  const altitude  = Math.min(Math.max(0.9 + maxSpread / 25, 0.85), 2.6)
  const lngOffset = altitude * 20
  return { povLat: latC - 2, povLng: lngC + lngOffset, altitude, centerLat: latC, centerLng: lngC }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GlobeView() {
  const containerRef      = useRef(null)
  const globeRef          = useRef(null)
  const selectedRef       = useRef(null) // ISO2 code
  const indexMapRef       = useRef({})   // ISO3 → index data
  const countriesFeatRef  = useRef([])

  const [worldData,       setWorldData]       = useState(null)
  const [indicesData,     setIndicesData]     = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)

  const [selectedCountry, setSelectedCountry] = useState(null) // ISO2
  const [selectedPoint,   setSelectedPoint]   = useState(null) // {lat, lng}
  const [bubbles,         setBubbles]         = useState([])
  const [isZooming,       setIsZooming]       = useState(false)

  const [chartHeight, setChartHeight]         = useState(220)
  const [isResizing,  setIsResizing]          = useState(false)

  const [searchQuery,   setSearchQuery]   = useState('')
  const [isSearchOpen,  setIsSearchOpen]  = useState(false)
  const searchRef = useRef(null)

  const [calendarEvents, setCalendarEvents] = useState([])
  const [newsArticles,   setNewsArticles]   = useState([])
  const [panelLoading,   setPanelLoading]   = useState(false)

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null })
  const [scrapeStatus, setScrapeStatus] = useState({})
  const [isScraping, setIsScraping] = useState(false)

  const handleScrapeLatest = async () => {
    if (!window.api) return
    setIsScraping(true)
    try {
      await window.api.scrapeLatest()
      setTimeout(async () => {
        const status = await window.api.scrapeStatus()
        setScrapeStatus(status || {})
      }, 1000)
    } catch (err) {
      console.error('Scrape error:', err)
    } finally {
      setTimeout(() => setIsScraping(false), 3000)
    }
  }

  const pollScrapeStatus = async () => {
    if (!window.api) return
    try {
      const status = await window.api.scrapeStatus()
      setScrapeStatus(status || {})
    } catch {}
  }

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchMapData = useCallback(async () => {
    try {
      const res  = await fetch(GEO_JSON_URL)
      if (!res.ok) throw new Error('Failed to fetch world topology')
      const data = await res.json()
      setWorldData(data)
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
    } catch {
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
      setCalendarEvents(macroData?.events  || [])
      setNewsArticles(newsData?.articles   || [])
    } catch {
      setCalendarEvents([]); setNewsArticles([])
    } finally {
      setPanelLoading(false)
    }
  }, [])

  // keep selectedRef in sync
  useEffect(() => { selectedRef.current = selectedCountry }, [selectedCountry])

  // rebuild indexMapRef whenever indicesData changes & repaint polygons
  useEffect(() => {
    const map = {}
    indicesData.forEach(idx => {
      const iso3 = ISO2_TO_ISO3[idx.country]
      if (iso3) map[iso3] = idx
    })
    indexMapRef.current = map
    if (globeRef.current) {
      globeRef.current.polygonCapColor(d => {
        const iso3 = d.properties.ISO_A3
        const iso2 = ISO3_TO_ISO2[iso3]
        if (selectedRef.current && ISO2_TO_ISO3[selectedRef.current] === iso3)
          return 'rgba(249,115,22,0.45)'
        const idx = indexMapRef.current[iso3]
        if (!idx && !iso2) return 'rgba(30,30,30,0.4)'
        if (!idx) return 'rgba(55,65,81,0.6)'
        return getCountryColor(idx.change_pct)
      })
    }
  }, [indicesData])

  // initial load
  useEffect(() => {
    let mounted = true
    const init = async () => {
      await Promise.all([fetchMapData(), fetchIndexData()])
      if (mounted) setLoading(false)
    }
    init()
    return () => { mounted = false }
  }, [fetchMapData, fetchIndexData])

  // ── Globe init ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!worldData || !containerRef.current || loading) return
    if (globeRef.current) return

    // dark ocean texture
    const oceanCanvas = document.createElement('canvas')
    oceanCanvas.width = 1; oceanCanvas.height = 1
    const ctx = oceanCanvas.getContext('2d')
    ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, 1, 1)

    // star background
    const starsCanvas = document.createElement('canvas')
    starsCanvas.width = 2048; starsCanvas.height = 1024
    const sCtx = starsCanvas.getContext('2d')
    sCtx.fillStyle = '#090909'; sCtx.fillRect(0, 0, starsCanvas.width, starsCanvas.height)
    for (let i = 0; i < 1600; i++) {
      const sx    = Math.random() * starsCanvas.width
      const sy    = Math.random() * starsCanvas.height
      const size  = Math.random() * 0.7
      const alpha = Math.random() * 0.4 + 0.05
      sCtx.fillStyle = `rgba(255,255,255,${alpha})`
      sCtx.beginPath(); sCtx.arc(sx, sy, size, 0, Math.PI * 2); sCtx.fill()
    }

    const globeInstance = Globe()(containerRef.current)
      .globeImageUrl(oceanCanvas.toDataURL())
      .backgroundImageUrl(starsCanvas.toDataURL())
      .showAtmosphere(true)
      .atmosphereColor('#7f1d1d')
      .atmosphereAltitude(0.2)
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight)

    const controls = globeInstance.controls()
    controls.autoRotate      = true
    controls.autoRotateSpeed = 0.5
    controls.enablePan       = true
    controls.minDistance     = 150
    controls.maxDistance     = 800

    const countries = worldData.features.filter(d => d.properties.ISO_A3 !== 'AQ')
    countriesFeatRef.current = countries

    globeInstance
      .polygonsData(countries)
      .polygonAltitude(d => {
        const iso3 = d.properties.ISO_A3
        return ISO3_TO_ISO2[iso3] && selectedRef.current && ISO2_TO_ISO3[selectedRef.current] === iso3
          ? 0.015 : 0.006
      })
      .polygonCapColor(d => {
        const iso3 = d.properties.ISO_A3
        const iso2 = ISO3_TO_ISO2[iso3]
        if (selectedRef.current && ISO2_TO_ISO3[selectedRef.current] === iso3)
          return 'rgba(249,115,22,0.45)'
        const idx = indexMapRef.current[iso3]
        if (!idx && !iso2) return 'rgba(30,30,30,0.4)'
        if (!idx) return 'rgba(55,65,81,0.6)'
        return getCountryColor(idx.change_pct)
      })
      .polygonSideColor(() => 'rgba(249,115,22,0.2)')
      .polygonStrokeColor(d => {
        const iso3 = d.properties.ISO_A3
        const iso2 = ISO3_TO_ISO2[iso3]
        if (selectedRef.current && ISO2_TO_ISO3[selectedRef.current] === iso3) return '#fb923c'
        return iso2 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)'
      })
      .onPolygonClick(polygon => {
        const iso3 = polygon.properties.ISO_A3
        const iso2 = ISO3_TO_ISO2[iso3]
        if (!iso2) return

        if (selectedRef.current === iso2) {
          setSelectedCountry(null); setSelectedPoint(null); setBubbles([])
          controls.autoRotate = true
          globeInstance.pointOfView({ lat: 20, lng: 110, altitude: 3.5 }, 1200)
          return
        }

        setIsZooming(true); setSelectedCountry(iso2)
        loadCountryData(iso2)

        // scatter bubbles inside the country polygon
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
        const updateBbox = geom => {
          const rings = geom.type === 'Polygon'
            ? [geom.coordinates[0]]
            : geom.coordinates.map(p => p[0])
          rings.forEach(ring => ring.forEach(([lng, lat]) => {
            minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat)
            minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng)
          }))
        }
        updateBbox(polygon.geometry)

        const latSpread = maxLat - minLat
        const lngSpread = maxLng - minLng
        const geoScale  = Math.max(0.1, Math.min(Math.sqrt(latSpread * lngSpread) * 0.08, 1.2))

        const newBubbles = []
        for (let b = 0; b < 3; b++) {
          let lat, lng, found = false, attempts = 0
          while (!found && attempts < 150) {
            lat = minLat + Math.random() * latSpread
            lng = minLng + Math.random() * lngSpread
            if (isPointInCountry([lng, lat], polygon.geometry)) found = true
            attempts++
          }
          if (!found) { lat = (minLat + maxLat) / 2; lng = (minLng + maxLng) / 2 }
          const importance = b === 0 ? 'high' : b === 1 ? 'medium' : 'low'
          newBubbles.push({
            lat, lng,
            size:  Math.max(0.15, Math.min((b === 0 ? 1.0 : b === 1 ? 0.7 : 0.4) * geoScale, 0.8)),
            color: b === 0 ? '#ef4444' : b === 1 ? '#f59e0b' : '#3b82f6',
            label: COUNTRY_INDEX_MAP[iso2]?.name || iso2,
          })
        }
        setBubbles(newBubbles)

        const feature = countries.find(f => f.properties.ISO_A3 === iso3)
        if (feature) {
          const { povLat, povLng, altitude, centerLat, centerLng } = getPointOfView(feature)
          setSelectedPoint({ lat: centerLat, lng: centerLng })
          globeInstance.pointOfView({ lat: povLat, lng: povLng, altitude }, 1500)
        }
        controls.autoRotate = false
        setTimeout(() => setIsZooming(false), 1500)
      })
      .onPolygonHover((polygon, event) => {
        if (!selectedRef.current) controls.autoRotate = !polygon
        if (containerRef.current)
          containerRef.current.style.cursor = polygon ? 'pointer' : 'default'

        if (polygon) {
          const iso3 = polygon.properties.ISO_A3
          const iso2 = ISO3_TO_ISO2[iso3]
          const idx  = indexMapRef.current[iso3]
          const mapEntry = iso2 ? COUNTRY_INDEX_MAP[iso2] : null
          let content = { country: iso2 || 'Unknown', name: 'No data', current_price: 'N/A', change_pct: null }
          if (idx && mapEntry) {
            content = { country: mapEntry.name, name: idx.name, current_price: idx.current_price, change_pct: idx.change_pct }
          }
          const rect  = containerRef.current?.getBoundingClientRect()
          const clX   = event?.clientX ?? 0
          const clY   = event?.clientY ?? 0
          setTooltip({ visible: true, x: rect ? clX - rect.left : 0, y: rect ? clY - rect.top : 0, content })
        } else {
          setTooltip(prev => ({ ...prev, visible: false }))
        }
      })
      .onGlobeClick(() => {
        controls.autoRotate = true
        setSelectedCountry(null); setSelectedPoint(null); setBubbles([])
        globeInstance.pointOfView({ lat: 20, lng: 110, altitude: 3.5 }, 1200)
      })

    // Point markers using built-in points layer
    globeInstance
      .pointsData([])
      .pointLat(d => d.lat)
      .pointLng(d => d.lng)
      .pointColor(d => d.color)
      .pointRadius(d => d.size * 2)
      .pointAltitude(d => 0.01)
      .pointLabel(d => d.label)

    // HTML overlay label
    globeInstance
      .htmlElementsData([])
      .htmlLat(d => d.lat)
      .htmlLng(d => d.lng)
      .htmlAltitude(0.01)
      .htmlElement(d => {
        const el = document.createElement('div')
        const idx  = indexMapRef.current[ISO2_TO_ISO3[d.iso2]] || {}
        const sign = idx.change_pct >= 0 ? '+' : ''
        const chgColor = idx.change_pct >= 0 ? '#089981' : '#f23645'
        el.innerHTML = `
          <div style="position:absolute;left:0;top:0;pointer-events:none;">
            <div style="position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:#fb923c;box-shadow:0 0 10px #fb923c;animation:pulse 2s infinite;"></div>
            <div style="position:absolute;left:0;top:-1px;width:130px;height:2px;background:#fb923c;"></div>
            <div style="position:absolute;left:130px;top:-2.5px;width:5px;height:5px;border-radius:50%;background:#fb923c;"></div>
            <div id="globe-label-card" style="
              position:absolute;left:146px;top:0;transform:translateY(-50%);
              background:rgba(17,17,17,0.92);backdrop-filter:blur(12px);
              border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px 16px;
              box-shadow:0 0 40px rgba(249,115,22,0.15);width:220px;
              opacity:0;transform:translate(-10px,-50%);transition:all 0.45s cubic-bezier(0.4,0,0.2,1);">
              <h2 style="font-size:18px;font-weight:900;color:#fff;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:2px;">${d.countryName}</h2>
              <p style="font-size:10px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">${COUNTRY_INDEX_MAP[d.iso2]?.name || ''}</p>
              <div style="display:flex;align-items:baseline;gap:8px;">
                <span style="font-size:20px;font-weight:700;color:#fff;">${idx.current_price ?? '—'}</span>
                <span style="font-size:12px;font-weight:600;color:${chgColor};">${idx.change_pct != null ? sign + idx.change_pct.toFixed(2) + '%' : ''}</span>
              </div>
            </div>
          </div>
        `
        requestAnimationFrame(() => {
          const card = el.querySelector('#globe-label-card')
          if (card) setTimeout(() => {
            card.style.opacity = '1'
            card.style.transform = 'translate(0,-50%)'
          }, 50)
        })
        return el
      })

    globeRef.current = globeInstance
    globeInstance.pointOfView({ lat: 20, lng: 110, altitude: 3.5 }, 0)

    const handleResize = () => {
      if (globeRef.current && containerRef.current) {
        globeRef.current.width(containerRef.current.clientWidth)
        globeRef.current.height(containerRef.current.clientHeight)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (globeRef.current) {
        globeRef.current.renderer()?.dispose()
        globeRef.current = null
      }
    }
  }, [worldData, loading, loadCountryData])

  // ── Sync globe visuals when selectedCountry / bubbles change ───────────────

  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = !selectedCountry

    globeRef.current
      .polygonAltitude(d => {
        const iso3 = d.properties.ISO_A3
        return selectedCountry && ISO2_TO_ISO3[selectedCountry] === iso3 ? 0.015 : 0.006
      })
      .polygonCapColor(d => {
        const iso3 = d.properties.ISO_A3
        const iso2 = ISO3_TO_ISO2[iso3]
        if (selectedCountry && ISO2_TO_ISO3[selectedCountry] === iso3)
          return 'rgba(249,115,22,0.45)'
        const idx = indexMapRef.current[iso3]
        if (!idx && !iso2) return 'rgba(30,30,30,0.4)'
        if (!idx) return 'rgba(55,65,81,0.6)'
        return getCountryColor(idx.change_pct)
      })
      .polygonStrokeColor(d => {
        const iso3 = d.properties.ISO_A3
        const iso2 = ISO3_TO_ISO2[iso3]
        if (selectedCountry && ISO2_TO_ISO3[selectedCountry] === iso3) return '#fb923c'
        return iso2 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)'
      })
      .pointsData(bubbles)

    const htmlData = selectedCountry && !isZooming && selectedPoint ? [{
      lat: selectedPoint.lat,
      lng: selectedPoint.lng,
      iso2: selectedCountry,
      countryName: COUNTRY_NAMES[selectedCountry] || selectedCountry,
    }] : []
    globeRef.current.htmlElementsData(htmlData)
  }, [selectedCountry, bubbles, isZooming, selectedPoint, indicesData])

  // ── Resize chart handle  ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isResizing) return
    const onMouseMove = e => {
      const container = containerRef.current?.parentElement
      if (!container) return
      const rect = container.getBoundingClientRect()
      const newH = Math.max(120, Math.min(400, rect.bottom - e.clientY))
      setChartHeight(newH)
    }
    const onMouseUp = () => setIsResizing(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isResizing])

  useEffect(() => {
    if (globeRef.current && containerRef.current) {
      const t = setTimeout(() => {
        globeRef.current?.width(containerRef.current.clientWidth)
        globeRef.current?.height(containerRef.current.clientHeight)
      }, 50)
      return () => clearTimeout(t)
    }
  }, [chartHeight, selectedCountry])

  // ── Derived / memoised data ───────────────────────────────────────────────

  const chartData = useMemo(() => generateCandlestickData(60), [selectedCountry])

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

  // ── Search handler ────────────────────────────────────────────────────────

  const handleSearchSubmit = e => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const q = searchQuery.toLowerCase()
    const found = Object.entries(COUNTRY_NAMES).find(
      ([iso2, name]) => iso2.toLowerCase() === q || name.toLowerCase().includes(q)
    )
    if (found) {
      const [iso2] = found
      const iso3   = ISO2_TO_ISO3[iso2]
      const feature = countriesFeatRef.current.find(f => f.properties.ISO_A3 === iso3)
      if (feature && globeRef.current) {
        setIsZooming(true); setSelectedCountry(iso2); loadCountryData(iso2)
        const { povLat, povLng, altitude, centerLat, centerLng } = getPointOfView(feature)
        setSelectedPoint({ lat: centerLat, lng: centerLng })
        globeRef.current.pointOfView({ lat: povLat, lng: povLng, altitude }, 1500)
        setTimeout(() => setIsZooming(false), 1500)
        setIsSearchOpen(false); setSearchQuery('')
      }
    }
  }

  // ── Tooltip renderer ──────────────────────────────────────────────────────

  const renderTooltip = () => {
    if (!tooltip.visible || !tooltip.content) return null
    const { content, x, y } = tooltip
    const chgClr  = content.change_pct > 0 ? '#089981' : content.change_pct < 0 ? '#f23645' : '#6b7280'
    const sign    = content.change_pct > 0 ? '+' : ''
    return (
      <div
        className="absolute pointer-events-none z-50 rounded-xl border border-white/10 px-3 py-2 shadow-2xl text-sm"
        style={{ left: x + 14, top: y + 14, background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(10px)' }}
      >
        <div className="font-bold text-white text-sm">{content.country}</div>
        <div className="text-white/50 text-xs">{content.name}</div>
        <div className="text-white/80 text-xs">Price: {content.current_price}</div>
        {content.change_pct !== null && (
          <div className="font-semibold text-xs" style={{ color: chgClr }}>
            {sign}{content.change_pct?.toFixed(2)}%
          </div>
        )}
      </div>
    )
  }

  // ── Loading / Error states ────────────────────────────────────────────────

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
        <span className="text-white/40 text-sm tracking-widest uppercase">Loading Globe…</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="text-danger text-sm">Error: {error}</div>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-white">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 relative overflow-hidden">

          {/* Globe canvas */}
          <div
            ref={containerRef}
            className="absolute top-0 left-0 right-0 bottom-0 transition-all duration-700 ease-in-out z-0"
            style={{
              right:  selectedCountry && !isZooming ? '320px' : '0px',
              bottom: selectedCountry && !isZooming ? `${chartHeight}px` : '0px',
            }}
          />

          {/* Tooltip */}
          {renderTooltip()}

          {/* Search */}
          <div className="absolute top-6 left-6 z-50 flex items-center gap-2">
            {!isSearchOpen ? (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-10 h-10 rounded-full bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors group"
              >
                <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            ) : (
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative">
                  <input
                    ref={searchRef}
                    autoFocus
                    type="text"
                    placeholder="Search country…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-10 w-64 bg-black/70 backdrop-blur border border-white/10 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-orange-500/50 transition-all pl-10 text-white"
                    onBlur={() => !searchQuery && setIsSearchOpen(false)}
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </form>
            )}
          </div>

          <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
            <button
              onClick={handleScrapeLatest}
              disabled={isScraping}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isScraping
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 cursor-not-allowed'
                  : 'bg-black/60 backdrop-blur border border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20'
              }`}
            >
              <svg
                className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isScraping ? 'Scraping...' : 'Scrape Latest'}
            </button>
            {Object.keys(scrapeStatus).length > 0 && (
              <div className="text-[10px] text-white/40 flex items-center gap-1">
                {scrapeStatus.ohlcv && (
                  <span className={scrapeStatus.ohlcv?.includes('error') ? 'text-red-400' : 'text-green-400'}>
                    OHLCV {scrapeStatus.ohlcv?.includes('error') ? '✗' : '✓'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-10 transition-all duration-500" style={{ opacity: isZooming ? 0 : 1 }}>
            <div className="bg-black/60 backdrop-blur border border-white/10 px-4 py-2 rounded-full text-xs text-white/60 flex items-center gap-2">
              <span>🌍</span>
              {selectedCountry
                ? <span>SELECTION: <strong className="text-orange-400 ml-1 uppercase">{COUNTRY_NAMES[selectedCountry]}</strong> — {COUNTRY_INDEX_MAP[selectedCountry]?.name}</span>
                : <span>Click a highlighted country to explore its markets</span>
              }
            </div>
          </div>

          {/* Color legend */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-black/60 backdrop-blur-md border border-white/5 p-4 rounded-xl z-10" style={{ bottom: selectedCountry && !isZooming ? `${chartHeight + 16}px` : '24px' }}>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Index Performance</span>
            <div className="flex flex-col gap-1.5 mt-1">
              {[
                { color: '#166534', label: '> +1.0%' },
                { color: '#4ade80', label: '0% to +1.0%' },
                { color: '#f87171', label: '-1.0% to 0%' },
                { color: '#991b1b', label: '< -1.0%' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                  <span className="text-[11px] text-white/70">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Candlestick chart bar (bottom) ── */}
          {selectedCountry && (
            <div
              className="absolute bottom-0 left-0 border-t border-white/5 backdrop-blur-md flex flex-col shrink-0 transition-all duration-700 ease-out z-20"
              style={{
                height: `${chartHeight}px`,
                background: 'rgba(13,15,20,0.85)',
                opacity: isZooming ? 0 : 1,
                transform: isZooming ? 'translateY(100%)' : 'translateY(0)',
                right: '320px',
              }}
            >
              {/* drag handle */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 cursor-row-resize transition-colors ${isResizing ? 'bg-orange-500/50' : 'hover:bg-orange-500/30'}`}
                onMouseDown={() => setIsResizing(true)}
              />
              <div className="flex-1 p-4 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-2 z-10">
                  <div>
                    <h3 className="text-sm font-semibold uppercase text-white/80 tracking-widest">
                      {COUNTRY_INDEX_MAP[selectedCountry]?.name || selectedCountry}
                    </h3>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-2xl font-bold text-white">
                        {selectedIndexData?.current_price ?? '—'}
                      </span>
                      {selectedIndexData?.change_pct != null && (
                        <span className={`text-sm mb-0.5 ${selectedIndexData.change_pct >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                          {selectedIndexData.change_pct >= 0 ? '+' : ''}{selectedIndexData.change_pct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 pt-16 pb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                      <XAxis dataKey="time" hide xAxisId={0} />
                      <XAxis dataKey="time" hide xAxisId={1} />
                      <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                      <YAxis yAxisId="volume" orientation="right" domain={[0, dataMax => dataMax * 5]} hide />
                      <Tooltip
                        cursor={{ fill: '#ffffff0a' }}
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            const d = payload[0].payload
                            return (
                              <div className="rounded-lg border border-white/10 p-2 text-[10px] font-mono" style={{ background: 'rgba(13,15,20,0.95)' }}>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                  <span className="text-white/40">O:</span><span className="text-white">{d.open.toFixed(2)}</span>
                                  <span className="text-white/40">H:</span><span className="text-white">{d.high.toFixed(2)}</span>
                                  <span className="text-white/40">L:</span><span className="text-white">{d.low.toFixed(2)}</span>
                                  <span className="text-white/40">C:</span><span style={{ color: d.close >= d.open ? '#089981' : '#f23645' }}>{d.close.toFixed(2)}</span>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="volume" yAxisId="volume" xAxisId={0} barCategoryGap="10%">
                        {chartData.map((entry, i) => (
                          <Cell key={`vol-${i}`} fill={entry.close >= entry.open ? '#08998144' : '#f2364544'} />
                        ))}
                      </Bar>
                      <Bar dataKey="bounds" shape={<Candlestick />} xAxisId={1} barCategoryGap="10%" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── Right panel: Forex + Calendar + News ── */}
          {selectedCountry && (
            <div
              className="absolute top-0 bottom-0 right-0 w-[320px] border-l border-white/5 flex flex-col shrink-0 transition-all duration-700 ease-out z-30"
              style={{
                background: 'rgba(13,15,20,0.88)',
                backdropFilter: 'blur(16px)',
                opacity: isZooming ? 0 : 1,
                transform: isZooming ? 'translateX(100%)' : 'translateX(0)',
              }}
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 bg-gradient-to-br from-orange-500/10 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                      {COUNTRY_NAMES[selectedCountry]}
                    </h2>
                    <p className="text-xs text-white/40 mt-0.5">{COUNTRY_INDEX_MAP[selectedCountry]?.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCountry(null); setSelectedPoint(null); setBubbles([])
                      if (globeRef.current) {
                        globeRef.current.controls().autoRotate = true
                        globeRef.current.pointOfView({ lat: 20, lng: 110, altitude: 3.5 }, 1200)
                      }
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Forex rates */}
                <div className="p-5 border-b border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-white/40 tracking-widest uppercase">Forex Rates</span>
                    <span className="text-[11px] font-bold text-orange-400 tracking-widest uppercase">
                      {COUNTRY_CURRENCY[ISO2_TO_ISO3[selectedCountry]] || 'USD'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 text-[11px] text-white/40 mb-2 uppercase pb-2 border-b border-white/5">
                    <div>Pair</div><div className="text-right">Rate</div><div className="text-right">Chg%</div>
                  </div>
                  <div className="flex flex-col">
                    {dynamicForexRates.map((fx, i) => (
                      <div key={i} className="grid grid-cols-3 text-sm items-center py-2 border-b border-white/5 last:border-none">
                        <div className="text-white/60 text-xs">{fx.pair}</div>
                        <div className="text-right text-white font-medium text-xs">{fx.rate}</div>
                        <div className={`text-right text-xs font-medium ${fx.chg >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                          {fx.chg > 0 ? '+' : ''}{fx.chg.toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Economic Calendar */}
                <div className="p-5 border-b border-white/5">
                  <span className="text-[11px] font-bold text-white/40 tracking-widest uppercase block mb-3">Economic Calendar</span>
                  {panelLoading ? (
                    <div className="text-xs text-white/40">Loading…</div>
                  ) : (
                    <EconomicCalendar events={calendarEvents} loading={false} />
                  )}
                </div>

                {/* News */}
                <div className="p-5">
                  <span className="text-[11px] font-bold text-white/40 tracking-widest uppercase block mb-3">Macro News</span>
                  {panelLoading ? (
                    <div className="text-xs text-white/40">Loading…</div>
                  ) : (
                    <MacroNewsPanel articles={newsArticles} loading={false} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}