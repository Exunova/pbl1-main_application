import { useState, useEffect } from 'react'
import { MARKETS } from '../data/mockData'
import MarketHeatmap from '../components/MarketHeatmap'
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { X, Newspaper } from 'lucide-react'

function NewsCard({ article, color }) {
  return (
    <a href={article.link || '#'} target="_blank" rel="noopener noreferrer"
      className="group flex gap-4 bg-surface border-b border-border p-4 hover:bg-white/5">
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {article.thumbnail?.url ? (
            <img src={article.thumbnail.url} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" 
              onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <Newspaper size={10} style={{ color: color }} className="shrink-0" />
          )}
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest truncate">{article.publisher}</span>
          {article.published && <span className="text-[9px] text-muted/50 ml-auto whitespace-nowrap">{article.published}</span>}
        </div>
        <p className="text-xs font-semibold text-text leading-snug group-hover:text-white line-clamp-3">{article.title}</p>
      </div>
    </a>
  )
}

function NewsPanel({ region, color, onClose }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(false)
  useEffect(() => {
    if (!region) return
    setLoading(true); setArticles([])
    if (!window.api) { setLoading(false); return }
    window.api.fetchNews(region)
      .then(data => setArticles(data?.articles || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [region])
  return (
    <div className="w-80 h-full border-l border-border bg-background flex flex-col shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-muted" />
          <span className="text-xs font-bold text-text uppercase tracking-widest">{MARKETS[region]?.label || region} News</span>
        </div>
        <button onClick={onClose} className="text-muted hover:text-white"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-border p-4 animate-pulse">
                <div className="flex-1"><div className="h-2.5 bg-border w-1/3 mb-3" /><div className="h-3 bg-border w-full mb-1.5" /><div className="h-3 bg-border w-4/5" /></div>
              </div>
            ))
          : articles.length === 0
          ? <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border-b border-border"><Newspaper size={32} className="text-muted/20" /><span className="text-[11px] text-muted uppercase">No news</span></div>
          : articles.map((art, i) => <NewsCard key={i} article={art} color={color} />)
        }
      </div>
    </div>
  )
}

export default function CompareView() {
  const [idx1, setIdx1] = useState('US')
  const [idx2, setIdx2] = useState('ID')
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [tickerData, setTickerData] = useState({})
  const [selectedNewsRegion, setSelectedNewsRegion] = useState(null)
  const regions = Object.keys(MARKETS)
  const IDX1_COLOR = '#ffffff'
  const IDX2_COLOR = '#a1a1aa'

  useEffect(() => {
    if (!window.api) return
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
    if (!window.api) return
    setLoading(true)
    Promise.all([
      window.api.fetchOHLCV(MARKETS[idx1].index),
      window.api.fetchOHLCV(MARKETS[idx2].index),
    ]).then(([d1, d2]) => {
      const c1 = d1?.ohlcv_15m || []
      const c2 = d2?.ohlcv_15m || []
      const base1 = c1.length > 0 && c1[0].close ? c1[0].close : 1
      const base2 = c2.length > 0 && c2[0].close ? c2[0].close : 1
      const c1ByTs = {}; c1.forEach(c => { if (c?.timestamp) c1ByTs[c.timestamp] = c.close })
      const c2ByTs = {}; c2.forEach(c => { if (c?.timestamp) c2ByTs[c.timestamp] = c.close })
      const allTs = Array.from(new Set([...Object.keys(c1ByTs), ...Object.keys(c2ByTs)])).sort()
      let lastV1 = c1.length > 0 ? c1[0].close : null
      let lastV2 = c2.length > 0 ? c2[0].close : null
      const merged = []
      for (const ts of allTs) {
        if (c1ByTs[ts] !== undefined) lastV1 = c1ByTs[ts]
        if (c2ByTs[ts] !== undefined) lastV2 = c2ByTs[ts]
        if (lastV1 === null || lastV2 === null) continue
        const v1 = (lastV1 / base1) * 100
        const v2 = (lastV2 / base2) * 100
        merged.push({
          ts: ts.slice(5, 16),
          v1, v2
        })
      }
      setChartData(merged); setLoading(false)
    }).catch(() => setLoading(false))
  }, [idx1, idx2])

  return (
  <div className="flex h-full w-full bg-background text-text overflow-hidden">
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-4 border-b border-border px-6 py-4 shrink-0 bg-surface/30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 shrink-0" style={{ background: IDX1_COLOR }} />
          <select value={idx1} onChange={e => setIdx1(e.target.value)}
            className="bg-transparent border-none text-sm text-text outline-none uppercase tracking-widest font-bold cursor-pointer">
            {regions.map(r => <option key={r} value={r} className="bg-surface text-text">{MARKETS[r].label}</option>)}
          </select>
        </div>
        <span className="text-muted text-xs font-bold tracking-widest px-2 shrink-0">VS</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 shrink-0" style={{ background: IDX2_COLOR }} />
          <select value={idx2} onChange={e => setIdx2(e.target.value)}
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
                      formatter={(val, name) => [typeof val === 'number' ? val.toFixed(2) : val, name]} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '10px' }}
                      verticalAlign="top" payload={[
                        { value: MARKETS[idx1].label, type: 'line', color: IDX1_COLOR },
                        { value: MARKETS[idx2].label, type: 'line', color: IDX2_COLOR }
                      ]} />
                    <Line type="monotone" dataKey="v1" stroke={IDX1_COLOR} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="v2" stroke={IDX2_COLOR} strokeWidth={1.5} dot={false} isAnimationActive={false} />
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
