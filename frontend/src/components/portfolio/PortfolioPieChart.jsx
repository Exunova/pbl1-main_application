import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { COLORS } from '../../utils/portfolioUtils'

export default function PortfolioPieChart({ data }) {
  return (
    <div className="lg:col-span-1 bg-surface border border-border p-5 h-[380px] flex flex-col overflow-hidden">
      <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 border-b border-border/50 pb-2">Asset Allocation</h3>
      <div className="flex-1 relative w-full h-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="#000" strokeWidth={1}>
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip 
              formatter={(value) => value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '10px' }} 
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] text-muted uppercase tracking-widest">Assets</span>
          <span className="text-xl font-bold text-white number-font">{data.length}</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 max-h-[100px] overflow-y-auto custom-scrollbar pr-1 shrink-0">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-[9px] uppercase tracking-wider">
            <div className="w-1.5 h-1.5 shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
            <span className="font-bold text-muted truncate">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
