// Shift pattern configuration types
import type { ShiftDuration, ShiftType, Shift } from './index';

export interface ShiftPattern {
  id: string;
  name: string;
  description?: string;
  duration: ShiftDuration;
  timeSlots: TimeSlot[];
  locationAssignments: PatternLocationAssignment[];
  constraints: PatternConstraints;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  id: string;
  patternId: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: ShiftType;
  minStaff: number;
  maxStaff: number;
  requiredSkills: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface PatternLocationAssignment {
  patternId: string;
  siteId: string;
  zoneId: string;
  teamId: string;
  assignmentId: string;
  required: boolean;
}

export interface PatternConstraints {
  maxConsecutiveShifts: number;
  minRestBetweenShifts: number; // hours
  maxWeeklyHours: number;
  maxOvertimeHours: number;
  preferredShiftTypes: ShiftType[];
  blackoutDates: string[]; // ISO date strings
  mandatoryBreaks: BreakRule[];
}

export interface BreakRule {
  duration: number; // minutes
  afterHours: number; // hours worked before break
  mandatory: boolean;
}

export interface ShiftPatternLibrary {
  predefined: ShiftPattern[];
  custom: ShiftPattern[];
  favorites: string[];
}

// Context menu action types
export type ContextMenuAction =
  | 'edit'
  | 'delete'
  | 'copy'
  | 'move'
  | 'swap'
  | 'convert-overtime'
  | 'assign-location'
  | 'view-details'
  | 'duplicate';

export interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  targetShift?: Shift;
  availableActions: ContextMenuAction[];
}