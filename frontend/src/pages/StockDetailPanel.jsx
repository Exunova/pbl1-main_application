import { useState, useEffect, useMemo, useRef } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { ChevronLeft, TrendingUp, TrendingDown } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n, decimals = 2) {
  if (n == null || n === '' || n === '—') return '—'
  if (typeof n === 'number') {
    if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`
    if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`
    return n.toLocaleString(undefined, { maximumFractionDigits: decimals })
  }
  return String(n)
}

function pct(n) {
  if (n == null) return '—'
  return `${(n * 100).toFixed(2)}%`
}

// ─── Candlestick shape ────────────────────────────────────────────────────────

const Candlestick = (props) => {
  const { x, y, width, height } = props
  const d = props.payload
  if (!d || !width || width <= 0) return null
  const isUp = d.close >= d.open
  const color = isUp ? "var(--success)" : "var(--danger)"
  const ratio = height / Math.max(d.high - d.low, 0.001)
  const bodyTop = y + (d.high - Math.max(d.open, d.close)) * ratio
  const bodyH = Math.max(Math.abs(d.open - d.close) * ratio, 2)
  const wickX = x + width / 2
  return (
    <g>
      <line x1={wickX} y1={y} x2={wickX} y2={y + height} stroke="#374151" strokeWidth={1} />
      <rect x={x} y={bodyTop} width={Math.max(width, 1)} height={bodyH} fill={color} />
    </g>
  )
}

const CandleTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const isUp = d.close >= d.open
  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 0, padding: '8px 12px', fontSize: 11 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 12px' }}>
        <span style={{ color: '#6b7280' }}>O</span><span style={{ color: '#e2e8f0' }}>{fmt(d.open, 0)}</span>
        <span style={{ color: '#6b7280' }}>H</span><span style={{ color: "var(--success)" }}>{fmt(d.high, 0)}</span>
        <span style={{ color: '#6b7280' }}>L</span><span style={{ color: "var(--danger)" }}>{fmt(d.low, 0)}</span>
        <span style={{ color: '#6b7280' }}>C</span><span style={{ color: isUp ? '#22c55e' : '#ef4444' }}>{fmt(d.close, 0)}</span>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' }}>
    {children}
  </div>
)

