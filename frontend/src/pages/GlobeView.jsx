import { useEffect, useRef, useState, useCallback } from 'react'
import Globe from 'globe.gl'
import EconomicCalendar from '../components/EconomicCalendar'
import MacroNewsPanel from '../components/MacroNewsPanel'

const COUNTRY_INDEX_MAP = {
  US: { index: '^GSPC', name: 'S&P 500' },
  ID: { index: '^JKLQ45', name: 'LQ45' },
  JP: { index: '^N225', name: 'Nikkei 225' },
  GB: { index: '^FTSE', name: 'FTSE 100' },
}

const ISO2_TO_ISO3 = {
  US: 'USA',
  ID: 'IDN',
  JP: 'JPN',
  GB: 'GBR',
}

const ISO3_TO_ISO2 = {
  USA: 'US',
  IDN: 'ID',
  JPN: 'JP',
  GBR: 'GB',
}

const GEO_JSON_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'

const COLOR_LEGEND = {
  change_gt_1: '#166534',
  change_gt_0: '#4ade80',
  change_lt_0: '#f87171',
  change_lt_neg1: '#991b1b',
  no_data: '#374151',
}

function getCountryColor(changePct) {
  if (changePct === null || changePct === undefined) return COLOR_LEGEND.no_data
  if (changePct > 1) return COLOR_LEGEND.change_gt_1
  if (changePct > 0) return COLOR_LEGEND.change_gt_0
  if (changePct < -1) return COLOR_LEGEND.change_lt_neg1
  return COLOR_LEGEND.change_lt_0
}

