// Location hierarchy types for complex site management

export type ShiftDuration = '4h' | '8h' | '12h' | '24h';

export interface Site {
  id: string;
  name: string;
  description?: string;
  address?: string;
  contactInfo?: string;
  zones: Zone[];
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  siteId: string;
  name: string;
  description?: string;
  capacity: number;
  securityLevel: 'low' | 'medium' | 'high';
  teams: Team[];
  color?: string; // For visual identification
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  zoneId: string;
  name: string;
  description?: string;
  teamLeadId?: string;
  memberIds: string[];
  specialization?: string;
  maxConcurrentShifts: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  requiredSkills: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  minStaffRequired: number;
  maxStaffAllowed: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocationAssignment {
  shiftId: string;
  siteId: string;
  zoneId: string;
  teamId: string;
  assignmentId: string;
  assignedAt: string;
  assignedBy: string;
}