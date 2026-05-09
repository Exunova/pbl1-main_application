export function buildChartData(d1, d2) {
  const c1 = [...(d1?.ohlcv_15m || [])]
  const c2 = [...(d2?.ohlcv_15m || [])]

  const c1ByTs = {}
  const c2ByTs = {}

  c1.forEach(c => {
    c1ByTs[c.timestamp] = c.close
  })

  c2.forEach(c => {
    c2ByTs[c.timestamp] = c.close
  })

  const allTs = Array.from(
    new Set([
      ...Object.keys(c1ByTs),
      ...Object.keys(c2ByTs)
    ])
  ).sort()

  const base1 = c1[0]?.close || 1
  const base2 = c2[0]?.close || 1

  let lastV1 = base1
  let lastV2 = base2

  return allTs.map(ts => {
    if (c1ByTs[ts]) lastV1 = c1ByTs[ts]
    if (c2ByTs[ts]) lastV2 = c2ByTs[ts]

    const v1 = (lastV1 / base1) * 100
    const v2 = (lastV2 / base2) * 100

    return {
      ts: ts.slice(5, 16),
      v1,
      v2,
      v1_high: v1 > v2 ? [v2, v1] : [v2, v2],
      v1_low: v2 > v1 ? [v1, v2] : [v1, v1]
    }
  })
}