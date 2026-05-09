import React from 'react'
import { Search } from 'lucide-react'
import { useScreener } from '../hooks/useScreener'
import ScreenerSidebar from '../components/screener/ScreenerSidebar'
import ScreenerHeader from '../components/screener/ScreenerHeader'
import StockCard from '../components/screener/StockCard'
import StockDetailPanel from './StockDetailPanel'

export default function ScreenerView() {
  const s = useScreener()

  return (
  <div className="w-full h-full flex flex-col bg-background relative overflow-hidden text-text">

    <div className="flex-1 flex overflow-hidden">

      <ScreenerSidebar
        region={s.region}
        setRegion={s.setRegion}
        regionKeys={s.regionKeys}
        sidebarWidth={s.sidebarWidth}
        isResizing={s.isResizing}
        setIsResizing={s.setIsResizing}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-background">

        <ScreenerHeader
          region={s.region}
          search={s.search}
          setSearch={s.setSearch}
          availableTickers={s.availableTickers}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {s.stocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 border border-dashed border-border/50 bg-surface/10">
              <Search size={32} className="text-muted/20" />
              <span className="text-xs text-muted uppercase tracking-widest">No assets matched</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {s.stocks.map(stock => (
                <StockCard key={stock.ticker} stock={stock} onClick={s.setSelectedStock} />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>

    {s.selectedStock && (
      <div className="absolute inset-0 z-[100] bg-background">
        <StockDetailPanel
          stock={s.selectedStock}
          onClose={() => s.setSelectedStock(null)}
        />
      </div>
    )}

  </div>
)
}
