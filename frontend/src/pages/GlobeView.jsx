import React, { useEffect, useRef } from 'react'
import Globe from 'globe.gl'
import { useGlobeData } from '../hooks/useGlobeData'
import { getCountryColor, getPointOfView, ISO2_TO_ISO3, ISO3_TO_ISO2, COUNTRY_INDEX_MAP, COUNTRY_NAMES } from '../utils/globeUtils'
import GlobeSearchBar from '../components/globe/GlobeSearchBar'
import GlobeLegend from '../components/globe/GlobeLegend'
import GlobeBottomChart from '../components/globe/GlobeBottomChart'
import GlobeRightPanel from '../components/globe/GlobeRightPanel'
import GlobeTooltip from '../components/globe/GlobeTooltip'

export default function GlobeView() {
  const containerRef = useRef(null)
  const globeRef = useRef(null)
  const selectedRef = useRef(null)

  const g = useGlobeData()

  // keep selectedRef in sync for globe instance closures
  useEffect(() => { selectedRef.current = g.selectedCountry }, [g.selectedCountry])

  // update polygons color when indicesData changes
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.polygonCapColor(d => {
        const iso3 = d.properties.ISO_A3
        const iso2 = ISO3_TO_ISO2[iso3]
        if (selectedRef.current && ISO2_TO_ISO3[selectedRef.current] === iso3)
          return 'rgba(249,115,22,0.45)'
        const idx = g.indexMapRef.current[iso3]
        if (!idx && !iso2) return 'rgba(30,30,30,0.4)'
        if (!idx) return 'rgba(55,65,81,0.6)'
        return getCountryColor(idx.change_pct)
      })
    }
  }, [g.indicesData, g.indexMapRef])

  // init globe
  useEffect(() => {
    if (!g.worldData || !containerRef.current || g.loading) return
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

    globeInstance
      .polygonsData(g.countriesFeatRef.current)
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
        const idx = g.indexMapRef.current[iso3]
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
          g.setSelectedCountry(null); g.setSelectedPoint(null); g.setBubbles([])
          controls.autoRotate = true
          globeInstance.pointOfView({ lat: 20, lng: 110, altitude: 3.5 }, 1200)
          return
        }

        g.setIsZooming(true); g.setSelectedCountry(iso2)
        g.loadCountryData(iso2)

        const feature = g.countriesFeatRef.current.find(f => f.properties.ISO_A3 === iso3)
        if (feature) {
          const { povLat, povLng, altitude, centerLat, centerLng } = getPointOfView(feature)
          g.setSelectedPoint({ lat: centerLat, lng: centerLng })
          globeInstance.pointOfView({ lat: povLat, lng: povLng, altitude }, 1500)
        }
        controls.autoRotate = false
        setTimeout(() => g.setIsZooming(false), 1500)
      })
      .onPolygonHover((polygon, event) => {
        if (!selectedRef.current) controls.autoRotate = !polygon
        if (containerRef.current)
          containerRef.current.style.cursor = polygon ? 'pointer' : 'default'

        if (polygon) {
          const iso3 = polygon.properties.ISO_A3
          const iso2 = ISO3_TO_ISO2[iso3]
          const idx  = g.indexMapRef.current[iso3]
          const mapEntry = iso2 ? COUNTRY_INDEX_MAP[iso2] : null
          let content = { country: iso2 || 'Unknown', name: 'No data', current_price: 'N/A', change_pct: null }
          if (idx && mapEntry) {
            content = { country: mapEntry.name, name: idx.name, current_price: idx.current_price, change_pct: idx.change_pct }
          }
          const rect  = containerRef.current?.getBoundingClientRect()
          const clX   = event?.clientX ?? 0
          const clY   = event?.clientY ?? 0
          g.setTooltip({ visible: true, x: rect ? clX - rect.left : 0, y: rect ? clY - rect.top : 0, content })
        } else {
          g.setTooltip(prev => ({ ...prev, visible: false }))
        }
      })
      .onGlobeClick(() => {
        controls.autoRotate = true
        g.setSelectedCountry(null); g.setSelectedPoint(null); g.setBubbles([])
        globeInstance.pointOfView({ lat: 20, lng: 110, altitude: 3.5 }, 1200)
      })

    globeInstance
      .pointsData([])
      .htmlElementsData([])
      .htmlLat(d => d.lat)
      .htmlLng(d => d.lng)
      .htmlAltitude(0.01)
      .htmlElement(d => {
        const el = document.createElement('div')
        const idx  = g.indexMapRef.current[ISO2_TO_ISO3[d.iso2]] || {}
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
  }, [g.worldData, g.loading, g.loadCountryData, g.countriesFeatRef, g.indexMapRef])

  // Sync globe visuals when selectedCountry changes
  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = !g.selectedCountry

    globeRef.current
      .polygonAltitude(d => {
        const iso3 = d.properties.ISO_A3
        return g.selectedCountry && ISO2_TO_ISO3[g.selectedCountry] === iso3 ? 0.015 : 0.006
      })
      .polygonCapColor(d => {
        const iso3 = d.properties.ISO_A3
        const iso2 = ISO3_TO_ISO2[iso3]
        if (g.selectedCountry && ISO2_TO_ISO3[g.selectedCountry] === iso3)
          return 'rgba(249,115,22,0.45)'
        const idx = g.indexMapRef.current[iso3]
        if (!idx && !iso2) return 'rgba(30,30,30,0.4)'
        if (!idx) return 'rgba(55,65,81,0.6)'
        return getCountryColor(idx.change_pct)
      })
      .polygonStrokeColor(d => {
        const iso3 = d.properties.ISO_A3
        const iso2 = ISO3_TO_ISO2[iso3]
        if (g.selectedCountry && ISO2_TO_ISO3[g.selectedCountry] === iso3) return '#fb923c'
        return iso2 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)'
      })
      .pointsData([])

    const htmlData = g.selectedCountry && !g.isZooming && g.selectedPoint ? [{
      lat: g.selectedPoint.lat,
      lng: g.selectedPoint.lng,
      iso2: g.selectedCountry,
      countryName: COUNTRY_NAMES[g.selectedCountry] || g.selectedCountry,
    }] : []
    globeRef.current.htmlElementsData(htmlData)
  }, [g.selectedCountry, g.bubbles, g.isZooming, g.selectedPoint, g.indicesData, g.indexMapRef])

  useEffect(() => {
    if (globeRef.current && containerRef.current) {
      const t = setTimeout(() => {
        globeRef.current?.width(containerRef.current.clientWidth)
        globeRef.current?.height(containerRef.current.clientHeight)
      }, 50)
      return () => clearTimeout(t)
    }
  }, [g.chartHeight, g.selectedCountry])

  const handleSearchSubmit = e => {
    e.preventDefault()
    if (!g.searchQuery.trim()) return
    const q = g.searchQuery.toLowerCase()
    const found = Object.entries(COUNTRY_NAMES).find(
      ([iso2, name]) => iso2.toLowerCase() === q || name.toLowerCase().includes(q)
    )
    if (found) {
      const [iso2] = found
      const iso3   = ISO2_TO_ISO3[iso2]
      const feature = g.countriesFeatRef.current.find(f => f.properties.ISO_A3 === iso3)
      if (feature && globeRef.current) {
        g.setIsZooming(true); g.setSelectedCountry(iso2); g.loadCountryData(iso2)
        const { povLat, povLng, altitude, centerLat, centerLng } = getPointOfView(feature)
        g.setSelectedPoint({ lat: centerLat, lng: centerLng })
        globeRef.current.pointOfView({ lat: povLat, lng: povLng, altitude }, 1500)
        setTimeout(() => g.setIsZooming(false), 1500)
        g.setIsSearchOpen(false); g.setSearchQuery('')
      }
    }
  }

  if (g.loading) return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        <span className="text-muted text-sm tracking-widest uppercase">Loading Globe…</span>
      </div>
    </div>
  )

  if (g.error) return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="text-danger text-sm">Error: {g.error}</div>
    </div>
  )

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-text">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 relative overflow-hidden">
          {/* Globe canvas */}
          <div
            ref={containerRef}
            className="absolute top-0 left-0 right-0 bottom-0 transition-all duration-700 ease-in-out z-0"
            style={{
              right:  g.selectedCountry && !g.isZooming ? `${g.panelWidth}px` : '0px',
              bottom: g.selectedCountry && !g.isZooming ? `${g.chartHeight}px` : '0px',
            }}
          />

          <GlobeTooltip tooltip={g.tooltip} />

          <GlobeSearchBar 
            isSearchOpen={g.isSearchOpen}
            setIsSearchOpen={g.setIsSearchOpen}
            searchQuery={g.searchQuery}
            setSearchQuery={g.setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
          />

          <GlobeLegend 
            selectedCountry={g.selectedCountry}
            isZooming={g.isZooming}
            chartHeight={g.chartHeight}
          />

          <GlobeBottomChart 
            selectedCountry={g.selectedCountry}
            selectedIndexData={g.selectedIndexData}
            chartData={g.chartData}
            chartHeight={g.chartHeight}
            isZooming={g.isZooming}
            panelWidth={g.panelWidth}
            isResizing={g.isResizing}
            setIsResizing={g.setIsResizing}
          />

          <GlobeRightPanel 
            selectedCountry={g.selectedCountry}
            isZooming={g.isZooming}
            panelWidth={g.panelWidth}
            isResizingPanel={g.isResizingPanel}
            setIsResizingPanel={g.setIsResizingPanel}
            dynamicForexRates={g.dynamicForexRates}
            calendarEvents={g.calendarEvents}
            panelLoading={g.panelLoading}
            onClose={() => {
              g.setSelectedCountry(null); g.setSelectedPoint(null); g.setBubbles([])
              if (globeRef.current) {
                globeRef.current.controls().autoRotate = true
                globeRef.current.pointOfView({ lat: 20, lng: 110, altitude: 3.5 }, 1200)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}