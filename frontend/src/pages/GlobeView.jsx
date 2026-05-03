import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Globe from 'globe.gl'
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis, XAxis } from 'recharts'
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
  const [panelWidth, setPanelWidth]           = useState(320)
  const [isResizingPanel, setIsResizingPanel] = useState(false)

  const [searchQuery,   setSearchQuery]   = useState('')
  const [isSearchOpen,  setIsSearchOpen]  = useState(false)
  const searchRef = useRef(null)

  const [calendarEvents, setCalendarEvents] = useState([])
  const [newsArticles,   setNewsArticles]   = useState([])
  const [panelLoading,   setPanelLoading]   = useState(false)

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null })
  const [scrapeStatus, setScrapeStatus] = useState({})
  const [ohlcvData, setOhlcvData] = useState([])
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
        const chgColor = idx.change_pct >= 0 ? 'var(--success)' : 'var(--danger)'
        el.innerHTML = `
          <div style="position:absolute;left:0;top:0;pointer-events:none;">
            <div style="position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);animation:pulse 2s infinite;"></div>
            <div style="position:absolute;left:0;top:-1px;width:130px;height:2px;background:var(--accent);"></div>
            <div style="position:absolute;left:130px;top:-2.5px;width:5px;height:5px;border-radius:50%;background:var(--accent);"></div>
            <div id="globe-label-card" style="
              position:absolute;left:146px;top:0;transform:translateY(-50%);
              background:var(--surface);backdrop-filter:blur(12px);
              border:1px solid var(--border);border-radius:12px;padding:14px 16px;
              box-shadow:0 0 40px rgba(0,0,0,0.15);width:220px;
              opacity:0;transform:translate(-10px,-50%);transition:all 0.45s cubic-bezier(0.4,0,0.2,1);">
              <h2 style="font-size:18px;font-weight:900;color:var(--text);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:2px;">${d.countryName}</h2>
              <p style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">${COUNTRY_INDEX_MAP[d.iso2]?.name || ''}</p>
              <div style="display:flex;align-items:baseline;gap:8px;">
                <span style="font-size:20px;font-weight:700;color:var(--text);">${idx.current_price ?? '—'}</span>
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
        try {
          const inst = globeRef.current;
          inst.controls().dispose?.();
          inst.renderer()?.dispose();
          inst._destructor?.();
        } catch(e) {}
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
    if (!isResizing && !isResizingPanel) return
    const onMouseMove = e => {
      const container = containerRef.current?.parentElement
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

  useEffect(() => {
    if (globeRef.current && containerRef.current) {
      const t = setTimeout(() => {
        globeRef.current?.width(containerRef.current.clientWidth)
        globeRef.current?.height(containerRef.current.clientHeight)
      }, 50)
      return () => clearTimeout(t)
    }
  }, [chartHeight, selectedCountry])

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

  // ── Derived / memoised data ───────────────────────────────────────────────

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
    const chgClr  = content.change_pct > 0 ? 'var(--success)' : content.change_pct < 0 ? 'var(--danger)' : 'var(--muted)'
    const sign    = content.change_pct > 0 ? '+' : ''
    return (
      <div
        className="absolute pointer-events-none z-50 rounded-xl border border-border px-3 py-2 shadow-2xl text-sm bg-surface backdrop-blur"
        style={{ left: x + 14, top: y + 14 }}
      >
        <div className="font-bold text-text text-sm">{content.country}</div>
        <div className="text-muted text-xs">{content.name}</div>
        <div className="text-text opacity-80 text-xs">Price: {content.current_price}</div>
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
        <div className="w-12 h-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        <span className="text-muted text-sm tracking-widest uppercase">Loading Globe…</span>
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
    <div className="flex h-full w-full overflow-hidden bg-background text-text">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 relative overflow-hidden">

          {/* Globe canvas */}
          <div
            ref={containerRef}
            className="absolute top-0 left-0 right-0 bottom-0 transition-all duration-700 ease-in-out z-0"
            style={{
              right:  selectedCountry && !isZooming ? `${panelWidth}px` : '0px',
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
                className="w-10 h-10 rounded-full bg-card backdrop-blur border border-border flex items-center justify-center hover:bg-surface transition-colors group"
              >
                <svg className="w-4 h-4 text-muted group-hover:text-text transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="h-10 w-64 bg-card backdrop-blur border border-border rounded-full px-4 py-2 text-xs focus:outline-none focus:border-accent transition-all pl-10 text-text"
                    onBlur={() => !searchQuery && setIsSearchOpen(false)}
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </form>
            )}
          </div>

          {/* Status badge */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-10 transition-all duration-500" style={{ opacity: isZooming ? 0 : 1 }}>
            <div className="bg-card backdrop-blur border border-border px-4 py-2 text-xs text-muted flex items-center gap-2">
              <span>🌍</span>
              {selectedCountry
                ? <span>SELECTION: <strong className="text-accent ml-1 uppercase">{COUNTRY_NAMES[selectedCountry]}</strong> — {COUNTRY_INDEX_MAP[selectedCountry]?.name}</span>
                : <span>Click a highlighted country to explore its markets</span>
              }
            </div>
          </div>

          {/* Color legend */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-surface backdrop-blur-md border border-border p-4 rounded-xl z-10" style={{ bottom: selectedCountry && !isZooming ? `${chartHeight + 16}px` : '24px' }}>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Index Performance</span>
            <div className="flex flex-col gap-1.5 mt-1">
              {[
                { color: '#166534', label: '> +1.0%' },
                { color: '#4ade80', label: '0% to +1.0%' },
                { color: '#f87171', label: '-1.0% to 0%' },
                { color: '#991b1b', label: '< -1.0%' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                  <span className="text-[11px] text-text opacity-70">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Candlestick chart bar (bottom) ── */}
          {selectedCountry && (
            <div
              className="absolute bottom-0 left-0 border-t border-border backdrop-blur-md flex flex-col shrink-0 transition-all duration-700 ease-out z-20 bg-surface"
              style={{
                height: `${chartHeight}px`,
                opacity: isZooming ? 0 : 1,
                transform: isZooming ? 'translateY(100%)' : 'translateY(0)',
                right: `${panelWidth}px`,
              }}
            >
              {/* drag handle */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 cursor-row-resize transition-colors ${isResizing ? 'bg-accent' : 'hover:bg-accent/50'}`}
                onMouseDown={() => setIsResizing(true)}
              />
              <div className="flex-1 p-4 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-2 z-10">
                  <div>
                    <h3 className="text-sm font-semibold uppercase text-text opacity-80 tracking-widest">
                      {COUNTRY_INDEX_MAP[selectedCountry]?.name || selectedCountry}
                    </h3>
                    <div className="flex items-end gap-2 mt-1">
                      <span className="text-2xl font-bold text-text">
                        {selectedIndexData?.current_price ?? '—'}
                      </span>
                      {selectedIndexData?.change_pct != null && (
                        <span className={`text-sm mb-0.5 ${selectedIndexData.change_pct >= 0 ? 'text-success' : 'text-danger'}`}>
                          {selectedIndexData.change_pct >= 0 ? '+' : ''}{selectedIndexData.change_pct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                 <div className="absolute inset-0 pt-16 pb-2">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                       <XAxis dataKey="time" hide />
                       <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                       <Tooltip
                         content={({ active, payload }) => {
                           if (active && payload?.length) {
                             const d = payload[0].payload
                             return (
                               <div className="p-2 text-[10px] font-mono border border-border bg-surface">
                                 <span className="text-text">Close: {d.close?.toFixed(2)}</span>
                               </div>
                             )
                           }
                           return null
                         }}
                       />
                       <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
              </div>
            </div>
          )}

          {/* ── Right panel: Forex + Calendar + News ── */}
          {selectedCountry && (
            <div
              className="absolute top-0 bottom-0 right-0 border-l border-border flex flex-col shrink-0 transition-all duration-700 ease-out z-30 bg-surface backdrop-blur-md"
              style={{
                width: `${panelWidth}px`,
                opacity: isZooming ? 0 : 1,
                transform: isZooming ? 'translateX(100%)' : 'translateX(0)',
              }}
            >
              <div
                className={`absolute top-0 bottom-0 left-0 w-1 cursor-col-resize transition-colors z-50 ${isResizingPanel ? 'bg-accent' : 'hover:bg-accent/50'}`}
                onMouseDown={() => setIsResizingPanel(true)}
              />
              {/* Header */}
              <div className="p-5 border-b border-border bg-gradient-to-br from-accent/20 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-text uppercase tracking-tight">
                      {COUNTRY_NAMES[selectedCountry]}
                    </h2>
                    <p className="text-xs text-muted mt-0.5">{COUNTRY_INDEX_MAP[selectedCountry]?.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCountry(null); setSelectedPoint(null); setBubbles([])
                      if (globeRef.current) {
                        globeRef.current.controls().autoRotate = true
                        globeRef.current.pointOfView({ lat: 20, lng: 110, altitude: 3.5 }, 1200)
                      }
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-border text-muted hover:text-text hover:border-accent transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Forex rates */}
                <div className="p-5 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-muted tracking-widest uppercase">Forex Rates</span>
                    <span className="text-[11px] font-bold text-accent tracking-widest uppercase">
                      {COUNTRY_CURRENCY[ISO2_TO_ISO3[selectedCountry]] || 'USD'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 text-[11px] text-muted mb-2 uppercase pb-2 border-b border-border">
                    <div>Pair</div><div className="text-right">Rate</div><div className="text-right">Chg%</div>
                  </div>
                  <div className="flex flex-col">
                    {dynamicForexRates.map((fx, i) => (
                      <div key={i} className="grid grid-cols-3 text-sm items-center py-2 border-b border-border last:border-none">
                        <div className="text-muted text-xs">{fx.pair}</div>
                        <div className="text-right text-text font-medium text-xs">{fx.rate}</div>
                        <div className={`text-right text-xs font-medium ${fx.chg >= 0 ? 'text-success' : 'text-danger'}`}>
                          {fx.chg > 0 ? '+' : ''}{fx.chg.toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Economic Calendar */}
                <div className="p-5">
                  <span className="text-[11px] font-bold text-muted tracking-widest uppercase block mb-3">Economic Calendar</span>
                  {panelLoading ? (
                    <div className="text-xs text-muted">Loading…</div>
                  ) : (
                    <EconomicCalendar events={calendarEvents} loading={false} />
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