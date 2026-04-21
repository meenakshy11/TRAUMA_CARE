import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { hospitalsApi, bloodStockApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'

const HospitalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [hospital, setHospital] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bloodStock, setBloodStock] = useState<any[]>([])
  const user = useAuthStore((s) => s.user)
  const canEdit = user?.role === 'HOSPITAL_STAFF' || user?.role === 'ADMIN'

  useEffect(() => {
    if (!id) return
    hospitalsApi.getOne(id)
      .then(r => setHospital(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
    bloodStockApi.getByHospital(id)
      .then(r => setBloodStock(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
  }, [id])

  const updateBloodStock = async (bloodGroup: string, delta: number) => {
    if (!id) return
    const current = bloodStock.find((s: any) => s.blood_group === bloodGroup)
    const newUnits = Math.max(0, (current?.units_available || 0) + delta)
    try {
      await bloodStockApi.updateStock(id, bloodGroup, newUnits)
      setBloodStock(prev => prev.map((s: any) =>
        s.blood_group === bloodGroup ? { ...s, units_available: newUnits } : s
      ))
    } catch (e) {}
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--color-text-secondary)' }}>Loading...</div>
  if (!hospital) return <div style={{ padding: 40, color: 'var(--color-text-secondary)' }}>Hospital not found.</div>

  const res = hospital.resources || {}

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/hospitals')} style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 13 }}>Back</button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>{hospital.name}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>{hospital.district} · {hospital.trauma_level}</p>
          </div>
        </div>
        <span style={{ fontSize: 12, background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '4px 14px', borderRadius: 99, border: '1px solid #22c55e', fontWeight: 600 }}>ACCEPTING</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'ICU Beds', value: res.icu_beds_available != null ? res.icu_beds_available + ' / ' + res.icu_beds_total : '—' },
          { label: 'Ventilators', value: res.ventilators ?? '—' },
          { label: 'OT Status', value: res.ot_functional ? 'Ready' : 'Unavailable', color: res.ot_functional ? '#22c55e' : '#ef4444' },
          { label: 'Blood Bank', value: res.blood_bank_available ? 'Available' : 'Unavailable', color: res.blood_bank_available ? '#22c55e' : '#ef4444' },
          { label: 'ED Capacity', value: res.ed_beds_available != null ? res.ed_beds_available + ' / ' + res.ed_beds_total : '—' },
          { label: 'Trauma Bays', value: res.trauma_bays ?? '—' },
        ].map(card => (
          <div key={card.label} style={{ background: 'var(--color-bg-secondary)', borderRadius: 8, padding: '12px 16px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: (card as any).color || 'var(--color-text-primary)' }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 10, padding: 20, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Hospital Information</h3>
          {[
            { label: 'Trauma Level', value: hospital.trauma_level },
            { label: 'District', value: hospital.district },
            { label: 'Address', value: hospital.address },
            { label: 'Contact', value: hospital.phone || '—' },
            { label: 'Type', value: hospital.is_government ? 'Government' : 'Private' },
            { label: 'KASB Empanelled', value: hospital.is_kasb_empaneled ? 'Yes' : 'No' },
            { label: 'Coordinates', value: hospital.latitude != null ? hospital.latitude.toFixed(5) + ', ' + hospital.longitude.toFixed(5) : '—' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 10, padding: 20, border: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Specializations & Protocols</h3>
          {(hospital.specializations || ['Emergency Medicine', 'Trauma Surgery']).map((s: string) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, color: 'var(--color-text-primary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              {s}
            </div>
          ))}
          <h3 style={{ margin: '20px 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Operational Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
            {[
              { label: '24h Emergency', value: res.emergency_24h },
              { label: 'Helipad', value: res.helipad },
              { label: 'MCI Protocol', value: res.mci_protocol },
              { label: 'Burn Unit', value: res.burn_unit },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                <span style={{ color: item.value ? '#22c55e' : 'var(--color-text-muted)', fontWeight: 500 }}>{item.value ? 'Yes' : 'No'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {bloodStock.length > 0 && (
        <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 10, padding: 20, border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Blood Bank Stock</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>Dispatch reduces count · Receive increases count</p>
            </div>
            <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '3px 10px', borderRadius: 99, border: '1px solid #22c55e' }}>Blood bank active</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {bloodStock.map((s: any) => {
              const isLow = s.units_available > 0 && s.units_available <= 3
              const isEmpty = s.units_available === 0
              const badgeBg = isEmpty ? 'rgba(107,114,128,0.15)' : isLow ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'
              const badgeColor = isEmpty ? '#6b7280' : isLow ? '#ef4444' : '#22c55e'
              return (
                <div key={s.blood_group} style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.blood_group}</span>
                    <span style={{ fontSize: 11, background: badgeBg, color: badgeColor, padding: '2px 8px', borderRadius: 99 }}>
                      {isEmpty ? 'Empty' : isLow ? s.units_available + ' — low' : s.units_available + ' units'}
                    </span>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => updateBloodStock(s.blood_group, -1)} disabled={isEmpty} style={{ flex: 1, padding: '4px 0', fontSize: 12, borderRadius: 6, background: isEmpty ? 'transparent' : 'rgba(239,68,68,0.1)', color: isEmpty ? '#9ca3af' : '#ef4444', border: '1px solid ' + (isEmpty ? '#e5e7eb' : '#ef4444'), cursor: isEmpty ? 'not-allowed' : 'pointer' }}>- Dispatch</button>
                      <button onClick={() => updateBloodStock(s.blood_group, 1)} style={{ flex: 1, padding: '4px 0', fontSize: 12, borderRadius: 6, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid #22c55e', cursor: 'pointer' }}>+ Receive</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default HospitalDetailPage
