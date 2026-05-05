import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f5f5f5',
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#e74c3c', marginBottom: '1rem' }}>
              ⚠️ Something went wrong
            </h1>
            <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              The application encountered an error. Try refreshing the page or going back to the dashboard.
            </p>
            {this.state.error && (
              <details style={{
                background: '#f9f9f9',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1.5rem',
                textAlign: 'left',
                fontSize: '0.85rem',
                color: '#666'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Error details
                </summary>
                <pre style={{ 
                  overflow: 'auto',
                  maxHeight: '200px',
                  margin: 0
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  flex: 1,
                  padding: '0.8rem 1.2rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  flex: 1,
                  padding: '0.8rem 1.2rem',
                  background: '#e0e0e0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
