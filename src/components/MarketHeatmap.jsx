export default function MarketHeatmap({ tickers = [] }) {
  return (
    <div className="grid grid-cols-5 gap-1">
      {tickers.map(t => (
        <div key={t} className="bg-[#1c2030] rounded p-1 text-[10px] text-center text-white/60 truncate">
          {t}
        </div>
      ))}
    </div>
  )
}