import React from 'react'

export default function DeleteConfirmModal({ deleteTarget, onDelete, onCancel }) {
  if (!deleteTarget) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border p-5 w-full max-w-xs space-y-4 shadow-2xl">
        <div className="space-y-1">
          <h3 className="text-sm font-bold var(--text) uppercase tracking-widest">Hapus Saham?</h3>
          <p className="text-xs text-muted">Yakin ingin menghapus {deleteTarget.ticker} dari portofolio?</p>
        </div>
        <div className="flex gap-3 pt-2 border-t border-border/50">
          <button onClick={onCancel} className="flex-1 bg-surface border border-border var(--text) text-xs font-bold uppercase tracking-widest py-2 hover:bg-white/10 transition-colors">Batal</button>
          <button onClick={onDelete} className="flex-1 bg-red-500 var(--text) text-xs font-bold uppercase tracking-widest py-2 hover:bg-red-600 transition-colors">Hapus</button>
        </div>
      </div>
    </div>
  )
}
