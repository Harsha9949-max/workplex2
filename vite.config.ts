import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_AES_SECRET': JSON.stringify(env.VITE_AES_SECRET || 'fallback-secret'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      warmup: {
        clientFiles: ['./src/main.tsx', './src/App.tsx', './src/firebase.ts']
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/functions', 'framer-motion', 'lucide-react'],
      exclude: ['crypto-js']
    },
  };
});
