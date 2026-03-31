/**
 * HospitalPanel.tsx
 * Horizontal strip at the bottom showing hospital ICU and ED capacity.
 */
import React, { useEffect } from 'react';
import { useHospitalStore } from '@/store/hospitalStore';

function capPct(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}

function capacityColor(pct: number): string {
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f59e0b';
  return '#22c55e';
}

const LEVEL_LABELS: Record<string, string> = {
  LEVEL_1:   'L1',
  LEVEL_2:   'L2',
  LEVEL_3:   'L3',
  COMMUNITY: 'CMY',
};

const HospitalPanel: React.FC = () => {
  const { hospitals, fetchHospitals, isLoading } = useHospitalStore();

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  if (isLoading && hospitals.length === 0) {
    return (
      <section className="hospital-panel" aria-label="Hospital capacity">
        <div className="hospital-panel__header">
          <h2 className="panel-title">Loading Hospital Data...</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="hospital-panel" aria-label="Hospital capacity">
      <div className="hospital-panel__header">
        <h2 className="panel-title">Hospital Capacity</h2>
        <span className="panel-subtitle">{hospitals.length} trauma centres</span>
      </div>

      <div className="hospital-strip">
        {hospitals.map((h) => {
          const icuPct = capPct(
            h.resources.icu_beds_total - h.resources.icu_beds_available,
            h.resources.icu_beds_total,
          );
          const edPct = capPct(h.resources.ed_capacity_current, h.resources.ed_capacity_total);
          const icuColor = capacityColor(icuPct);
          const edColor  = capacityColor(edPct);

          return (
            <article key={h.id} className="hospital-card" aria-label={h.name}>
              {/* Name + level */}
              <div className="hospital-card__header">
                <span className="hospital-card__level">{LEVEL_LABELS[h.trauma_level] ?? h.trauma_level}</span>
                <span className="hospital-card__name">{h.name}</span>
              </div>

              {/* ICU bar */}
              <div className="hospital-card__metric">
                <div className="hospital-card__metric-row">
                  <span className="hospital-card__metric-label">ICU</span>
                  <span className="hospital-card__metric-value" style={{ color: icuColor }}>
                    {h.resources.icu_beds_available}/{h.resources.icu_beds_total}
                  </span>
                </div>
                <div className="hospital-card__bar" aria-label={`ICU ${icuPct}% occupied`}>
                  <div
                    className="hospital-card__bar-fill"
                    style={{ width: `${icuPct}%`, background: icuColor }}
                  />
                </div>
              </div>

              {/* ED bar */}
              <div className="hospital-card__metric">
                <div className="hospital-card__metric-row">
                  <span className="hospital-card__metric-label">ED</span>
                  <span className="hospital-card__metric-value" style={{ color: edColor }}>
                    {h.resources.ed_capacity_current}/{h.resources.ed_capacity_total}
                  </span>
                </div>
                <div className="hospital-card__bar" aria-label={`ED ${edPct}% occupied`}>
                  <div
                    className="hospital-card__bar-fill"
                    style={{ width: `${edPct}%`, background: edColor }}
                  />
                </div>
              </div>

              {/* Status indicators */}
              <div className="hospital-card__flags">
                <span
                  className={`hospital-flag ${h.resources.ot_available ? 'hospital-flag--on' : 'hospital-flag--off'}`}
                  title={`OT ${h.resources.ot_available ? 'available' : 'unavailable'}`}
                >
                  OT
                </span>
                <span
                  className={`hospital-flag ${h.resources.blood_bank_available ? 'hospital-flag--on' : 'hospital-flag--off'}`}
                  title={`Blood bank ${h.resources.blood_bank_available ? 'available' : 'unavailable'}`}
                >
                  BB
                </span>
                <span
                  className={`hospital-flag ${h.resources.specialist_on_duty ? 'hospital-flag--on' : 'hospital-flag--off'}`}
                  title={`Specialist ${h.resources.specialist_on_duty ? 'on duty' : 'off duty'}`}
                >
                  SP
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default HospitalPanel;
