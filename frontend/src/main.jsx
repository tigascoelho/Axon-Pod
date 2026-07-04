import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Root render failed:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100dvh', background: '#08080a', color: '#f2f2f3', display: 'grid', placeItems: 'center', padding: '24px', textAlign: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 800 }}>App failed to load</h1>
            <p style={{ opacity: 0.8, fontSize: '13px' }}>{this.state.message}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
