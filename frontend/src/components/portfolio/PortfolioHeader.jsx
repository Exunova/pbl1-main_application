import React from 'react'
import { Plus, Layers } from 'lucide-react'

export default function PortfolioHeader({ onOpenAdd }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-4 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-surface border border-border">
          <Layers className="text-white" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-widest uppercase">Portfolio Overview</h2>
          <p className="text-[10px] text-muted tracking-widest uppercase mt-0.5">Asset Management Terminal</p>
        </div>
      </div>
      <button 
        onClick={onOpenAdd} 
        className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[11px] font-bold uppercase tracking-widest border border-white hover:bg-gray-200 transition-colors"
      >
        <Plus size={14} /> Add Position
      </button>
    </div>
  )
}
