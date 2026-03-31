import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import App from './App';

// ─── Global Styles ────────────────────────────────────────────────────────────
import './styles/globals.css';
import './styles/theme.css';
import './styles/leaflet-overrides.css';

// ─── React Query Client ───────────────────────────────────────────────────────
// Shared QueryClient instance. Configured with sensible defaults:
//  • 3x automatic retries with exponential back-off (skipped for 4xx errors)
//  • Stale time of 30 s so fresh data isn't re-fetched on every focus
//  • Error handling delegated to individual query call sites via onError
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,             // 30 seconds until data is considered stale
      gcTime: 5 * 60 * 1_000,        // 5 minutes garbage collection time
      refetchOnWindowFocus: true,
      retry: (failureCount, error: unknown) => {
        // Do not retry on 401 / 403 / 404 — those are definitive
        const status = (error as { status?: number })?.status;
        if (status && [401, 403, 404].includes(status)) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) =>
        Math.min(1_000 * 2 ** attemptIndex, 30_000),
    },
    mutations: {
      retry: false,
    },
  },
});

// ─── Root Element Guard ───────────────────────────────────────────────────────
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    '[main.tsx] Cannot find root element #root. ' +
      'Ensure public/index.html contains <div id="root"></div>.',
  );
}

// ─── Application Bootstrap ────────────────────────────────────────────────────
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/*
     * BrowserRouter → provides URL-based routing via HTML5 History API.
     * Place at the very top so every descendant can call useNavigate / useLocation.
     */}
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {/*
       * QueryClientProvider → makes the queryClient available everywhere
       * via useQuery / useMutation / useQueryClient hooks.
       */}
      <QueryClientProvider client={queryClient}>
        {/* Core application with all routes */}
        <App />

        {/*
         * Toaster → global notification system for success / error toasts.
         * Positioned top-right to avoid overlapping with map controls.
         * Duration is set lower than default so alerts don't obstruct the UI.
         */}
        <Toaster
          position="top-right"
          gutter={12}
          containerStyle={{ top: 16, right: 16 }}
          toastOptions={{
            duration: 4_000,
            style: {
              background: '#1e293b',   // slate-800 — matches dark theme
              color: '#f1f5f9',         // slate-100
              border: '1px solid #334155', // slate-700
              borderRadius: '10px',
              fontSize: '14px',
              maxWidth: '420px',
              padding: '12px 16px',
              boxShadow:
                '0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.2)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#1e293b' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
              duration: 6_000,
            },
          }}
        />

        {/* React Query devtools (only visible in development mode) */}
        {import.meta.env.DEV && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        )}
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
