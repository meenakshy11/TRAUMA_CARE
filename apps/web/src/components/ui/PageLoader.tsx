/**
 * PageLoader.tsx — Full-screen suspense fallback spinner.
 */
import React from 'react';

const PageLoader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--color-bg-primary, #0f172a)',
      flexDirection: 'column',
      gap: '16px',
    }}
    aria-label="Loading page"
    role="status"
  >
    <div className="hydration-spinner" />
    <span style={{ fontSize: '13px', color: 'var(--color-text-disabled, #475569)' }}>
      Loading…
    </span>
  </div>
);

export default PageLoader;
