import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';

  return {
    plugins: [react(), tailwindcss()],

    define: {
      'import.meta.env.VITE_AES_SECRET': JSON.stringify(env.VITE_AES_SECRET || 'fallback-secret'),
      // Global shims to prevent "process is not defined" crashes
      'process.env': {},
      'global': 'window',
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      // Handle native .node files (TailwindCSS oxide, etc.)
      // Prevents "No loader is configured for .node files" crash
      dedupe: ['tailwindcss', '@tailwindcss/vite'],
    },

    ssr: {
      // Don't bundle native modules in SSR
      noExternal: ['@tailwindcss/oxide'],
    },

    // Performance optimizations
    esbuild: {
      // Minify in production
      minifyIdentifiers: isProd,
      minifySyntax: isProd,
      // Drop console.log in production
      drop: isProd ? ['console', 'debugger'] : [],
    },

    build: {
      // Enable minification
      minify: 'esbuild',
      // Smaller chunks for faster parsing
      chunkSizeWarningLimit: 1000,
      // Enable source maps in development only
      sourcemap: !isProd,
      // Target modern browsers for smaller bundles
      target: 'esnext',

      rollupOptions: {
        output: {
          // Aggressive code splitting for parallel loading
          manualChunks: {
            // Core React (loaded first)
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // Firebase (loaded on-demand)
            'firebase-app': ['firebase/app'],
            'firebase-auth': ['firebase/auth'],
            'firebase-firestore': ['firebase/firestore'],
            'firebase-storage': ['firebase/storage'],
            'firebase-functions': ['firebase/functions'],
            // UI libraries (lazy loaded)
            'framer-motion': ['framer-motion'],
            'lucide-icons': ['lucide-react'],
            'recharts': ['recharts'],
            // Utils (small, can be in main bundle)
          },
          // Optimize chunk names for caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        }
      },
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Enable Brotli compression for smaller files
      reportCompressedSize: false,
    },

    server: {
      // EXPLICIT host and port - prevents ambiguous binding
      host: '0.0.0.0',
      port: 2532,
      strictPort: true, // Fail if port is in use (don't silently switch to another)
      hmr: process.env.DISABLE_HMR !== 'true',
      // Pre-warm critical files
      warmup: {
        clientFiles: [
          './src/main.tsx',
          './src/App.tsx',
          './src/firebase.ts',
          './src/pages/LandingPage.tsx',
          './src/pages/AuthPage.tsx',
        ]
      },
      // Enable compression
      cors: true,
      // Force reload when dependency graph changes
      watch: {
        usePolling: true,
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      },
    },

    optimizeDeps: {
      // Pre-bundle critical dependencies for instant dev server
      // This prevents the "Logo then Black Screen" issue where React modules
      // are requested but not yet bundled by Vite's dependency optimizer
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/storage',
        'firebase/functions',
        'framer-motion',
        'lucide-react',
        'react-hot-toast',
        'qrcode.react',
        'recharts',
        'canvas-confetti',
        'crypto-js',
      ],
      // These packages use native .node files or have bundling conflicts
      // and MUST NOT be pre-bundled by esbuild
      exclude: [
        '@tailwindcss/oxide',
        '@tailwindcss/oxide-win32-x64-msvc',
      ],
      // Force re-optimization on server restart to clear stale caches
      force: true,
      // Use esbuild for faster pre-bundling
      esbuildOptions: {
        target: 'esnext',
      },
    },

    // Preview server optimizations
    preview: {
      port: 4173,
      cors: true,
    },
  };
});
