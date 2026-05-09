import { useEffect, useState } from 'react'
import { MARKETS } from '../../../data/mockData'
import { buildChartData } from '../../../utils/chartUtils'

export default function useChartData(idx1, idx2) {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!window.api) return

    setLoading(true)

    Promise.all([
      window.api.fetchOHLCV(MARKETS[idx1].index),
      window.api.fetchOHLCV(MARKETS[idx2].index),
    ])
      .then(([d1, d2]) => {
        setChartData(buildChartData(d1, d2))
      })
      .finally(() => {
        setLoading(false)
      })

  }, [idx1, idx2])

  return {
    chartData,
    loading
  }
}