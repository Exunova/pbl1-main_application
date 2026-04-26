import { useState, useEffect, useRef, useMemo } from 'react'
import { stockScreenerData } from '../data/mockData'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react'
import StockDetailPanel from './StockDetailPanel'

// ─── Regions ──────────────────────────────────────────────────────────────────

const REGIONS = ['Asia Pacific', 'Americas', 'Europe', 'Middle East']

// ─── StockCard ────────────────────────────────────────────────────────────────

function StockCard({ stock, onClick }) {
  const [liveData, setLiveData] = useState(null)
  const [sparkline, setSparkline] = useState([])

  useEffect(() => {
    let cancelled = false
    if (!window.api) return

    // Try to get real price from company_info cache
    window.api.fetchCompany(stock.ticker).then(d => {
      const respData = d?.data || d // handle both wrapped and unwrapped for safety
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

    // Sparkline from OHLCV
    window.api.fetchOHLCV(stock.ticker).then(d => {
      if (cancelled) return
      const respData = d?.data || d
      const candles = respData?.ohlcv_15m || []
      if (candles.length > 0) {
        const last30 = candles.slice(-30).map((c, i) => ({ i, v: c.close }))
        setSparkline(last30)
      }
    }).catch(() => {})

    return () => { cancelled = true }
  }, [stock.ticker])

  const displayPrice = liveData?.price ?? parseFloat(String(stock.price).replace(/,/g, '')) ?? 0
  const displayChange = liveData?.changePct ?? stock.change
  const isUp = displayChange >= 0
  const color = isUp ? '#22c55e' : '#ef4444'

  // fallback sparkline from mock price
  const fallbackSparkline = useMemo(() => {
    let p = displayPrice
    return Array.from({ length: 20 }, (_, i) => {
      p += (Math.random() - 0.49) * p * 0.008
      return { i, v: p }
    })
  }, [stock.ticker])

  const chartData = sparkline.length > 0 ? sparkline : fallbackSparkline

  return (
  <div
    onClick={() => onClick(stock)}
    className="bg-card border border-border p-4 rounded-xl hover:border-accent/40 cursor-pointer transition-all duration-200 hover:bg-border/30 active:scale-[0.98] group"
  >
    <div className="flex justify-between items-start mb-3 gap-2">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold tracking-tight text-text truncate group-hover:text-accent transition-colors">
          {stock.ticker}
        </h3>
        <p className="text-[10px] text-muted uppercase font-medium tracking-wider leading-none mt-1 truncate">
          {stock.name}
        </p>
      </div>

      <div className="text-right shrink-0">
        <div className="text-sm font-mono font-bold text-text leading-none">
          {typeof displayPrice === 'number'
            ? displayPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : displayPrice}
        </div>

        <div
          className={`text-[10px] font-bold mt-1.5 flex items-center justify-end gap-0.5 ${
            isUp ? 'text-success' : 'text-danger'
          }`}
        >
          {isUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
          {isUp ? '+' : ''}
          {displayChange?.toFixed ? displayChange.toFixed(2) : displayChange}%
        </div>
      </div>
    </div>

    {/* Sparkline */}
    <div className="h-10 w-full">
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

    {/* Sector tag */}
    <div className="mt-2 flex items-center justify-between">
      <span className="text-[9px] text-muted uppercase tracking-widest truncate">
        {stock.sector}
      </span>
      <span className="text-[9px] text-muted/70 uppercase tracking-widest">
        {stock.industry?.slice(0, 8)}
      </span>
    </div>
  </div>
)
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function ScreenerView() {
  const [selectedStock, setSelectedStock] = useState(null)
  const [region, setRegion]               = useState('Asia Pacific')
  const [search, setSearch]               = useState('')

  const stocks = stockScreenerData.filter(s =>
    s.region === region &&
    (!search || s.ticker.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
  <div className="w-full h-full flex flex-col bg-background relative overflow-hidden">

    {/* ── Sidebar + Grid layout ── */}
    <div className="flex-1 flex overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-52 border-r border-border flex flex-col p-5 shrink-0 bg-surface/50">
        <div className="mb-6">
          <h2 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">
            Stock Explorer
          </h2>

          <div className="flex flex-col gap-1">
            {REGIONS.map(r => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  region === r
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-muted hover:text-text hover:bg-border/30 border border-transparent'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <div className="bg-card/50 border border-border p-3 rounded-xl">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-2">
              Market Status
            </span>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-bold text-text">LIVE</span>
            </div>

            <div className="mt-2 text-[10px] text-muted/70">
              {stocks.length} stocks in {region}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text">
              Market Screener
            </h1>

            <p className="text-xs text-muted mt-0.5">
              Real-time analysis · {region}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />

              <input
                type="text"
                placeholder="Search ticker or name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-card border border-border rounded-lg pl-8 pr-4 py-2 text-xs text-text placeholder:text-muted outline-none focus:border-accent/40 transition-all w-52"
              />
            </div>

            <button className="p-2 border border-border rounded-lg bg-card hover:bg-border/30 text-muted hover:text-text transition-colors">
              <Filter size={13} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {stocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Search size={28} className="text-muted/30" />
              <span className="text-sm text-muted">No stocks found</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {stocks.map(stock => (
                <StockCard key={stock.ticker} stock={stock} onClick={setSelectedStock} />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>

    {/* ── Stock Detail Panel (full-screen overlay) ── */}
    {selectedStock && (
      <div className="absolute inset-0 z-[100]">
        <StockDetailPanel
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      </div>
    )}

  </div>
)
}