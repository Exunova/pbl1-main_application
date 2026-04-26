import { useState, useEffect } from 'react'

export default function ForexTable() {
  const [forexData, setForexData] = useState([])

  useEffect(() => {
    if (!window.api) return
    const pairs = ['IDR_USD', 'JPY_USD', 'GBP_USD', 'USD_IDR', 'USD_JPY', 'USD_GBP']
    Promise.all(pairs.map(p => window.api.fetchForex(p)))
      .then(results => results.filter(Boolean))
      .then(setForexData)
      .catch(() => {})
  }, [])

  if (!forexData.length) return <div className="p-3 text-xs text-white/40">Loading forex...</div>

  return (
  <div className="p-3">
    <h3 className="text-xs font-bold text-muted uppercase mb-2">
      Forex Rates
    </h3>

    <table className="w-full text-xs">
      <thead>
        <tr className="text-muted">
          <th className="text-left font-medium">Pair</th>
          <th className="text-right font-medium">Rate</th>
          <th className="text-right font-medium">Chg%</th>
        </tr>
      </thead>

      <tbody className="space-y-1">
        {forexData.map((r) => {
          const chg = r.change_pct

          return (
            <tr key={r.pair} className="text-text/80">
              <td className="py-0.5">{r.label || r.pair}</td>

              <td className="text-right py-0.5">
                {r.current_rate?.toFixed(4) ?? '—'}
              </td>

              <td
                className={`text-right py-0.5 font-medium ${
                  chg >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {chg != null
                  ? `${chg >= 0 ? '+' : ''}${(chg * 100).toFixed(2)}%`
                  : '—'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)
}