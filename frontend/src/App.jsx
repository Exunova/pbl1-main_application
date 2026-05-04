import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import logo from './logo.ico'
import { Globe, LayoutGrid, BarChart3, PieChart, User, Minus, Square, X, RefreshCcw } from 'lucide-react'
import GlobeView from './pages/GlobeView'
import { ScrapingProvider, useScraping } from './contexts/ScrapingContext'
import ScreenerView from './pages/ScreenerView'
import CompareView from './pages/CompareView'
import PortfolioView from './pages/PortfolioView'
import ProfileView from './pages/ProfileView'

const THEMES = ['dark', 'light', 'auto']

const Titlebar = ({ theme, onThemeToggle }) => {
  const location = useLocation()
  const { isScraping, errorCount, startScrape } = useScraping()

  const tabs = [
    { name: 'Globe', path: '/', icon: Globe },
    { name: 'Screener', path: '/screener', icon: LayoutGrid },
    { name: 'Compare', path: '/compare', icon: BarChart3 },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
    { name: 'Profile', path: '/profile', icon: User },
  ]

  return (
    <div className="h-10 bg-surface border-b border-border flex items-center justify-between px-4 drag-header shrink-0 z-50 relative">
      <div className="flex items-center gap-6 no-drag">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <img src={logo} className="w-full h-full object-contain" alt="MAPRO Logo" />
          </div>
          <span className="text-xs font-bold tracking-widest text-text uppercase">MAPRO</span>
        </div>

        <nav className="flex items-center gap-1 h-full">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = location.pathname === tab.path
            return (
               <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-2 px-3 h-10 text-[11px] font-semibold uppercase tracking-wider transition-colors border-b-2 ${isActive
                    ? 'bg-text/5 text-text border-text'
                    : 'text-muted hover:text-text hover:bg-text/5 border-transparent'
                  }`}
              >
                <Icon size={14} className={isActive ? "opacity-100" : "opacity-70"} />
                {tab.name}
              </Link>
            )
          })}
          
          <div className="w-px h-4 bg-border mx-3"></div>

          <button
            onClick={startScrape}
            disabled={isScraping}
            className={`flex items-center gap-1.5 px-2 h-7 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
              isScraping
                ? 'bg-accent/20 text-accent cursor-not-allowed'
                : 'text-text hover:bg-text/10'
            }`}
          >
            <RefreshCcw size={12} className={isScraping ? 'animate-spin' : ''} />
            {isScraping ? 'Scraping...' : 'Scrape Latest'}
          </button>
          <div className="relative group flex items-center ml-2">
            <span className={`w-2 h-2 rounded-full ${isScraping ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-black/90 border border-border text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {errorCount || 0} errors
            </span>
          </div>
        </nav>
      </div>

      <div className="flex items-center gap-0 no-drag h-full">
        <button
          onClick={() => window.api?.minimize()}
          className="h-10 w-10 flex items-center justify-center hover:bg-text/10 text-muted transition-colors"
        >
          <Minus size={14} />
        </button>

        <button
          onClick={() => window.api?.maximize()}
          className="h-10 w-10 flex items-center justify-center hover:bg-text/10 text-muted transition-colors"
        >
          <Square size={12} />
        </button>

        <button
          onClick={() => window.api?.close()}
          className="h-10 w-10 flex items-center justify-center hover:bg-danger hover:text-white text-muted transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('mapro-theme') || 'dark')

  useEffect(() => {
    localStorage.setItem('mapro-theme', theme)
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'auto')
    if (theme === 'light') root.classList.add('light')
    else if (theme === 'dark') root.classList.add('dark')
  }, [theme])

  const nextTheme = () => {
    const idx = THEMES.indexOf(theme)
    setTheme(THEMES[(idx + 1) % THEMES.length])
  }

  return (
    <ScrapingProvider>
      <div className={`flex flex-col h-screen w-screen bg-background overflow-hidden relative text-text selection:bg-text/20 selection:text-text ${theme}`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
        <Titlebar theme={theme} onThemeToggle={nextTheme} />
        <main className="flex-1 overflow-hidden relative z-10">
          <Routes>
            <Route path="/" element={<GlobeView />} />
            <Route path="/screener" element={<ScreenerView />} />
            <Route path="/compare" element={<CompareView />} />
            <Route path="/portfolio" element={<PortfolioView />} />
            <Route path="/profile" element={<ProfileView theme={theme} onThemeToggle={nextTheme} />} />
          </Routes>
        </main>
      </div>
    </ScrapingProvider>
  )
}
