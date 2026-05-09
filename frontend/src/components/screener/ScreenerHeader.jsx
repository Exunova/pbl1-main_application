import React from 'react'
import { Search } from 'lucide-react'
import { MARKETS } from '../../data/mockData'
import { COUNTRY_NAMES } from '../../utils/screenerUtils'

export default function ScreenerHeader({ region, search, setSearch, availableTickers }) {
  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0 bg-background">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-widest text-text uppercase">
          {COUNTRY_NAMES[region]} Market
        </h1>
        <p className="text-[10px] text-muted mt-1 uppercase tracking-widest">
          Index: {MARKETS[region].label} • {availableTickers.length} Tracked Constituents
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search ticker..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-surface border border-border pl-9 pr-4 py-2.5 text-xs text-text placeholder:text-muted/50 outline-none focus:border-white transition-colors w-64 uppercase tracking-wider"
          />
        </div>
      </div>
    </div>
  )
}
