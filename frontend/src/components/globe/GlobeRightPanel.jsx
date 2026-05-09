import React from 'react'
import EconomicCalendar from '../EconomicCalendar'
import { COUNTRY_NAMES, COUNTRY_INDEX_MAP, COUNTRY_CURRENCY, ISO2_TO_ISO3 } from '../../utils/globeUtils'

export default function GlobeRightPanel({
  selectedCountry,
  isZooming,
  panelWidth,
  isResizingPanel,
  setIsResizingPanel,
  onClose,
  dynamicForexRates,
  calendarEvents,
  panelLoading
}) {
  if (!selectedCountry) return null

  return (
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
            onClick={onClose}
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
  )
}
