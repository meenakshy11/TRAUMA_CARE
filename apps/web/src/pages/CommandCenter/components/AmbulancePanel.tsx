/**
 * AmbulancePanel.tsx
 * Fleet status strip showing all ambulances with their real-time status.
 */
import React from 'react';
import { useAmbulanceStore } from '@/store/ambulanceStore';
import StatusBadge from '@/components/StatusBadge';

const TYPE_BADGES: Record<string, string> = {
  ALS:  '#3b82f6',
  BLS:  '#22c55e',
  NICU: '#8b5cf6',
  MFR:  '#f59e0b',
};

function lastSeenLabel(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}h`;
}

const AmbulancePanel: React.FC = () => {
  const ambulances = useAmbulanceStore((s) => s.ambulances);

  const available  = ambulances.filter((a) => a.status === 'AVAILABLE').length;
  const deployed   = ambulances.filter((a) => ['DISPATCHED','ON_SCENE','TRANSPORTING'].includes(a.status)).length;

  return (
    <aside className="ambulance-panel" aria-label="Fleet status">
      <div className="panel-header">
        <h2 className="panel-title">
          Fleet
          <span className="panel-badge panel-badge--green">{available} free</span>
        </h2>
        <span className="panel-subtitle">{deployed} deployed · {ambulances.length} total</span>
      </div>

      <ul className="ambulance-list" role="list">
        {ambulances.map((amb) => {
          const typeColor = TYPE_BADGES[amb.ambulance_type] ?? '#6b7280';

          return (
            <li key={amb.id} className="ambulance-card">
              {/* Left: type + reg */}
              <div className="ambulance-card__left">
                <span
                  className="ambulance-card__type"
                  style={{ background: `${typeColor}22`, color: typeColor,
                    border: `1px solid ${typeColor}44` }}
                >
                  {amb.ambulance_type}
                </span>
                <span className="ambulance-card__reg">{amb.registration_no}</span>
                <span className="ambulance-card__district">{amb.district}</span>
              </div>

              {/* Right: status + last ping */}
              <div className="ambulance-card__right">
                <StatusBadge 
                  status={amb.status} 
                  pulse={amb.status === 'AVAILABLE'} 
                />
                <span className="ambulance-card__ping" title={`Last GPS ping: ${amb.last_location_at}`}>
                  {lastSeenLabel(amb.last_location_at)} ago
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default AmbulancePanel;
