import { useState, useEffect } from 'react'
import { MARKETS } from '../data/mockData'
import StockCard from '../components/StockCard'
import StockDetailModal from '../components/StockDetailModal'

export default function ScreenerView() {
  const [region, setRegion] = useState('US')
  const [search, setSearch] = useState('')
  const [selectedTicker, setSelectedTicker] = useState(null)

  const market = MARKETS[region]
  const allTickers = market.tickers
  const filtered = search
    ? allTickers.filter(t => t.toLowerCase().includes(search.toLowerCase()))
    : allTickers

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-white/5">
        <div className="flex gap-1">
          {Object.keys(MARKETS).map(r => (
            <button key={r} onClick={() => setRegion(r)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                region === r ? 'bg-accent text-white' : 'bg-surface text-white/50 hover:text-white hover:bg-surface/80'
              }`}>
              {r}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ticker..."
          className="flex-1 bg-surface border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-accent"
        />
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {filtered.map(ticker => (
            <StockCard key={ticker} ticker={ticker} onClick={() => setSelectedTicker(ticker)} />
          ))}
        </div>
      </div>
      {selectedTicker && (
        <StockDetailModal ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />
      )}
    </div>
  )
}