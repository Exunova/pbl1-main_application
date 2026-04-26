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
  
  useEffect(() => {
    if (!window.api) return
    window.api.getPositions().then(r => setPositions(r?.positions || [])).catch(() => {})
    window.api.fetchPnL().then(setPnlData).catch(() => {})
  }, [])

  const handleSave = async () => {
  if (!form.ticker || !form.shares || !form.buyPrice) return;
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
    <div className="flex flex-col h-full p-4 gap-4 overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white/80">Portfolio</h2>
        <button onClick={() => {
            setEditingId(null); // Memastikan mode dikembalikan ke mode Tambah (Save)
            setForm({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' }); // Kosongkan form
            setShowAdd(true);   // Tampilkan popup
          }}
          className="px-3 py-1.5 bg-accent text-white text-xs font-bold rounded hover:bg-accent/80 transition-colors">
          + Add Position
        </button>
      </div>

      {pnlData && pnlData.total && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded p-3">
            <div className="text-xs text-white/40">Total P&L</div>
            <div className="text-lg font-bold text-success">{pnlData.total.totalPnL.toLocaleString('en-US', {style:'currency', currency:'USD'})}</div>
          </div>
          <div className="bg-surface rounded p-3">
            <div className="text-xs text-white/40">Stock Return</div>
            <div className="text-lg font-bold text-accent">+{pnlData.total.stockReturn.toLocaleString('en-US', {style:'currency', currency:'USD'})}</div>
          </div>
          <div className="bg-surface rounded p-3">
            <div className="text-xs text-white/40">Forex Return</div>
            <div className="text-lg font-bold text-accent">+{pnlData.total.forexReturn.toLocaleString('en-US', {style:'currency', currency:'USD'})}</div>
          </div>
        </div>
      )}
      {/* --- AWAL PEMBUNGKUS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start mb-4">
        
        {/* --- SISI KIRI: TABEL (Ambil 3 Kolom) --- */}
        <div className="lg:col-span-3 bg-surface rounded-lg overflow-hidden h-full">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/40 border-b border-white/5">
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
                const cur = pnlData?.positions?.find(x => x.ticker === p.ticker)
                const curPrice = cur?.currentPrice || 186.2
                const pnl = (curPrice - p.buyPrice) * p.shares
                const pnlPct = (pnl / (p.buyPrice * p.shares)) * 100
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-2 font-bold text-accent">{p.ticker}</td>
                    <td className="p-2 text-white/70">{p.company}</td>
                    <td className="p-2 text-right text-white/70">{p.shares}</td>
                    <td className="p-2 text-right text-white/70">{p.buyPrice?.toFixed(2)}</td>
                    <td className="p-2 text-right text-white/50">{p.currency}</td>
                    <td className="p-2 text-right">
                      <span className={pnl >= 0 ? 'text-success' : 'text-danger'}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPct.toFixed(1)}%)</span>
                    </td>
                    <td className="p-2 text-right">
                      <button onClick={() => handleEditClick(p)} className="text-accent hover:text-accent/70 text-xs mr-3">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-danger hover:text-danger/70 text-xs">Delete</button>
                    </td>
                  </tr>
                )
              })}
              {positions.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-white/30">No positions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- SISI KANAN: PIE CHART (Ambil 2 Kolom) --- */}
        {pieData.length > 0 && (
          <div className="lg:col-span-2 bg-surface rounded-lg p-4 h-[350px] flex flex-col">
            <div className="text-xs text-white/40 mb-2">Portfolio Distribution (Current Value)</div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => value.toLocaleString('en-US', {style:'currency', currency:'USD'})}
                  contentStyle={{ backgroundColor: '#1e2128', borderColor: '#ffffff20', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
      {/* --- AKHIR PEMBUNGKUS GRID --- */}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-surface rounded-lg p-4 w-80 space-y-3">
            <h3 className="text-sm font-bold text-white">Add Position</h3>
            {['ticker','company'].map(field => (
              <input key={field} value={form[field]} onChange={e => setForm(f => ({...f, [field]: e.target.value}))}
                placeholder={field} className="w-full bg-card border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-accent" />
            ))}
            <div className="grid grid-cols-2 gap-2">
              <input value={form.shares} onChange={e => setForm(f => ({...f, shares: e.target.value}))}
                placeholder="Shares" type="number" className="bg-card border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-accent" />
              <input value={form.buyPrice} onChange={e => setForm(f => ({...f, buyPrice: e.target.value}))}
                placeholder="Buy Price" type="number" className="bg-card border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-accent" />
            </div>
            <input value={form.buyDate} onChange={e => setForm(f => ({...f, buyDate: e.target.value}))}
              placeholder="Buy Date (YYYY-MM-DD)" className="w-full bg-card border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-accent" />
            <select value={form.currency} onChange={e => setForm(f => ({...f, currency: e.target.value}))}
              className="w-full bg-card border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none">
              {['USD','IDR','JPY','GBP'].map(c => <option key={c}>{c}</option>)}
            </select>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} className="flex-1 bg-accent text-white text-xs font-bold py-1.5 rounded">
                {editingId ? "Update" : "Save"}
              </button>
              <button onClick={() => {
                  setShowAdd(false); // Tutup popup
                  setEditingId(null); // Bersihkan mode edit
                  setForm({ ticker: '', company: '', shares: '', buyPrice: '', buyDate: '', currency: 'USD' }); // Kosongkan form
                }} className="flex-1 bg-white/10 text-white/70 text-xs py-1.5 rounded">Cancel</button>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}