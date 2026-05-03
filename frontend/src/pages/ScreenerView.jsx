import { useState, useEffect, useMemo } from 'react'
import { stockScreenerData, MARKETS } from '../data/mockData'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { Search, TrendingUp, TrendingDown } from 'lucide-react'
import StockDetailPanel from './StockDetailPanel'

const COUNTRY_NAMES = {
  US: 'United States',
  ID: 'Indonesia',
  JP: 'Japan',
  GB: 'United Kingdom'
}

function StockCard({ stock, onClick }) {
  const [liveData, setLiveData] = useState(null)
  const [sparkline, setSparkline] = useState([])

  useEffect(() => {
    let cancelled = false
    if (!window.api) return

    window.api.fetchCompany(stock.ticker).then(d => {
      const respData = d?.data || d 
      if (cancelled || !respData?.info?.price) return
      const cur = respData.info.price.currentPrice
      const prv = respData.info.price.previousClose
      if (cur != null) {
        setLiveData({
          price: cur,
          changePct: (cur && prv) ? +((cur - prv) / prv * 100).toFixed(2) : null,
        })
      }
    }).catch(() => {})

    window.api.fetchOHLCV(stock.ticker).then(d => {
      if (cancelled) return
      const respData = d?.data || d
      const candles = respData?.ohlcv_15m || []
      if (candles.length > 0) {
        const all = candles.map((c, i) => ({ i, v: c.close }))
        setSparkline(all)
      }
    }).catch(() => {})

    return () => { cancelled = true }
  }, [stock.ticker])

  const displayPrice = liveData?.price ?? parseFloat(String(stock.price).replace(/,/g, '')) ?? 0
  const displayChange = liveData?.changePct ?? stock.change
  const isUp = displayChange >= 0
  const color = isUp ? 'var(--success)' : 'var(--danger)'

  const fallbackSparkline = useMemo(() => {
    let p = displayPrice
    return Array.from({ length: 50 }, (_, i) => {
      p += (Math.random() - 0.49) * p * 0.008
      return { i, v: p }
    })
  }, [stock.ticker, displayPrice])

  const chartData = sparkline.length > 0 ? sparkline : fallbackSparkline

  return (
  <div
    onClick={() => onClick(stock)}
    className="bg-surface border border-border p-4 hover:border-white/40 cursor-pointer transition-all duration-200 hover:bg-white/5 group flex flex-col"
  >
    <div className="flex justify-between items-start mb-3 gap-2">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold tracking-widest text-text truncate uppercase group-hover:text-white transition-colors">
          {stock.ticker}
        </h3>
        <p className="text-[10px] text-muted uppercase tracking-widest mt-1 truncate">
          {stock.name}
        </p>
      </div>

      <div className="text-right shrink-0">
        <div className="text-sm font-bold text-text number-font leading-none">
          {typeof displayPrice === 'number'
            ? displayPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : displayPrice}
        </div>

        <div
          className={`text-[10px] font-bold mt-1.5 flex items-center justify-end gap-1 number-font ${
            isUp ? 'text-success' : 'text-danger'
          }`}
        >
          {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isUp ? '+' : ''}
          {displayChange?.toFixed ? displayChange.toFixed(2) : displayChange}%
        </div>
      </div>
    </div>

    <div className="h-10 w-full opacity-80 group-hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div className="mt-3 flex items-start justify-between border-t border-border/50 pt-2 gap-2">
      <span className="text-[9px] text-muted uppercase tracking-widest leading-tight flex-1">
        {stock.sector}
      </span>
      <span className="text-[9px] text-muted/50 uppercase tracking-widest leading-tight text-right flex-1">
        {stock.industry}
      </span>
    </div>
  </div>
)
}

export default function ScreenerView() {
  const [selectedStock, setSelectedStock] = useState(null)
  const [region, setRegion]               = useState('US')
  const [search, setSearch]               = useState('')

  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    if (!isResizing) return
    const onMouseMove = e => {
      const newW = Math.max(150, Math.min(500, e.clientX))
      setSidebarWidth(newW)
    }
    const onMouseUp = () => setIsResizing(false)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isResizing])

  const availableTickers = MARKETS[region]?.tickers || [];
  
  const stocks = stockScreenerData.filter(s =>
    availableTickers.includes(s.ticker) &&
    (!search || s.ticker.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
  )

  const regionKeys = Object.keys(MARKETS);

  return (
  <div className="w-full h-full flex flex-col bg-background relative overflow-hidden text-text">

    <div className="flex-1 flex overflow-hidden">

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

      <main className="flex-1 flex flex-col overflow-hidden bg-background">

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

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {stocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 border border-dashed border-border/50 bg-surface/10">
              <Search size={32} className="text-muted/20" />
              <span className="text-xs text-muted uppercase tracking-widest">No assets matched</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {stocks.map(stock => (
                <StockCard key={stock.ticker} stock={stock} onClick={setSelectedStock} />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>

    {selectedStock && (
      <div className="absolute inset-0 z-[100] bg-background">
        <StockDetailPanel
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      </div>
    )}

  </div>
)
}
