import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function CandlestickChart({ data = [] }) {
  const candles = data.map(d => {
    const open = d.open, close = d.close, high = d.high, low = d.low
    const isGreen = close >= open
    return {
      ...d,
      fill: isGreen ? '#22c55e' : '#ef4444',
      bodyY: Math.min(open, close),
      wickY: high,
      wickY2: low,
      range: Math.abs(close - open) || 1,
    }
  })

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={candles}>
          <XAxis dataKey="timestamp" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#1e2433' }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#1e2433' }} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2433', borderRadius: 6, color: '#e2e8f0', fontSize: 11 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(val, name) => [val?.toFixed ? val.toFixed(2) : val, name]} />
          <Bar dataKey="bodyY" barWidth={6} radius={[1,1,0,0]}>
            {candles.map((c, i) => <Cell key={i} fill={c.fill} />)}
          </Bar>
          <Line type="monotone" dataKey="wickY" stroke="#94a3b8" strokeWidth={1} dot={false} />
          <Line type="monotone" dataKey="wickY2" stroke="#94a3b8" strokeWidth={1} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}