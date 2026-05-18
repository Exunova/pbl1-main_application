import { useState, useEffect } from 'react'
import { MARKETS } from '../data/mockData'
import MarketHeatmap from '../components/MarketHeatmap'
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import NewsPanel from '../components/compare/NewsPanel'

export default function CompareView() {
  const [idx1, setIdx1] = useState('US')
  const [idx2, setIdx2] = useState('ID')
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [tickerData, setTickerData] = useState({})
  const [selectedNewsRegion, setSelectedNewsRegion] = useState(null)
  const [error, setError] = useState(null)
  
  const regions = Object.keys(MARKETS)
  const IDX1_COLOR = '#ffffff'
  const IDX2_COLOR = '#a1a1aa'

  const pickDifferentRegion = (selected) => regions.find(region => region !== selected) || selected

  const handleIdx1Change = (value) => {
    setIdx1(value)
    if (value === idx2) setIdx2(pickDifferentRegion(value))
  }

  const handleIdx2Change = (value) => {
    setIdx2(value)
    if (value === idx1) setIdx1(pickDifferentRegion(value))
  }

  useEffect(() => {
    if (!window.api) {
      setError('Backend not connected')
      return
    }
    const allTickers = Object.values(MARKETS).flatMap(m => m.tickers)
    let cancelled = false
    
    window.api.fetchCompanies(allTickers).then(results => {
      if (cancelled) return
      const td = {}
      const dataMap = results?.data || results
      if (dataMap) {
        Object.entries(dataMap).forEach(([t, d]) => {
          if (!d?.info?.price) return
          const cur = d.info.price.currentPrice
          const prv = d.info.price.previousClose
          const mcap = d.info.price.marketCap || (Math.random() * 500 + 100)
          const builtIn = d.info.price.regularMarketChangePercent
          let chgPct = 0
          if (builtIn != null) chgPct = builtIn
          else if (cur && prv) chgPct = ((cur - prv) / prv) * 100
          td[t] = { change_pct: chgPct, marketCap: mcap }
        })
      }
      setTickerData(td)
    }).catch(e => { console.error('[CompareView] fetchCompanies error:', e) })
    
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!window.api) {
      setError('Backend not connected')
      return
    }
    setLoading(true)
    Promise.all([
      window.api.fetchOHLCV(MARKETS[idx1].index),
      window.api.fetchOHLCV(MARKETS[idx2].index),
    ]).then(([d1, d2]) => {
      const c1 = [...(d1?.ohlcv_15m || [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      const c2 = [...(d2?.ohlcv_15m || [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

      const base1 = c1.find(c => c.close != null)?.close || 1
      const base2 = c2.find(c => c.close != null)?.close || 1

      const c1ByTs = {}; c1.forEach(c => { if (c?.timestamp) c1ByTs[c.timestamp] = c.close })
      const c2ByTs = {}; c2.forEach(c => { if (c?.timestamp) c2ByTs[c.timestamp] = c.close })
      const allTs = Array.from(new Set([...Object.keys(c1ByTs), ...Object.keys(c2ByTs)])).sort()

      let lastV1 = base1
      let lastV2 = base2
      const merged = []
      
      for (const ts of allTs) {
        if (c1ByTs[ts] !== undefined) lastV1 = c1ByTs[ts]
        if (c2ByTs[ts] !== undefined) lastV2 = c2ByTs[ts]
        const v1 = (lastV1 / base1) * 100
        const v2 = (lastV2 / base2) * 100
        merged.push({
          ts: ts.slice(5, 16),
          v1, v2,
          v1_high: v1 > v2 ? [v2, v1] : [v2, v2],
          v1_low: v2 > v1 ? [v1, v2] : [v1, v1]
        })
      }
      setChartData(merged); setLoading(false)
    }).catch(e => {
      console.error('[CompareView] fetchOHLCV error:', e)
      setLoading(false)
    })
  }, [idx1, idx2])

  return (
    <div className="flex h-full w-full bg-background text-text overflow-hidden relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4 py-2 bg-red-500/20 border-b border-red-500/50 text-red-400 text-xs font-mono">
          ⚠ {error}
        </div>
      )}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border px-6 py-4 shrink-0 bg-surface/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 shrink-0" style={{ background: IDX1_COLOR }} />
            <select value={idx1} onChange={e => handleIdx1Change(e.target.value)}
              className="bg-transparent border-none text-sm text-text outline-none uppercase tracking-widest font-bold cursor-pointer">
              {regions.map(r => <option key={r} value={r} className="bg-surface text-text">{MARKETS[r].label}</option>)}
            </select>
          </div>
          <span className="text-muted text-xs font-bold tracking-widest px-2 shrink-0">VS</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 shrink-0" style={{ background: IDX2_COLOR }} />
            <select value={idx2} onChange={e => handleIdx2Change(e.target.value)}
              className="bg-transparent border-none text-sm text-text outline-none uppercase tracking-widest font-bold cursor-pointer">
              {regions.map(r => <option key={r} value={r} className="bg-surface text-text">{MARKETS[r].label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 flex-1 overflow-hidden">
          <div className="xl:col-span-2 border-r border-b border-border flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b border-border shrink-0 bg-surface/10">
              <h3 className="text-xs font-bold text-text uppercase tracking-widest">Index Comparison</h3>
            </div>
            <div className="flex-1 relative p-4">
              {loading
                ? <div className="flex items-center justify-center h-full text-muted text-xs uppercase animate-pulse">Loading chart...</div>
                : chartData.length > 0
                ? <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <XAxis dataKey="ts" tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: "'Fira Code', monospace" }}
                        tickLine={false} axisLine={{ stroke: 'var(--border)' }} minTickGap={30} />
                      <YAxis tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: "'Fira Code', monospace" }}
                        tickLine={false} axisLine={{ stroke: 'var(--border)' }} domain={['auto', 'auto']} orientation="right" />
                      <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 11, fontFamily: "'Fira Code', monospace" }}
                        labelStyle={{ color: 'var(--muted)' }}
                        formatter={(val, name, entry) => {
                          const { v1, v2 } = entry.payload
                          if (name === 'OUTPERFORM') {
                            if (v1 <= v2) return [null, null]
                            const pct = ((v1 - v2) / v1) * 100
                            return [`+${pct.toFixed(2)}%`, name]
                          }
                          if (name === 'UNDERPERFORM') {
                            if (v2 <= v1) return [null, null]
                            const pct = ((v2 - v1) / v1) * 100
                            return [`-${pct.toFixed(2)}%`, name]
                          }
                          return [typeof val === 'number' ? val.toFixed(2) : val, name]
                        }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '10px' }}
                        verticalAlign="top" payload={[
                          { value: MARKETS[idx1].label, type: 'line', color: IDX1_COLOR },
                          { value: MARKETS[idx2].label, type: 'line', color: IDX2_COLOR }
                        ]} />
                      <Area name="OUTPERFORM" type="monotone" dataKey="v1_high" fill="var(--success)" fillOpacity={0.2} stroke="none" isAnimationActive={false} />
                      <Area name="UNDERPERFORM" type="monotone" dataKey="v1_low" fill="var(--danger)" fillOpacity={0.2} stroke="none" isAnimationActive={false} />
                      <Line name={MARKETS[idx1].label} type="monotone" dataKey="v1" stroke={IDX1_COLOR} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                      <Line name={MARKETS[idx2].label} type="monotone" dataKey="v2" stroke={IDX2_COLOR} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                : <div className="flex items-center justify-center h-full text-muted text-xs uppercase">No data</div>
              }
            </div>
          </div>

          <div className="xl:col-span-1 flex flex-col border-b border-border overflow-hidden">
            {[idx1, idx2].map((region, i) => (
              <div key={`${region}-${i}`}
                className={`flex-1 flex flex-col overflow-hidden cursor-pointer group ${i === 0 ? 'border-b border-border' : ''} ${selectedNewsRegion === region ? 'bg-surface' : 'hover:bg-surface/30'}`}
                onClick={() => setSelectedNewsRegion(prev => prev === region ? null : region)}>
                <div className="px-6 py-3 border-b border-border/50 flex justify-between items-center shrink-0">
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${selectedNewsRegion === region ? 'text-text' : 'text-muted group-hover:text-text'}`}>
                    <div className="w-2 h-2 shrink-0" style={{ background: i === 0 ? IDX1_COLOR : IDX2_COLOR }} />
                    {MARKETS[region].label}
                  </h3>
                  <span className={`text-[8px] tracking-widest shrink-0 ${selectedNewsRegion === region ? 'text-accent' : 'text-muted opacity-0 group-hover:opacity-100'}`}>
                    {selectedNewsRegion === region ? 'NEWS OPEN' : 'VIEW NEWS'}
                  </span>
                </div>
                <div className="flex-1 w-full bg-background relative min-h-0">
                  <MarketHeatmap tickers={MARKETS[region].tickers} data={tickerData} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedNewsRegion && (
        <NewsPanel region={selectedNewsRegion}
          color={selectedNewsRegion === idx1 ? IDX1_COLOR : IDX2_COLOR}
          onClose={() => setSelectedNewsRegion(null)} />
      )}
    </div>
  )
}
