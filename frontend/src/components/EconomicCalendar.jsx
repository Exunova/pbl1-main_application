import { useState, useEffect } from 'react'

export default function EconomicCalendar({ country, events: propEvents, loading = false, impactFilter }) {
  const [events, setEvents] = useState(propEvents || [])

  useEffect(() => {
    if (propEvents != null) {
      setEvents(propEvents)
      return
    }
    if (!window.api || !country) return
    window.api.fetchMacro(country)
      .then(d => setEvents(d?.events || []))
      .catch(() => {})
  }, [country, propEvents])

  const filteredEvents = impactFilter
    ? events.filter(ev => ev.impact === impactFilter)
    : events

  const IMPACT_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#94a3b8' }

  if (loading) return (
    <div className="p-5 text-xs text-muted">Loading calendar...</div>
  )

  if (!filteredEvents.length) return (
    <div className="p-5 text-xs text-muted">No economic events</div>
  )

  return (
  <div className="p-5">
    <span className="text-[11px] font-bold text-muted tracking-widest uppercase block mb-3">
      Economic Calendar
    </span>

    <div className="space-y-1.5">
      {filteredEvents.map((ev, i) => (
        <div key={i} className="bg-card rounded p-2 text-xs">
          
          <div className="flex justify-between items-start">
            <span className="text-text font-medium">{ev.name}</span>

            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
              style={{
                background: IMPACT_COLORS[ev.impact] || '#94a3b8'
              }}
            >
              {ev.impact?.toUpperCase()}
            </span>
          </div>

          <div className="text-muted mt-1 space-y-0.5">
            <div>{ev.date} {ev.time}</div>

            {ev.actual && (
              <div className="text-muted/80">
                Actual: <span className="text-text">{ev.actual}</span>
              </div>
            )}

            {ev.forecast && <div>Forecast: {ev.forecast}</div>}
            {ev.previous && <div>Previous: {ev.previous}</div>}
          </div>

        </div>
      ))}
    </div>
  </div>
)
}