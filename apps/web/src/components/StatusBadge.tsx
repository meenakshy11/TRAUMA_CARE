import React from 'react';

export type StatusType = 
  | 'REPORTED' 
  | 'DISPATCHED' 
  | 'ON_SCENE' 
  | 'TRANSPORTING' 
  | 'AT_HOSPITAL' 
  | 'RESOLVED' 
  | 'FALSE_ALARM'
  | 'AVAILABLE'
  | 'MAINTENANCE'
  | 'OFF_DUTY';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  pulse?: boolean;
}

const STATUS_VARIANTS: Record<string, { bg: string; color: string; dot: string }> = {
  REPORTED:     { bg: 'rgba(239, 68, 68, 0.15)',  color: '#fca5a5', dot: '#ef4444' },     // Red
  DISPATCHED:   { bg: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', dot: '#3b82f6' },     // Blue
  ON_SCENE:     { bg: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', dot: '#f59e0b' },     // Orange
  TRANSPORTING: { bg: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', dot: '#8b5cf6' },     // Purple
  AT_HOSPITAL:  { bg: 'rgba(6, 182, 212, 0.15)',  color: '#67e8f9', dot: '#06b6d4' },      // Cyan
  RESOLVED:     { bg: 'rgba(34, 197, 94, 0.15)',  color: '#86efac', dot: '#22c55e' },      // Green
  AVAILABLE:    { bg: 'rgba(34, 197, 94, 0.15)',  color: '#86efac', dot: '#22c55e' },      // Green
  FALSE_ALARM:  { bg: 'rgba(107, 114, 128, 0.15)',color: '#d1d5db', dot: '#9ca3af' },    // Gray
  MAINTENANCE:  { bg: 'rgba(107, 114, 128, 0.15)',color: '#d1d5db', dot: '#9ca3af' },
  OFF_DUTY:     { bg: 'rgba(107, 114, 128, 0.15)',color: '#d1d5db', dot: '#9ca3af' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', pulse = false }) => {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');
  const variant = STATUS_VARIANTS[normalized] ?? STATUS_VARIANTS.FALSE_ALARM;

  return (
    <span
      className={`status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: '9999px',
        background: variant.bg,
        border: `1px solid ${variant.bg.replace('0.15', '0.3')}`,
        color: variant.color,
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
      aria-label={`Status: ${status.replace('_', ' ')}`}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: variant.dot,
          boxShadow: `0 0 5px ${variant.dot}`,
          animation: pulse ? 'live-pulse 2s ease-in-out infinite' : 'none',
        }}
        aria-hidden="true"
      />
      {status.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
