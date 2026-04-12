import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Globe, LayoutGrid, BarChart3, PieChart, Minus, Square, X, MoreHorizontal } from 'lucide-react'

const Titlebar = () => (
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d0f14] overflow-hidden relative">
      <Titlebar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isExtended={isSidebarExtended} onToggle={() => setIsSidebarExtended(!isSidebarExtended)} />
        <main className="flex-1 overflow-hidden relative">
          {isSidebarExtended && (
            <div className="absolute inset-0 bg-black/60 z-40 transition-opacity cursor-pointer" onClick={() => setIsSidebarExtended(false)} />
          )}
          <Routes>
            <Route path="/" element={<div className="p-4 text-white/50">GlobeView - D3.js 2D choropleth coming soon</div>} />
            <Route path="/screener" element={<div className="p-4 text-white/50">ScreenerView - stock grid coming soon</div>} />
            <Route path="/compare" element={<div className="p-4 text-white/50">CompareView - index comparison coming soon</div>} />
            <Route path="/portfolio" element={<div className="p-4 text-white/50">PortfolioView - position management coming soon</div>} />
          </Routes>
        </main>
      </div>
    </div>
  )
}