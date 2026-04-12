export default function ForexTable({ rates = [] }) {
  const pairs = Object.values(rates)
  if (!pairs.length) return (
    <div className="p-3 text-xs text-white/40">No forex data</div>
  )
  return (
    <div className="p-3">
      <h3 className="text-xs font-bold text-white/50 uppercase mb-2">Forex Rates</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-white/40">
            <th className="text-left font-medium">Pair</th>
            <th className="text-right font-medium">Rate</th>
            <th className="text-right font-medium">Chg%</th>
          </tr>
        </thead>
        <tbody className="space-y-1">
          {pairs.map((r) => {
            const chg = r.change_pct
            const color = chg >= 0 ? '#22c55e' : '#ef4444'
            return (
              <tr key={r.pair} className="text-white/70">
                <td className="py-0.5">{r.label}</td>
                <td className="text-right py-0.5">{r.current_rate?.toFixed(4)}</td>
                <td className="text-right py-0.5 font-medium" style={{ color }}>{chg >= 0 ? '+' : ''}{(chg * 100).toFixed(2)}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}