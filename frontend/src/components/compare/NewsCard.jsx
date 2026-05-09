import { Newspaper } from 'lucide-react'

export default function NewsCard({ article, color }) {
  return (
    <a
      href={article.link || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 bg-surface border-b border-border p-4 hover:bg-white/5"
    >
      <div className="flex-1 flex flex-col justify-center min-w-0">

        <div className="flex items-center gap-2 mb-2">

          {article.thumbnail?.url ? (
            <img
              src={article.thumbnail.url}
              alt=""
              className="w-4 h-4 rounded-full object-cover shrink-0"
            />
          ) : (
            <Newspaper
              size={10}
              style={{ color }}
            />
          )}

          <span className="text-[10px] font-bold text-muted uppercase tracking-widest truncate">
            {article.publisher}
          </span>

        </div>

        <p className="text-xs font-semibold text-text leading-snug line-clamp-3">
          {article.title}
        </p>

      </div>
    </a>
  )
}