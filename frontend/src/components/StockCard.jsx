export default function StockCard({ ticker, onClick }) {
  return (
    <div onClick={onClick}
      className="bg-[#1c2030] rounded p-3 cursor-pointer hover:bg-[#252a3a] transition-colors border border-transparent hover:border-white/10">
      <div className="text-xs font-bold text-accent">{ticker}</div>
      <div className="text-[10px] text-white/30 mt-1">Sparkline</div>
      <div className="h-8 bg-[#141720] rounded mt-1 flex items-center justify-center text-[9px] text-white/20">
        {ticker}
      </div>
    </div>
  )
}