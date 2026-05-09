import { useEffect, useState } from 'react'
import { X, Newspaper } from 'lucide-react'

import { MARKETS } from '../../../data/mockData'

import NewsCard from './NewsCard'
import NewsLoading from './NewsLoading'
import EmptyNews from './EmptyNews'

export default function NewsPanel({
  region,
  color,
  onClose
}) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!region || !window.api) return

    setLoading(true)

    window.api
      .fetchNews(region)
      .then(data => {
        setArticles(data?.articles || [])
      })
      .catch(() => {
        setArticles([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [region])

  return (
    <div className="w-80 h-full border-l border-border bg-background flex flex-col shrink-0">

      <div className="flex items-center justify-between p-4 border-b border-border">

        <div className="flex items-center gap-2">
          <Newspaper size={14} />
          <span className="text-xs font-bold uppercase tracking-widest">
            {MARKETS[region]?.label} News
          </span>
        </div>

        <button onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {loading ? (
          <NewsLoading />
        ) : articles.length === 0 ? (
          <EmptyNews />
        ) : (
          articles.map((article, index) => (
            <NewsCard
              key={index}
              article={article}
              color={color}
            />
          ))
        )}

      </div>
    </div>
  )
}