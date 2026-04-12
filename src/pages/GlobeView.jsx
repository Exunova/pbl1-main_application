import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import EconomicCalendar from '../components/EconomicCalendar'
import MacroNewsPanel from '../components/MacroNewsPanel'

const COUNTRY_INDEX_MAP = {
  US: { index: '^GSPC', name: 'S&P 500' },
  ID: { index: '^JKLQ45', name: 'LQ45' },
  JP: { index: '^N225', name: 'Nikkei 225' },
  GB: { index: '^FTSE', name: 'FTSE 100' },
}

const COUNTRY_ISO_TO_CODE = {
  840: 'US',
  360: 'ID',
  392: 'JP',
  826: 'GB',
}

const COLOR_POSITIVE = '#22c55e'
const COLOR_NEGATIVE = '#ef4444'
const COLOR_NEUTRAL = '#374151'
const OCEAN_COLOR = '#0d1220'
const BORDER_COLOR = '#1e2433'

function getColor(changePct, magnitude) {
  if (changePct === null || changePct === undefined) return COLOR_NEUTRAL
  const opacity = Math.min(Math.max(Math.abs(magnitude || changePct) / 5, 0.3), 1.0)
  const color = changePct > 0 ? COLOR_POSITIVE : changePct < 0 ? COLOR_NEGATIVE : COLOR_NEUTRAL
  const rgb = d3.color(color)
  return rgb ? rgb.copy({ opacity }) : color
}

export default function GlobeView() {
  const svgRef = useRef(null)
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
      const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
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
    setPanelLoading(true)
    try {
      const cc = COUNTRY_INDEX_MAP[countryCode]?.index
      if (cc) {
        const [macroData, newsData] = await Promise.all([
          window.api.fetchMacro(cc),
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
    if (!worldData || !svgRef.current || loading) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth || 1200
    const height = svgRef.current.clientHeight || 700

    const projection = d3.geoNaturalEarth1().fitSize([width, height], { type: 'Sphere' })
    const path = d3.geoPath().projection(projection)

    const indexMap = {}
    indicesData.forEach(idx => {
      const entry = Object.entries(COUNTRY_INDEX_MAP).find(([, v]) => v.index === idx.index)
      if (entry) indexMap[entry[0]] = idx
    })

    const countries = topojson.feature(worldData, worldData.objects.countries)
    const borders = topojson.mesh(worldData, worldData.objects.countries, (a, b) => a !== b)

    svg.append('path')
      .datum({ type: 'Sphere' })
      .attr('d', path)
      .attr('fill', OCEAN_COLOR)

    const countryGroup = svg.append('g')

    countryGroup.selectAll('path')
      .data(countries.features)
      .join('path')
      .attr('d', path)
      .attr('fill', d => {
        const isoNum = +d.id
        const code = COUNTRY_ISO_TO_CODE[isoNum]
        if (!code) return COLOR_NEUTRAL
        const idx = indexMap[code]
        if (!idx) return COLOR_NEUTRAL
        return getColor(idx.change_pct, idx.change_pct)
      })
      .attr('stroke', BORDER_COLOR)
      .attr('stroke-width', 0.5)
      .style('cursor', d => {
        const isoNum = +d.id
        return COUNTRY_ISO_TO_CODE[isoNum] ? 'pointer' : 'default'
      })
      .on('mouseenter', function (event, d) {
        const isoNum = +d.id
        const code = COUNTRY_ISO_TO_CODE[isoNum]
        const idx = code ? indexMap[code] : null
        const mapEntry = code ? COUNTRY_INDEX_MAP[code] : null

        let content = { country: code || 'Unknown', name: 'No data', current_price: 'N/A', change_pct: null }
        if (idx && mapEntry) {
          content = {
            country: mapEntry.name,
            name: idx.name,
            current_price: idx.current_price,
            change_pct: idx.change_pct,
          }
        }

        const rect = svgRef.current.getBoundingClientRect()
        setTooltip({ visible: true, x: event.clientX - rect.left, y: event.clientY - rect.top, content })
        d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1)
      })
      .on('mousemove', function (event) {
        const rect = svgRef.current.getBoundingClientRect()
        setTooltip(prev => ({ ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top }))
      })
      .on('mouseleave', function () {
        setTooltip(prev => ({ ...prev, visible: false }))
        d3.select(this).attr('stroke', BORDER_COLOR).attr('stroke-width', 0.5)
      })
      .on('click', function (event, d) {
        event.stopPropagation()
        const isoNum = +d.id
        const code = COUNTRY_ISO_TO_CODE[isoNum]
        if (!code) return
        if (selectedCountry === code) {
          setSelectedCountry(null)
        } else {
          setSelectedCountry(code)
          loadCountryData(code)
        }
      })

    svg.append('path')
      .datum(borders)
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', BORDER_COLOR)
      .attr('stroke-width', 0.3)

    svg.on('click', () => setSelectedCountry(null))

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
        <div className="text-gray-400 text-lg">Loading map...</div>
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
      <svg ref={svgRef} className="w-full h-full" style={{ background: OCEAN_COLOR }} />

      {renderTooltip()}

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
                    <EconomicCalendar events={calendarEvents} />
                  </div>
                  <div className="p-4 border-t border-gray-800">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Macro News</h3>
                    <MacroNewsPanel articles={newsArticles} />
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
