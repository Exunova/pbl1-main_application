import React from 'react'
import { MARKETS } from '../../data/mockData'
import { COUNTRY_NAMES } from '../../utils/screenerUtils'

export default function ScreenerSidebar({ region, setRegion, regionKeys, sidebarWidth, isResizing, setIsResizing }) {
  return (
    <aside className="border-r flex flex-col shrink-0 bg-background relative" style={{ width: sidebarWidth, borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="p-6 border-b border-border">
        <h2 className="text-[10px] font-bold text-muted uppercase tracking-widest">
          Market Navigator
        </h2>
      </div>

      <div className="flex flex-col">
        {regionKeys.map(r => {
          const isActive = region === r;
          return (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`text-left px-6 py-4 text-[11px] font-bold uppercase tracking-widest transition-colors ${
              isActive
                ? 'bg-surface text-text border-l-2 border-l-text'
                : 'text-muted hover:bg-surface/30 hover:text-text border-l-2 border-l-transparent'
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{COUNTRY_NAMES[r] || r}</span>
              <span className={`text-[9px] ${isActive ? 'text-muted' : 'text-muted/50'}`}>({MARKETS[r].label})</span>
            </div>
          </button>
        )})}
      </div>

      <div
        className={`absolute top-0 right-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors ${isResizing ? 'bg-accent' : 'hover:bg-accent/50'}`}
        onMouseDown={() => setIsResizing(true)}
      />
    </aside>
  )
}
