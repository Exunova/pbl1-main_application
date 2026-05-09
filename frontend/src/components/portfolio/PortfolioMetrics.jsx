import React from 'react'

export default function PortfolioMetrics({ total }) {
  if (!total) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      {[
        { label: 'Total P&L (IDR)', value: total.totalPnL, color: 'text-success' },
        { label: 'Stock Return (IDR)', value: total.stockReturn, color: 'text-white' },
        { label: 'Forex Return (IDR)', value: total.forexReturn, color: 'text-secondary' }
      ].map((metric, i) => (
        <div key={i} className="bg-surface border border-border p-4 flex flex-col justify-center">
          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{metric.label}</div>
          <div className={`text-xl font-bold number-font ${metric.value >= 0 ? metric.color : 'text-danger'} flex items-center gap-2`}>
            {metric.value >= 0 ? '+' : ''}{metric.value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
          </div>
        </div>
      ))}
    </div>
  )
}
