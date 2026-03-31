/**
 * mockDataGenerators.ts
 *
 * Dynamically generates granular clinical and operational data for a given
 * incident ID. This bridges the gap between our lightweight Command Center
 * fixtures and the deep-dive requirements.
 */
import type { Incident } from '@/api/incidents.api';
import type { TriageColor } from '@/components/TriageColorBadge';

export interface Vitals {
  gcs: number; // 3-15
  hr: number;  // Heart Rate
  bp: string;  // Blood Pressure
  spo2: number; // 0-100
}

export interface Patient {
  id: string;
  demographics: string; // e.g., "M/45"
  triage_color: TriageColor;
  vitals: Vitals;
  injury_description: string;
}

export interface TimelineEvent {
  id: string;
  status: string;
  timestamp: string;
  agent: string; // "Dispatcher", "Paramedic KL-07-1234", "System"
}

// Map overall incident severity to individual patient triage colors
const severityToTriage = (severity: string): TriageColor[] => {
  switch (severity) {
    case 'CRITICAL': return ['RED', 'YELLOW'];
    case 'SEVERE': return ['YELLOW', 'RED', 'GREEN'];
    case 'MODERATE': return ['GREEN', 'YELLOW'];
    case 'MINOR': return ['GREEN'];
    default: return ['GREEN'];
  }
};

export const generateMockPatients = (incident: Incident): Patient[] => {
  const count = incident.patient_count;
  const colors = severityToTriage(incident.severity);
  const patients: Patient[] = [];

  for (let i = 0; i < count; i++) {
    const color = colors[i % colors.length];
    
    // Generate logical vitals based on triage color
    let vitals: Vitals;
    let desc: string;
    
    if (color === 'RED') {
      vitals = { gcs: 8, hr: 130, bp: '80/50', spo2: 88 };
      desc = 'Massive hemorrhage, airway compromised';
    } else if (color === 'YELLOW') {
      vitals = { gcs: 13, hr: 110, bp: '100/60', spo2: 94 };
      desc = 'Open femur fracture, conscious';
    } else {
      vitals = { gcs: 15, hr: 85, bp: '120/80', spo2: 98 };
      desc = 'Minor lacerations and contusions';
    }

    const age = Math.floor(Math.random() * 50) + 18;
    const sex = Math.random() > 0.5 ? 'M' : 'F';

    patients.push({
      id: `pat-${incident.id}-${i}`,
      demographics: `${sex}/${age}`,
      triage_color: color,
      vitals,
      injury_description: desc,
    });
  }

  return patients;
};

// Generates a mock timeline tracing from the creation date up to the current status.
export const generateMockTimeline = (incident: Incident): TimelineEvent[] => {
  const timeline: TimelineEvent[] = [];
  let baseTime = new Date(incident.created_at).getTime();

  const addEvent = (status: string, agent: string, minutesDelta: number) => {
    baseTime += minutesDelta * 60000;
    timeline.push({
      id: `evt-${baseTime}`,
      status,
      agent,
      timestamp: new Date(baseTime).toISOString(),
    });
  };

  // Always starts with reported
  addEvent('REPORTED', 'Public Reporter', 0);

  const statuses = [
    'DISPATCH_PENDING', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE',
    'PATIENT_LOADED', 'TRANSPORTING', 'HOSPITAL_ARRIVED', 'CLOSED'
  ];

  let currentIdx = statuses.indexOf(incident.status);
  if (currentIdx === -1 && incident.status === 'REPORTED') {
    return timeline;
  }

  // Cap it at current status
  if (currentIdx === -1) currentIdx = statuses.length - 1;

  if (currentIdx >= statuses.indexOf('DISPATCH_PENDING')) {
    addEvent('DISPATCH_PENDING', 'System Engine', 1);
  }
  if (currentIdx >= statuses.indexOf('DISPATCHED')) {
    addEvent('DISPATCHED', 'Dispatcher Command', 2);
  }
  if (currentIdx >= statuses.indexOf('EN_ROUTE')) {
    addEvent('EN_ROUTE', 'Paramedic Tablet', 1);
  }
  if (currentIdx >= statuses.indexOf('ON_SCENE')) {
    addEvent('ON_SCENE', 'Paramedic Tablet', 8);
  }
  if (currentIdx >= statuses.indexOf('PATIENT_LOADED')) {
    addEvent('PATIENT_LOADED', 'Paramedic Tablet', 15);
  }
  if (currentIdx >= statuses.indexOf('TRANSPORTING')) {
    addEvent('TRANSPORTING', 'Paramedic Tablet', 2);
  }
  if (currentIdx >= statuses.indexOf('HOSPITAL_ARRIVED')) {
    addEvent('HOSPITAL_ARRIVED', 'Hospital Dashboard', 20);
  }

  // Reverse so newest is at the top
  return timeline.reverse();
};
