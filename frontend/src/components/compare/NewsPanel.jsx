import { useState, useEffect } from 'react'
import { X, Newspaper } from 'lucide-react'
import { MARKETS } from '../../data/mockData'
import NewsCard from './NewsCard'

export default function NewsPanel({ region, color, onClose }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!region) return
    setLoading(true); setArticles([])
    
    if (!window.api) { 
      setLoading(false); 
      return 
    }

    window.api.fetchNews(region)
      .then(data => setArticles(data?.articles || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [region])

  return (
    <div className="w-80 h-full border-l border-border bg-background flex flex-col shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-muted" />
          <span className="text-xs font-bold text-text uppercase tracking-widest">{MARKETS[region]?.label || region} News</span>
        </div>
        <button onClick={onClose} className="text-muted hover:text-white"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-border p-4 animate-pulse">
                <div className="flex-1">
                  <div className="h-2.5 bg-border w-1/3 mb-3" />
                  <div className="h-3 bg-border w-full mb-1.5" />
                  <div className="h-3 bg-border w-4/5" />
                </div>
              </div>
            ))
          : articles.length === 0
          ? <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border-b border-border">
              <Newspaper size={32} className="text-muted/20" />
              <span className="text-[11px] text-muted uppercase">No news</span>
            </div>
          : articles.map((art, i) => <NewsCard key={i} article={art} color={color} />)
        }
      </div>
    </div>
  )
}