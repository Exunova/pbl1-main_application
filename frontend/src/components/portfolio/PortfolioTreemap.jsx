import React from 'react'
import { ResponsiveContainer, Treemap } from 'recharts'
import { Activity } from 'lucide-react'

const CustomTreemapContent = React.memo(function CustomTreemapContent(props) {
  const { x, y, width, height, name } = props
  const parts = (name || ':0').split(':')
  const ticker = parts[0]
  const changeStr = parts[1] || '0'
  const change = parseFloat(changeStr)

  const showText = width > 40 && height > 30
  
  let bgColor = '#3f3f46'
  if (change >= 5) bgColor = '#059669'
  else if (change > 0) bgColor = '#065f46'
  else if (change <= -5) bgColor = '#dc2626'
  else if (change < 0) bgColor = '#991b1b'

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={bgColor} stroke="#000" strokeWidth={1} />
      {showText && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 4} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold" stroke="none"
            fontFamily="'Fira Sans', sans-serif" pointerEvents="none">{ticker}</text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={10} stroke="none"
            fontFamily="'Fira Code', monospace" pointerEvents="none">{changeStr}%</text>
        </>
      )}
    </g>
  )
})

export default function PortfolioTreemap({ data, positionsCount }) {
  return (
    <div className="lg:col-span-2 bg-surface border border-border p-5 min-h-[380px] flex flex-col relative">
      <h3 className="text-xs font-bold var(--text) uppercase tracking-widest mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
        <Activity size={14} className="text-muted" /> Active Positions Map
      </h3>
      <div className="flex-1 min-h-[300px] relative">
        {positionsCount === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted border border-dashed border-border/50">
            <span className="text-xs uppercase tracking-widest">No positions active</span>
          </div>
        ) : (
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={data} dataKey="size" aspectRatio={4/3} stroke="#000" isAnimationActive={false} content={<CustomTreemapContent />} />
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
