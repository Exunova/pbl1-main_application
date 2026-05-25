import { createContext, useContext, useEffect, useState } from 'react'

const RefreshContext = createContext(0)

export function RefreshProvider({ children }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 3000)
    return () => clearInterval(interval)
  }, [])

  return <RefreshContext.Provider value={tick}>{children}</RefreshContext.Provider>
}

export function useRefreshTick() {
  return useContext(RefreshContext)
}
