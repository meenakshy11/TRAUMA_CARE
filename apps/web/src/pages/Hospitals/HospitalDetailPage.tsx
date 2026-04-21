import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { hospitalsApi, bloodStockApi } from '../../api/index'

const HospitalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [hospital, setHospital] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bloodStock, setBloodStock] = useState<any[]>([])

  useEffect(() => {
    if (!id) return
    hospitalsApi.getOne(id)
      .then(r => {
        setHospital(r.data)
        bloodStockApi.getByHospital(id).then(b => setBloodStock(Array.isArray(b.data) ? b.data : [])).catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16, color: 'var(--color-text-muted)' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--color-text-muted)', borderTopColor: 'var(--color-accent-blue)' }} />
        <div style={{ fontSize: 14 }}>Loading hospital...</div>
      </div>
    )
  }

  if (!hospital) {
    return (
      <div style={{ textAlign: 'center', padding: 64, color: 'var(--color-text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🏥</div>
        <div style={{ fontSize: 16, color: 'var(--color-text-primary)' }}>Hospital not found</div>
        <button onClick={() => navigate('/hospitals')} className="btn btn-secondary" style={{ marginTop: 16 }}>← Back to Hospitals</button>
      </div>
    )
  }

  const res = hospital.resources || {}

  const resourceCards = [
    { label: 'ICU Beds',     value: `${res.icu_beds_available ?? 0} / ${res.icu_beds_total ?? 0}`,   color: res.icu_beds_available > 0 ? 'var(--color-success)' : 'var(--color-danger)' },
    { label: 'Ventilators',  value: res.ventilators_available ?? '—',                                  color: 'var(--color-accent-blue)' },
    { label: 'OT Status',    value: res.ot_available ? 'Ready' : 'Busy',                              color: res.ot_available ? 'var(--color-success)' : 'var(--color-warning)' },
    { label: 'Blood Bank',   value: res.blood_bank_available ? 'Available' : 'Critical',              color: res.blood_bank_available ? 'var(--color-success)' : 'var(--color-danger)' },
    { label: 'ED Capacity',  value: `${res.ed_capacity_current ?? 0} / ${res.ed_capacity_total ?? 0}`, color: 'var(--color-warning)' },
    { label: 'Trauma Bays',  value: res.trauma_bays ?? '—',                                            color: 'var(--color-accent-cyan)' },
  ]

  const infoRows = [
    ['Trauma Level',   hospital.trauma_level?.replace(/_/g, ' ')],
    ['District',       hospital.district],
    ['Address',        hospital.address],
    ['Contact',        hospital.contact_number],
    ['Type',           hospital.is_government ? 'Government' : 'Private'],
    ['KASB Empanelled', hospital.is_kasb_empaneled ? '✅ Yes' : '❌ No'],
    ['Coordinates',    hospital.latitude ? `${hospital.latitude.toFixed(5)}, ${hospital.longitude.toFixed(5)}` : '—'],
  ]

  return (
    <div>
      {/* Back + Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/hospitals')}
          style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '6px 12px', fontSize: 13, transition: 'all var(--transition-fast)' }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>{hospital.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {hospital.district} · {hospital.trauma_level?.replace(/_/g, ' ')}
          </div>
        </div>
        <span className={`badge ${res.icu_beds_available > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 13, padding: '6px 14px' }}>
          {res.icu_beds_available > 0 ? '🟢 ACCEPTING' : '🔴 FULL'}
        </span>
      </div>

      {/* Resource KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 24 }}>
        {resourceCards.map(c => (
          <div key={c.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              {c.label}
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1 }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Hospital Info */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-tertiary)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Hospital Information
            </span>
          </div>
          <div style={{ padding: '12px 20px' }}>
            {infoRows.map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right', maxWidth: '55%' }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trauma Specializations */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-tertiary)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Specializations & Protocols
            </span>
          </div>
          <div style={{ padding: '20px' }}>
            {(hospital.specializations || ['Emergency Medicine', 'Trauma Surgery', 'Neurosurgery', 'Cardiology', 'Orthopaedics']).map((s: string) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{s}</span>
              </div>
            ))}

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
                Operational Status
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: '24h Emergency', value: true },
                  { label: 'Helipad',        value: hospital.has_helipad ?? false },
                  { label: 'MCI Protocol',   value: hospital.trauma_level === 'LEVEL_1' },
                  { label: 'Burn Unit',      value: false },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--color-bg-tertiary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.value ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                      {item.value ? 'Yes' : 'No'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HospitalDetailPage
