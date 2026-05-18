import { useState, useEffect, useRef } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'

const SCRAPER_CATEGORIES = [
  { key: 'ohlcv', label: 'OHLCV', icon: Activity },
  { key: 'news', label: 'News', icon: AlertTriangle },
  { key: 'macro', label: 'Macro', icon: Clock },
  { key: 'forex', label: 'Forex', icon: Activity },
  { key: 'company_info', label: 'Company Info', icon: CheckCircle2 },
]

const STATUS_CONFIG = {
  pending: { color: 'text-muted', bg: 'bg-muted/10', icon: Clock, label: 'Pending' },
  running: { color: 'text-accent', bg: 'bg-accent/10', icon: Loader2, label: 'Running', spin: true },
  done: { color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2, label: 'Done' },
  failed: { color: 'text-danger', bg: 'bg-danger/10', icon: XCircle, label: 'Failed' },
}

const LOG_TYPE_STYLES = {
  info: 'text-text/70',
  warning: 'text-yellow-400',
  error: 'text-danger',
}

function getScraperStatus(key, dataAvailability, isScraping, scrapeLogs) {
  if (dataAvailability[key] === 'present') return 'done'
  if (!isScraping) return 'pending'

  const scraperLabel = SCRAPER_CATEGORIES.find(c => c.key === key)?.label || key
  const hasStarted = scrapeLogs.some(l => l.message?.includes(`${scraperLabel} scraper started`))
  const hasCompleted = scrapeLogs.some(l => l.message?.includes(`${scraperLabel} scraper completed`))
  const hasFailed = scrapeLogs.some(l => l.type === 'error' && l.message?.includes(`${scraperLabel} scraper failed`))

  if (hasFailed) return 'failed'
  if (hasCompleted) return 'done'
  if (hasStarted) return 'running'
  return 'pending'
}

function formatTimestamp(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return ''
  }
}

function LogTypeIcon({ type }) {
  if (type === 'error') return <XCircle size={11} className="text-danger shrink-0" />
  if (type === 'warning') return <AlertTriangle size={11} className="text-yellow-400 shrink-0" />
  return <Activity size={11} className="text-accent shrink-0" />
}

export default function LoadingScreen({ dataAvailability, scrapeLogs, isScraping, onSkip }) {
  const [showSkip, setShowSkip] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const logEndRef = useRef(null)

  useEffect(() => {
    setShowSkip(false)
    const timer = setTimeout(() => setShowSkip(true), 60000)
    return () => clearTimeout(timer)
  }, [scrapeLogs])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [scrapeLogs])

  useEffect(() => {
    const allPresent = Object.values(dataAvailability || {}).every(v => v === 'present')
    if (allPresent && !fadeOut) {
      setFadeOut(true)
      const timer = setTimeout(() => {
        onSkip?.()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [dataAvailability, fadeOut, onSkip])

  const statuses = SCRAPER_CATEGORIES.map(cat => ({
    ...cat,
    status: getScraperStatus(cat.key, dataAvailability, isScraping, scrapeLogs),
  }))

  const completedCount = statuses.filter(s => s.status === 'done').length
  const totalCount = statuses.length
  const progressPct = (completedCount / totalCount) * 100

  const allPresent = Object.values(dataAvailability || {}).every(v => v === 'present')
  if (!isScraping && allPresent) return null

  return (
    <div
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg w-full px-6">
        <div className="w-full bg-card border border-border rounded-lg p-6 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-5">
            <Loader2 size={20} className="text-accent animate-spin" />
            <h2 className="text-lg font-bold text-text tracking-wide">
              Loading <span className="text-accent">&ldquo;Scraping...&rdquo;</span>
            </h2>
          </div>

          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-5 gap-2">
            {statuses.map(({ key, label, status }) => {
              const config = STATUS_CONFIG[status]
              const Icon = config.icon
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1.5 rounded border border-border/50 ${config.bg}`}
                >
                  <Icon
                    size={14}
                    className={`${config.color} ${config.spin ? 'animate-spin' : ''}`}
                  />
                  <span className={`text-[9px] font-semibold uppercase tracking-wider ${config.color}`}>
                    {label}
                  </span>
                  <span className={`text-[8px] font-mono ${config.color} opacity-60`}>
                    {config.label}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between mt-3 px-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Scraping Progress
            </span>
            <span className="text-[10px] font-mono text-muted">
              {completedCount}/{totalCount} complete
            </span>
          </div>
        </div>

        <div className="w-full bg-card/80 border border-border/50 rounded-lg overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Scrape Log Output
            </span>
            <span className="text-[10px] font-mono text-muted/50">
              {scrapeLogs?.length || 0} entries
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar p-3 font-mono text-[11px] leading-relaxed">
            {(!scrapeLogs || scrapeLogs.length === 0) && (
              <div className="text-muted/50 text-center py-4">Waiting for scrape output...</div>
            )}
            {scrapeLogs?.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                <span className="text-muted/40 shrink-0 select-none">
                  {formatTimestamp(entry.timestamp)}
                </span>
                <LogTypeIcon type={entry.type} />
                <span className={`${LOG_TYPE_STYLES[entry.type] || 'text-text/70'} break-all`}>
                  {entry.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {showSkip && (
          <div className="animate-fade-in-up">
            <button
              onClick={onSkip}
              className="px-6 py-2 bg-card border border-border text-muted text-xs font-semibold uppercase tracking-widest rounded hover:border-text hover:text-text transition-all duration-200 shadow-lg"
            >
              Continue Anyway
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
