import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'

  return (
    <button
      onClick={onToggle}
      title={`Theme: ${theme}`}
      className="relative w-14 h-7 flex items-center rounded-full transition-colors duration-300 bg-border hover:bg-muted/20 px-1"
    >
      {/* Sun icon */}
      <Sun
        size={12}
        className={`absolute left-2 z-10 transition-colors duration-300 ${
          !isDark ? 'text-yellow-500' : 'text-muted'
        }`}
      />

      {/* Moon icon */}
      <Moon
        size={12}
        className={`absolute right-2 z-10 transition-colors duration-300 ${
          isDark ? 'text-accent' : 'text-muted'
        }`}
      />

      {/* Knob */}
      <div
        className={`w-5 h-5 bg-card border border-border rounded-full shadow-md transform transition-all duration-300 ease-in-out ${
          isDark ? 'translate-x-[28px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}