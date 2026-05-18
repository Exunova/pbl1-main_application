export default function NewDataBadge({ isNewData, onDismiss }) {
  if (!isNewData) return null

  return (
    <button
      onClick={onDismiss}
      className="animate-badge-pulse inline-flex items-center gap-1 px-2 h-5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-[#3b82f6] text-white cursor-pointer hover:bg-[#3b82f6]/80 transition-colors"
    >
      New Data
    </button>
  )
}