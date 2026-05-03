import { Treemap, ResponsiveContainer } from 'recharts'

function formatChange(n) {
  if (n == null || isNaN(n)) return '0.00'
  return (n >= 0 ? '+' : '') + n.toFixed(2)
}

function CustomTreemapContent(props) {
  const { x, y, width, height, name } = props
  
  const parts = (name || ':0').split(':')
  const ticker = parts[0]
  const changeStr = parts[1] || '0'
  const change = parseFloat(changeStr)

  const showText = width > 40 && height > 30
  
  let bgColor = '#3f3f46'
  if (change > 1.5) bgColor = '#059669'
  else if (change > 0) bgColor = '#065f46'
  else if (change < -1.5) bgColor = '#dc2626'
  else if (change < 0) bgColor = '#991b1b'

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={bgColor} stroke="#000" strokeWidth={1}
        onMouseEnter={e => { e.target.style.filter = 'brightness(1.3)' }}
        onMouseLeave={e => { e.target.style.filter = 'brightness(1)' }}
      />
      {showText && (
        <text x={x + width / 2} y={y + height / 2 - 4} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold"
          fontFamily="'Fira Sans', sans-serif" pointerEvents="none">{ticker}</text>
      )}
      {showText && (
        <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={10}
          fontFamily="'Fira Code', monospace" pointerEvents="none">{changeStr}%</text>
      )}
    </g>
  )
}

export default function MarketHeatmap({ tickers = [], data = {} }) {
  const treeData = tickers.map(t => {
    const info = data[t] || {}
    const chg = info.change_pct ?? 0
    return {
      name: t + ':' + formatChange(chg),
      size: info.marketCap || 500
    }
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Treemap data={treeData} dataKey="size" aspectRatio={4/3} stroke="#000"
        isAnimationActive={false} content={<CustomTreemapContent />} />
    </ResponsiveContainer>
  )
}
