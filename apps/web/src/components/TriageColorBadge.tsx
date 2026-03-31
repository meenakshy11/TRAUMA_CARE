import React from 'react';

export type TriageColor = 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';

interface TriageColorBadgeProps {
  color: TriageColor | string;
  className?: string;
  count?: number; // Optional count to show like a pill
}

const TRIAGE_VARIANTS: Record<string, { bg: string; text: string; label: string }> = {
  RED:    { bg: '#ef4444', text: '#ffffff', label: 'T1 - IMMED' },
  YELLOW: { bg: '#facc15', text: '#854d0e', label: 'T2 - DELAY' },
  GREEN:  { bg: '#22c55e', text: '#ffffff', label: 'T3 - MINOR' },
  BLACK:  { bg: '#1f2937', text: '#9ca3af', label: 'T4 - DECD'  },
};

const TriageColorBadge: React.FC<TriageColorBadgeProps> = ({ color, className = '', count }) => {
  const normalized = color.toUpperCase();
  const variant = TRIAGE_VARIANTS[normalized];

  if (!variant) return null;

  return (
    <span
      className={`triage-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: variant.bg,
        color: variant.text,
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        boxShadow: `0 2px 4px -1px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
        flexShrink: 0,
      }}
      title={`Triage Category: ${normalized}`}
      aria-label={`Triage Category: ${normalized}`}
    >
      {variant.label}
      {count !== undefined && (
        <span
          style={{
            background: 'rgba(0,0,0,0.15)',
            padding: '0 4px',
            borderRadius: '999px',
            marginLeft: '4px',
          }}
        >
          {count}
        </span>
      )}
    </span>
  );
};

export default TriageColorBadge;
