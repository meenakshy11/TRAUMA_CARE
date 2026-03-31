/**
 * IncidentListPage.tsx
 *
 * Master registry of all recorded incidents (historical and ongoing).
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useIncidentStore } from '@/store/incidentStore';
import styles from './IncidentListPage.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type IncidentStatus = 'REPORTED' | 'DISPATCH_PENDING' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'PATIENT_LOADED' | 'TRANSPORTING' | 'HOSPITAL_ARRIVED' | 'CLOSED' | 'CANCELLED';

const STATUS_LABELS: Record<IncidentStatus, string> = {
  REPORTED:         'Reported',
  DISPATCH_PENDING: 'Pending Dispatch',
  DISPATCHED:       'Dispatched',
  EN_ROUTE:         'En Route',
  ON_SCENE:         'On Scene',
  PATIENT_LOADED:   'Loaded',
  TRANSPORTING:     'Transporting',
  HOSPITAL_ARRIVED: 'Arrived',
  CLOSED:           'Closed',
  CANCELLED:        'Cancelled'
};

const STATUS_COLORS: Record<IncidentStatus, string> = {
  REPORTED:         '#6b7280',
  DISPATCH_PENDING: '#f59e0b',
  DISPATCHED:       '#3b82f6',
  EN_ROUTE:         '#8b5cf6',
  ON_SCENE:         '#ef4444',
  PATIENT_LOADED:   '#f97316',
  TRANSPORTING:     '#06b6d4',
  HOSPITAL_ARRIVED: '#22c55e',
  CLOSED:           '#4b5563',
  CANCELLED:        '#dc2626',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  SEVERE:   '#f97316',
  MODERATE: '#f59e0b',
  MINOR:    '#22c55e',
  MCI:      '#dc2626',
};

// ─── Component ────────────────────────────────────────────────────────────────

const IncidentListPage: React.FC = () => {
  const { incidents } = useIncidentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  /** Filter logic */
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSearch = inc.incident_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            inc.address_text.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || 
                           (statusFilter === 'ACTIVE' && !['CLOSED', 'CANCELLED'].includes(inc.status)) ||
                           (inc.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [incidents, searchQuery, statusFilter]);

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Digital Trauma Record</h1>
          <p>Browsing {incidents.length} recorded incidents across the Kerala Trauma Grid.</p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.searchIcon}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search by Ref or Location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select 
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="CLOSED">Closed Only</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="ON_SCENE">On Scene</option>
          </select>
        </div>
      </header>

      {/* ── Main Registry ──────────────────────────────────── */}
      <div className={styles.container}>
        <div className={styles.scrollArea}>
          {filteredIncidents.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ref Number</th>
                  <th>Status</th>
                  <th>Severity</th>
                  <th>Location</th>
                  <th>District</th>
                  <th>Patients</th>
                  <th>Reported</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((inc) => (
                  <tr key={inc.id} className={styles.row}>
                    <td>
                      <Link to={`/incidents/${inc.id}`} className={styles.incidentRef}>
                        {inc.incident_number}
                      </Link>
                    </td>
                    <td>
                      <span 
                        className={styles.statusPill}
                        style={{
                          background: `${STATUS_COLORS[inc.status as IncidentStatus]}22`,
                          color: STATUS_COLORS[inc.status as IncidentStatus],
                          border: `1px solid ${STATUS_COLORS[inc.status as IncidentStatus]}44`
                        }}
                      >
                        {STATUS_LABELS[inc.status as IncidentStatus]}
                      </span>
                    </td>
                    <td>
                      <span 
                        className={styles.severitySwatch} 
                        style={{ background: SEVERITY_COLORS[inc.severity] }} 
                      />
                      {inc.severity}
                    </td>
                    <td title={inc.address_text}>
                      <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inc.address_text}
                      </div>
                    </td>
                    <td>{inc.district}</td>
                    <td style={{ fontWeight: 700 }}>{inc.patient_count}</td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>
                      {new Date(inc.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </td>
                    <td>
                      <Link to={`/incidents/${inc.id}`} className={styles.auditBtn}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                        Audit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>No incidents found matching your query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentListPage;
