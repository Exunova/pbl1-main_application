import { MARKETS } from '../../data/mockData'

export default function CompareHeader({
  idx1,
  idx2,
  setIdx1,
  setIdx2,
  regions,
  idx1Color,
  idx2Color
}) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-6 py-4 shrink-0 bg-surface/30">

      <Selector
        value={idx1}
        onChange={setIdx1}
        color={idx1Color}
        regions={regions}
      />

      <span className="text-muted text-xs font-bold tracking-widest px-2 shrink-0">
        VS
      </span>

      <Selector
        value={idx2}
        onChange={setIdx2}
        color={idx2Color}
        regions={regions}
      />
    </div>
  )
}

function Selector({ value, onChange, color, regions }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 shrink-0"
        style={{ background: color }}
      />

      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-transparent border-none text-sm text-text outline-none uppercase tracking-widest font-bold cursor-pointer"
      >
        {regions.map(region => (
          <option
            key={region}
            value={region}
            className="bg-surface text-text"
          >
            {MARKETS[region].label}
          </option>
        ))}
      </select>
    </div>
  )
}