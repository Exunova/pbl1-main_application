import React from 'react'

// Mock Recharts components for jsdom testing
// jsdom doesn't support SVG rendering, so we provide simple div-based mocks

export function ResponsiveContainer({ children, width = '100%', height = '100%' }) {
  return (
    <div
      className="recharts-wrapper recharts-responsive-container"
      style={{ width, height, display: 'block' }}
    >
      {children}
    </div>
  )
}

export function Treemap({ data, dataKey, aspectRatio, stroke, isAnimationActive, content }) {
  // Render custom content if provided, otherwise render simple labels
  return (
    <div className="recharts-treemap" style={{ width: '100%', height: '100%' }}>
      {data && data.map((item, index) => {
        const nameParts = (item.name || '').split(':')
        const ticker = nameParts[0] || ''
        const changeStr = nameParts[1] || '0'
        const change = parseFloat(changeStr)

        let bgColor = '#3f3f46'
        if (change > 1.5) bgColor = '#059669'
        else if (change > 0) bgColor = '#065f46'
        else if (change < -1.5) bgColor = '#dc2626'
        else if (change < 0) bgColor = '#991b1b'

        return (
          <div
            key={index}
            style={{
              backgroundColor: bgColor,
              border: '1px solid #000',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              overflow: 'hidden',
            }}
          >
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>{ticker}</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '10px' }}>{changeStr}%</span>
          </div>
        )
      })}
    </div>
  )
}

export function LineChart({ children, data }) {
  return (
    <div className="recharts-line-chart">
      {React.Children.map(children, (child) => {
        if (child?.type?.name === 'Line') {
          const stroke = child.props?.stroke || '#3b82f6'
          const dataKey = child.props?.dataKey || 'v'
          const chartData = data || []
          return (
            <div
              className="recharts-line"
              style={{ stroke }}
              data-datakey={dataKey}
            >
              {/* Mock line visualization */}
              {chartData.length > 0 && (
                <div className="recharts-line-dots" style={{ display: 'none' }}>
                  {chartData.map((d, i) => (
                    <span key={i} className="recharts-line-dot" style={{ display: 'none' }} />
                  ))}
                </div>
              )}
            </div>
          )
        }
        return child
      })}
    </div>
  )
}

export function AreaChart({ children, data }) {
  return (
    <div className="recharts-area-chart">
      {React.Children.map(children, (child) => {
        if (child?.type?.name === 'Area') {
          const stroke = child.props?.stroke || '#3b82f6'
          const fill = child.props?.fill || stroke + '22'
          return (
            <div className="recharts-area" style={{ stroke, fill }} />
          )
        }
        return child
      })}
    </div>
  )
}

export function Bar({ dataKey, fill }) {
  return (
    <div className="recharts-bar">
      {/* For candlestick, we need rectangular bars */}
      <div className="recharts-bar-rectangle" style={{ backgroundColor: fill || '#3b82f6' }} />
    </div>
  )
}

export function Area({ type, dataKey, stroke, fill, strokeWidth, dot, isAnimationActive }) {
  return (
    <div
      className="recharts-area"
      style={{
        stroke: stroke || '#3b82f6',
        fill: fill || (stroke + '22') || '#3b82f622',
        strokeWidth: strokeWidth || 1.5,
      }}
      data-datakey={dataKey}
    />
  )
}

export function Line({ type, dataKey, stroke, strokeWidth, dot, isAnimationActive }) {
  return (
    <div
      className="recharts-line"
      style={{ stroke: stroke || '#3b82f6', strokeWidth: strokeWidth || 1.5 }}
      data-datakey={dataKey}
    />
  )
}

export function ComposedChart({ children, data }) {
  return (
    <div className="recharts-composed-chart">
      {React.Children.map(children, (child) => {
        // Pass through children - they'll be rendered by their respective mocks
        return child
      })}
    </div>
  )
}

export function Tooltip({ content, formatter, labelFormatter }) {
  return (
    <div className="recharts-tooltip">
      {typeof content === 'function' ? content({ label: '', payload: [] }) : content}
    </div>
  )
}

export function XAxis({ dataKey, tick, axisLine, tickLine, padding }) {
  return <div className="recharts-xAxis" data-datakey={dataKey} />
}

export function YAxis({ dataKey, tick, axisLine, tickLine, domain, orientation }) {
  return <div className="recharts-yAxis" data-datakey={dataKey} />
}

export function Legend() {
  return <div className="recharts-legend" />
}

export function PieChart({ children }) {
  return <div className="recharts-pie-chart">{children}</div>
}

export function Pie({ data, dataKey, cx, cy, innerRadius, outerRadius }) {
  return (
    <div className="recharts-pie" data-datakey={dataKey}>
      {data?.map((entry, index) => (
        <div key={index} className="recharts-pie-sector" />
      ))}
    </div>
  )
}

export function Cell({ fill, stroke }) {
  return <div className="recharts-cell" style={{ fill, stroke }} />
}

// Default export with all components
export default {
  ResponsiveContainer,
  Treemap,
  LineChart,
  AreaChart,
  Bar,
  Area,
  Line,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  PieChart,
  Pie,
  Cell,
}