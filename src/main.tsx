import React, { ReactNode, Component, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// ============================================================
// Global Error Boundary Component
// Catches all React errors and prevents blank screen crashes
// ============================================================
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Uncaught Error:', error);
    console.error('[GlobalErrorBoundary] Component Stack:', errorInfo.componentStack);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Something Went Wrong</h1>
          <p style={{ color: '#9CA3AF', marginBottom: '1.5rem', maxWidth: '24rem' }}>
            {this.state.error?.message || 'An unexpected error occurred while loading the application.'}
          </p>
          <button
            onClick={this.handleRefresh}
            style={{
              background: '#E8B84B',
              color: '#000000',
              fontWeight: 600,
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'transform 0.1s ease'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Refresh Application
          </button>
          {import.meta.env.DEV && (
            <details style={{ marginTop: '2rem', maxWidth: '48rem', width: '100%', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#6B7280', fontSize: '0.75rem' }}>Error Details (Development)</summary>
              <pre style={{
                marginTop: '0.5rem',
                background: '#111827',
                padding: '1rem',
                borderRadius: '0.5rem',
                overflow: 'auto',
                fontSize: '0.75rem',
                color: '#EF4444',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================
// Initialization
// ============================================================
console.log('[WorkPlex] Initialization Start');

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element in index.html');
}

try {
  const root = createRoot(rootElement!);

  root.render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <App />
      </GlobalErrorBoundary>
    </React.StrictMode>
  );

  console.log('[WorkPlex] React rendering complete');
} catch (error: unknown) {
  console.error('[WorkPlex] Fatal initialization error:', error);

  const errorMessage = error instanceof Error ? error.message : 'Unknown error during initialization';

  document.getElementById('root')!.innerHTML = `
    <div style="min-height:100vh;background:#0A0A0A;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;font-family:system-ui,-apple-system,sans-serif;color:#ffffff;text-align:center;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1.5rem;">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;">Fatal Error</h1>
      <p style="color:#9CA3AF;margin-bottom:1.5rem;max-width:24rem;">${errorMessage}</p>
      <button onclick="window.location.reload()" style="background:#E8B84B;color:#000000;font-weight:600;padding:0.75rem 1.5rem;border-radius:0.5rem;border:none;cursor:pointer;font-size:0.875rem;">Refresh Application</button>
    </div>
  `;
}

// Remove splash screen when React is ready
window.addEventListener('load', () => {
  const splash = document.getElementById('workplex-splash');
  if (splash) {
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.4s ease-out';
    setTimeout(() => splash.remove(), 500);
  }
});
