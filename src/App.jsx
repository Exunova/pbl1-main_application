import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Globe, LayoutGrid, BarChart3, PieChart, Minus, Square, X, MoreHorizontal, Settings } from 'lucide-react'
import GlobeView from './pages/GlobeView'
import ScreenerView from './pages/ScreenerView'
import CompareView from './pages/CompareView'
import PortfolioView from './pages/PortfolioView'

const THEMES = ['dark', 'light', 'auto']

const Titlebar = ({ theme, onThemeToggle }) => (
  <div className="h-10 bg-[#141720] border-b border-white/5 flex items-center justify-between px-3 drag-header shrink-0">
    <div className="flex items-center gap-4 no-drag">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-[#3b82f6] rounded-sm flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">M</span>
        </div>
        <span className="text-xs font-bold tracking-tight text-white/90">MAPRO</span>
      </div>
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

const Sidebar = ({ isExtended, onToggle }) => {
  const location = useLocation()
  const tabs = [
    { name: 'Globe', path: '/', icon: Globe },
    { name: 'Screener', path: '/screener', icon: LayoutGrid },
    { name: 'Compare', path: '/compare', icon: BarChart3 },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
  ]

  return (
    <div className={`${isExtended ? 'w-48' : 'w-16'} bg-[#141720] border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 z-50`}>
      <div className={`h-10 border-b border-white/5 w-full flex items-center ${isExtended ? 'justify-between px-4' : 'justify-center'}`}>
        {isExtended && <span className="text-[10px] font-bold text-white/90 tracking-wider">MENU</span>}
        <button onClick={onToggle} className="p-1 hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors rounded">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <nav className="flex-1 w-full p-2 space-y-2 overflow-hidden">
        {tabs.map(({ name, path, icon: Icon }) => {
          const isActive = location.pathname === path
          return (
            <Link key={path} to={path} title={name}
              className={`flex items-center h-10 w-full rounded transition-colors ${isExtended ? 'px-3 justify-start gap-3' : 'justify-center'} ${isActive ? 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20' : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'}`}>
              <Icon size={20} className="shrink-0" />
              {isExtended && <span className="text-sm font-medium whitespace-nowrap">{name}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default function App() {
  const [isSidebarExtended, setIsSidebarExtended] = useState(false)
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
    <div className="flex flex-col h-screen w-screen bg-[#0d0f14] overflow-hidden relative">
      <Titlebar theme={theme} onThemeToggle={nextTheme} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isExtended={isSidebarExtended} onToggle={() => setIsSidebarExtended(!isSidebarExtended)} />
        <main className="flex-1 overflow-hidden relative">
          {isSidebarExtended && (
            <div className="absolute inset-0 bg-black/60 z-40 transition-opacity cursor-pointer" onClick={() => setIsSidebarExtended(false)} />
          )}
          <Routes>
            <Route path="/" element={<GlobeView />} />
            <Route path="/screener" element={<ScreenerView />} />
            <Route path="/compare" element={<CompareView />} />
            <Route path="/portfolio" element={<PortfolioView />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
