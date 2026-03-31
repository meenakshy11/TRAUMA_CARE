import React, { useEffect } from 'react';
import { useHospitalStore } from '@/store/hospitalStore';
import { useIncidentStore } from '@/store/incidentStore';
import { useAmbulanceStore } from '@/store/ambulanceStore';
import IncomingAmbulanceCard from './components/IncomingAmbulanceCard';
import { TriageColor } from '@/components/TriageColorBadge';

const HospitalDashboardPage: React.FC = () => {
  const { hospitals, isLoading, decrementIcuBed, fetchHospitals } = useHospitalStore();
  
  // To mock "incoming" data, we look at the global incident store and find ones that are moving.
  const allIncidents = useIncidentStore((s) => s.incidents);
  const ambulances = useAmbulanceStore((s) => s.ambulances);

  // In reality, this would filter by `receiving_hospital_id === currentUser.hospitalId`
  const incomingTraumas = allIncidents.filter((inc) => 
    inc.status === 'EN_ROUTE' || inc.status === 'TRANSPORTING' || inc.status === 'ON_SCENE'
  );

  useEffect(() => {
    fetchHospitals();
    // Hydrate siblings if not already loaded (for demo purposes)
    useIncidentStore.getState().loadIncidents();
    useAmbulanceStore.getState().loadAmbulances();
  }, [fetchHospitals]);

  // Assume the user is logged in as the primary mock hospital
  const myHospital = hospitals[0];

  if (isLoading || !myHospital) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
        Loading Hospital Infrastructure Data...
      </div>
    );
  }

  const { resources } = myHospital;

  const handleAcknowledge = (_id: string) => {
    // Simulate consuming an ICU bed as the trauma patient arrives
    decrementIcuBed(myHospital.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-primary)', padding: '24px', overflowY: 'auto' }}>
      
      {/* ─── Header ────────────────────────────────────────────── */}
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
          {myHospital.name}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Trauma Level: {myHospital.trauma_level.replace('_', ' ')} · {myHospital.district}
        </p>
      </header>

      {/* ─── Metrics Strip ─────────────────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        
        {/* ICU Card */}
        <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Available ICU Beds
          </h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '36px', fontWeight: 800, color: resources.icu_beds_available <= 2 ? 'var(--color-red)' : 'var(--color-success)' }}>
              {resources.icu_beds_available}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-disabled)', fontWeight: 600 }}>/ {resources.icu_beds_total} Total</span>
          </div>
          {resources.icu_beds_available <= 2 && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-red)', background: 'rgba(239, 68, 68, 0.15)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
              CRITICAL CAPACITY
            </div>
          )}
        </div>

        {/* Ventilators Card */}
        <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            Free Ventilators
          </h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {resources.ventilators_available}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--color-text-disabled)', fontWeight: 600 }}>/ {resources.ventilators_total} Total</span>
          </div>
        </div>

        {/* Operational Status Card */}
        <div style={{ background: 'var(--color-bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
            Facility Readiness
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Operating Theatre</span>
              <span style={{ color: resources.ot_available ? 'var(--color-success)' : 'var(--color-red)', fontWeight: 800 }}>
                {resources.ot_available ? 'STANDBY' : 'OCCUPIED'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Blood Bank</span>
              <span style={{ color: resources.blood_bank_available ? 'var(--color-success)' : 'var(--color-red)', fontWeight: 800 }}>
                {resources.blood_bank_available ? 'STOCKED' : 'DEPLETED'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pre-Arrival Triage List ────────────────────────────── */}
      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Incoming Pre-Arrival Alerts
          <span style={{ background: 'var(--color-red)', color: 'white', padding: '2px 8px', borderRadius: '999px', fontSize: '12px' }}>
            {incomingTraumas.length} Active
          </span>
        </h2>

        {incomingTraumas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)', color: 'var(--color-text-disabled)' }}>
            No declared inbound trauma transports at this time.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {incomingTraumas.map((incident) => {
              // Map severity to Triage Color
              const getTriageColor = (sev: string): TriageColor => {
                if (sev === 'CRITICAL') return 'RED';
                if (sev === 'SEVERE') return 'YELLOW';
                return 'GREEN';
              };

              // Identify assigned ambulance
              const amb = ambulances.find(a => a.id === incident.dispatched_ambulance_id);

              return (
                <IncomingAmbulanceCard
                  key={incident.id}
                  id={incident.id}
                  ambulanceNo={amb ? amb.registration_no : 'Pending Dispatch...'}
                  incidentNo={incident.incident_number}
                  triage={getTriageColor(incident.severity)}
                  eta={amb ? 8 : 15} // Mock ETA logic
                  patients={incident.patient_count}
                  status={incident.status}
                  onAcknowledge={handleAcknowledge}
                />
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default HospitalDashboardPage;
