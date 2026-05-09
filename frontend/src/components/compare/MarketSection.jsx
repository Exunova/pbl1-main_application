import { MARKETS } from '../../data/mockData'
import MarketHeatmap from '../MarketHeatmap'

export default function MarketSection({
  region,
  index,
  tickerData,
  selectedNewsRegion,
  onToggleNews,
  color
}) {
  const isSelected = selectedNewsRegion === region

  return (
    <div
      className={`
        flex-1 flex flex-col overflow-hidden cursor-pointer group
        ${index === 0 ? 'border-b border-border' : ''}
        ${isSelected ? 'bg-surface' : 'hover:bg-surface/30'}
      `}
      onClick={onToggleNews}
    >
      <div className="px-6 py-3 border-b border-border/50 flex justify-between items-center shrink-0">

        <h3
          className={`
            text-[10px] font-bold uppercase tracking-widest
            flex items-center gap-2
            ${isSelected ? 'text-text' : 'text-muted group-hover:text-text'}
          `}
        >
          <div
            className="w-2 h-2 shrink-0"
            style={{ background: color }}
          />

          {MARKETS[region].label}
        </h3>

      </div>

      <div className="flex-1 w-full bg-background relative min-h-0">
        <MarketHeatmap
          tickers={MARKETS[region].tickers}
          data={tickerData}
        />
      </div>
    </div>
  )
}