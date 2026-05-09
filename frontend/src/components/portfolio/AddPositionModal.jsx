import React from 'react'
import { Plus, Edit2 } from 'lucide-react'

export default function AddPositionModal({
  form,
  setForm,
  editingId,
  availableTickers,
  showTickerDropdown,
  setShowTickerDropdown,
  sharesError,
  setSharesError,
  errorMessage,
  setErrorMessage,
  handleSave,
  onClose
}) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border p-6 w-full max-w-sm space-y-5 shadow-2xl relative">
        <div className="flex justify-between items-center border-b border-border/50 pb-3">
          <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-widest flex items-center gap-2">
            {editingId ? <Edit2 size={14} /> : <Plus size={14} />} {editingId ? "Edit Position" : "Add Position"}
          </h3>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Ticker</label>
            <input 
              value={form.ticker} 
              onChange={e => { 
                const val = e.target.value.toUpperCase();
                setForm(f => ({ ...f, ticker: val })); 
                setErrorMessage('');
                setShowTickerDropdown(true); 
              }} 
              onFocus={() => setShowTickerDropdown(true)} 
              onBlur={() => setTimeout(() => setShowTickerDropdown(false), 200)} 
              placeholder="e.g. AAPL" 
              className="w-full bg-[var(--background)] border border-border px-3 py-2 text-xs text-[var(--text] outline-none focus:border-white transition-colors" 
            />
            {showTickerDropdown && availableTickers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[var(--background)] border border-border max-h-48 overflow-y-auto custom-scrollbar">
                {availableTickers.filter(t => t.ticker.toLowerCase().includes(form.ticker.toLowerCase())).map(t => (
                  <div 
                    key={t.ticker} 
                    onMouseDown={e => { 
                      e.preventDefault()
                      let autoCurrency = 'USD';
                      if (t.ticker.endsWith('.JK')) autoCurrency = 'IDR';
                      else if (t.ticker.endsWith('.T')) autoCurrency = 'JPY';
                      else if (t.ticker.endsWith('.L')) autoCurrency = 'GBP';
                      setForm(f => ({ ...f, ticker: t.ticker, company: t.name, currency: autoCurrency })); 
                      setErrorMessage('');
                      setShowTickerDropdown(false); 
                    }} 
                    className="px-3 py-2 text-xs hover:bg-white/10 cursor-pointer flex flex-col border-b border-border/30"
                  >
                    <span className="font-bold text-[var(--text)]">{t.ticker}</span>
                    <span className="text-[9px] text-muted truncate mt-0.5">{t.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Company Name</label>
            <input 
              value={form.company} 
              onChange={e => { setForm(f => ({ ...f, company: e.target.value })); setErrorMessage(''); }} 
              className="w-full bg-[var(--background)] border border-border px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-white" 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">SHARES (Lot)</label>
              <input 
                value={form.shares} 
                onChange={e => {
                  const val = e.target.value
                  const num = parseFloat(val)
                  const isInvalid = val !== '' && (isNaN(num) || num <= 0 || !Number.isInteger(num))
                  setSharesError(isInvalid)
                  setErrorMessage('')
                  setForm(f => ({ ...f, shares: val }))
                }} 
                type="text" 
                className={`w-full bg-[var(--background)] border px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-white number-font ${sharesError ? 'border-red-500' : 'border-border'}`} 
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Buy Price</label>
              <input 
                value={form.buyPrice} 
                onChange={e => { setForm(f => ({ ...f, buyPrice: e.target.value })); setErrorMessage(''); }} 
                type="number" 
                className="w-full bg-[var(--background)] border border-border px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-white number-font" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Buy Date</label>
              <input 
                value={form.buyDate} 
                onChange={e => { setForm(f => ({ ...f, buyDate: e.target.value })); setErrorMessage(''); }} 
                type="date" 
                className="w-full bg-[var(--background)] border border-border px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-white number-font" 
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Currency</label>
              <select disabled value={form.currency} className="w-full bg-[var(--background)] border border-border px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-white opacity-50 cursor-not-allowed">
                {['USD', 'IDR', 'JPY', 'GBP'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-border/50">
            <button onClick={onClose} className="flex-1 bg-surface border border-border text-[var(--text)] text-xs font-bold uppercase tracking-widest py-2 hover:bg-white/10 transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex-1 bg-white text-black text-xs font-bold uppercase tracking-widest py-2 hover:bg-gray-200 transition-colors">{editingId ? "Update" : "Save"}</button>
          </div>
        </div>
        {errorMessage && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-surface border border-red-500 p-4 w-full max-w-xs space-y-3">
              <div className="text-xs text-white">{errorMessage}</div>
              <button onClick={() => { setErrorMessage(''); setSharesError(false); }} className="w-full bg-white text-black text-xs font-bold uppercase tracking-widest py-2 hover:bg-gray-200 transition-colors">OK</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
