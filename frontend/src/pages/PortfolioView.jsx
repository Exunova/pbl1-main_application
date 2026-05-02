import { useState, useEffect } from 'react'
import { MARKETS } from '../data/mockData'
import Sparkline from '../components/Sparkline'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function PortfolioView() {
  const [positions, setPositions] = useState([])
  const [pnlData, setPnlData] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' })

  // Tambahkan state baru untuk edit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({}); // Menyimpan data saat diedit
  
  // Tambahkan baris ini di bawah state yang sudah ada
  const [availableTickers, setAvailableTickers] = useState([]);
  const [showTickerDropdown, setShowTickerDropdown] = useState(false);

  useEffect(() => {
    if (!window.api) return
    window.api.getPositions().then(r => setPositions(r?.positions || [])).catch(() => {})
    window.api.fetchPnL().then(setPnlData).catch(() => {})
    // --- TAMBAHKAN BARIS INI UNTUK MENGAMBIL 40 TICKER ---
    window.api.getScrapedTickers().then(data => {
        if(data) setAvailableTickers(data);
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
  if (!form.ticker || !form.shares || !form.buyPrice) return;
  
  // Validasi ticker harus ada di availableTickers (sekarang berupa array of objects)
  if (!availableTickers.some(t => t.ticker === form.ticker)) {
    alert("Ticker tidak valid! Silakan pilih ticker yang tersedia dari dropdown hasil scraping.");
    return;
  }

  const pos = { ...form, shares: parseFloat(form.shares), buyPrice: parseFloat(form.buyPrice) };
  
  if (editingId) {
    // Jika mode edit, panggil fungsi IPC untuk edit
    await window.api.editPosition(editingId, pos);
  } else {
    // Jika mode add, panggil fungsi IPC untuk add
    await window.api.addPosition(pos);
  }
  
  // Refresh UI dan reset form
  const updated = await window.api.getPositions();
  setPositions(updated?.positions || []);
  setShowAdd(false);
  setEditingId(null); // Reset mode edit
  setForm({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' });
};


  const handleDelete = async (id) => {
    await window.api.deletePosition(id)
    const updated = await window.api.getPositions()
    setPositions(updated?.positions || [])
  }

  const handleEditClick = (position) => {
  // Mengisi form dengan data aset yang dipilih
  setForm({
    ticker: position.ticker,
    company: position.company,
    shares: position.shares,
    buyPrice: position.buyPrice,
    buyDate: position.buyDate,
    currency: position.currency
  });
  setEditingId(position.id); // Set ID yang sedang diedit
  setShowAdd(true);          // Tampilkan popup form
};
  // --- MULAI KODE PIE CHART ---
  // Menggabungkan data PnL untuk Pie Chart
  const pieData = positions.map(p => {
    const cur = pnlData?.positions?.find(x => x.ticker === p.ticker);
    const curPrice = cur?.currentPrice || p.buyPrice;
    const currentValue = curPrice * p.shares; // Nilai aset riil saat ini (termasuk PnL)
    return { name: p.ticker, value: currentValue };
  }).filter(d => d.value > 0); // Hindari nilai <= 0 agar Pie Chart tidak error

  // Daftar warna untuk setiap potongan pie chart
  const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3', '#FF4560'];
  // --- AKHIR KODE PIE CHART ---


  return (
  <div className="h-full w-full overflow-y-auto p-4 space-y-4 pb-10 custom-scrollbar">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-bold text-text">Portfolio</h2>
      <button
        onClick={() => {
          setEditingId(null)
          setForm({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' })
          setShowAdd(true)
        }}
        className="px-3 py-1.5 bg-accent text-background text-xs font-bold rounded hover:bg-accent/80 transition-colors"
      >
        + Add Position
      </button>
    </div>

    {pnlData && pnlData.total && (
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface rounded p-3">
          <div className="text-xs text-muted">Total P&L</div>
          <div className="text-lg font-bold text-success">
            {pnlData.total.totalPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </div>
        <div className="bg-surface rounded p-3">
          <div className="text-xs text-muted">Stock Return</div>
          <div className="text-lg font-bold text-accent">
            +{pnlData.total.stockReturn.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </div>
        <div className="bg-surface rounded p-3">
          <div className="text-xs text-muted">Forex Return</div>
          <div className="text-lg font-bold text-accent">
            +{pnlData.total.forexReturn.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start mb-4">

      <div className="lg:col-span-3 bg-surface rounded-lg p-4 h-[350px] overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-[160px]">
          {positions.map((p, index) => {
            const isLoading = !pnlData;
            const cur = pnlData?.positions?.find(x => x.ticker === p.ticker)
            const curPrice = isLoading ? p.buyPrice : (cur?.currentPrice || p.buyPrice)
            const pnl = isLoading ? 0 : (curPrice - p.buyPrice) * p.shares
            const pnlPct = isLoading ? 0 : (p.buyPrice && p.shares ? (pnl / (p.buyPrice * p.shares)) * 100 : 0)
            
            let bgClass = 'heatmap-neutral';
            if (isLoading) {
               bgClass = 'heatmap-loading'; // Loading state
            } else if (pnlPct > 0) {
               bgClass = 'heatmap-profit';
            } else if (pnlPct < 0) {
               bgClass = 'heatmap-loss';
            }

            let spanClass = 'col-span-1 row-span-1';

            return (
              <div 
                key={p.id} 
                className={`${bgClass} ${spanClass} heatmap-card rounded-2xl p-4 flex flex-col shadow-md relative hover:scale-[1.02]`}
              >
                <div className="flex justify-between items-start z-10 pointer-events-none">
                  <div className="font-medium text-sm opacity-90 truncate pr-2 w-full">
                    <span className="font-bold opacity-100 mr-2 text-base">{p.ticker}</span>
                    <span className="block truncate opacity-80 text-xs mt-0.5">{p.company}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs mt-auto pointer-events-none">
                  <div className="flex justify-between items-center">
                    <span className="opacity-70">Shares</span>
                    <span className="font-semibold">{p.shares}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-70">Buy Price</span>
                    <span className="font-semibold">{p.buyPrice?.toFixed(2)} {p.currency}</span>
                  </div>
                  <div className="w-full h-[1px] bg-current opacity-20 my-1"></div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-70">PnL</span>
                    {isLoading ? (
                      <span className="font-semibold animate-pulse">Loading...</span>
                    ) : (
                      <span className="font-bold">
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPct.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          
          {positions.length === 0 && (
            <div className="col-span-full h-full flex flex-col items-center justify-center text-muted min-h-[200px]">
              <div className="text-3xl mb-2">📊</div>
              <div>Belum ada posisi portofolio.</div>
            </div>
          )}
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="lg:col-span-2 bg-surface rounded-lg p-4 h-[350px] flex flex-col">
          <div className="text-xs text-muted mb-2">
            Portfolio Distribution (Current Value)
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                }
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  borderRadius: '8px'
                }}
                itemStyle={{ color: 'var(--text)', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>

    {/* --- BAGIAN TABEL DETAIL LAMA --- */}
    <div className="bg-surface rounded-lg overflow-hidden mb-4">
      <div className="p-3 border-b border-border text-sm font-bold text-text">
        Position Details
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted border-b border-border">
            <th className="text-left p-2 font-medium">Ticker</th>
            <th className="text-left p-2 font-medium">Company</th>
            <th className="text-right p-2 font-medium">Shares</th>
            <th className="text-right p-2 font-medium">Buy Price</th>
            <th className="text-right p-2 font-medium">Cur</th>
            <th className="text-right p-2 font-medium">PnL</th>
            <th className="text-right p-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {positions.map(p => {
            const isLoading = !pnlData;
            const cur = pnlData?.positions?.find(x => x.ticker === p.ticker)
            const curPrice = isLoading ? p.buyPrice : (cur?.currentPrice || p.buyPrice)
            const pnl = isLoading ? 0 : (curPrice - p.buyPrice) * p.shares
            const pnlPct = isLoading ? 0 : (p.buyPrice && p.shares ? (pnl / (p.buyPrice * p.shares)) * 100 : 0)
            return (
              <tr key={p.id} className="border-b border-border hover:bg-border/30">
                <td className="p-2 font-bold text-accent">{p.ticker}</td>
                <td className="p-2 text-muted">{p.company}</td>
                <td className="p-2 text-right text-muted">{p.shares}</td>
                <td className="p-2 text-right text-muted">{p.buyPrice?.toFixed(2)}</td>
                <td className="p-2 text-right text-muted">{p.currency}</td>
                <td className="p-2 text-right">
                  {isLoading ? (
                    <span className="text-muted animate-pulse">Loading...</span>
                  ) : (
                    <span className={pnl >= 0 ? 'text-success' : 'text-danger'}>
                      {pnl >= 0 ? '+' : ''}
                      {pnl.toFixed(2)} ({pnlPct.toFixed(1)}%)
                    </span>
                  )}
                </td>
                <td className="p-2 text-right">
                  <button onClick={() => handleEditClick(p)} className="text-accent hover:text-accent/70 text-xs mr-3">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-danger hover:text-danger/70 text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
          {positions.length === 0 && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-muted">
                No positions yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {showAdd && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-surface rounded-lg p-4 w-80 space-y-3">
          <h3 className="text-sm font-bold text-text">Add Position</h3>

          {/* --- INPUT TICKER DENGAN FITUR PENCARIAN KUSTOM --- */}
          <div className="mb-3 relative">
            <input
              value={form.ticker}
              onChange={e => {
                setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }));
                setShowTickerDropdown(true);
              }}
              onFocus={() => setShowTickerDropdown(true)}
              onBlur={() => setTimeout(() => setShowTickerDropdown(false), 200)}
              placeholder="ticker (contoh: AAPL)"
              className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-text outline-none focus:border-accent"
            />
            {showTickerDropdown && availableTickers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded shadow-lg max-h-40 overflow-y-auto">
                {availableTickers
                  .filter(t => t.ticker.toLowerCase().includes(form.ticker.toLowerCase()))
                  .map(t => (
                    <div
                      key={t.ticker}
                      onClick={() => {
                        // OTOMATIS MENGISI COMPANY NAME
                        setForm(f => ({ ...f, ticker: t.ticker, company: t.name }));
                        setShowTickerDropdown(false);
                      }}
                      className="px-2 py-1.5 text-xs text-text hover:bg-border cursor-pointer transition-colors flex justify-between items-center"
                    >
                      <span className="font-bold">{t.ticker}</span>
                      <span className="text-muted text-[10px] truncate max-w-[150px] text-right">{t.name}</span>
                    </div>
                  ))}
                {availableTickers.filter(t => t.ticker.toLowerCase().includes(form.ticker.toLowerCase())).length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted italic">Tidak ditemukan</div>
                )}
              </div>
            )}
          </div>

          {/* --- INPUT COMPANY (Tetap Teks Biasa) --- */}
          <input
            value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            placeholder="company"
            className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-text outline-none focus:border-accent"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.shares}
              onChange={e => setForm(f => ({ ...f, shares: e.target.value }))}
              placeholder="Shares"
              type="number"
              className="bg-card border border-border rounded px-2 py-1.5 text-xs text-text outline-none focus:border-accent"
            />
            <input
              value={form.buyPrice}
              onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))}
              placeholder="Buy Price"
              type="number"
              className="bg-card border border-border rounded px-2 py-1.5 text-xs text-text outline-none focus:border-accent"
            />
          </div>

          <input
            value={form.buyDate}
            onChange={e => setForm(f => ({ ...f, buyDate: e.target.value }))}
            placeholder="Buy Date (YYYY-MM-DD)"
            className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-text outline-none focus:border-accent"
          />

          <select
            value={form.currency}
            onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
            className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-text outline-none"
          >
            {['USD', 'IDR', 'JPY', 'GBP'].map(c => <option key={c}>{c}</option>)}
          </select>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} className="flex-1 bg-accent text-background text-xs font-bold py-1.5 rounded">
              {editingId ? "Update" : "Save"}
            </button>
            <button
              onClick={() => {
                setShowAdd(false)
                setEditingId(null)
                setForm({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' })
              }}
              className="flex-1 bg-border text-muted text-xs py-1.5 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)
}