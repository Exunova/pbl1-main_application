import { useState, useEffect } from 'react'
import { MARKETS } from '../data/mockData'
import MarketHeatmap from '../components/MarketHeatmap'

export default function CompareView() {
  const [idx1, setIdx1] = useState('US')
  const [idx2, setIdx2] = useState('ID')
  const [normalize, setNormalize] = useState(true)
  const [chartData, setChartData] = useState([])

  const regions = Object.keys(MARKETS)

  useEffect(() => {
    if (!window.api) return
    Promise.all([
      window.api.fetchOHLCV(MARKETS[idx1].index),
      window.api.fetchOHLCV(MARKETS[idx2].index),
    ]).then(([d1, d2]) => {
      const candles1 = d1.ohlcv_15m || []
      const candles2 = d2.ohlcv_15m || []
      const merged = candles1.map((c, i) => ({
        ts: c.timestamp,
        v1: normalize && candles1[0]?.close ? (c.close / candles1[0].close) * 100 : c.close,
        v2: normalize && candles2[0]?.close && candles2[i] ? (candles2[i].close / candles2[0].close) * 100 : (candles2[i]?.close || 0),
      }))
      setChartData(merged)
    })
  }, [idx1, idx2, normalize])

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
      <div className="flex items-center gap-3">
        <select value={idx1} onChange={e => setIdx1(e.target.value)}
          className="bg-surface border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none">
          {regions.map(r => <option key={r} value={r}>{MARKETS[r].label}</option>)}
        </select>
        <span className="text-white/40 text-xs">vs</span>
        <select value={idx2} onChange={e => setIdx2(e.target.value)}
          className="bg-surface border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none">
          {regions.map(r => <option key={r} value={r}>{MARKETS[r].label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-white/50 ml-auto">
          <input type="checkbox" checked={normalize} onChange={e => setNormalize(e.target.checked)} />
          Normalize
        </label>
      </div>

      <div className="bg-surface rounded-lg p-3 h-48">
        {chartData.length > 0 ? (
          <div className="flex items-center justify-center h-full text-white/30 text-xs">
            Chart ({chartData.length} candles) — {MARKETS[idx1].label} vs {MARKETS[idx2].label}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/30 text-xs">Loading...</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[idx1, idx2].map(region => (
          <div key={region} className="bg-surface rounded-lg p-3">
            <h3 className="text-xs font-bold text-white/50 mb-2">{MARKETS[region].label} Heatmap</h3>
            <MarketHeatmap tickers={MARKETS[region].tickers} />
          </div>
        ))}
      </div>
    </div>
  )
}