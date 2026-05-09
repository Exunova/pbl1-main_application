import React from 'react'
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis, XAxis } from 'recharts'
import { COUNTRY_INDEX_MAP } from '../../utils/globeUtils'

export default function GlobeBottomChart({ 
  selectedCountry, 
  selectedIndexData, 
  chartData, 
  chartHeight, 
  isZooming, 
  panelWidth, 
  isResizing, 
  setIsResizing 
}) {
  if (!selectedCountry) return null

  return (
    <div
      className="absolute bottom-0 left-0 border-t border-border backdrop-blur-md flex flex-col shrink-0 transition-all duration-700 ease-out z-20 bg-surface"
      style={{
        height: `${chartHeight}px`,
        opacity: isZooming ? 0 : 1,
        transform: isZooming ? 'translateY(100%)' : 'translateY(0)',
        right: `${panelWidth}px`,
      }}
    >
      {/* drag handle */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 cursor-row-resize transition-colors ${isResizing ? 'bg-accent' : 'hover:bg-accent/50'}`}
        onMouseDown={() => setIsResizing(true)}
      />
      <div className="flex-1 p-4 flex flex-col relative overflow-hidden">
        <div className="flex items-center justify-between mb-2 z-10">
          <div>
            <h3 className="text-sm font-semibold uppercase text-text opacity-80 tracking-widest">
              {COUNTRY_INDEX_MAP[selectedCountry]?.name || selectedCountry}
            </h3>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-2xl font-bold text-text">
                {selectedIndexData?.current_price ?? '—'}
              </span>
              {selectedIndexData?.change_pct != null && (
                <span className={`text-sm mb-0.5 ${selectedIndexData.change_pct >= 0 ? 'text-success' : 'text-danger'}`}>
                  {selectedIndexData.change_pct >= 0 ? '+' : ''}{selectedIndexData.change_pct.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </div>
         <div className="absolute inset-0 pt-16 pb-2">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
               <XAxis dataKey="time" hide />
               <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
               <Tooltip
                 content={({ active, payload }) => {
                   if (active && payload?.length) {
                     const d = payload[0].payload
                     return (
                       <div className="p-2 text-[10px] font-mono border border-border bg-surface">
                         <span className="text-text">Close: {d.close?.toFixed(2)}</span>
                       </div>
                     )
                   }
                   return null
                 }}
               />
               <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
             </LineChart>
           </ResponsiveContainer>
         </div>
      </div>
    </div>
  )
}
