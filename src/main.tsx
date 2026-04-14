import React, { ReactNode, Component, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// ============================================================
// Debug Logging - Track Boot Sequence
// ============================================================
const log = (msg: string, data?: unknown) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[WorkPlex ${timestamp}] ${msg}`, data || '');
};

log('🚀 Module loaded - Starting boot sequence');

// ============================================================
// Global Error Boundary Component
// Catches all React errors and prevents blank screen crashes
// ============================================================
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  hasFallback: boolean;
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, hasFallback: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    log('❌ Error caught by GlobalErrorBoundary', error.message);
    return { hasError: true, error, hasFallback: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log('🔍 Component stack:', errorInfo.componentStack);
  }

  private handleRefresh = () => {
    log('🔄 User triggered refresh');
    window.location.reload();
  };

  private handleClearCache = async () => {
    log('🧹 Clearing all caches');
    try {
      // Clear service workers
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.unregister()));
      }
      // Clear caches
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }
      // Clear localStorage (optional)
      // localStorage.clear();
      window.location.reload();
    } catch (err) {
      log('⚠️ Cache clear failed', err);
      window.location.reload();
    }
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Application Error</h1>
          <p style={{ color: '#9CA3AF', marginBottom: '0.5rem', maxWidth: '32rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <p style={{ color: '#6B7280', fontSize: '0.75rem', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
            {this.state.error?.name || 'UnknownError'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleRefresh}
              style={{
                background: '#E8B84B',
                color: '#000',
                fontWeight: 600,
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
            <button
              onClick={this.handleClearCache}
              style={{
                background: 'transparent',
                color: '#9CA3AF',
                fontWeight: 600,
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #374151',
                cursor: 'pointer'
              }}
            >
              Clear Cache & Reload
            </button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: '2rem', maxWidth: '48rem', width: '100%', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#6B7280', fontSize: '0.75rem' }}>
                🔍 Error Details (Development Mode)
              </summary>
              <pre style={{
                marginTop: '0.5rem',
                background: '#111827',
                padding: '1rem',
                borderRadius: '0.5rem',
                overflow: 'auto',
                fontSize: '0.7rem',
                color: '#F87171',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error.stack}
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
// Safe Splash Removal - Idempotent and Non-Blocking
// ============================================================
const removeSplash = () => {
  try {
    const splash = document.getElementById('workplex-splash');
    if (splash && !splash.classList.contains('removing')) {
      log('✨ Removing splash screen');
      splash.classList.add('removing');
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        if (splash.parentNode) {
          splash.parentNode.removeChild(splash);
        }
      }, 350);
    }
  } catch (err) {
    log('⚠️ Splash removal failed (non-critical)', err);
  }
};

// ============================================================
// Main Initialization - Wrapped in Try/Catch
// ============================================================
log('🔧 Initializing React root');

try {
  // Verify DOM is ready
  if (document.readyState === 'loading') {
    log('⏳ DOM still loading - waiting');
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    log('✅ DOM ready - proceeding');
    initializeApp();
  }
} catch (fatalError) {
  log('💀 FATAL: Initialization threw an error', fatalError);
  renderFallbackUI(fatalError);
}

// ============================================================
// Initialize App Function - Separated for Clarity
// ============================================================
function initializeApp() {
  try {
    const rootElement = document.getElementById('root');

    if (!rootElement) {
      throw new Error('#root element not found in DOM. Check index.html structure.');
    }

    // Check if React already rendered (prevent double render)
    if (rootElement.querySelector('[data-reactroot]') || rootElement.childElementCount > 1) {
      log('⚠️ React may have already rendered - skipping');
      return;
    }

    log('🎨 Creating React root');
    const root = createRoot(rootElement);

    log('🚀 Rendering App component');
    root.render(
      <React.StrictMode>
        <GlobalErrorBoundary>
          <App />
        </GlobalErrorBoundary>
      </React.StrictMode>
    );

    log('✅ React render successful - Removing splash');
    // Remove splash AFTER React has rendered
    requestAnimationFrame(() => {
      removeSplash();
    });

  } catch (error) {
    log('❌ React render failed', error);
    renderFallbackUI(error);
  }
}

// ============================================================
// Fallback UI Renderer - For Critical Failures
// ============================================================
function renderFallbackUI(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
  const errorStack = error instanceof Error ? error.stack : '';

  log('🆘 Rendering fallback UI');

  // Remove splash first
  removeSplash();

  // Replace root content with error UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height:100vh;background:#0A0A0A;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;font-family:system-ui,-apple-system,sans-serif;color:#fff;text-align:center;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1.5rem;">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;">Failed to Load Application</h1>
        <p style="color:#9CA3AF;margin-bottom:0.5rem;max-width:32rem;">${errorMessage}</p>
        ${import.meta.env.DEV && errorStack ? `<pre style="color:#F87171;font-size:0.7rem;background:#111827;padding:1rem;border-radius:0.5rem;overflow:auto;max-width:48rem;text-align:left;margin-top:1rem;white-space:pre-wrap;word-break:break-word;">${errorStack}</pre>` : ''}
        <button onclick="window.location.reload()" style="background:#E8B84B;color:#000;font-weight:600;padding:0.75rem 1.5rem;border-radius:0.5rem;border:none;cursor:pointer;font-size:0.875rem;margin-top:1.5rem;">Refresh Page</button>
      </div>
    `;
  }
}

// ============================================================
// Service Worker Registration - Idempotent (No Infinite Loops)
// ============================================================
if ('serviceWorker' in navigator) {
  log('🔧 Registering Service Worker');

  let swRegistrationAttempted = false;

  window.addEventListener('load', () => {
    // Delay SW registration to prioritize page load
    setTimeout(async () => {
      if (swRegistrationAttempted) {
        log('⚠️ SW registration already attempted - skipping');
        return;
      }
      swRegistrationAttempted = true;

      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        log('✅ Service Worker registered:', registration.scope);

        // Idempotent update flow - only reload if controller exists
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          log('🔄 New service worker installing');

          newWorker.addEventListener('statechange', () => {
            log('🔍 SW state changed:', newWorker.state);

            // Only reload if we have an active controller AND new worker is installed
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              log('🔄 New version ready - reloading');
              window.location.reload();
            }
          });
        });

        // Handle controller change - only reload once
        let controllerChangedHandled = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (controllerChangedHandled) return;
          controllerChangedHandled = true;

          log('🔄 Controller changed - reloading');
          window.location.reload();
        });

      } catch (error) {
        log('❌ Service Worker registration failed (non-critical):', error);
        // Don't block app - SW failure shouldn't break the app
      }
    }, 1500); // 1.5s delay to prioritize main app load
  });
} else {
  log('⚠️ Service Workers not supported in this browser');
}

log('🏁 Boot sequence complete');
