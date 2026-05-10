// Mock for lightweight-charts library (used by CandlestickChart)
// lightweight-charts requires canvas which jsdom doesn't support
// This mock renders placeholder elements instead

export const createChart = () => ({
  addCandlestickSeries: () => ({
    setData: () => {},
    update: () => {},
  }),
  addLineSeries: () => ({
    setData: () => {},
  }),
  addAreaSeries: () => ({
    setData: () => {},
  }),
  addHistogramSeries: () => ({
    setData: () => {},
  }),
  timeScale: () => ({
    fitContent: () => {},
  }),
  applyOptions: () => {},
  remove: () => {},
})

export const CrosshairMode = { NORMAL: 0, NORMAL: 1 }
export const LineStyle = { SOLID: 0, DASHED: 1 }
