import { AreaChart, Area, ResponsiveContainer } from 'recharts'

export default function Sparkline({ data = [], positive = true, width = 80, height = 32 }) {
  const chartData = data.map((v, i) => ({ v: typeof v === 'number' ? v : v.close || v }))
  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={chartData}>
        <Area type="monotone" dataKey="v" stroke={positive ? '#22c55e' : '#ef4444'} fill={positive ? '#22c55e22' : '#ef444422'} strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}