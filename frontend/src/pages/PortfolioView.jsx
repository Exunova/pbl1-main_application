import React, { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Treemap } from 'recharts'
import { Plus, Edit2, Trash2, Layers, Activity, Newspaper } from 'lucide-react'

function formatChange(n) {
  if (n == null || isNaN(n)) return '0.00'
  return (n >= 0 ? '+' : '') + n.toFixed(2)
}

const CustomTreemapContent = React.memo(function CustomTreemapContent(props) {
  const { x, y, width, height, name } = props
  const parts = (name || ':0').split(':')
  const ticker = parts[0]
  const changeStr = parts[1] || '0'
  const change = parseFloat(changeStr)

  const showText = width > 40 && height > 30
  
  let bgColor = '#3f3f46'
  if (change >= 5) bgColor = '#059669'
  else if (change > 0) bgColor = '#065f46'
  else if (change <= -5) bgColor = '#dc2626'
  else if (change < 0) bgColor = '#991b1b'

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={bgColor} stroke="#000" strokeWidth={1} />
      {showText && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 4} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold"
            fontFamily="sans-serif" pointerEvents="none">{ticker}</text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={10}
            fontFamily="monospace" pointerEvents="none">{changeStr}%</text>
        </>
      )}
    </g>
  )
})

export default function PortfolioView() {
  const [positions, setPositions] = useState([])
  const [pnlData, setPnlData] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' })

  const [editingId, setEditingId] = useState(null)
  const [availableTickers, setAvailableTickers] = useState([])
  const [showTickerDropdown, setShowTickerDropdown] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [sharesError, setSharesError] = useState(false)

  useEffect(() => {
    if (!window.api) return
    Promise.all([
      window.api.getPositions().catch(() => []),
      window.api.fetchPnL().catch(() => null),
      window.api.getScrapedTickers().catch(() => [])
    ]).then(([positionsResult, pnlResult, tickersResult]) => {
      setPositions(positionsResult?.positions || [])
      setPnlData(pnlResult)
      if (tickersResult) setAvailableTickers(tickersResult)
      setIsInitialLoad(false)
    })
  }, [])

  const handleSave = async () => {
    if (!form.ticker || !form.shares || !form.buyPrice) return;
    const sharesNum = parseFloat(form.shares)
    if (isNaN(sharesNum) || sharesNum <= 0 || !Number.isInteger(sharesNum)) {
      setSharesError(true)
      return
    }
    if (parseFloat(form.buyPrice) <= 0) {
      alert("Buy Price must be greater than 0!");
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (form.buyDate > today) {
      alert("Buy date cannot be in the future!");
      return;
    }
    if (!availableTickers.some(t => t.ticker === form.ticker)) {
      alert("Ticker tidak valid! Silakan pilih ticker yang tersedia dari dropdown hasil scraping.");
      return;
    }
    const pos = { ...form, shares: parseFloat(form.shares) * 100, buyPrice: parseFloat(form.buyPrice) };
    if (editingId) await window.api.editPosition(editingId, pos);
    else await window.api.addPosition(pos);
    const updated = await window.api.getPositions();
    setPositions(updated?.positions || []);
    setShowAdd(false);
    setEditingId(null);
    setForm({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' });
    window.api.fetchPnL().then(setPnlData).catch(() => {})
  };

  const handleDelete = async (id) => {
    await window.api.deletePosition(id)
    const updated = await window.api.getPositions()
    setPositions(updated?.positions || [])
    window.api.fetchPnL().then(setPnlData).catch(() => {})
  }

  const handleEditClick = (position) => {
    setForm({ ticker: position.ticker, company: position.company, shares: position.shares / 100, buyPrice: position.buyPrice, buyDate: position.buyDate, currency: position.currency });
    setEditingId(position.id);
    setShowAdd(true);
  };

  const pieData = useMemo(() => positions.map(p => {
    const cur = pnlData?.positions?.find(x => x.ticker === p.ticker);
    const shares = parseFloat(p.shares) || 0;
    const buyPrice = parseFloat(p.buyPrice) || 0;
    const curPriceIDR = cur?.currentPriceIDR || (buyPrice * 15650.0);
    return { name: p.ticker, value: curPriceIDR * shares };
  }).filter(d => d.value > 0), [positions, pnlData]);

  const treeData = useMemo(() => positions.map(p => {
    const cur = pnlData?.positions?.find(x => x.ticker === p.ticker);
    const pnlPct = (cur?.buyPriceIDR && cur?.shares ? ((cur.stockReturn) / (cur.buyPriceIDR * cur.shares)) * 100 : 0);
    const valuationIDR = cur?.currentPriceIDR ? (cur.currentPriceIDR * p.shares) : (parseFloat(p.buyPrice) * 15650.0 * p.shares);
    return {
      name: p.ticker + ':' + formatChange(pnlPct),
      size: Math.max(valuationIDR, 1)
    }
  }), [positions, pnlData]);

  const COLORS = ['#ffffff', '#d4d4d4', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a'];

  // Guard: Don't render until initial data is loaded
  if (isInitialLoad) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-muted text-xs uppercase tracking-widest">Loading portfolio data...</div>
      </div>
    )
  }

  return (
  <div className="h-full w-full overflow-y-auto p-6 space-y-6 pb-12 custom-scrollbar relative bg-background">
    <div className="flex items-center justify-between border-b border-border/50 pb-4 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-surface border border-border">
          <Layers className="text-white" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-widest uppercase">Portfolio Overview</h2>
          <p className="text-[10px] text-muted tracking-widest uppercase mt-0.5">Asset Management Terminal</p>
        </div>
      </div>
      <button onClick={() => { setEditingId(null); setForm({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' }); setShowAdd(true); }} className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[11px] font-bold uppercase tracking-widest border border-white hover:bg-gray-200 transition-colors">
        <Plus size={14} /> Add Position
      </button>
    </div>

    {pnlData && pnlData.total && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {[
          { label: 'Total P&L (IDR)', value: pnlData.total.totalPnL, color: 'text-success' },
          { label: 'Stock Return (IDR)', value: pnlData.total.stockReturn, color: 'text-white' },
          { label: 'Forex Return (IDR)', value: pnlData.total.forexReturn, color: 'text-secondary' }
        ].map((metric, i) => (
          <div key={i} className="bg-surface border border-border p-4 flex flex-col justify-center">
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">{metric.label}</div>
            <div className={`text-xl font-bold number-font ${metric.value >= 0 ? metric.color : 'text-danger'} flex items-center gap-2`}>
              {metric.value >= 0 ? '+' : ''}{metric.value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
            </div>
          </div>
        ))}
      </div>
    )}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="lg:col-span-2 bg-surface border border-border p-5 min-h-[380px] flex flex-col relative">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
          <Activity size={14} className="text-muted" /> Active Positions Map
        </h3>
        <div className="flex-1 min-h-[300px] relative">
          {positions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted border border-dashed border-border/50">
              <span className="text-xs uppercase tracking-widest">No positions active</span>
            </div>
          ) : (
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap data={treeData} dataKey="size" aspectRatio={4/3} stroke="#000" isAnimationActive={false} content={<CustomTreemapContent />} />
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      
      <div className="lg:col-span-1 bg-surface border border-border p-5 h-[380px] flex flex-col overflow-hidden">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 border-b border-border/50 pb-2">Asset Allocation</h3>
        <div className="flex-1 relative w-full h-full min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="#000" strokeWidth={1}>
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip 
                formatter={(value) => value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '10px' }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[9px] text-muted uppercase tracking-widest">Assets</span>
            <span className="text-xl font-bold text-white number-font">{pieData.length}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 max-h-[100px] overflow-y-auto custom-scrollbar pr-1 shrink-0">
          {pieData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-[9px] uppercase tracking-wider">
              <div className="w-1.5 h-1.5 shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
              <span className="font-bold text-muted truncate">{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    
    <div className="bg-surface border border-border overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <div className="p-4 border-b border-border/50 bg-[#0a0a0a]">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Position Details (Ledger)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left whitespace-nowrap">
          <thead className="bg-[#111] text-muted uppercase tracking-widest text-[9px] border-b border-border/50">
            <tr>
              <th className="px-4 py-3">Ticker</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3 text-right">SHARES (Lot)</th>
              <th className="px-4 py-3 text-right">Buy Price</th>
              <th className="px-4 py-3 text-right">PnL</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
             {positions.map(p => {
               const isLoading = !pnlData;
               const cur = pnlData?.positions?.find(x => x.ticker === p.ticker)
               const pnl = cur?.stockReturn || 0
               const pnlPct = isLoading ? 0 : (cur?.buyPriceIDR && cur?.shares ? (pnl / (cur.buyPriceIDR * cur.shares)) * 100 : 0)
               const isProfit = pnl >= 0;
               return (
                 <tr key={p.id} className="hover:bg-white/5 transition-colors">
                   <td className="px-4 py-3 font-bold text-white">{p.ticker}</td>
                   <td className="px-4 py-3 text-muted max-w-[150px] truncate" title={p.company}>{p.company}</td>
                   <td className="px-4 py-3 text-right font-medium number-font">{p.shares / 100}</td>
                   <td className="px-4 py-3 text-right number-font">{p.buyPrice?.toFixed(2)} <span className="text-[9px] ml-0.5">{p.currency}</span></td>
                   <td className="px-4 py-3 text-right">
                     {isLoading ? <span className="text-muted">CALC...</span> : (
                       <div className={`font-bold number-font ${isProfit ? 'text-success' : 'text-danger'}`}>
                         {isProfit ? '+' : ''}{pnl.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })} <span className="opacity-70 text-[9px]">({pnlPct.toFixed(2)}%)</span>
                       </div>
                     )}
                   </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleEditClick(p)} className="text-muted hover:text-white" title="Edit"><Edit2 size={12} /></button>
                      <button onClick={() => handleDelete(p.id)} className="text-muted hover:text-danger" title="Delete"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>

    {showAdd && (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="bg-surface border border-border p-6 w-full max-w-sm space-y-5 shadow-2xl relative">
          <div className="flex justify-between items-center border-b border-border/50 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              {editingId ? <Edit2 size={14} /> : <Plus size={14} />} {editingId ? "Edit Position" : "Add Position"}
            </h3>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Ticker</label>
              <input value={form.ticker} onChange={e => { 
                const val = e.target.value.toUpperCase();
                setForm(f => ({ ...f, ticker: val })); 
                setShowTickerDropdown(true); 
              }} onFocus={() => setShowTickerDropdown(true)} onBlur={() => setTimeout(() => setShowTickerDropdown(false), 200)} placeholder="e.g. AAPL" className="w-full bg-[#111] border border-border px-3 py-2 text-xs text-white outline-none focus:border-white transition-colors" />
              {showTickerDropdown && availableTickers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[#111] border border-border max-h-48 overflow-y-auto custom-scrollbar">
                  {availableTickers.filter(t => t.ticker.toLowerCase().includes(form.ticker.toLowerCase())).map(t => (
                    <div key={t.ticker} onClick={() => { 
                      let autoCurrency = 'USD';
                      if (t.ticker.endsWith('.JK')) autoCurrency = 'IDR';
                      else if (t.ticker.endsWith('.T')) autoCurrency = 'JPY';
                      else if (t.ticker.endsWith('.L')) autoCurrency = 'GBP';
                      setForm(f => ({ ...f, ticker: t.ticker, company: t.name, currency: autoCurrency })); 
                      setShowTickerDropdown(false); 
                    }} className="px-3 py-2 text-xs hover:bg-white/10 cursor-pointer flex flex-col border-b border-border/30">
                      <span className="font-bold text-white">{t.ticker}</span>
                      <span className="text-[9px] text-muted truncate mt-0.5">{t.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Company Name</label>
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full bg-[#111] border border-border px-3 py-2 text-xs text-white outline-none focus:border-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">SHARES (Lot)</label>
                <input value={form.shares} onChange={e => {
                  const val = e.target.value
                  const num = parseFloat(val)
                  const isInvalid = val !== '' && (isNaN(num) || num <= 0 || !Number.isInteger(num))
                  setSharesError(isInvalid)
                  setForm(f => ({ ...f, shares: val }))
                }} min="1" type="number" className={`w-full bg-[#111] border px-3 py-2 text-xs text-white outline-none focus:border-white number-font ${sharesError ? 'border-red-500' : 'border-border'}`} />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Buy Price</label>
                <input value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))} type="number" className="w-full bg-[#111] border border-border px-3 py-2 text-xs text-white outline-none focus:border-white number-font" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Buy Date</label>
                <input value={form.buyDate} onChange={e => setForm(f => ({ ...f, buyDate: e.target.value }))} type="date" className="w-full bg-[#111] border border-border px-3 py-2 text-xs text-white outline-none focus:border-white number-font" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Currency</label>
                <select disabled value={form.currency} className="w-full bg-[#111] border border-border px-3 py-2 text-xs text-white outline-none focus:border-white opacity-50 cursor-not-allowed">
                  {['USD', 'IDR', 'JPY', 'GBP'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-border/50">
              <button onClick={() => { setShowAdd(false); setEditingId(null); setForm({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' }) }} className="flex-1 bg-surface border border-border text-white text-xs font-bold uppercase tracking-widest py-2 hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!form.shares || sharesError} className="flex-1 bg-white text-black text-xs font-bold uppercase tracking-widest py-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{editingId ? "Update" : "Save"}</button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
)
}