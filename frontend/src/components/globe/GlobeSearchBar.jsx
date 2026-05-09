import React, { useRef } from 'react'

export default function GlobeSearchBar({ 
  isSearchOpen, 
  setIsSearchOpen, 
  searchQuery, 
  setSearchQuery, 
  onSearchSubmit 
}) {
  const searchRef = useRef(null)

  return (
    <div className="absolute top-6 left-6 z-50 flex items-center gap-2">
      {!isSearchOpen ? (
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-10 h-10 rounded-full bg-card backdrop-blur border border-border flex items-center justify-center hover:bg-surface transition-colors group"
        >
          <svg className="w-4 h-4 text-muted group-hover:text-text transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      ) : (
        <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <input
              ref={searchRef}
              autoFocus
              type="text"
              placeholder="Search country…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-10 w-64 bg-card backdrop-blur border border-border rounded-full px-4 py-2 text-xs focus:outline-none focus:border-accent transition-all pl-10 text-text"
              onBlur={() => !searchQuery && setIsSearchOpen(false)}
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>
      )}
    </div>
  )
}
