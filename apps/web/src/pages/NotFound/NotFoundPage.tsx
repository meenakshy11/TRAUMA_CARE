/**
 * NotFoundPage.tsx — 404 page shown for unmatched routes.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/App';

const NotFoundPage: React.FC = () => (
  <div
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '16px',
      background: 'var(--color-bg-primary)', textAlign: 'center', padding: '40px',
    }}
  >
    <span style={{ fontSize: '64px' }}>🔍</span>
    <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
      404 — Page Not Found
    </h1>
    <p style={{ color: 'var(--color-text-secondary)', maxWidth: '380px' }}>
      The page you're looking for doesn't exist or you don't have permission to view it.
    </p>
    <Link
      to={ROUTES.COMMAND_CENTER}
      style={{
        padding: '10px 20px', background: 'rgba(239,68,68,0.15)',
        border: '1px solid #ef4444', borderRadius: '8px',
        color: '#fca5a5', fontWeight: 600, fontSize: '14px',
      }}
    >
      ← Return to Dashboard
    </Link>
  </div>
);

export default NotFoundPage;