const InfoGrid = ({ rows }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', borderRadius: 0, overflow: 'hidden', marginBottom: 14 }}>
    {rows.map(({ label, value, color }) => (
      <div key={label} style={{ background: 'var(--surface)', padding: '7px 10px' }}>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{label}</div>
        <div style={{ fontSize: 12, color: color || 'var(--text)', fontWeight: 500, marginTop: 2 }}>{value ?? '—'}</div>
      </div>
    ))}
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const TIMEFRAMES = ['15m', '30m', '1h']

// ─── OHLCV aggregation ────────────────────────────────────────────────────────

function aggregateCandles(candles, groupSize) {
  if (!candles.length || groupSize <= 1) return candles
  const result = []
  for (let i = 0; i < candles.length; i += groupSize) {
    const group = candles.slice(i, i + groupSize)
    if (!group.length) continue
    result.push({
      index: result.length,
      time: group[0].time,
      open: group[0].open,
      high: Math.max(...group.map(c => c.high)),
      low: Math.min(...group.map(c => c.low)),
      close: group[group.length - 1].close,
    })
  }
  return result
}

export default function StockDetailPanel({ stock, onClose }) {
  const [tab, setTab] = useState('overview')
  const [chartType, setChartType] = useState('candlestick')
  const [timeframe, setTimeframe] = useState('15m')
  const [yScale, setYScale] = useState('auto')   // 'auto' | 'tight' | 'full'
  const [companyData, setCompanyData] = useState(null)
  const [ohlcvData, setOhlcvData] = useState([])
  const [loading, setLoading] = useState(true)
  const [ohlcvLoading, setOhlcvLoading] = useState(true)

  // Fetch real data
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setOhlcvLoading(true)
    setCompanyData(null)
    setOhlcvData([])

    if (window.api) {
      window.api.fetchCompany(stock.ticker)
        .then(d => {
          if (!cancelled) {
            const respData = d?.data || d
            setCompanyData(respData)
          }
        })
        .catch(() => { })
        .finally(() => { if (!cancelled) setLoading(false) })

      window.api.fetchOHLCV(stock.ticker)
        .then(d => {
          if (!cancelled) {
            const respData = d?.data || d
            setOhlcvData(respData?.ohlcv_15m || [])
          }
        })
        .catch(() => { })
        .finally(() => { if (!cancelled) setOhlcvLoading(false) })
    } else {
      setLoading(false)
      setOhlcvLoading(false)
    }

    return () => { cancelled = true }
  }, [stock.ticker])

  // ── Derived values ────────────────────────────────────────────────────────

  const info = companyData?.info || {}
  const priceInfo = info.price || {}
  const valuation = info.valuation || {}
  const dividend = info.dividend || {}
  const analyst = info.analyst || {}
  const identity = info.identity || {}
  const financials = companyData?.financials?.income_statement || {}

  // Fallback to stock mock data
  const stockPrice = priceInfo.currentPrice ?? parseFloat(String(stock.price).replace(/,/g, '')) ?? 0
  const prevClose = priceInfo.previousClose ?? (stockPrice * (1 - stock.change / 100))
  const changePct = priceInfo.currentPrice && priceInfo.previousClose
    ? +((priceInfo.currentPrice - priceInfo.previousClose) / priceInfo.previousClose * 100).toFixed(2)
    : stock.change
  const isPositive = changePct >= 0
  const changeColor = isPositive ? '#22c55e' : '#ef4444'
  const ticker = stock.ticker
  const name = identity.longName || stock.name

  // ── Chart data ─────────────────────────────────────────────────────────────

  // Build base 15m candlestick data from real OHLCV or generate mock
  const baseCandles = useMemo(() => {
    if (ohlcvData.length > 0) {
      return ohlcvData.map((c, i) => ({
        index: i, time: i,
        open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume || 0,
      }))
    }
    // Fallback mock
    let base = stockPrice || 1000
    return Array.from({ length: 120 }, (_, i) => {
      const seed = stock.ticker.charCodeAt(0) * 17
      const move = (Math.sin(i * seed / 30 + i * 0.3) * 0.6 + Math.random() - 0.49) * base * 0.012
      const close = base + move
      const high = Math.max(base, close) + Math.random() * base * 0.004
      const low = Math.min(base, close) - Math.random() * base * 0.004
      const d = { index: i, time: i, open: +base.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2), volume: Math.random() * 10000 + 5000 }
      base = close
      return d
    })
  }, [ohlcvData, stockPrice, stock.ticker])

  // Aggregate into 30m / 1h when needed
  const candleData = useMemo(() => {
    if (timeframe === '30m') return aggregateCandles(baseCandles, 2)
    if (timeframe === '1h') return aggregateCandles(baseCandles, 4)
    return baseCandles
  }, [baseCandles, timeframe])

  // ── Zoom / pan ─────────────────────────────────────────────────────────────

  const DEFAULT_VISIBLE = 80
  const [range, setRange] = useState({ start: 0, end: DEFAULT_VISIBLE })
  const [isPanning, setIsPanning] = useState(false)
  const [lastX, setLastX] = useState(0)

  useEffect(() => {
    const len = candleData.length
    setRange({ start: Math.max(0, len - DEFAULT_VISIBLE), end: len })
  }, [candleData.length])

  const handleZoomOut = () => {
    setRange({ start: 0, end: candleData.length })
  }

  const visibleData = useMemo(() =>
    candleData.slice(Math.max(0, range.start), Math.min(candleData.length, range.end)),
    [candleData, range]
  )

  const handleWheel = e => {
    e.preventDefault()
    const dir = e.deltaY > 0 ? 1 : -1
    setRange(prev => {
      const newStart = Math.min(Math.max(0, prev.start + dir * 2), prev.end - 10)
      const newEnd = Math.max(Math.min(candleData.length, prev.end - dir * 2), newStart + 10)
      return { start: newStart, end: newEnd }
    })
  }

  const handleMouseDown = e => { setIsPanning(true); setLastX(e.clientX) }
  const handleMouseMove = e => {
    if (!isPanning) return
    const dx = e.clientX - lastX
    const cw = 800 / Math.max(range.end - range.start, 1)
    const shift = -Math.round(dx / cw)
    if (shift !== 0) {
      setRange(prev => {
        if (prev.start + shift < 0 || prev.end + shift > candleData.length) return prev
        return { start: prev.start + shift, end: prev.end + shift }
      })
      setLastX(e.clientX)
    }
  }
  const handleMouseUp = () => setIsPanning(false)

  // ── Y-axis domain ──────────────────────────────────────────────────────────

  const yDomain = useMemo(() => {
    if (yScale === 'tight') {
      const closes = visibleData.map(d => d.close)
      if (!closes.length) return ['auto', 'auto']
      const mn = Math.min(...visibleData.map(d => d.low))
      const mx = Math.max(...visibleData.map(d => d.high))
      const pad = (mx - mn) * 0.05
      return [+(mn - pad).toFixed(2), +(mx + pad).toFixed(2)]
    }
    if (yScale === 'full') {
      const mn = Math.min(...candleData.map(d => d.low))
      const mx = Math.max(...candleData.map(d => d.high))
      const pad = (mx - mn) * 0.03
      return [+(mn - pad).toFixed(2), +(mx + pad).toFixed(2)]
    }
    return ['auto', 'auto']  // 'auto'
  }, [yScale, visibleData, candleData])

  // MA50
  const ma50 = useMemo(() => {
    const slice = candleData.slice(-50)
    return slice.length ? slice.reduce((s, d) => s + d.close, 0) / slice.length : null
  }, [candleData])

  const lastCandle = candleData[candleData.length - 1] ?? { open: 0, high: 0, low: 0, close: 0 }

  // Financials rows
  const finRows = Object.entries(financials)
    .filter(([, y]) => y && Object.values(y).some(v => v != null))
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 4)

  function formatBig(n) {
    if (n == null) return '—'
    if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`
    if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`
    return n.toLocaleString()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      background: 'var(--background)', borderRadius: 0, overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>

      {/* ── Header ── */}
      <div style={{ background: 'var(--background)', padding: '10px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px 6px', display: 'flex', alignItems: 'center', borderRadius: 0, transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          title="Back to Screener"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Ticker avatar */}
        <div style={{ width: 30, height: 30, borderRadius: 0, background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '0.5px solid var(--border)' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.05em' }}>
            {ticker.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase()}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {loading ? stock.name : name}
          </span>
          <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 8 }}>{ticker}</span>
          {(identity.sector || stock.sector) && (
            <span style={{ fontSize: 9, background: '#1a2d1a', color: '#4ade80', padding: '2px 8px', borderRadius: 0, marginLeft: 8, display: 'inline-block', fontWeight: 600, letterSpacing: '0.05em' }}>
              {identity.sector || stock.sector}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.01em' }}>
            {stockPrice ? stockPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </span>
          <span style={{ fontSize: 12, color: changeColor, display: 'flex', alignItems: 'center', gap: 3 }}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPositive ? '+' : ''}{changePct?.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* ── Body: Chart Left + Info Panel Right ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', flex: 1, overflow: 'hidden' }}>

        {/* ── Chart Side ── */}
        <div style={{ borderRight: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Toolbar */}
          <div style={{ padding: '6px 14px', borderBottom: '0.5px solid var(--border)', display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0, background: 'var(--background)', flexWrap: 'wrap' }}>

            {/* Chart type */}
            {['Line', 'Candle'].map(ct => (
              <button key={ct}
                onClick={() => setChartType(ct.toLowerCase())}
                style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 0, cursor: 'pointer',
                  border: 'none', fontFamily: 'inherit',
                  background: chartType === ct.toLowerCase() ? 'var(--background)' : 'transparent',
                  color: chartType === ct.toLowerCase() ? '#60a5fa' : '#4b5563',
                }}
              >{ct}</button>
            ))}

            <span style={{ width: 1, height: 14, background: '#1e2433', margin: '0 4px' }} />

            {/* Timeframe */}
            {TIMEFRAMES.map(tf => (
              <button key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 0, cursor: 'pointer',
                  border: 'none', fontFamily: 'inherit',
                  background: timeframe === tf ? 'var(--card)' : 'transparent',
                  color: timeframe === tf ? '#f59e0b' : '#4b5563',
                  fontWeight: timeframe === tf ? 700 : 400,
                }}
              >{tf}</button>
            ))}

            <span style={{ width: 1, height: 14, background: '#1e2433', margin: '0 4px' }} />

            {/* Y-scale toggle */}
            {[{ id: 'auto', label: 'Y:Auto' }, { id: 'tight', label: 'Y:Tight' }, { id: 'full', label: 'Y:Full' }].map(({ id, label }) => (
              <button key={id}
                onClick={() => setYScale(id)}
                title={`Y-axis scale: ${id}`}
                style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 0, cursor: 'pointer',
                  border: yScale === id ? '0.5px solid var(--accent)' : '0.5px solid transparent',
                  fontFamily: 'inherit',
                  background: yScale === id ? 'var(--surface)' : 'transparent',
                  color: yScale === id ? 'var(--text)' : '#374151',
                }}
              >{label}</button>
            ))}

            <span style={{ width: 1, height: 14, background: '#1e2433', margin: '0 4px' }} />

            {/* Zoom buttons */}
            <button
              onClick={() => {
                const ts = chartRef?.current?.timeScale();
                const r = ts?.getVisibleLogicalRange();
                if (!r) return;
                const span = (r.to - r.from) / 2;
                const mid = (r.from + r.to) / 2;
                ts.setVisibleLogicalRange({ from: mid - span / 2, to: mid + span / 2 });
              }}
              title="Zoom in"
              style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 0, cursor: 'pointer',
                border: '0.5px solid var(--border)', fontFamily: 'inherit',
                background: 'transparent', color: 'var(--muted)',
                display: 'flex', alignItems: 'center', gap: 3,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4b5563' }}
            >⊕ Zoom In</button>
            <button
              onClick={handleZoomOut}
              title="Zoom out — show all candles"
              style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 0, cursor: 'pointer',
                border: '0.5px solid var(--border)', fontFamily: 'inherit',
                background: 'transparent', color: 'var(--muted)',
                display: 'flex', alignItems: 'center', gap: 3,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4b5563' }}
            >⊖ Zoom Out</button>

            {/* OHLC readout */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              {[
                { label: 'O', val: lastCandle.open, color: '#e2e8f0' },
                { label: 'H', val: lastCandle.high, color: "var(--success)" },
                { label: 'L', val: lastCandle.low, color: "var(--danger)" },
                { label: 'C', val: lastCandle.close, color: '#e2e8f0' },
              ].map(({ label, val, color }) => (
                <span key={label} style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {label} <span style={{ color }}>{val?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Chart */}
          {ohlcvLoading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)1', fontSize: 12 }}>
              Loading chart…
            </div>
          ) : (
            <div
              style={{ flex: 1, overflow: 'hidden', padding: '8px 4px 0 4px', cursor: isPanning ? 'grabbing' : 'crosshair', outline: 'none' }}
              tabIndex={-1}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <ComposedChart data={visibleData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <XAxis dataKey="index" hide />
                    <YAxis yAxisId="price" domain={yDomain} tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: "'Fira Code', monospace" }} orientation="right" width={58} tickFormatter={v => v.toLocaleString()} axisLine={{stroke: 'var(--border)'}} tickLine={false} />
                    <YAxis yAxisId="volume" orientation="left" hide domain={[0, dataMax => dataMax * 5]} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 0, fontSize: 11 }} />
                    {ma50 && <ReferenceLine y={ma50} stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={0.8} />}
                    <Line type="monotone" dataKey="close" stroke="#22c55e" strokeWidth={1.8} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={visibleData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <XAxis dataKey="index" hide />
                    <YAxis yAxisId="price" domain={yDomain} tick={{ fontSize: 9, fill: 'var(--muted)', fontFamily: "'Fira Code', monospace" }} orientation="right" width={58} tickFormatter={v => v.toLocaleString()} axisLine={{stroke: 'var(--border)'}} tickLine={false} />
                    <YAxis yAxisId="volume" orientation="left" hide domain={[0, dataMax => dataMax * 5]} />
                    <Tooltip content={<CandleTooltip />} cursor={{ stroke: '#1e2433', strokeWidth: 1 }} />
                    {ma50 && <ReferenceLine y={ma50} stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={0.8} />}
                    <Bar dataKey={d => [d.low, d.high]} shape={<Candlestick />} isAnimationActive={false} xAxisId={0} yAxisId="price" barCategoryGap="10%" barGap={0} />
                    <Bar dataKey="volume" fill="var(--border)" isAnimationActive={false} xAxisId={0} yAxisId="volume" barGap={0}>
                      {visibleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? 'var(--success)' : 'var(--danger)'} fillOpacity={0.3} />
                      ))}
                    </Bar>
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Footer metrics */}
          <div style={{ padding: '8px 14px', borderTop: '0.5px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, flexShrink: 0, background: 'var(--background)' }}>
            {[
              { label: 'Market Cap', value: formatBig(priceInfo.marketCap), color: '#e2e8f0' },
              { label: 'Volume', value: formatBig(priceInfo.volume), color: '#e2e8f0' },
              { label: 'P/E (TTM)', value: valuation.trailingPE ? valuation.trailingPE.toFixed(1) + 'x' : (stock.pe ? stock.pe + 'x' : '—'), color: '#60a5fa' },
              { label: 'Div Yield', value: dividend.dividendYield ? pct(dividend.dividendYield) : (stock.div || '—'), color: '#fbbf24' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--card)', borderRadius: 0, padding: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--background)' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
            {['overview', 'financials', 'about'].map(t => (
              <button key={t}
                onClick={() => setTab(t)}
                style={{
                  fontSize: 11, padding: '10px 14px', cursor: 'pointer', border: 'none', background: 'none',
                  color: tab === t ? '#60a5fa' : '#4b5563',
                  borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
                  fontFamily: 'inherit', textTransform: 'capitalize', letterSpacing: '0.02em',
                }}
              >{t}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }} className="custom-scrollbar">

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ height: 32, background: 'var(--surface)', borderRadius: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            )}

            {/* ── Overview ── */}
            {!loading && tab === 'overview' && (
              <>
                <SectionLabel>Price Info</SectionLabel>
                <InfoGrid rows={[
                  { label: 'Prev Close', value: fmt(priceInfo.previousClose ?? prevClose, 2) },
                  { label: 'Open', value: fmt(priceInfo.open, 2) },
                  { label: 'Day Low', value: fmt(priceInfo.dayLow, 2), color: "var(--danger)" },
                  { label: 'Day High', value: fmt(priceInfo.dayHigh, 2), color: "var(--success)" },
                  { label: '52W Low', value: fmt(priceInfo.fiftyTwoWeekLow, 2), color: "var(--danger)" },
                  { label: '52W High', value: fmt(priceInfo.fiftyTwoWeekHigh, 2), color: "var(--success)" },
                ]} />

                <SectionLabel>Valuation</SectionLabel>
                <InfoGrid rows={[
                  { label: 'Market Cap', value: formatBig(priceInfo.marketCap) },
                  { label: 'P/E (TTM)', value: valuation.trailingPE ? valuation.trailingPE.toFixed(1) + 'x' : (stock.pe ? stock.pe + 'x' : '—') },
                  { label: 'Forward P/E', value: valuation.forwardPE ? valuation.forwardPE.toFixed(1) + 'x' : '—' },
                  { label: 'EPS (TTM)', value: valuation.trailingEps ? fmt(valuation.trailingEps, 2) : '—' },
                  { label: 'Price/Book', value: valuation.priceToBook ? valuation.priceToBook.toFixed(2) + 'x' : '—' },
                  { label: 'Beta', value: valuation.beta ? valuation.beta.toFixed(2) : '—' },
                ]} />

                <SectionLabel>Dividend</SectionLabel>
                <InfoGrid rows={[
                  { label: 'Yield', value: dividend.dividendYield ? pct(dividend.dividendYield) : (stock.div || '—'), color: '#fbbf24' },
                  { label: 'Rate', value: dividend.dividendRate ? fmt(dividend.dividendRate, 2) : '—' },
                  { label: 'Payout', value: dividend.payoutRatio ? pct(dividend.payoutRatio) : '—' },
                  { label: 'Ex-Date', value: dividend.exDividendDate ? new Date(dividend.exDividendDate * 1000).toLocaleDateString() : '—' },
                ]} />

                {analyst.recommendationKey && (
                  <>
                    <SectionLabel>Analyst Consensus</SectionLabel>
                    <div style={{ background: 'var(--surface)', borderRadius: 0, padding: '10px 12px', marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', textTransform: 'capitalize' }}>
                          {analyst.recommendationKey.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: 11, color: '#4b5563' }}>
                          {analyst.numberOfAnalystOpinions ?? '?'} analysts
                        </span>
                      </div>
                      {analyst.targetMeanPrice && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 4 }}>
                          {[
                            { label: 'Low', value: analyst.targetLowPrice ? fmt(analyst.targetLowPrice, 2) : '—', color: '#e2e8f0' },
                            { label: 'Mean', value: analyst.targetMeanPrice ? fmt(analyst.targetMeanPrice, 2) : '—', color: '#60a5fa' },
                            { label: 'High', value: analyst.targetHighPrice ? fmt(analyst.targetHighPrice, 2) : '—', color: '#e2e8f0' },
                          ].map(({ label, value, color }) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 10, color: '#4b5563' }}>{label}</div>
                              <div style={{ fontSize: 11, color, fontWeight: 500 }}>{value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── Financials ── */}
            {!loading && tab === 'financials' && (
              <>
                <SectionLabel>Income Statement</SectionLabel>
                {finRows.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '5px 6px', color: '#4b5563', fontWeight: 400 }}>Item</th>
                        {finRows.slice(0, 2).map(([yr]) => (
                          <th key={yr} style={{ textAlign: 'right', padding: '5px 6px', color: '#4b5563', fontWeight: 400 }}>
                            {yr.slice(0, 4)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Revenue', key: 'Total Revenue', color: '#e2e8f0' },
                        { name: 'Gross Profit', key: 'Gross Profit', color: '#4ade80' },
                        { name: 'Net Income', key: 'Net Income', color: '#4ade80' },
                        { name: 'EBIT', key: 'EBIT', color: '#e2e8f0' },
                        { name: 'Diluted EPS', key: 'Diluted EPS', color: '#fbbf24' },
                      ].map(({ name, key, color }) => (
                        <tr key={name} style={{ borderBottom: '0.5px solid var(--border)' }}>
                          <td style={{ padding: '6px 6px', color: '#6b7280' }}>{name}</td>
                          {finRows.slice(0, 2).map(([yr, yd]) => (
                            <td key={yr} style={{ padding: '6px 6px', textAlign: 'right', color }}>
                              {yd?.[key] != null ? formatBig(yd[key]) : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: '#374151', fontSize: 12, marginBottom: 14, padding: 8 }}>
                    No financial data cached. Run scrape first.
                  </div>
                )}
              </>
            )}

            {/* ── About ── */}
            {!loading && tab === 'about' && (
              <>
                <SectionLabel>Company</SectionLabel>
                <div style={{ background: 'var(--surface)', borderRadius: 0, padding: '10px 12px', marginBottom: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, marginBottom: 10 }}>
                    {[
                      { label: 'Sector', value: identity.sector || stock.sector },
                      { label: 'Industry', value: identity.industry || stock.industry },
                      { label: 'Country', value: identity.country },
                      { label: 'Employees', value: identity.fullTimeEmployees ? identity.fullTimeEmployees.toLocaleString() : '—' },
                      { label: 'Website', value: identity.website },
                    ].filter(r => r.value).map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ color: '#4b5563', fontSize: 10 }}>{label}</div>
                        <div style={{ color: '#e2e8f0', marginTop: 2, wordBreak: 'break-all' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {identity.longBusinessSummary && (
                    <p style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>
                      {identity.longBusinessSummary}
                    </p>
                  )}
                  {!identity.longBusinessSummary && (
                    <p style={{ fontSize: 10, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                      {stock.name} is a company in the {stock.sector} sector operating in the {stock.industry} industry.
                    </p>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
