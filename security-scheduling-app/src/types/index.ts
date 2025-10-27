// Core types for the security guard scheduling application
import type { ShiftDuration, Site, Zone, Team, Assignment, LocationAssignment } from './location';
import type { ShiftPattern as CustomShiftPattern, ContextMenuAction, ContextMenuState } from './shiftPattern';

export type ShiftType = 'morning' | 'afternoon' | 'night';

export type ShiftPattern = '8-8-8' | '12-12' | '12-day-only' | '12-night-only' | 'mixed';

// Re-export new types for backward compatibility
export type { ShiftDuration, Site, Zone, Team, Assignment, LocationAssignment };
export type { CustomShiftPattern, ContextMenuAction, ContextMenuState };

export interface Employee {
  id: string;
  name: string;
  position: string;
  hourlyRate: number;
  overtimeRate: number;
  maxWeeklyHours: number;
  preferredShifts: ShiftType[];
  unavailableDates: string[]; // ISO date strings
}

export interface Shift {
  id: string;
  employeeId: string;
  date: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  type: ShiftType;
  isOvertime: boolean;
  notes?: string;
  // Enhanced fields for location-based teamwork
  locationAssignment?: {
    siteId: string;
    zoneId: string;
    teamId: string;
    assignmentId: string;
  };
  patternId?: string; // Reference to custom shift pattern
  duration?: ShiftDuration; // 4h, 8h, 12h, 24h
}

export interface Budget {
  id: string;
  name: string;
  totalAmount: number;
  usedAmount: number;
  period: 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
}

export interface SchedulingConstraints {
  maxConsecutiveNights: number;
  minRestHours: number;
  maxWeeklyOT: number;
  maxConsecutiveDays: number;
  minStaffPerShift: number;
}

export interface SchedulingStrategy {
  pattern: ShiftPattern;
  startDate: string;
  endDate: string;
  constraints: SchedulingConstraints;
  budgetId?: string;
}

export interface CostAnalysis {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  regularCost: number;
  overtimeCost: number;
  totalCost: number;
  budgetUtilization: number;
}

export interface EmployeeWorkload {
  employeeId: string;
  totalHours: number;
  overtimeHours: number;
  consecutiveDays: number;
  happinessScore: number;
}

export interface ReportData {
  period: {
    start: string;
    end: string;
  };
  shifts: Shift[];
  costAnalysis: CostAnalysis;
  employeeWorkloads: EmployeeWorkload[];
  coverageGaps: {
    date: string;
    shiftType: ShiftType;
    required: number;
    actual: number;
  }[];
}

// Employee happiness calculation based on the standard
export interface HappinessFactors {
  workLifeBalance: number; // 0-5
  fairness: number; // 0-5
  recognition: number; // 0-5
  growth: number; // 0-5
  stress: number; // 0-5 (negative factor)
  exhaustion: number; // 0-5 (negative factor)
}

export const calculateHappinessScore = (factors: HappinessFactors, employeeType: 'new' | 'operational' | 'supervisor'): number => {
  const weights = {
    new: { wlb: 0.35, fairness: 0.20, recognition: 0.15, growth: 0.30, stress: 0.6, exhaustion: 0.4 },
    operational: { wlb: 0.25, fairness: 0.30, recognition: 0.20, growth: 0.25, stress: 0.6, exhaustion: 0.4 },
    supervisor: { wlb: 0.20, fairness: 0.25, recognition: 0.35, growth: 0.30, stress: 0.6, exhaustion: 0.4 }
  };

  const weight = weights[employeeType];

  const numerator = (
    weight.wlb * factors.workLifeBalance +
    weight.fairness * factors.fairness +
    weight.recognition * factors.recognition +
    weight.growth * factors.growth
  );

  const denominator = (
    weight.stress * factors.stress +
    weight.exhaustion * factors.exhaustion
  );

  // Avoid division by zero
  return denominator > 0 ? numerator / denominator : numerator;
};