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

const STATUS_MAPPING: Record<string, { badgeClass: string; isPulse: boolean }> = {
  REPORTED:     { badgeClass: 'badge-warning', isPulse: false },
  DISPATCHED:   { badgeClass: 'badge-info', isPulse: false },
  ON_SCENE:     { badgeClass: 'badge-cyan', isPulse: false },
  TRANSPORTING: { badgeClass: 'badge-info', isPulse: false },
  AT_HOSPITAL:  { badgeClass: 'badge-cyan', isPulse: false },
  RESOLVED:     { badgeClass: 'badge-success', isPulse: false },
  AVAILABLE:    { badgeClass: 'badge-success', isPulse: false },
  FALSE_ALARM:  { badgeClass: 'badge-muted', isPulse: false },
  MAINTENANCE:  { badgeClass: 'badge-warning', isPulse: false },
  OFF_DUTY:     { badgeClass: 'badge-muted', isPulse: false },
  CRITICAL:     { badgeClass: 'badge-critical', isPulse: true },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', pulse }) => {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');
  const mapping = STATUS_MAPPING[normalized] || { badgeClass: 'badge-muted', isPulse: false };
  const showPulse = pulse !== undefined ? pulse : mapping.isPulse;

  return (
    <span
      className={`badge ${mapping.badgeClass} ${className}`}
      aria-label={`Status: ${status.replace(/_/g, ' ')}`}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          boxShadow: showPulse ? 'var(--shadow-elevated)' : 'none',
          animation: showPulse ? 'pulse-ring 2s ease-in-out infinite' : 'none',
        }}
        aria-hidden="true"
      />
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
