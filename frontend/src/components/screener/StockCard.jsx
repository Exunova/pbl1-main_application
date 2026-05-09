import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StockCard({ stock, onClick }) {
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
