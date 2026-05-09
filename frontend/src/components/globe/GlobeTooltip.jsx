import React from 'react'

export default function GlobeTooltip({ tooltip }) {
  if (!tooltip.visible || !tooltip.content) return null
  const { content, x, y } = tooltip
  const chgClr  = content.change_pct > 0 ? 'var(--success)' : content.change_pct < 0 ? 'var(--danger)' : 'var(--muted)'
  const sign    = content.change_pct > 0 ? '+' : ''
  return (
    <div
      className="absolute pointer-events-none z-50 rounded-xl border border-border px-3 py-2 shadow-2xl text-sm bg-surface backdrop-blur"
      style={{ left: x + 14, top: y + 14 }}
    >
      <div className="font-bold text-text text-sm">{content.country}</div>
      <div className="text-muted text-xs">{content.name}</div>
      <div className="text-text opacity-80 text-xs">Price: {content.current_price}</div>
      {content.change_pct !== null && (
        <div className="font-semibold text-xs" style={{ color: chgClr }}>
          {sign}{content.change_pct?.toFixed(2)}%
        </div>
      )}
    </div>
  )
}
