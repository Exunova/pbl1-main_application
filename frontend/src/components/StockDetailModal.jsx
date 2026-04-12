import { useState, useEffect } from 'react'
import CandlestickChart from './CandlestickChart'

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

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#141720] rounded-lg w-[700px] max-h-[80vh] flex flex-col border border-white/10">
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <span className="font-bold text-accent text-sm">{ticker}</span>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg">×</button>
        </div>
        <div className="flex border-b border-white/5">
          {['overview', 'chart', 'financials', 'about'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium capitalize ${tab === t ? 'text-accent border-b border-accent' : 'text-white/40'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-3">
          {tab === 'chart' ? (
            chartLoading ? (
              <div className="text-xs text-white/40">Loading chart...</div>
            ) : (
              <CandlestickChart data={chartData} />
            )
          ) : tab === 'overview' ? (
            infoLoading ? (
              <div className="text-xs text-white/40">Loading...</div>
            ) : data ? (
              <div className="space-y-1 text-xs text-white/70">
                <div>Company: {data.info?.identity?.longName}</div>
                <div>Sector: {data.info?.identity?.sector}</div>
                <div>Industry: {data.info?.identity?.industry}</div>
                <div>Price: ${data.info?.price?.currentPrice}</div>
                <div>Market Cap: {(data.info?.price?.marketCap / 1e12).toFixed(2)}T</div>
                <div>P/E: {data.info?.valuation?.trailingPE}</div>
                <div>Dividend: {data.info?.dividend?.dividendYield != null ? `${(data.info.dividend.dividendYield * 100).toFixed(2)}%` : '—'}</div>
                <div>Analyst: {data.info?.analyst?.recommendationKey}</div>
                <div>Target: ${data.info?.analyst?.targetMeanPrice}</div>
              </div>
            ) : (
              <div className="text-xs text-white/30">Financials — coming soon</div>
            )
          ) : tab === 'financials' ? (
            infoLoading ? (
              <div className="text-xs text-white/40">Loading...</div>
            ) : (
              <div className="text-xs text-white/30">Financials — coming soon</div>
            )
          ) : (
            infoLoading ? (
              <div className="text-xs text-white/40">Loading...</div>
            ) : (
              <div className="text-xs text-white/30">About — coming soon</div>
            )
          )}
        </div>
      </div>
    </div>
  )
}