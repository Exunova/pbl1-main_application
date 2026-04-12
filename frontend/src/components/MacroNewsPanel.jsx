export default function MacroNewsPanel({ articles = [], region, loading = false }) {
  if (loading) return (
    <div className="p-3 text-xs text-white/40">Loading news...</div>
  )

  if (!articles.length) return (
    <div className="p-3 text-xs text-white/40">No news available</div>
  )
  return (
    <div className="p-3">
      <h3 className="text-xs font-bold text-white/50 uppercase mb-2">Macro News</h3>
      <div className="space-y-2 max-h-56 overflow-y-auto">
        {articles.map((art, i) => (
          <a key={i} href={art.link} target="_blank" rel="noopener noreferrer"
            className="block bg-[#1c2030] rounded p-2 hover:bg-[#252a3a] transition-colors">
            {art.thumbnail?.url && (
              <img src={art.thumbnail.url} alt="" className="w-full h-16 object-cover rounded mb-1.5 bg-[#141720]" />
            )}
            <div className="text-xs text-white font-medium leading-tight">{art.title}</div>
            <div className="text-[10px] text-white/40 mt-1">{art.publisher} · {art.published}</div>
          </a>
        ))}
      </div>
    </div>
  )
}