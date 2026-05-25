import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      const errorName = this.state.error?.name || 'Error'
      const errorMessage = this.state.error?.message || 'Unknown error'
      const stack = this.state.error?.stack || ''
      const componentStack = this.state.errorInfo?.componentStack || ''

      return (
        <div style={{
          background: 'var(--background, #0d0f14)',
          color: 'var(--text, #fff)',
          padding: 32,
          fontFamily: "'Fira Code', monospace",
          height: '100%',
          overflow: 'auto',
        }}>
          <h2 style={{ color: '#ef4444', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
            Component Error
          </h2>
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: 16, marginBottom: 16 }}>
            <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              {errorName}: {errorMessage}
            </p>
            {stack && (
              <pre style={{ color: '#a1a1aa', fontSize: 11, overflow: 'auto', whiteSpace: 'pre-wrap', margin: 0 }}>
                {stack.split('\n').slice(0, 6).join('\n')}
              </pre>
            )}
          </div>
          {componentStack && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border, rgba(255,255,255,0.12))', padding: 16 }}>
              <p style={{ color: '#a1a1aa', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Component Stack
              </p>
              <pre style={{ color: '#71717a', fontSize: 10, overflow: 'auto', whiteSpace: 'pre-wrap', margin: 0 }}>
                {componentStack}
              </pre>
            </div>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: 'var(--surface, #141720)',
              border: '1px solid var(--border, rgba(255,255,255,0.12))',
              color: 'var(--text, #fff)',
              cursor: 'pointer',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}