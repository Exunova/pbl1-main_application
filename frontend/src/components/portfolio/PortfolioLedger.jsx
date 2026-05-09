import React from 'react'
import { Edit2, Trash2 } from 'lucide-react'
import { ambilPnl } from '../../utils/portfolioUtils'

export default function PortfolioLedger({ positions, pnlData, onEdit, onDelete }) {
  return (
    <div className="bg-surface border border-border overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <div className="p-4 border-b border-border/50 bg-[#0a0a0a]">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Position Details (Ledger)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left whitespace-nowrap">
          <thead className="bg-[#111] text-muted uppercase tracking-widest text-[9px] border-b border-border/50">
            <tr>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3 text-right">SHARES (Lot)</th>
              <th className="px-4 py-3 text-right">Buy Price</th>
              <th className="px-4 py-3 text-right">PnL</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {positions.map((p, index) => {
              const isLoading = !pnlData;
              const cur = ambilPnl(p, index, pnlData)
              const pnl = cur?.stockReturn || 0
              const pnlPct = isLoading ? 0 : (cur?.buyPriceIDR && cur?.shares ? (pnl / (cur.buyPriceIDR * cur.shares)) * 100 : 0)
              const isProfit = pnl >= 0;
              return (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-bold text-white">{p.ticker}</td>
                  <td className="px-4 py-3 text-muted max-w-[150px] truncate" title={p.company}>{p.company}</td>
                  <td className="px-4 py-3 text-right font-medium number-font">{p.shares / 100}</td>
                  <td className="px-4 py-3 text-right number-font">{p.buyPrice?.toFixed(2)} <span className="text-[9px] ml-0.5">{p.currency}</span></td>
                  <td className="px-4 py-3 text-right">
                    {isLoading ? <span className="text-muted">CALC...</span> : (
                      <div className={`font-bold number-font ${isProfit ? 'text-success' : 'text-danger'}`}>
                        {isProfit ? '+' : ''}{pnl.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} <span className="opacity-70 text-[9px]">({pnlPct.toFixed(2)}%)</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => onEdit(p)} className="text-muted hover:text-white" title="Edit"><Edit2 size={12} /></button>
                      <button onClick={() => onDelete(p)} className="text-muted hover:text-danger" title="Delete"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
