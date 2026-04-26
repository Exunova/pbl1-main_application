export default function StockCard({ ticker, onClick, loading = false }) {
  return (
  <div
    onClick={onClick}
    className="bg-card rounded p-3 cursor-pointer hover:bg-border/30 transition-colors border border-transparent hover:border-border"
  >
    {loading ? (
      <>
        <div className="text-xs font-bold text-accent animate-pulse">{ticker}</div>
        <div className="text-[10px] text-muted mt-1">...</div>

        <div className="h-8 bg-surface rounded mt-1 flex items-center justify-center text-[9px] text-muted/50 animate-pulse">
          {ticker}
        </div>
      </>
    ) : (
      <>
        <div className="text-xs font-bold text-accent">{ticker}</div>
        <div className="text-[10px] text-muted mt-1">Sparkline</div>

        <div className="h-8 bg-surface rounded mt-1 flex items-center justify-center text-[9px] text-muted/50">
          {ticker}
        </div>
      </>
    )}
  </div>
)
}