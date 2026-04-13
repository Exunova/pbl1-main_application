import { useState, useEffect, useCallback } from 'react'
import { MARKETS } from '../data/mockData'
import MarketHeatmap from '../components/MarketHeatmap'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// ─── News Column ──────────────────────────────────────────────────────────────

function NewsColumn({ region, color }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!region) return
    setLoading(true)
    setArticles([])

    if (!window.api) {
      setLoading(false)
      return
    }

    window.api.fetchNews(region)
      .then(data => {
        setArticles(data?.articles || [])
      })
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [region])

  const label = MARKETS[region]?.label || region

  return (
    <div className="flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-xs font-bold text-white/70 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] text-white/30 ml-auto">Market News</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: '340px' }}>
        {loading ? (
          // Skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-lg p-3 animate-pulse">
              <div className="h-3 bg-white/5 rounded w-3/4 mb-2" />
              <div className="h-2.5 bg-white/5 rounded w-full mb-1" />
              <div className="h-2.5 bg-white/5 rounded w-5/6 mb-2" />
              <div className="h-2 bg-white/5 rounded w-1/3" />
            </div>
          ))
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <svg className="w-8 h-8 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-[11px] text-white/25">No news available</span>
          </div>
        ) : (
          articles.map((art, i) => (
            <a
              key={i}
              href={art.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-surface rounded-lg p-3 border border-white/0 hover:border-white/8 hover:bg-white/3 transition-all duration-200"
            >
              {/* Thumbnail */}
              {art.thumbnail?.url && (
                <div className="mb-2 rounded overflow-hidden h-20 bg-white/5">
                  <img
                    src={art.thumbnail.url}
                    alt=""
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={e => { e.target.parentElement.style.display = 'none' }}
                  />
                </div>
              )}
              {/* Title */}
              <p className="text-xs font-medium text-white/85 leading-snug group-hover:text-white transition-colors line-clamp-3 mb-1.5">
                {art.title}
              </p>
              {/* Meta */}
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-[10px] text-white/35">{art.publisher}</span>
                {art.published && (
                  <>
                    <span className="text-[10px] text-white/20">·</span>
                    <span className="text-[10px] text-white/25">{art.published}</span>
                  </>
                )}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompareView() {
  const [idx1, setIdx1] = useState('US')
  const [idx2, setIdx2] = useState('ID')
  const [normalize, setNormalize] = useState(true)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)
  const [tickerData, setTickerData] = useState({})

  const regions = Object.keys(MARKETS)

  const IDX1_COLOR = '#3b82f6'
  const IDX2_COLOR = '#f59e0b'

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
      const c2ByDay = {}
      c2.forEach(c => {
        if (c?.timestamp) c2ByDay[c.timestamp.slice(0, 10)] = c
      })
      const merged = c1.reduce((acc, c) => {
        if (!c?.timestamp) return acc
        const day = c.timestamp.slice(0, 10)
        const matched = c2ByDay[day]
        if (!matched) return acc
        return acc.concat({ ts: day, v1: c.close / base1 * 100, v2: matched.close / base2 * 100 })
      }, [])
      setChartData(merged)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [idx1, idx2, normalize])

  return (
    <div className="flex flex-col h-full p-4 gap-5 overflow-auto custom-scrollbar">

      {/* ── Index Selector ── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: IDX1_COLOR }} />
          <select
            value={idx1}
            onChange={e => setIdx1(e.target.value)}
            className="bg-surface border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500/50 transition-colors"
          >
            {regions.map(r => <option key={r} value={r}>{MARKETS[r].label}</option>)}
          </select>
        </div>

        <span className="text-white/30 text-xs font-bold tracking-widest">VS</span>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: IDX2_COLOR }} />
          <select
            value={idx2}
            onChange={e => setIdx2(e.target.value)}
            className="bg-surface border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-amber-500/50 transition-colors"
          >
            {regions.map(r => <option key={r} value={r}>{MARKETS[r].label}</option>)}
          </select>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-white/40 ml-auto cursor-pointer select-none hover:text-white/60 transition-colors">
          <input
            type="checkbox"
            checked={normalize}
            onChange={e => setNormalize(e.target.checked)}
            className="accent-blue-500"
          />
          Normalize (rebased to 100)
        </label>
      </div>

      {/* ── Price Chart ── */}
      <div className="bg-surface rounded-xl border border-white/5 p-4 h-56 shrink-0">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/20 text-xs">Loading chart…</div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="ts"
                tick={{ fill: '#64748b', fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: '#1e2433' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: '#1e2433' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: '#141720', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#e2e8f0', fontSize: 10 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(val, name) => [typeof val === 'number' ? val.toFixed(2) : val, name]}
              />
              <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
              <Line type="monotone" dataKey="v1" name={MARKETS[idx1].label} stroke={IDX1_COLOR} strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="v2" name={MARKETS[idx2].label} stroke={IDX2_COLOR} strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-white/20 text-xs">No data — trigger scrape first</div>
        )}
      </div>

      {/* ── Heatmaps ── */}
      <div className="grid grid-cols-2 gap-4">
        {[idx1, idx2].map((region, i) => (
          <div key={`${region}-${i}`} className="bg-surface rounded-xl border border-white/5 p-3">
            <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: i === 0 ? IDX1_COLOR : IDX2_COLOR }} />
              {MARKETS[region].label} Heatmap
            </h3>
            <MarketHeatmap tickers={MARKETS[region].tickers} data={tickerData} />
          </div>
        ))}
      </div>

      {/* ── Dual News Columns ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-2">Index News</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <NewsColumn region={idx1} color={IDX1_COLOR} />
          <NewsColumn region={idx2} color={IDX2_COLOR} />
        </div>
      </div>

    </div>
  )
}