export default function GlobeView() {
  const containerRef = useRef(null)
  const globeRef = useRef(null)
  const [worldData, setWorldData] = useState(null)
  const [indicesData, setIndicesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null })
  const [calendarEvents, setCalendarEvents] = useState([])
  const [newsArticles, setNewsArticles] = useState([])
  const [panelLoading, setPanelLoading] = useState(false)

  const fetchMapData = useCallback(async () => {
    try {
      const response = await fetch(GEO_JSON_URL)
      if (!response.ok) throw new Error('Failed to fetch world topology')
      const data = await response.json()
      setWorldData(data)
      return data
    } catch (err) {
      setError(err.message)
      setLoading(false)
      return null
    }
  }, [])

  const fetchIndexData = useCallback(async () => {
    if (!window.api) {
      console.warn('window.api not available yet')
      setIndicesData([])
      return []
    }
    try {
      const indices = await window.api.fetchIndices()
      setIndicesData(indices || [])
      return indices
    } catch (err) {
      console.error('Failed to fetch indices:', err)
      setIndicesData([])
      return []
    }
  }, [])

  const loadCountryData = useCallback(async (countryCode) => {
    if (!window.api) {
      console.warn('window.api not available yet')
      setCalendarEvents([])
      setNewsArticles([])
      setPanelLoading(false)
      return
    }
    setPanelLoading(true)
    try {
      if (countryCode) {
        const [macroData, newsData] = await Promise.all([
          window.api.fetchMacro(countryCode),
          window.api.fetchNews(countryCode),
        ])
        setCalendarEvents(macroData?.events || [])
        setNewsArticles(newsData?.articles || [])
      } else {
        setCalendarEvents([])
        setNewsArticles([])
      }
    } catch (err) {
      console.error('Failed to load country data:', err)
      setCalendarEvents([])
      setNewsArticles([])
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
    if (!worldData || !containerRef.current || loading) return

    const indexMap = {}
    indicesData.forEach(idx => {
      const iso3 = ISO2_TO_ISO3[idx.country]
      if (iso3) {
        indexMap[iso3] = idx
      }
    })

    const globeInstance = Globe()
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundColor('#0d0f14')
      .atmosphereColor('#3b82f6')
      .atmosphereAltitude(0.15)
      .width(containerRef.current.clientWidth)
      .height(containerRef.current.clientHeight)

    const controls = globeInstance.controls()
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.5
    controls.enablePan = false
    controls.minDistance = 200
    controls.maxDistance = 500

    const countries = worldData.features.filter(d => d.properties.ISO_A3 !== 'AQ')

    globeInstance
      .polygonsData(countries)
      .polygonAltitude(0.01)
      .polygonCapColor(d => {
        const countryId = d.properties.ISO_A3
        const idx = indexMap[countryId]
        if (!idx) return COLOR_LEGEND.no_data
        return getCountryColor(idx.change_pct)
      })
      .polygonSideColor(() => 'rgba(0, 0, 0, 0.1)')
      .polygonStrokeColor(() => '#111')
      .onPolygonClick((polygon) => {
        const iso3 = polygon.properties.ISO_A3
        const iso2 = ISO3_TO_ISO2[iso3]
        if (!iso2) return
        if (selectedCountry === iso2) {
          setSelectedCountry(null)
        } else {
          setSelectedCountry(iso2)
          loadCountryData(iso2)
        }
      })
      .onPolygonHover((polygon) => {
        controls.autoRotate = !polygon
        if (containerRef.current) {
          containerRef.current.style.cursor = polygon ? 'pointer' : 'default'
        }
        if (polygon) {
          const iso3 = polygon.properties.ISO_A3
          const iso2 = ISO3_TO_ISO2[iso3]
          const idx = indexMap[iso3]
          const mapEntry = iso2 ? COUNTRY_INDEX_MAP[iso2] : null

          let content = { country: iso2 || 'Unknown', name: 'No data', current_price: 'N/A', change_pct: null }
          if (idx && mapEntry) {
            content = {
              country: mapEntry.name,
              name: idx.name,
              current_price: idx.current_price,
              change_pct: idx.change_pct,
            }
          }

          const rect = containerRef.current.getBoundingClientRect()
          setTooltip({ visible: true, x: event.clientX - rect.left, y: event.clientY - rect.top, content })
        } else {
          setTooltip(prev => ({ ...prev, visible: false }))
        }
      })

    globeRef.current = globeInstance

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
        const scene = globeRef.current.scene()
        const renderer = globeRef.current.renderer()
        if (renderer) renderer.dispose()
      }
    }
  }, [worldData, indicesData, loading, selectedCountry, loadCountryData])

  const renderTooltip = () => {
    if (!tooltip.visible || !tooltip.content) return null
    const { content, x, y } = tooltip
    const changeColor = content.change_pct > 0 ? 'text-green-500' : content.change_pct < 0 ? 'text-red-500' : 'text-gray-400'
    const changeSign = content.change_pct > 0 ? '+' : ''

    return (
      <div
        className="absolute pointer-events-none z-50 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl text-sm"
        style={{ left: x + 12, top: y + 12 }}
      >
        <div className="font-semibold text-white">{content.country}</div>
        <div className="text-gray-400">{content.name}</div>
        <div className="text-gray-300">Price: {content.current_price}</div>
        <div className={`font-medium ${changeColor}`}>
          {changeSign}{content.change_pct !== null ? `${content.change_pct.toFixed(2)}%` : 'N/A'}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0d0f14]">
        <div className="text-gray-400 text-lg">Loading globe...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0d0f14]">
        <div className="text-red-400 text-lg">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-[#0d0f14] overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {renderTooltip()}

      <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-[#12151c]/80 backdrop-blur-md border border-gray-800 p-4 rounded-lg z-10">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Index Performance</span>
        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#166534]" />
            <span className="text-[11px] text-gray-300">&gt; +1.0%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#4ade80]" />
            <span className="text-[11px] text-gray-300">0% to +1.0%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f87171]" />
            <span className="text-[11px] text-gray-300">-1.0% to 0%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#991b1b]" />
            <span className="text-[11px] text-gray-300">&lt; -1.0%</span>
          </div>
        </div>
      </div>

      <div
        className={`absolute top-0 right-0 h-full bg-[#12151c] border-l border-gray-800 transition-transform duration-300 ease-in-out ${
          selectedCountry ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        {selectedCountry && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                {COUNTRY_INDEX_MAP[selectedCountry]?.name || selectedCountry}
              </h2>
              <p className="text-sm text-gray-400">
                {selectedCountry === 'US' && 'United States'}
                {selectedCountry === 'ID' && 'Indonesia'}
                {selectedCountry === 'JP' && 'Japan'}
                {selectedCountry === 'GB' && 'United Kingdom'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {panelLoading ? (
                <div className="p-4 text-gray-400 text-center">Loading...</div>
              ) : (
                <>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Economic Calendar</h3>
                    <EconomicCalendar events={calendarEvents} loading={panelLoading} />
                  </div>
                  <div className="p-4 border-t border-gray-800">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Macro News</h3>
                    <MacroNewsPanel articles={newsArticles} loading={panelLoading} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}