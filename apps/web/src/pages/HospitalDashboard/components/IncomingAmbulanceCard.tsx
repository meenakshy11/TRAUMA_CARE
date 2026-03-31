import React from 'react';
import TriageColorBadge, { TriageColor } from '@/components/TriageColorBadge';
import StatusBadge from '@/components/StatusBadge';

export interface IncomingAmbulanceProps {
  id: string;
  ambulanceNo: string;
  incidentNo: string;
  triage: TriageColor;
  eta: number; // in minutes
  patients: number;
  status: string;
  onAcknowledge: (id: string) => void;
}

const IncomingAmbulanceCard: React.FC<IncomingAmbulanceProps> = ({
  id,
  ambulanceNo,
  incidentNo,
  triage,
  eta,
  patients,
  status,
  onAcknowledge,
}) => {
  // Glow effect changes based on triage severity
  const getGlowColor = () => {
    switch (triage) {
      case 'RED': return 'rgba(239, 68, 68, 0.4)';
      case 'YELLOW': return 'rgba(250, 204, 21, 0.4)';
      case 'GREEN': return 'rgba(34, 197, 94, 0.4)';
      case 'BLACK': return 'rgba(31, 41, 55, 0.6)';
      default: return 'transparent';
    }
  };

  const isCritical = triage === 'RED' || triage === 'YELLOW';

  return (
    <article
      style={{
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: isCritical ? `0 0 15px ${getGlowColor()}` : 'var(--shadow-md)',
        transition: 'transform 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Alert Top Strip */}
      {isCritical && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '4px',
          background: `var(--theme-triage-${triage.toLowerCase()})`
        }} />
      )}

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
            {ambulanceNo}
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {incidentNo}
          </p>
        </div>
        <TriageColorBadge color={triage} />
      </header>

      {/* Meta Data */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-primary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-text-disabled)', textTransform: 'uppercase' }}>ETA</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: eta <= 10 ? 'var(--color-red)' : 'var(--color-text-primary)' }}>
            {eta} <span style={{ fontSize: '12px', fontWeight: 600 }}>min</span>
          </div>
        </div>
        <div style={{ width: '1px', height: '30px', background: 'var(--color-border)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-text-disabled)', textTransform: 'uppercase' }}>Patients</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {patients}
          </div>
        </div>
        <div style={{ width: '1px', height: '30px', background: 'var(--color-border)' }} />
        <div style={{ textAlign: 'center', paddingRight: '10px' }}>
          <div style={{ fontSize: '10px', color: 'var(--color-text-disabled)', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={() => onAcknowledge(id)}
        style={{
          width: '100%',
          padding: '10px',
          background: isCritical ? 'var(--theme-triage-red)' : 'var(--color-info)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: '4px'
        }}
      >
        Acknowledge & Sync Beds
      </button>
    </article>
  );
};

export default IncomingAmbulanceCard;
