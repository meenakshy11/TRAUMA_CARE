import React from 'react';

export type TriageColor = 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';

interface TriageColorBadgeProps {
  color: TriageColor | string;
  className?: string;
  showIcon?: boolean;
}

const TRIAGE_MAPPING: Record<string, { label: string; badgeClass: string; icon: string }> = {
  RED:    { label: 'Immediate', badgeClass: 'triage-red',    icon: '🚨' },
  YELLOW: { label: 'Delayed',   badgeClass: 'triage-yellow', icon: '⏳' },
  GREEN:  { label: 'Minor',     badgeClass: 'triage-green',  icon: '🩹' },
  BLACK:  { label: 'Deceased',  badgeClass: 'triage-black',  icon: '✝' },
};

const TriageColorBadge: React.FC<TriageColorBadgeProps> = ({ 
  color, 
  className = '',
  showIcon = true
}) => {
  const norm = color?.toUpperCase() || 'GREEN';
  const mapping = TRIAGE_MAPPING[norm] || TRIAGE_MAPPING.GREEN;

  return (
    <span
      className={`badge ${mapping.badgeClass} ${className}`}
      title={`Triage Protocol: ${mapping.label}`}
    >
      {showIcon && <span style={{ marginRight: 2 }}>{mapping.icon}</span>}
      {norm}
    </span>
  );
};

export default TriageColorBadge;
