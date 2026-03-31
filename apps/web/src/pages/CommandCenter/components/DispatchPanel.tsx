/**
 * DispatchPanel.tsx
 * Modal/slide-over for reviewing and confirming a dispatch recommendation
 * for a selected incident.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEMO_HOSPITALS } from '@/api/demo-fixtures';
import { useIncidentStore } from '@/store/incidentStore';
import { useAmbulanceStore } from '@/store/ambulanceStore';

interface DispatchPanelProps {
  incidentId: string | null;
  onClose: () => void;
}

const DispatchPanel: React.FC<DispatchPanelProps> = ({ incidentId, onClose }) => {
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading]     = useState(false);

  const incidents = useIncidentStore((s) => s.incidents);
  const updateIncidentStatus = useIncidentStore((s) => s.updateStatus);
  
  const ambulances = useAmbulanceStore((s) => s.ambulances);
  const updateAmbulanceStatus = useAmbulanceStore((s) => s.updateAmbulanceStatus);

  if (!incidentId) return null;

  const incident  = incidents.find((i) => i.id === incidentId) || null;
  const ambulance = ambulances.find((a) => a.status === 'AVAILABLE') || null;
  const hospital  = isDemo ? DEMO_HOSPITALS[0] : null;

  if (!incident) return null;

  const handleConfirm = async () => {
    if (!ambulance) return;
    setLoading(true);
    
    // Trigger store updates (which syncs with the API in the background)
    await updateIncidentStatus(incidentId, 'DISPATCHED');
    updateAmbulanceStatus(ambulance.id, 'DISPATCHED');
    
    setLoading(false);
    setConfirmed(true);
    setTimeout(onClose, 1500);
  };

  return (
    <>
      <div className="dispatch-backdrop" onClick={onClose} aria-hidden="true" />
      <aside
        className="dispatch-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Dispatch recommendation"
      >
        {/* Header */}
        <div className="dispatch-panel__header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="dispatch-panel__title">Dispatch Recommendation</h2>
              <button 
                onClick={() => navigate(`/incidents/${incident.id}`)}
                style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Deep-Dive ↗
              </button>
            </div>
            <p className="dispatch-panel__subtitle">{incident.incident_number}</p>
          </div>
          <button className="topbar__icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="dispatch-panel__body">
          {/* Incident summary */}
          <div className="dispatch-section">
            <h3 className="dispatch-section__title">Incident</h3>
            <p className="dispatch-detail">{incident.address_text}</p>
            <p className="dispatch-detail dispatch-detail--dim">{incident.description}</p>
            <div className="dispatch-tags">
              <span className="dispatch-tag dispatch-tag--red">{incident.severity}</span>
              <span className="dispatch-tag">{incident.accident_type.replace('_', ' ')}</span>
              <span className="dispatch-tag">👤 {incident.patient_count} patients</span>
            </div>
          </div>

          {/* Recommended ambulance */}
          {ambulance ? (
            <div className="dispatch-section">
              <h3 className="dispatch-section__title">Closest Available Ambulance</h3>
              <div className="dispatch-recommendation">
                <div className="dispatch-rec__icon" aria-hidden="true">🚑</div>
                <div className="dispatch-rec__info">
                  <span className="dispatch-rec__reg">{ambulance.registration_no}</span>
                  <span className="dispatch-rec__meta">
                    {ambulance.ambulance_type} · {ambulance.district}
                  </span>
                  <span className="dispatch-rec__eta">ETA ~6 min · 4.2 km</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="dispatch-section">
              <p className="dispatch-detail dispatch-detail--warn">No available ambulances nearby</p>
            </div>
          )}

          {/* Recommended hospital */}
          {hospital && (
            <div className="dispatch-section">
              <h3 className="dispatch-section__title">Suggested Receiving Hospital</h3>
              <div className="dispatch-recommendation">
                <div className="dispatch-rec__icon" aria-hidden="true">🏥</div>
                <div className="dispatch-rec__info">
                  <span className="dispatch-rec__reg">{hospital.name}</span>
                  <span className="dispatch-rec__meta">
                    Trauma {hospital.trauma_level.replace('_', ' ')} · {hospital.district}
                  </span>
                  <span className="dispatch-rec__eta">
                    ICU: {hospital.resources.icu_beds_available} beds · OT: {hospital.resources.ot_available ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="dispatch-panel__footer">
          <button className="dispatch-btn dispatch-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="dispatch-btn dispatch-btn--primary"
            onClick={handleConfirm}
            disabled={loading || confirmed || !ambulance}
          >
            {confirmed ? (
              <>✓ Dispatched</>
            ) : loading ? (
              <><span className="btn-spinner" aria-hidden="true" /> Confirming…</>
            ) : (
              'Confirm Dispatch'
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default DispatchPanel;
