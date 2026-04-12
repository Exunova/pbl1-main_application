export default function MarketHeatmap({ tickers = [], data = {} }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {tickers.map(t => {
        const chg = data[t]?.change_pct || 0
        const bg = chg > 0 ? `rgba(34,197,94,${Math.min(Math.abs(chg)/5+0.2, 0.8)})` : chg < 0 ? `rgba(239,68,68,${Math.min(Math.abs(chg)/5+0.2, 0.8)})` : '#1c2030'
        return (
          <div key={t} className="rounded p-1 text-[10px] text-center truncate flex flex-col items-center justify-center" style={{ background: bg }}>
            <span className="text-white/80 font-medium">{t}</span>
            {data[t] && <span className="text-[9px]" style={{ color: chg >= 0 ? '#22c55e' : '#ef4444' }}>{chg >= 0 ? '+' : ''}{chg.toFixed(1)}%</span>}
          </div>
        )
      })}
    </div>
  )
}