export function formatChange(n) {
  if (n == null || isNaN(n)) return '0.00'
  return (n >= 0 ? '+' : '') + n.toFixed(2)
}

export function ambilPnl(p, index, pnlData) {
  if (!pnlData?.positions) return null
  const ketemu = pnlData.positions.find(x => String(x.id) === String(p.id))
  return ketemu || pnlData.positions[index]
}

export const COLORS = ['#ffffff', '#d4d4d4', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a'];
