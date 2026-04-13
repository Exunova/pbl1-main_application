import { useState, useEffect } from 'react'
import { MARKETS } from '../data/mockData'
import MarketHeatmap from '../components/MarketHeatmap'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function CompareView() {
  const [idx1, setIdx1] = useState('US')
  const [idx2, setIdx2] = useState('ID')
  const [normalize, setNormalize] = useState(true)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [tickerData, setTickerData] = useState({})

  const regions = Object.keys(MARKETS)

  useEffect(() => {
    if (!window.api) return
    const allTickers = Object.values(MARKETS).flatMap(m => m.tickers)
    let cancelled = false

    window.api.fetchCompanies(allTickers).then(results => {
      if (cancelled) return
      const td = {}
      Object.entries(results).forEach(([t, d]) => {
        if (!d?.info?.price) return
        const cur = d.info.price.currentPrice
        const prv = d.info.price.previousClose
        td[t] = { change_pct: (cur && prv) ? ((cur - prv) / prv * 100) : 0 }
      })
      setTickerData(td)
    }).catch(() => {})

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!window.api) return
    setLoading(true)
    Promise.all([
      window.api.fetchOHLCV(MARKETS[idx1].index),
      window.api.fetchOHLCV(MARKETS[idx2].index),
    ]).then(([d1, d2]) => {
      const c1 = d1.ohlcv_15m || []
      const c2 = d2.ohlcv_15m || []
      const base1 = normalize && c1[0]?.close ? c1[0].close : 1
      const base2 = normalize && c2[0]?.close ? c2[0].close : 1
      // Normalize both arrays to UTC date strings so candles from the same trading day match
      // regardless of timezone offset differences (DST transitions change offsets between markets)
      const c2ByDay = {}
      c2.forEach(c => {
        if (c?.timestamp) {
          // "2026-03-30 09:30:00-04:00" or "2026-03-30 14:30:00+01:00" → "2026-03-30"
          c2ByDay[c.timestamp.slice(0, 10)] = c
        }
      })
      const merged = c1.reduce((acc, c) => {
        if (!c?.timestamp) return acc
        const day = c.timestamp.slice(0, 10)
        const matched = c2ByDay[day]
        if (!matched) return acc
        return acc.concat({
          ts: day,
          v1: c.close / base1 * 100,
          v2: matched.close / base2 * 100,
        })
      }, [])
      setChartData(merged)
      setLoading(false)
    }).catch(() => setLoading(false))
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
          Normalize (rebased to 100)
        </label>
      </div>

      <div className="bg-surface rounded-lg p-3 h-56">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/30 text-xs">Loading...</div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="ts" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} axisLine={{ stroke: '#1e2433' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} axisLine={{ stroke: '#1e2433' }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2433', borderRadius: 6, color: '#e2e8f0', fontSize: 10 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(val, name) => [typeof val === 'number' ? val.toFixed(2) : val, name]} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
              <Line type="monotone" dataKey="v1" name={MARKETS[idx1].label} stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="v2" name={MARKETS[idx2].label} stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-white/30 text-xs">No data — trigger scrape first</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[idx1, idx2].map(region => (
          <div key={region} className="bg-surface rounded-lg p-3">
            <h3 className="text-xs font-bold text-white/50 mb-2">{MARKETS[region].label} Heatmap</h3>
            <MarketHeatmap tickers={MARKETS[region].tickers} data={tickerData} />
          </div>
        ))}
      </div>
    </div>
  )
}