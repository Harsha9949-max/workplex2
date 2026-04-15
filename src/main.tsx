import React, { ReactNode, Component, ErrorInfo } from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './App';
import './index.css';

// ============================================================
// Debug Logging - Track Boot Sequence (Safe)
// ============================================================
const log = (msg: string, data?: unknown) => {
  try {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[WorkPlex ${timestamp}] ${msg}`, data ?? '');
  } catch {
    // Logging should never crash the app
  }
};

log('🚀 Module loaded - Starting boot sequence');

// ============================================================
// Global Error Boundary Component
// Catches all React errors and prevents blank screen crashes
// ============================================================
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    log('❌ Error caught by GlobalErrorBoundary', error.message);
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    log('🔍 Component stack:', errorInfo.componentStack);
    this.setState({ errorInfo: errorInfo.componentStack });
  }

  private handleRefresh = () => {
    log('🔄 User triggered refresh');
    window.location.reload();
  };

  private handleClearCache = async () => {
    log('🧹 Clearing all caches');
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }
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
          {import.meta.env.DEV && this.state.errorInfo && (
            <details style={{ marginTop: '2rem', maxWidth: '48rem', width: '100%', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#6B7280', fontSize: '0.75rem' }}>
                🔍 Component Stack (Development Mode)
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
                {this.state.errorInfo}
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
// Called ONLY after root.render() completes successfully
// ============================================================
let splashRemoved = false;

const removeSplash = () => {
  if (splashRemoved) return;
  splashRemoved = true;

  try {
    const splash = document.getElementById('workplex-splash');
    if (splash) {
      log('✨ Removing splash screen');
      splash.classList.add('removing');
      // Use rAF to ensure the class change is painted before transition
      requestAnimationFrame(() => {
        splash.style.opacity = '0';
        splash.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
          if (splash.parentNode) {
            splash.parentNode.removeChild(splash);
          }
        }, 350);
      });
    }
  } catch (err) {
    log('⚠️ Splash removal failed (non-critical)', err);
  }
};

// ============================================================
// Fallback UI Renderer - For Critical Failures
// ============================================================
function renderFallbackUI(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
  const errorStack = error instanceof Error ? (error.stack ?? '') : '';

  log('🆘 Rendering fallback UI');

  // Remove splash first
  removeSplash();

  // Replace root content with error UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const isDev = import.meta.env.DEV;
    rootElement.innerHTML = `
      <div style="min-height:100vh;background:#0A0A0A;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;font-family:system-ui,-apple-system,sans-serif;color:#fff;text-align:center;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1.5rem;">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;">Failed to Load Application</h1>
        <p style="color:#9CA3AF;margin-bottom:0.5rem;max-width:32rem;">${errorMessage}</p>
        ${isDev && errorStack ? `<pre style="color:#F87171;font-size:0.7rem;background:#111827;padding:1rem;border-radius:0.5rem;overflow:auto;max-width:48rem;text-align:left;margin-top:1rem;white-space:pre-wrap;word-break:break-word;">${errorStack}</pre>` : ''}
        <div style="display:flex;gap:1rem;margin-top:1.5rem;flex-wrap:wrap;justify-content:center;">
          <button onclick="window.location.reload()" style="background:#E8B84B;color:#000;font-weight:600;padding:0.75rem 1.5rem;border-radius:0.5rem;border:none;cursor:pointer;font-size:0.875rem;">Refresh Page</button>
          <button id="clear-cache-btn" style="background:transparent;color:#9CA3AF;font-weight:600;padding:0.75rem 1.5rem;border-radius:0.5rem;border:1px solid #374151;cursor:pointer;font-size:0.875rem;">Clear Cache & Reload</button>
        </div>
      </div>
    `;

    // Attach clear cache handler
    const clearBtn = document.getElementById('clear-cache-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        try {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r => r.unregister()));
          }
          if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map(n => caches.delete(n)));
          }
        } catch { /* ignore */ }
        window.location.reload();
      });
    }
  }
}

// ============================================================
// Main Initialization - Wrapped in Try/Catch with Auto-Reload
// ============================================================
log('🔧 Initializing React root');

// Signal to index.html's Asset Load Detector that modules loaded successfully
// This cancels the 5-second timeout that would show a Connection Error UI
try {
  (window as any).__WORKPLEX_BOOT_COMPLETE = true;
} catch { /* ignore */ }

// Auto-reload counter - prevents infinite reload loops
const RELOAD_KEY = '__workplex_reload_count';
const MAX_RELOADS = 3;
const RELOAD_WINDOW_MS = 30000; // 30 seconds

function shouldAttemptReload(): boolean {
  try {
    const now = Date.now();
    const stored = localStorage.getItem(RELOAD_KEY);
    if (stored) {
      const { count, timestamp } = JSON.parse(stored);
      // Reset counter if outside the time window
      if (now - timestamp > RELOAD_WINDOW_MS) {
        localStorage.setItem(RELOAD_KEY, JSON.stringify({ count: 1, timestamp: now }));
        return true;
      }
      if (count >= MAX_RELOADS) {
        console.warn(`[WorkPlex] Max auto-reloads (${MAX_RELOADS}) reached - stopping to prevent loop`);
        return false;
      }
      localStorage.setItem(RELOAD_KEY, JSON.stringify({ count: count + 1, timestamp }));
      return true;
    }
    localStorage.setItem(RELOAD_KEY, JSON.stringify({ count: 1, timestamp: now }));
    return true;
  } catch {
    return true; // If localStorage fails, allow reload
  }
}

function scheduleReload(reason: string, delayMs = 3000) {
  if (!shouldAttemptReload()) {
    log('🚫 Auto-reload blocked (max attempts reached). User must manually refresh.');
    return;
  }
  log(`🔄 Scheduling auto-reload in ${delayMs / 1000}s: ${reason}`);
  setTimeout(() => {
    log('🔄 Executing auto-reload');
    window.location.reload();
  }, delayMs);
}

// Ensure we don't initialize before DOM is ready
function boot() {
  try {
    const rootElement = document.getElementById('root');

    if (!rootElement) {
      throw new Error('#root element not found in DOM. Check index.html structure.');
    }

    // Prevent double render (idempotent)
    if (rootElement.hasAttribute('data-react-rendered')) {
      log('⚠️ React already rendered - skipping');
      return;
    }

    // Verify critical DOM elements exist
    if (!document.getElementById('workplex-splash')) {
      log('⚠️ Splash screen not found (may have been removed by stale SW)');
    }

    log('🎨 Creating React root');
    const root: Root = createRoot(rootElement);

    log('🚀 Rendering App component');
    root.render(
      <React.StrictMode>
        <GlobalErrorBoundary>
          <App />
        </GlobalErrorBoundary>
      </React.StrictMode>
    );

    // Mark as rendered to prevent double-init
    rootElement.setAttribute('data-react-rendered', 'true');

    log('✅ React render successful - Removing splash');
    // Remove splash AFTER React has rendered (synchronous guarantee)
    removeSplash();

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log('❌ React render/initialization failed', error);

    // Check if this looks like a module import failure
    const isModuleError = errMsg.includes('Failed to resolve') ||
      errMsg.includes('Failed to load') ||
      errMsg.includes('Cannot read properties') ||
      errMsg.includes('is not defined') ||
      errMsg.includes('is not a function');

    if (isModuleError) {
      log('📦 Module load error detected - scheduling auto-reload');
      renderFallbackUI(error);
      scheduleReload('ModuleLoadError: ' + errMsg, 3000);
    } else {
      // Non-module error - show fallback without auto-reload
      renderFallbackUI(error);
    }
  }
}

// Handle DOM readiness
if (document.readyState === 'loading') {
  log('⏳ DOM still loading - waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  log('✅ DOM ready - proceeding');
  boot();
}

// ============================================================
// Service Worker Registration - Idempotent (No Infinite Loops)
// Only ONE registration point (removed duplicate from index.html)
// ============================================================
if ('serviceWorker' in navigator) {
  log('🔧 Registering Service Worker');

  // Guard: prevent multiple registrations in the same session
  const SW_REGISTERED_KEY = '__workplex_sw_registered';
  if ((window as any)[SW_REGISTERED_KEY]) {
    log('⚠️ SW already registered in this session - skipping');
  } else {
    (window as any)[SW_REGISTERED_KEY] = true;

    window.addEventListener('load', () => {
      // Delay SW registration to prioritize main app load
      setTimeout(async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          log('✅ Service Worker registered:', registration.scope);

          // SHARED reload guard — prevents double-reload when both updatefound
          // and controllerchange fire on the same SW update (P0-5 fix)
          let reloadTriggered = false;
          const triggerReload = (reason: string) => {
            if (reloadTriggered) {
              log(`⚠️ Reload already triggered — skipping (${reason})`);
              return;
            }
            reloadTriggered = true;
            log(`🔄 ${reason} — reloading`);
            window.location.reload();
          };

          // Idempotent update flow - only reload if a previous controller exists
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            log('🔄 New service worker installing');

            newWorker.addEventListener('statechange', () => {
              log('🔍 SW state changed:', newWorker.state);

              // Only reload if we have an active controller AND new worker is installed
              // This prevents infinite loops on first-ever install
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                triggerReload('New version available via updatefound');
              }
            });
          });

          // Handle controller change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            triggerReload('Controller changed');
          });

        } catch (error) {
          log('❌ Service Worker registration failed (non-critical):', error);
          // Don't block app - SW failure shouldn't crash the app
        }
      }, 2000); // 2s delay to prioritize main app load
    });
  }
} else {
  log('⚠️ Service Workers not supported in this browser');
}

log('🏁 Boot sequence complete');
