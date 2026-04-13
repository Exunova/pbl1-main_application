import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Globe, LayoutGrid, BarChart3, PieChart, Minus, Square, X, Settings } from 'lucide-react'
import GlobeView from './pages/GlobeView'
import ScreenerView from './pages/ScreenerView'
import CompareView from './pages/CompareView'
import PortfolioView from './pages/PortfolioView'

const THEMES = ['dark', 'light', 'auto']

const Titlebar = ({ theme, onThemeToggle }) => {
  const location = useLocation()
  
  const tabs = [
    { name: 'Globe', path: '/', icon: Globe },
    { name: 'Screener', path: '/screener', icon: LayoutGrid },
    { name: 'Compare', path: '/compare', icon: BarChart3 },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
  ]

  return (
    <div className="h-10 bg-surface border-b border-white/5 flex items-center justify-between px-3 drag-header shrink-0">
      <div className="flex items-center gap-4 no-drag">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-accent rounded-sm flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">M</span>
          </div>
          <span className="text-xs font-bold tracking-tight text-white/90">MAPRO</span>
        </div>
        
        <nav className="flex items-center gap-1 ml-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = location.pathname === tab.path
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                  isActive 
                    ? 'bg-accent/10 text-accent border border-accent/20' 
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon size={12} />
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-0 no-drag">
        <button onClick={onThemeToggle} title={`Theme: ${theme}`}
          className="p-2 hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors text-xs">
          <Settings size={14} />
        </button>
        <button onClick={() => window.api?.minimize()} className="p-2 hover:bg-white/5 text-white/40 transition-colors">
          <Minus size={14} />
        </button>
        <button onClick={() => window.api?.maximize()} className="p-2 hover:bg-white/5 text-white/40 transition-colors">
          <Square size={10} />
        </button>
        <button onClick={() => window.api?.close()} className="p-2 hover:bg-danger/80 hover:text-white text-white/40 transition-colors">
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
    document.documentElement.classList.remove('dark', 'light')
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else if (theme === 'light') document.documentElement.classList.add('light')
  }, [theme])

  const nextTheme = () => {
    const idx = THEMES.indexOf(theme)
    setTheme(THEMES[(idx + 1) % THEMES.length])
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden">
      <Titlebar theme={theme} onThemeToggle={nextTheme} />
      <main className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<GlobeView />} />
          <Route path="/screener" element={<ScreenerView />} />
          <Route path="/compare" element={<CompareView />} />
          <Route path="/portfolio" element={<PortfolioView />} />
        </Routes>
      </main>
    </div>
  )
}
