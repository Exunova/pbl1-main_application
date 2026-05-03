import { useState } from 'react'
import { User, Download, Upload, Monitor, Moon, Sun, ShieldCheck } from 'lucide-react'

export default function ProfileView({ theme, onThemeToggle }) {
  const [importStatus, setImportStatus] = useState('')

  const handleExportCSV = async () => {
    if (!window.api) return;
    try {
      const response = await window.api.getPositions()
      const positions = response?.positions || []
      
      if (positions.length === 0) {
        alert("Portfolio is empty. Nothing to export.")
        return
      }

      const headers = ["ticker", "company", "shares", "buyPrice", "buyDate", "currency"]
      const csvRows = [
        headers.join(','),
        ...positions.map(p => [
          p.ticker,
          `"${(p.company || '').replace(/"/g, '""')}"`,
          p.shares,
          p.buyPrice,
          p.buyDate,
          p.currency
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `MAPRO_Portfolio_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Failed to export portfolio data.')
    }
  }

  const handleImportCSV = (e) => {
    if (!window.api) return;
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target.result
        const rows = text.split('\n').filter(r => r.trim())
        if (rows.length < 2) throw new Error("Invalid CSV format")

        const headers = rows[0].split(',').map(h => h.trim().toLowerCase())
        const positions = rows.slice(1).map(row => {
          const regex = /(".*?"|[^",\n]+)(?=\s*,|\s*$)/g
          const matches = row.match(regex) || []
          const values = matches.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim())
          
          const pos = {}
          headers.forEach((header, i) => {
            pos[header] = values[i]
          })
          
          return {
            ticker: pos.ticker,
            company: pos.company || '',
            shares: parseFloat(pos.shares),
            buyPrice: parseFloat(pos.buyprice || pos.buy_price),
            buyDate: pos.buydate || pos.buy_date,
            currency: pos.currency || 'USD'
          }
        }).filter(p => p.ticker && !isNaN(p.shares) && !isNaN(p.buyPrice))

        if (positions.length === 0) throw new Error("No valid data found in CSV")

        const res = await window.api.portfolioImport({ positions })
        setImportStatus(`Successfully imported ${res.imported} positions.`)
        setTimeout(() => setImportStatus(''), 5000)
      } catch (err) {
        console.error('Import failed:', err)
        alert('Failed to import CSV. Ensure the format is correct.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="h-full w-full overflow-y-auto p-8 space-y-8 bg-background custom-scrollbar">
      <div className="flex items-center gap-4 border-b border-border/50 pb-6 animate-fade-in-up">
        <div className="p-3 bg-surface border border-border">
          <User className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">System Profile</h2>
          <p className="text-[10px] text-muted tracking-widest uppercase mt-0.5">Application Settings & Data Mobility</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-surface border border-border p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <Monitor size={16} className="text-muted" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Interface Preferences</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white uppercase">System Theme</p>
                <p className="text-[9px] text-muted uppercase mt-0.5">Toggle between dark, light, or auto mode</p>
              </div>
              <button 
                onClick={onThemeToggle}
                className="flex items-center gap-3 px-4 py-2 bg-[#111] border border-border hover:border-white transition-all text-[10px] font-bold uppercase tracking-widest"
              >
                {theme === 'dark' && <><Moon size={14} /> Dark</>}
                {theme === 'light' && <><Sun size={14} /> Light</>}
                {theme === 'auto' && <><Monitor size={14} /> Auto</>}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <Download size={16} className="text-muted" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Data Portability</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[9px] text-muted uppercase tracking-widest leading-relaxed">
                Export your portfolio positions to a CSV file to backup or move them to another MAPRO instance.
              </p>
              <button 
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                <Download size={14} /> Export Portfolio (.CSV)
              </button>
            </div>

            <div className="w-full h-px bg-border/30"></div>

            <div className="space-y-3">
              <p className="text-[9px] text-muted uppercase tracking-widest leading-relaxed">
                Import positions from a previously exported MAPRO CSV file.
              </p>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleImportCSV}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <button 
                  className="w-full flex items-center justify-center gap-2 py-3 bg-surface border border-border text-white text-[11px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  <Upload size={14} /> Import Portfolio (.CSV)
                </button>
              </div>
              {importStatus && <p className="text-[9px] text-success font-bold uppercase text-center">{importStatus}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface/30 border border-border p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={16} className="text-muted" />
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">Security Note</h3>
        </div>
        <p className="text-[9px] text-muted/60 leading-relaxed uppercase tracking-wider">
          MAPRO Portfolio data is stored locally on this machine. Exporting to CSV creates an unencrypted file containing your position details. Keep your backup files secure.
        </p>
      </div>
    </div>
  )
}