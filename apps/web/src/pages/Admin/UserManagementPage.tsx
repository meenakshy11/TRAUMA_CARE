/**
 * UserManagementPage.tsx
 *
 * Full-featured User Management for the Integrated Trauma Care Platform.
 * Designed to live inside the standard AdminPage (scrollable, padded container).
 *
 * Features:
 *  - Role-colour KPI strip (click to filter)
 *  - Search + status filter bar
 *  - Sortable user table with avatar, role badge, status pill, last-login
 *  - Inline slide-down row expansion with contact / activity / assignment details
 *  - Add / Edit modal with role selector, field validation, active toggle
 *  - Deactivate / Reset-password / Delete actions
 */

import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'ADMIN' | 'DISPATCHER' | 'HOSPITAL_STAFF' | 'PARAMEDIC' | 'GOVERNMENT';

interface PlatformUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  hospital_id: string | null;
  ambulance_id: string | null;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  district?: string;
  avatar_initials: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_CFG: Record<UserRole, { label: string; color: string; bg: string; border: string; icon: string; desc: string }> = {
  ADMIN:          { label: 'Admin',          color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)', icon: '🛡', desc: 'Full platform access' },
  DISPATCHER:     { label: 'Dispatcher',     color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)',  icon: '📡', desc: 'Incident dispatch & coordination' },
  HOSPITAL_STAFF: { label: 'Hospital Staff', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.25)',   icon: '🏥', desc: 'Hospital resource management' },
  PARAMEDIC:      { label: 'Paramedic',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',   icon: '🚑', desc: 'Field response & patient care' },
  GOVERNMENT:     { label: 'Government',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  icon: '🏛', desc: 'Analytics & oversight access' },
};

const DISTRICTS = [
  'Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam',
  'Idukki','Ernakulam','Thrissur','Palakkad','Malappuram',
  'Kozhikode','Wayanad','Kannur','Kasaragod',
];

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_USERS: PlatformUser[] = [
  { id:'u-001', full_name:'Arun Krishnan',      email:'dispatcher@trauma.demo',         phone:'+91-9876543210', role:'DISPATCHER',     hospital_id:null,    ambulance_id:null,    is_active:true,  created_at:'2025-01-15T09:00:00Z', last_login:new Date(Date.now()-2*3600000).toISOString(),       district:'Ernakulam',           avatar_initials:'AK' },
  { id:'u-002', full_name:'Priya Menon',         email:'admin@trauma.demo',              phone:'+91-9876543211', role:'ADMIN',          hospital_id:null,    ambulance_id:null,    is_active:true,  created_at:'2025-01-01T08:00:00Z', last_login:new Date(Date.now()-30*60000).toISOString(),        district:'Thiruvananthapuram',  avatar_initials:'PM' },
  { id:'u-003', full_name:'Dr. Sreeja Nair',     email:'hospital.kottayam@trauma.demo',  phone:'+91-9876543212', role:'HOSPITAL_STAFF', hospital_id:'h-001', ambulance_id:null,    is_active:true,  created_at:'2025-02-10T10:00:00Z', last_login:new Date(Date.now()-8*3600000).toISOString(),       district:'Kottayam',            avatar_initials:'SN' },
  { id:'u-004', full_name:'Suresh Kumar IAS',    email:'gov@trauma.demo',                phone:'+91-9876543213', role:'GOVERNMENT',     hospital_id:null,    ambulance_id:null,    is_active:true,  created_at:'2025-01-20T11:00:00Z', last_login:new Date(Date.now()-24*3600000).toISOString(),      district:'Thiruvananthapuram',  avatar_initials:'SK' },
  { id:'u-005', full_name:'Dr. Anitha Pillai',   email:'hospital.tvm@trauma.demo',       phone:'+91-9876543214', role:'HOSPITAL_STAFF', hospital_id:'h-002', ambulance_id:null,    is_active:true,  created_at:'2025-02-15T09:30:00Z', last_login:new Date(Date.now()-4*3600000).toISOString(),       district:'Thiruvananthapuram',  avatar_initials:'AP' },
  { id:'u-006', full_name:'Dr. Rajan Kutty',     email:'hospital.kozhikode@trauma.demo', phone:'+91-9876543215', role:'HOSPITAL_STAFF', hospital_id:'h-003', ambulance_id:null,    is_active:true,  created_at:'2025-02-20T08:00:00Z', last_login:new Date(Date.now()-12*3600000).toISOString(),      district:'Kozhikode',           avatar_initials:'RK' },
  { id:'u-007', full_name:'Dr. Mary Thomas',     email:'hospital.thrissur@trauma.demo',  phone:'+91-9876543216', role:'HOSPITAL_STAFF', hospital_id:'h-004', ambulance_id:null,    is_active:true,  created_at:'2025-03-01T10:00:00Z', last_login:new Date(Date.now()-6*3600000).toISOString(),       district:'Thrissur',            avatar_initials:'MT' },
  { id:'u-008', full_name:'Binu Mathew',         email:'paramedic.kl05@trauma.demo',     phone:'+91-9845123456', role:'PARAMEDIC',      hospital_id:null,    ambulance_id:'amb-001', is_active:true, created_at:'2025-03-05T07:00:00Z', last_login:new Date(Date.now()-45*60000).toISOString(),        district:'Kottayam',            avatar_initials:'BM' },
  { id:'u-009', full_name:'Sajin Varghese',      email:'paramedic.kl07@trauma.demo',     phone:'+91-9845234567', role:'PARAMEDIC',      hospital_id:null,    ambulance_id:'amb-002', is_active:true, created_at:'2025-03-08T06:30:00Z', last_login:new Date(Date.now()-90*60000).toISOString(),        district:'Kozhikode',           avatar_initials:'SV' },
  { id:'u-010', full_name:'Lekha Chandran',      email:'dispatcher2@trauma.demo',        phone:'+91-9876123456', role:'DISPATCHER',     hospital_id:null,    ambulance_id:null,    is_active:false, created_at:'2025-01-25T09:00:00Z', last_login:new Date(Date.now()-7*24*3600000).toISOString(),    district:'Ernakulam',           avatar_initials:'LC' },
  { id:'u-011', full_name:'Rahul Das',            email:'paramedic.kl08@trauma.demo',     phone:'+91-9912345678', role:'PARAMEDIC',      hospital_id:null,    ambulance_id:'amb-003', is_active:true, created_at:'2025-03-10T08:00:00Z', last_login:new Date(Date.now()-20*60000).toISOString(),        district:'Thrissur',            avatar_initials:'RD' },
  { id:'u-012', full_name:'Gopika Soman',        email:'gov.finance@trauma.demo',        phone:'+91-9876543220', role:'GOVERNMENT',     hospital_id:null,    ambulance_id:null,    is_active:false, created_at:'2025-02-01T10:00:00Z', last_login:new Date(Date.now()-30*24*3600000).toISOString(),  district:'Kozhikode',           avatar_initials:'GS' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relTime(iso?: string) {
  if (!iso) return 'Never';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function initials(name: string) { return name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase(); }
function uid() { return `u-${Date.now().toString(36)}`; }

// ─── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const c = ROLE_CFG[role];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px',
      borderRadius:20, fontSize:11, fontWeight:700,
      background:c.bg, color:c.color, border:`1px solid ${c.border}`, whiteSpace:'nowrap' }}>
      {c.icon} {c.label}
    </span>
  );
};

