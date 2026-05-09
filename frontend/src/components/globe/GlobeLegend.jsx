import React from 'react'
import { COUNTRY_NAMES, COUNTRY_INDEX_MAP } from '../../utils/globeUtils'

export default function GlobeLegend({ selectedCountry, isZooming, chartHeight }) {
  return (
    <>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none z-10 transition-all duration-500" style={{ opacity: isZooming ? 0 : 1 }}>
        <div className="bg-card backdrop-blur border border-border px-4 py-2 text-xs text-muted flex items-center gap-2">
          <span>🌍</span>
          {selectedCountry
            ? <span>SELECTION: <strong className="text-accent ml-1 uppercase">{COUNTRY_NAMES[selectedCountry]}</strong> — {COUNTRY_INDEX_MAP[selectedCountry]?.name}</span>
            : <span>Click a highlighted country to explore its markets</span>
          }
        </div>
      </div>

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
    </>
  )
}
