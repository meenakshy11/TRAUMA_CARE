/**
 * IncidentPanel.tsx
 * Left sidebar panel listing active incidents with severity, status, and elapsed time.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIncidentStore } from '@/store/incidentStore';
import MCIBadge from './MCIBadge';
import StatusBadge from '@/components/StatusBadge';
import TriageColorBadge from '@/components/TriageColorBadge';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  SEVERE:   '#f97316',
  MODERATE: '#f59e0b',
  MINOR:    '#22c55e',
};

const TRIAGE_MAP: Record<string, 'RED' | 'YELLOW' | 'GREEN' | 'BLACK'> = {
  CRITICAL: 'RED',
  SEVERE:   'YELLOW',
  MODERATE: 'GREEN',
  MINOR:    'GREEN',
};

const ACCIDENT_ICONS: Record<string, string> = {
  ROAD_ACCIDENT: '🚗',
  FALL:          '🏗️',
  CARDIAC:       '❤️',
  BURNS:         '🔥',
  DROWNING:      '💧',
  ASSAULT:       '⚠️',
  INDUSTRIAL:    '🏭',
  OTHER:         '🚨',
};

function elapsedLabel(isoDate: string): string {
  const mins = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

const ACTIVE_STATUSES = ['REPORTED', 'DISPATCH_PENDING', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'PATIENT_LOADED', 'TRANSPORTING'];

interface IncidentPanelProps {
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

const IncidentPanel: React.FC<IncidentPanelProps> = ({ selectedId, onSelect }) => {
  const incidents = useIncidentStore((state) => state.incidents);
  const active   = incidents.filter((i) => ACTIVE_STATUSES.includes(i.status));

  const resolved = incidents.filter((i) => !ACTIVE_STATUSES.includes(i.status));

  const [tab, setTab] = useState<'active' | 'resolved'>('active');
  const shown = tab === 'active' ? active : resolved;

  return (
    <aside className="incident-panel" aria-label="Incidents">
      {/* Header */}
      <div className="panel-header">
        <h2 className="panel-title">
          Incidents
          {active.length > 0 && (
            <span className="panel-badge panel-badge--red">{active.length}</span>
          )}
        </h2>
        <Link to="#" className="panel-view-all">View all →</Link>
      </div>

      {/* Tabs */}
      <div className="panel-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'active'}
          className={`panel-tab ${tab === 'active' ? 'panel-tab--active' : ''}`}
          onClick={() => setTab('active')}
          id="tab-active"
        >
          Active <span className="panel-tab-count">{active.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === 'resolved'}
          className={`panel-tab ${tab === 'resolved' ? 'panel-tab--active' : ''}`}
          onClick={() => setTab('resolved')}
          id="tab-resolved"
        >
          Recent <span className="panel-tab-count">{resolved.length}</span>
        </button>
      </div>

      {/* List */}
      <ul className="incident-list" role="listbox" aria-label="Incident list">
        {shown.length === 0 && (
          <li className="panel-empty">No {tab} incidents</li>
        )}
        {shown.map((inc) => {
          const sevColor = SEVERITY_COLORS[inc.severity] ?? '#6b7280';
          const isSelected = selectedId === inc.id;

          return (
            <li key={inc.id} role="option" aria-selected={isSelected}>
              <button
                className={`incident-item ${isSelected ? 'incident-item--selected' : ''}`}
                onClick={() => onSelect(inc.id)}
                style={{ borderLeftColor: isSelected ? sevColor : 'transparent' }}
              >
                {/* Top row */}
                <div className="incident-item__top">
                  <span className="incident-item__icon" aria-hidden="true">
                    {ACCIDENT_ICONS[inc.accident_type] ?? '🚨'}
                  </span>
                  <span className="incident-item__number">{inc.incident_number}</span>
                  <div style={{ marginLeft: 'auto' }}>
                    <TriageColorBadge color={TRIAGE_MAP[inc.severity] ?? 'GREEN'} />
                  </div>
                  {inc.is_mci && <MCIBadge patientCount={inc.patient_count} />}
                </div>

                {/* Address */}
                <p className="incident-item__address">{inc.address_text}</p>

                {/* Bottom row */}
                <div className="incident-item__bottom">
                  <StatusBadge status={inc.status} />
                  <span className="incident-item__patients" style={{ marginLeft: 'auto' }}>
                    👤 {inc.patient_count}
                  </span>
                  <span className="incident-item__time">
                    {elapsedLabel(inc.created_at)}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default IncidentPanel;