// ─── Status Pill ──────────────────────────────────────────────────────────────
const StatusPill: React.FC<{ active: boolean }> = ({ active }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'2px 9px',
    borderRadius:20, fontSize:11, fontWeight:700,
    background: active ? 'rgba(34,197,94,0.1)' : 'rgba(71,85,105,0.1)',
    color: active ? '#22c55e' : '#64748b',
    border:`1px solid ${active ? 'rgba(34,197,94,0.2)' : 'rgba(51,65,85,0.4)'}` }}>
    <span style={{ width:5, height:5, borderRadius:'50%', background: active ? '#22c55e' : '#475569', flexShrink:0 }}/>
    {active ? 'Active' : 'Inactive'}
  </span>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ user: PlatformUser; size?: number }> = ({ user, size=34 }) => {
  const c = ROLE_CFG[user.role];
  return (
    <span style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      background:c.bg, color:c.color, border:`1px solid ${c.border}`,
      fontSize:size>34?14:11, fontWeight:800 }}>
      {user.avatar_initials}
    </span>
  );
};

// ─── KPI Chip ─────────────────────────────────────────────────────────────────
const KpiChip: React.FC<{ label:string; value:number; color:string; active?:boolean; onClick?:()=>void }> = ({
  label, value, color, active, onClick,
}) => (
  <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:8,
    padding:'8px 14px', borderRadius:8,
    border:`1px solid ${active ? color : 'var(--color-border-strong)'}`,
    background: active ? `${color}15` : 'var(--color-bg-tertiary)',
    cursor: onClick ? 'pointer' : 'default',
    transition:'all 0.15s', flexShrink:0 }}>
    <span style={{ fontSize:20, fontWeight:900, color, fontFamily:'monospace', lineHeight:1 }}>{value}</span>
    <span style={{ fontSize:10, color: active ? color : 'var(--color-text-secondary)', fontWeight:700,
      textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>{label}</span>
  </button>
);

// ─── Expanded Row Detail ──────────────────────────────────────────────────────
const ExpandedDetail: React.FC<{
  user: PlatformUser;
  onEdit: ()=>void;
  onToggle: ()=>void;
  onReset: ()=>void;
  onDelete: ()=>void;
}> = ({ user, onEdit, onToggle, onReset, onDelete }) => {
  const c = ROLE_CFG[user.role];
  const rows = [
    ['Phone',      user.phone],
    ['District',   user.district ?? '—'],
    ['Created',    new Date(user.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})],
    ['Last Login', relTime(user.last_login)],
    ['User ID',    user.id],
    ...(user.hospital_id  ? [['Hospital ID',   user.hospital_id]]  : []),
    ...(user.ambulance_id ? [['Ambulance ID',  user.ambulance_id]] : []),
  ];
  return (
    <tr>
      <td colSpan={6} style={{ padding:0, background:'var(--color-bg-primary)', borderBottom:'1px solid var(--color-border)' }}>
        <div style={{ padding:'16px 20px 16px 68px', display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start' }}>
          {/* Info grid */}
          <div style={{ flex:1, minWidth:260, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 24px' }}>
            {rows.map(([k,v]) => (
              <div key={k} style={{ display:'flex', flexDirection:'column', padding:'4px 0',
                borderBottom:'1px solid var(--color-border)' }}>
                <span style={{ fontSize:9, fontWeight:700, color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>{k}</span>
                <span style={{ fontSize:12, color:'var(--color-text-primary)', fontWeight:500,
                  fontFamily: k==='User ID'||k==='Hospital ID'||k==='Ambulance ID' ? 'monospace':'inherit' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Role description */}
          <div style={{ padding:'10px 14px', borderRadius:8,
            background:c.bg, border:`1px solid ${c.border}`, color:c.color,
            fontSize:12, fontWeight:500, maxWidth:200, alignSelf:'flex-start' }}>
            <div style={{ fontWeight:700, marginBottom:2 }}>{c.icon} {c.label}</div>
            <div style={{ fontSize:11, opacity:0.8 }}>{c.desc}</div>
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, alignSelf:'flex-start' }}>
            <button onClick={onEdit}   style={actionBtnStyle('#3b82f6')}>✏️ Edit Profile</button>
            <button onClick={onToggle} style={actionBtnStyle(user.is_active ? '#f59e0b' : '#22c55e')}>
              {user.is_active ? '⏸ Deactivate' : '▶ Activate'}
            </button>
            <button onClick={onReset}  style={actionBtnStyle('#06b6d4')}>🔑 Reset Password</button>
            <button onClick={onDelete} style={actionBtnStyle('#ef4444', true)}>🗑 Delete Account</button>
          </div>
        </div>
      </td>
    </tr>
  );
};

function actionBtnStyle(color: string, muted=false): React.CSSProperties {
  return {
    background:'transparent', border:`1px solid ${color}${muted?'55':'40'}`,
    borderRadius:6, padding:'6px 12px', fontSize:11, fontWeight:600,
    color: muted ? `${color}99` : color, cursor:'pointer', textAlign:'left',
    transition:'all 0.12s', whiteSpace:'nowrap',
  };
}

// ─── User Modal ───────────────────────────────────────────────────────────────

interface FormData { full_name:string; email:string; phone:string; role:UserRole; district:string; password:string; is_active:boolean }
const EMPTY: FormData = { full_name:'', email:'', phone:'', role:'DISPATCHER', district:'Thiruvananthapuram', password:'', is_active:true };

const UserModal: React.FC<{ user:PlatformUser|null; onClose:()=>void; onSave:(d:FormData,id?:string)=>void }> = ({
  user, onClose, onSave,
}) => {
  const [form, setForm] = useState<FormData>(() =>
    user ? { full_name:user.full_name, email:user.email, phone:user.phone,
              role:user.role, district:user.district??'Thiruvananthapuram',
              password:'', is_active:user.is_active } : { ...EMPTY }
  );
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const set = (k: keyof FormData, v: string|boolean) => setForm(p => ({ ...p, [k]:v }));

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.full_name.trim())         e.full_name = 'Required';
    if (!form.email.includes('@'))      e.email     = 'Valid email required';
    if (!form.phone.trim())             e.phone     = 'Required';
    if (!user && !form.password.trim()) e.password  = 'Required for new users';
    if (form.password && form.password.length < 8) e.password = 'Min 8 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) onSave(form, user?.id); };

  const rc = ROLE_CFG[form.role];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)',
      zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'#0f1623', border:'1px solid #1e2a3d', borderRadius:14,
        boxShadow:'0 24px 80px rgba(0,0,0,0.7)', width:'100%', maxWidth:520,
        maxHeight:'90vh', overflow:'auto', animation:'modal-in 0.2s ease both' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          padding:'18px 24px', borderBottom:'1px solid #1e2a3d' }}>
          <div>
            <h2 style={{ margin:0, fontSize:16, fontWeight:700, color:'#e8edf5' }}>
              {user ? '✏️ Edit User' : '➕ Add New User'}
            </h2>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'#4a5878' }}>
              {user ? `Editing ${user.full_name}'s account` : 'Create a new platform account'}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#4a5878',
            cursor:'pointer', fontSize:18, lineHeight:1, padding:4 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

            {/* Role chips */}
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:'#4a5878', textTransform:'uppercase',
                letterSpacing:'0.07em', marginBottom:8 }}>Role</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {(Object.keys(ROLE_CFG) as UserRole[]).map(r => {
                  const c = ROLE_CFG[r];
                  const sel = form.role === r;
                  return (
                    <button key={r} type="button" onClick={() => set('role', r)}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                        padding:'8px 12px', border:`1px solid ${sel?c.color:'#1e2a3d'}`,
                        borderRadius:8, cursor:'pointer', background: sel?c.bg:'transparent',
                        color: sel?c.color:'#4a5878', transition:'all 0.12s', minWidth:80, fontSize:11, fontWeight:700 }}>
                      <span style={{ fontSize:16 }}>{c.icon}</span>
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop:8, padding:'6px 10px', borderRadius:6,
                background:rc.bg, border:`1px solid ${rc.border}`, color:rc.color, fontSize:11, fontWeight:500 }}>
                {rc.icon} {rc.desc}
              </div>
            </div>

            {/* Fields grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {([
                { key:'full_name', label:'Full Name', type:'text', ph:'Dr. First Last' },
                { key:'email',     label:'Email',     type:'email', ph:'user@trauma.demo' },
                { key:'phone',     label:'Phone',     type:'tel',  ph:'+91-9876543210' },
              ] as {key:keyof FormData;label:string;type:string;ph:string}[]).map(f => (
                <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:10, fontWeight:700, color:'#4a5878', textTransform:'uppercase', letterSpacing:'0.07em' }}>{f.label} *</label>
                  <input type={f.type} placeholder={f.ph} value={form[f.key] as string}
                    onChange={e => set(f.key, e.target.value)}
                    style={{ padding:'8px 10px', background:'#161d2e', border:`1px solid ${(errors as any)[f.key]?'#ef4444':'#1e2a3d'}`,
                      borderRadius:6, color:'#e8edf5', fontSize:13, outline:'none', fontFamily:'inherit' }}/>
                  {(errors as any)[f.key] && <span style={{ fontSize:10, color:'#ef4444' }}>{(errors as any)[f.key]}</span>}
                </div>
              ))}

              {/* District */}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#4a5878', textTransform:'uppercase', letterSpacing:'0.07em' }}>District</label>
                <select value={form.district} onChange={e => set('district', e.target.value)}
                  style={{ padding:'8px 10px', background:'#161d2e', border:'1px solid #1e2a3d',
                    borderRadius:6, color:'#e8edf5', fontSize:13, outline:'none' }}>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Password */}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:10, fontWeight:700, color:'#4a5878', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                  {user ? 'New Password (blank = keep)' : 'Password *'}
                </label>
                <input type="password" placeholder="••••••••" value={form.password}
                  onChange={e => set('password', e.target.value)}
                  style={{ padding:'8px 10px', background:'#161d2e', border:`1px solid ${errors.password?'#ef4444':'#1e2a3d'}`,
                    borderRadius:6, color:'#e8edf5', fontSize:13, outline:'none', fontFamily:'inherit' }}/>
                {errors.password && <span style={{ fontSize:10, color:'#ef4444' }}>{errors.password}</span>}
              </div>
            </div>

            {/* Active toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
              background:'rgba(15,22,35,0.6)', borderRadius:8, border:'1px solid #1e2a3d' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#e8edf5' }}>Account Status</div>
                <div style={{ fontSize:11, color:'#4a5878' }}>Inactive accounts cannot log in</div>
              </div>
              <div onClick={() => set('is_active', !form.is_active)}
                style={{ width:40, height:22, borderRadius:11, position:'relative', cursor:'pointer',
                  background: form.is_active ? '#22c55e' : '#334155', transition:'background 0.2s', flexShrink:0 }}>
                <div style={{ position:'absolute', top:2, width:18, height:18, borderRadius:'50%', background:'#fff',
                  transition:'transform 0.2s', transform: form.is_active ? 'translateX(20px)' : 'translateX(2px)' }}/>
              </div>
              <span style={{ fontSize:12, fontWeight:600, color: form.is_active ? '#22c55e' : '#64748b', minWidth:48 }}>
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10,
            padding:'14px 24px', borderTop:'1px solid #1e2a3d' }}>
            <button type="button" onClick={onClose}
              style={{ padding:'8px 18px', background:'transparent', border:'1px solid #1e2a3d',
                borderRadius:7, color:'#8a99b3', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit"
              style={{ padding:'8px 22px', background:'#3b82f6', border:'none',
                borderRadius:7, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              {user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const UserManagementPage: React.FC = () => {
  const [users,        setUsers]        = useState<PlatformUser[]>(SEED_USERS);
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState<UserRole|'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL'|'ACTIVE'|'INACTIVE'>('ALL');
  const [expandedId,   setExpandedId]   = useState<string|null>(null);
  const [modalUser,    setModalUser]    = useState<PlatformUser|null|'new'>(null);

  // derived
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const ms = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
                     || u.phone.includes(q) || (u.district??'').toLowerCase().includes(q);
      const mr = roleFilter==='ALL' || u.role===roleFilter;
      const mx = statusFilter==='ALL' || (statusFilter==='ACTIVE'&&u.is_active) || (statusFilter==='INACTIVE'&&!u.is_active);
      return ms && mr && mx;
    });
  }, [users, search, roleFilter, statusFilter]);

  const kpi = useMemo(() => ({
    total:    users.length,
    active:   users.filter(u=>u.is_active).length,
    ADMIN:         users.filter(u=>u.role==='ADMIN').length,
    DISPATCHER:    users.filter(u=>u.role==='DISPATCHER').length,
    HOSPITAL_STAFF:users.filter(u=>u.role==='HOSPITAL_STAFF').length,
    PARAMEDIC:     users.filter(u=>u.role==='PARAMEDIC').length,
    GOVERNMENT:    users.filter(u=>u.role==='GOVERNMENT').length,
  }), [users]);

  // actions
  const saveUser = useCallback((data: FormData, id?: string) => {
    if (id) {
      setUsers(prev => prev.map(u => u.id!==id ? u : {
        ...u, full_name:data.full_name, email:data.email, phone:data.phone,
        role:data.role, district:data.district, is_active:data.is_active,
        avatar_initials:initials(data.full_name),
      }));
      toast.success(`✅ ${data.full_name} updated`);
    } else {
      const nu: PlatformUser = { id:uid(), ...data,
        hospital_id:null, ambulance_id:null,
        created_at:new Date().toISOString(),
        avatar_initials:initials(data.full_name),
      };
      setUsers(prev => [nu, ...prev]);
      toast.success(`✅ ${ROLE_CFG[data.role].label} account created for ${data.full_name}`);
    }
    setModalUser(null);
    setExpandedId(null);
  }, []);

  const toggleStatus = useCallback((uid: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id!==uid) return u;
      const next = { ...u, is_active:!u.is_active };
      toast.success(`${next.full_name} → ${next.is_active?'✅ Active':'⏸ Inactive'}`);
      return next;
    }));
  }, []);

  const resetPw = useCallback((u: PlatformUser) => toast.success(`🔑 Reset email sent to ${u.email}`), []);

  const deleteUser = useCallback((uid: string, name: string) => {
    setUsers(prev => prev.filter(u=>u.id!==uid));
    setExpandedId(null);
    toast.success(`🗑 ${name} removed`);
  }, []);

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:'var(--color-text-primary)' }}>👥 User Management</h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'var(--color-text-secondary)' }}>
            {users.length} accounts &nbsp;·&nbsp; {kpi.active} active &nbsp;·&nbsp; {users.length-kpi.active} inactive
          </p>
        </div>
        <button onClick={() => setModalUser('new')}
          style={{ padding:'9px 18px', background:'#3b82f6', border:'none', borderRadius:8,
            color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
          + Add User
        </button>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
        <KpiChip label="Total"  value={kpi.total}  color="#64748b" />
        <KpiChip label="Active" value={kpi.active} color="#22c55e"
          active={statusFilter==='ACTIVE'}
          onClick={() => setStatusFilter(statusFilter==='ACTIVE'?'ALL':'ACTIVE')} />

        <span style={{ width:1, height:36, background:'#1e2a3d', alignSelf:'center', margin:'0 4px' }}/>

        {(Object.keys(ROLE_CFG) as UserRole[]).map(r => (
          <KpiChip key={r} label={ROLE_CFG[r].label} value={(kpi as any)[r]} color={ROLE_CFG[r].color}
            active={roleFilter===r}
            onClick={() => setRoleFilter(roleFilter===r?'ALL':r)} />
        ))}
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        {/* Search */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:220,
          background:'var(--color-bg-tertiary)', border:'1px solid var(--color-border)',
          borderRadius:8, padding:'8px 12px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a5878" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name, email, phone, district…"
            style={{ background:'transparent', border:'none', outline:'none',
              color:'var(--color-text-primary)', fontSize:13, width:'100%', fontFamily:'inherit' }}/>
          {search && (
            <button onClick={()=>setSearch('')}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#4a5878', fontSize:14, lineHeight:1 }}>
              ✕
            </button>
          )}
        </div>

        {/* Status filter */}
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as typeof statusFilter)}
          style={{ padding:'8px 12px', background:'var(--color-bg-tertiary)',
            border:'1px solid var(--color-border)', borderRadius:8,
            color:'var(--color-text-secondary)', fontSize:13, cursor:'pointer', outline:'none' }}>
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>

        {(search || roleFilter!=='ALL' || statusFilter!=='ALL') && (
          <button onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
            style={{ padding:'8px 12px', background:'transparent',
              border:'1px solid var(--color-border)', borderRadius:8,
              color:'var(--color-text-secondary)', fontSize:12, cursor:'pointer' }}>
            Clear filters
          </button>
        )}

        <span style={{ fontSize:11, color:'var(--color-text-muted)', marginLeft:'auto' }}>
          {filtered.length} of {users.length} users
        </span>
      </div>

      {/* ── Table card ──────────────────────────────────────────────────── */}
      <div className="card" style={{ overflow:'hidden', marginBottom:8 }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['User','Role','District','Status','Last Login',''].map(h => (
                  <th key={h} style={{ padding:'10px 14px',
                    background:'var(--color-bg-tertiary)', color:'var(--color-text-muted)',
                    fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
                    textAlign:'left', borderBottom:'1px solid var(--color-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding:'48px 20px', textAlign:'center', color:'var(--color-text-muted)' }}>
                    <div style={{ fontSize:32, marginBottom:10, opacity:0.4 }}>🔍</div>
                    No users match your search or filters.
                  </td>
                </tr>
              ) : (
                filtered.map(user => {
                  const exp = expandedId===user.id;
                  const rc  = ROLE_CFG[user.role];
                  return (
                    <React.Fragment key={user.id}>
                      <tr
                        onClick={() => setExpandedId(exp?null:user.id)}
                        style={{ borderBottom:`1px solid var(--color-border)`,
                          borderLeft:`3px solid ${exp?rc.color:'transparent'}`,
                          background: exp ? 'var(--color-bg-hover)' : 'transparent',
                          cursor:'pointer', transition:'background 0.12s',
                          opacity: user.is_active ? 1 : 0.6 }}>

                        {/* User */}
                        <td style={{ padding:'10px 14px', verticalAlign:'middle' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <Avatar user={user}/>
                            <div>
                              <div style={{ fontSize:13, fontWeight:600, color:'var(--color-text-primary)' }}>{user.full_name}</div>
                              <div style={{ fontSize:11, color:'var(--color-text-muted)', fontFamily:'monospace' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding:'10px 14px', verticalAlign:'middle' }}><RoleBadge role={user.role}/></td>
                        <td style={{ padding:'10px 14px', verticalAlign:'middle', color:'var(--color-text-secondary)', fontSize:12 }}>{user.district??'—'}</td>
                        <td style={{ padding:'10px 14px', verticalAlign:'middle' }}><StatusPill active={user.is_active}/></td>
                        <td style={{ padding:'10px 14px', verticalAlign:'middle', color:'var(--color-text-secondary)', fontSize:12 }}>{relTime(user.last_login)}</td>
                        <td style={{ padding:'10px 14px', verticalAlign:'middle', textAlign:'right',
                          color: exp?rc.color:'var(--color-border-strong)', fontSize:14 }}>
                          {exp?'▲':'▼'}
                        </td>
                      </tr>

                      {/* Inline expanded detail */}
                      {exp && (
                        <ExpandedDetail
                          user={user}
                          onEdit={() => setModalUser(user)}
                          onToggle={() => toggleStatus(user.id)}
                          onReset={() => resetPw(user)}
                          onDelete={() => deleteUser(user.id, user.full_name)}
                        />
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {filtered.length > 0 && (
          <div style={{ padding:'8px 14px', borderTop:'1px solid var(--color-border)',
            background:'var(--color-bg-tertiary)', fontSize:11, color:'var(--color-text-muted)' }}>
            Click any row to expand details &nbsp;·&nbsp; Role chips above filter the table
          </div>
        )}
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      {modalUser !== null && (
        <UserModal
          user={modalUser==='new' ? null : modalUser}
          onClose={() => setModalUser(null)}
          onSave={saveUser}
        />
      )}
    </>
  );
};

export default UserManagementPage;
