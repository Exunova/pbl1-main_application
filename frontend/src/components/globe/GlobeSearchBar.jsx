import React, { useRef, useState, useMemo } from 'react'

export default function GlobeSearchBar({ 
  isSearchOpen, 
  setIsSearchOpen, 
  searchQuery, 
  setSearchQuery, 
  onSearchSubmit,
  countries = [],
  onCountrySelect
}) {
  const searchRef = useRef(null)
  const [focusedIdx, setFocusedIdx] = useState(-1)

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return countries
    const q = searchQuery.toLowerCase()
    return countries.filter(
      ([iso2, name]) => iso2.toLowerCase().includes(q) || name.toLowerCase().includes(q)
    )
  }, [countries, searchQuery])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && focusedIdx >= 0 && filtered[focusedIdx]) {
      e.preventDefault()
      const [iso2] = filtered[focusedIdx]
      onCountrySelect(iso2)
      setSearchQuery('')
      setIsSearchOpen(false)
      setFocusedIdx(-1)
    }
  }

  const handleSelect = (iso2) => {
    onCountrySelect(iso2)
    setSearchQuery('')
    setIsSearchOpen(false)
    setFocusedIdx(-1)
  }

  return (
    <div className="absolute top-6 left-6 z-50 flex items-start gap-2">
      {!isSearchOpen ? (
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-10 h-10 rounded-full bg-card backdrop-blur border border-border flex items-center justify-center hover:bg-surface transition-colors group shrink-0"
        >
          <svg className="w-4 h-4 text-muted group-hover:text-text transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      ) : (
        <div className="flex flex-col gap-0">
          <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <input
                ref={searchRef}
                autoFocus
                type="text"
                placeholder="Search country…"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setFocusedIdx(-1) }}
                onKeyDown={handleKeyDown}
                className="h-10 w-64 bg-card backdrop-blur border border-border rounded-full px-4 py-2 text-xs focus:outline-none focus:border-accent transition-all pl-10 text-text"
                onBlur={() => {
                  if (!searchQuery) setIsSearchOpen(false)
                }}
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {filtered.length > 0 && searchQuery.trim() && (
            <div className="mt-1 w-64 bg-card backdrop-blur border border-border rounded-xl overflow-hidden shadow-xl">
              {filtered.map(([iso2, name], i) => (
                <button
                  key={iso2}
                  type="button"
                  onMouseDown={() => handleSelect(iso2)}
                  onMouseEnter={() => setFocusedIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left transition-colors ${
                    i === focusedIdx ? 'bg-accent/20 text-text' : 'text-muted hover:text-text hover:bg-accent/10'
                  }`}
                >
                  <span className="font-medium uppercase tracking-wider text-[11px] w-8 text-accent">{iso2}</span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
          )}

          {searchQuery.trim() && filtered.length === 0 && (
            <div className="mt-1 w-64 bg-card backdrop-blur border border-border rounded-xl overflow-hidden shadow-xl">
              <div className="px-4 py-3 text-xs text-muted">No countries match &ldquo;{searchQuery}&rdquo;</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
