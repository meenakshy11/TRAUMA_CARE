/**
 * MCIBadge.tsx
 * Flashing "MCI" badge shown on incidents flagged as Mass Casualty Incidents.
 */
import React from 'react';

interface MCIBadgeProps {
  patientCount?: number;
}

const MCIBadge: React.FC<MCIBadgeProps> = ({ patientCount }) => (
  <span className="mci-badge" aria-label={`MCI — ${patientCount ?? '?'} patients`} title="Mass Casualty Incident">
    <span className="mci-badge__dot" aria-hidden="true" />
    MCI
    {patientCount != null && (
      <span className="mci-badge__count">{patientCount}pts</span>
    )}
  </span>
);

export default MCIBadge;
