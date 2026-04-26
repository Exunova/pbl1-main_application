import { useState, useEffect } from 'react'
import CandlestickChart from './CandlestickChart'

function formatBillions(val) {
  if (val == null) return '—'
  const abs = Math.abs(val)
  if (abs >= 1e12) return `$${(val / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `$${(val / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `$${(val / 1e6).toFixed(2)}M`
  return `$${val.toFixed(2)}`
}

function formatYear(dateStr) {
  if (!dateStr) return '—'
  return dateStr.slice(0, 4)
}

export default function StockDetailModal({ ticker, onClose }) {
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState(null)
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(false)
  const [infoLoading, setInfoLoading] = useState(false)

  useEffect(() => {
    if (!window.api) return
    if (tab === 'chart') {
      if (chartData.length) return
      setChartLoading(true)
      window.api.fetchOHLCV(ticker).then(d => {
        setChartData(d.ohlcv_15m || [])
        setChartLoading(false)
      }).catch(() => setChartLoading(false))
    }
    if (tab === 'overview' || tab === 'financials' || tab === 'about') {
      if (data) return
      setInfoLoading(true)
      window.api.fetchCompany(ticker).then(d => {
        setData(d)
        setInfoLoading(false)
      }).catch(() => setInfoLoading(false))
    }
  }, [ticker, tab])

  const financialsData = data?.financials?.income_statement
  const financialsRows = financialsData
    ? Object.entries(financialsData)
        .filter(([, yearData]) => yearData && Object.values(yearData).some(v => v != null))
        .sort(([a], [b]) => b.localeCompare(a))
    : []

  const aboutInfo = data?.info?.identity

  return (
  <div className="fixed inset-0 bg-background/70 z-50 flex items-center justify-center p-4">
    <div className="bg-surface rounded-lg w-[800px] max-h-[85vh] flex flex-col border border-border">

      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="font-bold text-accent text-sm">{ticker}</span>
        <button onClick={onClose} className="text-muted hover:text-text text-lg">×</button>
      </div>

      <div className="flex border-b border-border">
        {['overview', 'chart', 'financials', 'about'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium capitalize ${
              tab === t
                ? 'text-accent border-b border-accent'
                : 'text-muted hover:text-text'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        className={`flex-1 ${tab === 'chart' ? '' : 'overflow-auto p-3'}`}
        style={tab === 'chart'
          ? { minHeight: 0, display: 'flex', flexDirection: 'column' }
          : {}}
      >
        {tab === 'chart' ? (
          chartLoading ? (
            <div className="text-xs text-muted p-3">Loading chart...</div>
          ) : (
            <CandlestickChart data={chartData} />
          )
        ) : tab === 'overview' ? (
          infoLoading ? (
            <div className="text-xs text-muted">Loading...</div>
          ) : data ? (
            <div className="space-y-1 text-xs text-muted">
              <div>Company: {data.info?.identity?.longName || '—'}</div>
              <div>Sector: {data.info?.identity?.sector || '—'}</div>
              <div>Industry: {data.info?.identity?.industry || '—'}</div>
              <div>Price: {data.info?.price?.currentPrice ? `$${data.info.price.currentPrice}` : '—'}</div>
              <div>Market Cap: {data.info?.price?.marketCap ? `${(data.info.price.marketCap / 1e12).toFixed(2)}T` : '—'}</div>
              <div>P/E: {data.info?.valuation?.trailingPE || '—'}</div>
              <div>Dividend: {data.info?.dividend?.dividendYield ? `${data.info.dividend.dividendYield.toFixed(2)}%` : '—'}</div>
              <div>Analyst: {data.info?.analyst?.recommendationKey || '—'}</div>
              <div>Target: {data.info?.analyst?.targetMeanPrice ? `$${data.info.analyst.targetMeanPrice.toFixed(2)}` : '—'}</div>
            </div>
          ) : (
            <div className="text-xs text-muted">No company data available</div>
          )
        ) : tab === 'financials' ? (
          infoLoading ? (
            <div className="text-xs text-muted">Loading...</div>
          ) : financialsRows.length > 0 ? (
            <table className="w-full text-xs text-muted">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1 pr-3 font-medium">Year</th>
                  <th className="text-right py-1 pr-3 font-medium">Revenue</th>
                  <th className="text-right py-1 pr-3 font-medium">Gross Profit</th>
                  <th className="text-right py-1 pr-3 font-medium">Op. Income</th>
                  <th className="text-right py-1 pr-3 font-medium">Net Income</th>
                  <th className="text-right py-1 font-medium">EPS</th>
                </tr>
              </thead>
              <tbody>
                {financialsRows.map(([dateStr, yearData]) => (
                  <tr key={dateStr} className="border-b border-border">
                    <td className="py-1.5 pr-3">{formatYear(dateStr)}</td>
                    <td className="text-right py-1.5 pr-3">{formatBillions(yearData['Total Revenue'])}</td>
                    <td className="text-right py-1.5 pr-3">{formatBillions(yearData['Gross Profit'])}</td>
                    <td className="text-right py-1.5 pr-3">{formatBillions(yearData['Operating Income'])}</td>
                    <td className="text-right py-1.5 pr-3">{formatBillions(yearData['Net Income'])}</td>
                    <td className="text-right py-1.5">
                      {yearData['Diluted EPS'] != null ? yearData['Diluted EPS'].toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-xs text-muted">No financial data available</div>
          )
        ) : (
          infoLoading ? (
            <div className="text-xs text-muted">Loading...</div>
          ) : aboutInfo ? (
            <div className="space-y-3 text-xs text-muted">
              {aboutInfo.longBusinessSummary && (
                <p className="text-muted/80 leading-relaxed">
                  {aboutInfo.longBusinessSummary}
                </p>
              )}

              <div className="space-y-1">
                {aboutInfo.website && (
                  <div>
                    Website:{' '}
                    <a
                      href={aboutInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      {aboutInfo.website}
                    </a>
                  </div>
                )}
                {aboutInfo.sector && <div>Sector: {aboutInfo.sector}</div>}
                {aboutInfo.industry && <div>Industry: {aboutInfo.industry}</div>}
                {aboutInfo.fullTimeEmployees != null && (
                  <div>Employees: {aboutInfo.fullTimeEmployees.toLocaleString()}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted">No about data available</div>
          )
        )}
      </div>
    </div>
  </div>
)
}
