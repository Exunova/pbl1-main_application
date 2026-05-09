import { MARKETS } from '../../data/mockData'

import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  Line
} from 'recharts'

export default function ComparisonChart({
  chartData,
  loading,
  idx1,
  idx2,
  idx1Color,
  idx2Color
}) {
  return (
    <div className="xl:col-span-2 border-r border-b border-border flex flex-col overflow-hidden">

      <div className="px-6 py-3 border-b border-border shrink-0 bg-surface/10">
        <h3 className="text-xs font-bold text-text uppercase tracking-widest">
          Index Comparison
        </h3>
      </div>

      <div className="flex-1 relative p-4">

        {loading ? (
          <Loading />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>

              <XAxis
                dataKey="ts"
                tick={{
                  fill: 'var(--muted)',
                  fontSize: 10
                }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
              />

              <YAxis
                tick={{
                  fill: 'var(--muted)',
                  fontSize: 10
                }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                orientation="right"
              />

              <Tooltip />

              <Legend
                payload={[
                  {
                    value: MARKETS[idx1].label,
                    type: 'line',
                    color: idx1Color
                  },
                  {
                    value: MARKETS[idx2].label,
                    type: 'line',
                    color: idx2Color
                  }
                ]}
              />

              <Area
                name="OUTPERFORM"
                type="monotone"
                dataKey="v1_high"
                fill="var(--success)"
                fillOpacity={0.2}
                stroke="none"
              />

              <Area
                name="UNDERPERFORM"
                type="monotone"
                dataKey="v1_low"
                fill="var(--danger)"
                fillOpacity={0.2}
                stroke="none"
              />

              <Line
                dataKey="v1"
                stroke={idx1Color}
                strokeWidth={1.5}
                dot={false}
              />

              <Line
                dataKey="v2"
                stroke={idx2Color}
                strokeWidth={1.5}
                dot={false}
              />

            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <NoData />
        )}

      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-full text-muted text-xs uppercase animate-pulse">
      Loading chart...
    </div>
  )
}

function NoData() {
  return (
    <div className="flex items-center justify-center h-full text-muted text-xs uppercase">
      No data
    </div>
  )
}