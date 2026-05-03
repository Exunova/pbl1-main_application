import { useEffect, useRef, useCallback } from 'react'
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'

// Strip focus ring from an element WITHOUT touching tabindex.
// tabindex must stay as-is because lightweight-charts uses it to detect
// pointer interactions for Y-axis drag-to-scale via its internal event model.
function suppressFocusRing(root) {
  if (!root) return
  const apply = el => {
    // Inline style — highest specificity, beats UA stylesheet and :focus rules
    el.style.setProperty('outline', 'none', 'important')
    el.style.setProperty('box-shadow', 'none', 'important')
    // Belt-and-suspenders: also clear outline each time the element gains focus
    // (Electron re-applies the ring on every focus event)
    if (!el._focusHandlerAttached) {
      el._focusHandlerAttached = true
      el.addEventListener('focus', () => {
        el.style.setProperty('outline', 'none', 'important')
        el.style.setProperty('box-shadow', 'none', 'important')
      }, { capture: true, passive: true })
    }
  }
  apply(root)
  root.querySelectorAll('*').forEach(apply)
}

export default function CandlestickChart({ data = [] }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)

  // ─── Data formatter ───────────────────────────────────────────────────────
  const getFormattedData = useCallback(() => {
    return data
      .filter(d => d.timestamp)
      .map(d => {
        let time
        if (typeof d.timestamp === 'number') {
          time = d.timestamp > 1e12 ? Math.floor(d.timestamp / 1000) : d.timestamp
        } else {
          time = Math.floor(new Date(d.timestamp).getTime() / 1000)
        }
        return { time, open: d.open, high: d.high, low: d.low, close: d.close }
      })
      .filter(d => !isNaN(d.time) && d.open != null)
      .sort((a, b) => a.time - b.time)
  }, [data])

  // ─── Chart init ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: '#0d1117' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: '#1c2333', style: LineStyle.Dotted },
        horzLines: { color: '#1c2333', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#4c5a70',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e2b3a',
        },
        horzLine: {
          color: '#4c5a70',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e2b3a',
        },
      },
      rightPriceScale: {
        borderColor: '#1c2333',
        scaleMargins: { top: 0.08, bottom: 0.08 },
        // mode: 0 = Normal (price-axis drag-to-scale is enabled by handleScale below)
        mode: 0,
        entireTextOnly: false,
      },
      timeScale: {
        borderColor: '#1c2333',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        barSpacing: 8,
        minBarSpacing: 1.5,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      // ── Scroll: mouse wheel + drag pan
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,   // left-click drag = pan
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      // ── Scale: wheel zoom + axis drag-to-scale
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: {
          time: true,   // drag X-axis to scale time
          price: true,  // drag Y-axis to scale price
        },
        axisDoubleClickReset: {
          time: true,
          price: true,
        },
      },
      // ── Kinetic momentum scrolling (smooth "flick" pan)
      kineticScroll: {
        touch: true,
        mouse: true,
      },
    })

    chartRef.current = chart

    // Candlestick series
    const series = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })
    seriesRef.current = series

    const formatted = getFormattedData()
    if (formatted.length > 0) {
      series.setData(formatted)
      chart.timeScale().fitContent()
    }

    // ── Strip focus outlines, watch for new DOM nodes AND attribute changes
    suppressFocusRing(containerRef.current)

    const mo = new MutationObserver(() => suppressFocusRing(containerRef.current))
    mo.observe(containerRef.current, {
      childList: true,
      subtree: true,
      // Also watch attribute changes: library sets tabindex dynamically
      attributes: true,
      attributeFilter: ['tabindex', 'style'],
    })

    // ── Responsive resize
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) chart.applyOptions({ width, height })
    })
    ro.observe(containerRef.current)

    return () => {
      mo.disconnect()
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Re-feed data when prop changes ───────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return
    const formatted = getFormattedData()
    if (formatted.length > 0) {
      seriesRef.current.setData(formatted)
      chartRef.current.timeScale().fitContent()
    }
  }, [data, getFormattedData])

  // ─── Toolbar handlers ─────────────────────────────────────────────────────
  const zoomIn = useCallback(() => {
    const ts = chartRef.current?.timeScale()
    const r = ts?.getVisibleLogicalRange()
    if (!r) return
    const span = (r.to - r.from) / 2
    const mid = (r.from + r.to) / 2
    ts.setVisibleLogicalRange({ from: mid - span / 2, to: mid + span / 2 })
  }, [])

  const zoomOut = useCallback(() => {
    const ts = chartRef.current?.timeScale()
    const r = ts?.getVisibleLogicalRange()
    if (!r) return
    const span = (r.to - r.from)
    const mid = (r.from + r.to) / 2
    ts.setVisibleLogicalRange({ from: mid - span, to: mid + span })
  }, [])

  const fitAll = useCallback(() => {
    chartRef.current?.timeScale().fitContent()
  }, [])

  const resetY = useCallback(() => {
    chartRef.current?.priceScale('right').applyOptions({ autoScale: true })
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <ToolBtn onClick={zoomIn} title="Zoom In (Scroll Up)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </ToolBtn>
          <ToolBtn onClick={zoomOut} title="Zoom Out (Scroll Down)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </ToolBtn>
        </div>

        <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 4px' }} />

        <ToolBtn onClick={fitAll} title="Reset Zoom / Fit All">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </ToolBtn>

        <ToolBtn onClick={resetY} title="Reset Price Scale (Double Click Y-Axis)">
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>AUTO</span>
        </ToolBtn>

        <span style={styles.hint}>
          Zoom: <kbd style={styles.kbd}>+</kbd> <kbd style={styles.kbd}>-</kbd> or Scroll • Pan: Drag Chart • Scale: Drag Y-Axis
        </span>
      </div>

      {/* Chart mount point */}
      <div
        ref={containerRef}
        style={styles.chartArea}
      />
    </div>
  )
}

// ─── Small toolbar button ──────────────────────────────────────────────────
function ToolBtn({ onClick, title, children }) {
  const ref = useRef(null)
  return (
    <button
      ref={ref}
      onClick={onClick}
      title={title}
      tabIndex={-1}           /* prevent tab-focus → no outline */
      style={styles.btn}
      onMouseEnter={() => ref.current && (ref.current.style.background = '#1c2333')}
      onMouseLeave={() => ref.current && (ref.current.style.background = 'transparent')}
    >
      {children}
    </button>
  )
}

// ─── Static styles ─────────────────────────────────────────────────────────
const styles = {
  root: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#0d1117',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 8px',
    borderBottom: '1px solid #1c2333',
    flexShrink: 0,
  },
  chartArea: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    // Explicitly kill any outline/ring this div might receive
    outline: 'none',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 4,
    border: '1px solid #1c2333',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 0,
    outline: 'none',        /* no focus ring on toolbar buttons */
    transition: 'background 0.12s',
  },
  hint: {
    marginLeft: 'auto',
    fontSize: 10,
    color: '#3d4f63',
    userSelect: 'none',
  },
  kbd: {
    background: '#1c2333',
    border: '1px solid #3d4f63',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '9px',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
}