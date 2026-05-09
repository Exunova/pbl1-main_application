import { useState } from 'react'
import {
  User,
  Download,
  Upload,
  Monitor,
  Moon,
  Sun,
  ShieldCheck
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const labelClass =
  'text-[9px] text-muted uppercase tracking-widest'

const sectionTitleClass =
  'text-xs font-bold text-[var(--text)] uppercase tracking-widest'

const panelClass =
  'bg-surface border border-border p-6 space-y-6'

// ─────────────────────────────────────────────────────────────
// CSV Helpers
// ─────────────────────────────────────────────────────────────

function buildCSV(positions) {
  const headers = [
    'ticker',
    'company',
    'shares',
    'buyPrice',
    'buyDate',
    'currency'
  ]

  const rows = [
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

  return rows.join('\n')
}

function parseCSV(text) {
  const rows = text
    .split('\n')
    .filter(r => r.trim())

  if (rows.length < 2) {
    throw new Error('Invalid CSV format')
  }

  const headers = rows[0]
    .split(',')
    .map(h => h.trim().toLowerCase())

  return rows.slice(1)
    .map(row => {
      const regex = /(".*?"|[^",\n]+)(?=\s*,|\s*$)/g

      const matches = row.match(regex) || []

      const values = matches.map(v =>
        v
          .replace(/^"|"$/g, '')
          .replace(/""/g, '"')
          .trim()
      )

      const pos = {}

      headers.forEach((header, i) => {
        pos[header] = values[i]
      })

      return {
        ticker: pos.ticker,
        company: pos.company || '',
        shares: parseFloat(pos.shares),
        buyPrice: parseFloat(
          pos.buyprice || pos.buy_price
        ),
        buyDate:
          pos.buydate || pos.buy_date,
        currency: pos.currency || 'USD'
      }
    })
    .filter(p =>
      p.ticker &&
      !isNaN(p.shares) &&
      !isNaN(p.buyPrice)
    )
}

function downloadCSV(content, filename) {
  const blob = new Blob(
    [content],
    { type: 'text/csv;charset=utf-8;' }
  )

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function ProfileView({
  theme,
  onThemeToggle
}) {
  const [importStatus, setImportStatus] =
    useState('')

  const api = window.api

  // ───────────────────────────────────────────────────────────
  // Export CSV
  // ───────────────────────────────────────────────────────────

  const handleExportCSV = async () => {
    if (!api) return

    try {
      const response =
        await api.getPositions()

      const positions =
        response?.positions || []

      if (positions.length === 0) {
        alert(
          'Portfolio is empty. Nothing to export.'
        )
        return
      }

      const csv =
        buildCSV(positions)

      const filename =
        `MAPRO_Portfolio_${
          new Date()
            .toISOString()
            .split('T')[0]
        }.csv`

      downloadCSV(csv, filename)

    } catch (err) {
      console.error(
        'Export failed:',
        err
      )

      alert(
        'Failed to export portfolio data.'
      )
    }
  }

  // ───────────────────────────────────────────────────────────
  // Import CSV
  // ───────────────────────────────────────────────────────────

  const handleImportCSV = e => {
    if (!api) return

    const file = e.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = async event => {
      try {
        const text =
          event.target.result

        const positions =
          parseCSV(text)

        if (positions.length === 0) {
          throw new Error(
            'No valid data found in CSV'
          )
        }

        const res =
          await api.portfolioImport({
            positions
          })

        setImportStatus(
          `Successfully imported ${res.imported} positions.`
        )

        setTimeout(() => {
          setImportStatus('')
        }, 5000)

      } catch (err) {
        console.error(
          'Import failed:',
          err
        )

        alert(
          'Failed to import CSV. Ensure the format is correct.'
        )
      }
    }

    reader.readAsText(file)
  }

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────

  return (
    <div className="h-full w-full overflow-y-auto p-8 space-y-8 bg-background custom-scrollbar">

      {/* Header */}

      <div className="flex items-center gap-4 border-b border-border/50 pb-6 animate-fade-in-up">

        <div className="p-3 bg-surface border border-border">
          <User
            className="text-[var(--text)]"
            size={24}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold text-[var(--text)] tracking-widest uppercase">
            System Profile
          </h2>

          <p className="text-[10px] text-muted tracking-widest uppercase mt-0.5">
            Application Settings & Data Mobility
          </p>
        </div>
      </div>

      {/* Main Grid */}

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >

        {/* Theme */}

        <div className={panelClass}>

          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <Monitor
              size={16}
              className="text-muted"
            />

            <h3 className={sectionTitleClass}>
              Interface Preferences
            </h3>
          </div>

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-bold text-[var(--text)] uppercase">
                System Theme
              </p>

              <p className={`${labelClass} mt-0.5`}>
                Toggle between dark, light, or auto mode
              </p>
            </div>

            <button
              onClick={onThemeToggle}
              className="flex items-center gap-3 px-4 py-2 bg-[var(--background)] border border-border hover:border-white transition-all text-[10px] font-bold uppercase tracking-widest"
            >
              {theme === 'dark' && (
                <>
                  <Moon size={14} />
                  Dark
                </>
              )}

              {theme === 'light' && (
                <>
                  <Sun size={14} />
                  Light
                </>
              )}

              {theme === 'auto' && (
                <>
                  <Monitor size={14} />
                  Auto
                </>
              )}
            </button>
          </div>
        </div>

        {/* CSV */}

        <div className={panelClass}>

          <div className="flex items-center gap-2 border-b border-border/50 pb-3">

            <Download
              size={16}
              className="text-muted"
            />

            <h3 className={sectionTitleClass}>
              Data Portability
            </h3>
          </div>

          <div className="space-y-6">

            {/* Export */}

            <div className="space-y-3">

              <p className={`${labelClass} leading-relaxed`}>
                Export your portfolio positions to a CSV file to backup or move them to another MAPRO instance.
              </p>

              <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                <Download size={14} />
                Export Portfolio (.CSV)
              </button>
            </div>

            <div className="w-full h-px bg-border/30" />

            {/* Import */}

            <div className="space-y-3">

              <p className={`${labelClass} leading-relaxed`}>
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
                  className="w-full flex items-center justify-center gap-2 py-3 bg-surface border border-border text-[var(--text)] text-[11px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  <Upload size={14} />
                  Import Portfolio (.CSV)
                </button>
              </div>

              {importStatus && (
                <p className="text-[9px] text-success font-bold uppercase text-center">
                  {importStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security */}

      <div
        className="bg-surface/30 border border-border p-6 animate-fade-in-up"
        style={{ animationDelay: '0.2s' }}
      >

        <div className="flex items-center gap-2 mb-4">

          <ShieldCheck
            size={16}
            className="text-muted"
          />

          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Security Note
          </h3>
        </div>

        <p className="text-[9px] text-muted/60 leading-relaxed uppercase tracking-wider">
          MAPRO Portfolio data is stored locally on this machine.
          Exporting to CSV creates an unencrypted file containing your
          position details. Keep your backup files secure.
        </p>
      </div>
    </div>
  )
}