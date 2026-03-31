import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables for the current mode so we can use them in this config
  const env = loadEnv(mode, process.cwd(), '');

  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8000';

  return {
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          icon: true,
        },
      }),
    ],

    // ─── Path Aliases ───────────────────────────────────────────────────────────
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@api': resolve(__dirname, './src/api'),
        '@components': resolve(__dirname, './src/components'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@pages': resolve(__dirname, './src/pages'),
        '@store': resolve(__dirname, './src/store'),
        '@styles': resolve(__dirname, './src/styles'),
        '@types': resolve(__dirname, './src/types'),
        '@utils': resolve(__dirname, './src/utils'),
        '@trauma/shared': resolve(__dirname, '../../packages/shared/src'),
      },
    },

    // ─── Dev Server ─────────────────────────────────────────────────────────────
    server: {
      port: 3000,
      strictPort: false,
      host: true, // expose on LAN for mobile testing
      open: false,
      proxy: {
        // REST API proxy
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // keep /api prefix (FastAPI is mounted at /api)
        },
        // WebSocket proxy
        '/ws': {
          target: apiBaseUrl.replace(/^http/, 'ws'),
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // ─── Preview Server (production build preview) ───────────────────────────
    preview: {
      port: 4173,
      host: true,
    },

    // ─── Build ──────────────────────────────────────────────────────────────────
    build: {
      target: 'esnext',
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          // Manual chunk splitting to keep bundles lean and cache-friendly
          manualChunks: {
            // React core
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // State management
            'vendor-state': ['zustand', 'immer', '@tanstack/react-query'],
            // Charts & data viz
            'vendor-charts': ['recharts'],
            // Mapping
            'vendor-map': ['leaflet', 'react-leaflet'],
            // Form handling
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            // Utilities
            'vendor-utils': ['axios', 'date-fns', 'jwt-decode', 'clsx'],
          },
        },
      },
      // Warn if any chunk exceeds 600 KB before compression
      chunkSizeWarningLimit: 600,
    },

    // ─── CSS ────────────────────────────────────────────────────────────────────
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
      devSourcemap: true,
    },

    // ─── Test (Vitest) ──────────────────────────────────────────────────────────
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/types/**',
        ],
      },
    },

    // ─── Environment Variables (type-safe VITE_ prefix) ─────────────────────
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  };
});
