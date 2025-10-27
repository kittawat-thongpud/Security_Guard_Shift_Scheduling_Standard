// Shift pattern specific types for the Security Guard Scheduling System

import { ShiftType } from './index';

export interface ShiftTypeConfig {
  id: string;
  name: ShiftType;
  duration: number; // hours
  description: string;
  commonPatterns: string[];
  legalConstraints: LegalConstraints;
}

export interface LegalConstraints {
  maxConsecutiveHours: number;
  minRestBetweenShifts: number;
  maxWeeklyHours: number;
  requiredBreakFrequency: number;
}

export interface SiteShiftPattern {
  siteId: string;
  patternName: string;
  shifts: SiteShiftRequirement[];
  totalDailyStaff: number;
  standbyRequirement: number;
  rotationStrategy: string;
}

export interface SiteShiftRequirement {
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  requiredStaff: number;
  minStaff: number;
  maxStaff: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Standard shift patterns
export const STANDARD_SHIFT_TYPES: ShiftTypeConfig[] = [
  {
    id: '4h',
    name: '4H',
    duration: 4,
    description: '4-hour shift for part-time or peak coverage',
    commonPatterns: ['Part-time', 'Peak coverage', 'Flexible scheduling'],
    legalConstraints: {
      maxConsecutiveHours: 6,
      minRestBetweenShifts: 8,
      maxWeeklyHours: 48,
      requiredBreakFrequency: 2
    }
  },
  {
    id: '8h',
    name: '8H',
    duration: 8,
    description: '8-hour standard shift',
    commonPatterns: ['8-8-8 Pattern', 'Day coverage', 'Standard rotation'],
    legalConstraints: {
      maxConsecutiveHours: 8,
      minRestBetweenShifts: 12,
      maxWeeklyHours: 48,
      requiredBreakFrequency: 1
    }
  },
  {
    id: '12h',
    name: '12H',
    duration: 12,
    description: '12-hour extended shift',
    commonPatterns: ['12-12 Pattern', 'Compressed week', 'Extended coverage'],
    legalConstraints: {
      maxConsecutiveHours: 12,
      minRestBetweenShifts: 12,
      maxWeeklyHours: 60,
      requiredBreakFrequency: 2
    }
  },
  {
    id: '24h',
    name: '24H',
    duration: 24,
    description: '24-hour continuous shift',
    commonPatterns: ['Emergency', 'Special events', 'Continuous operations'],
    legalConstraints: {
      maxConsecutiveHours: 24,
      minRestBetweenShifts: 24,
      maxWeeklyHours: 72,
      requiredBreakFrequency: 4
    }
  }
];

// Standard shift patterns
export const STANDARD_SHIFT_PATTERNS = {
  '8-8-8_STANDARD': {
    id: '8-8-8_STANDARD',
    patternName: '8-8-8 Standard',
    patternType: '8-8-8',
    shiftSequence: [
      {
        name: 'Morning',
        shiftType: '8H',
        startTime: '06:00',
        endTime: '14:00',
        requiredStaff: 4,
        minStaff: 3,
        maxStaff: 5,
        riskLevel: 'MEDIUM'
      },
      {
        name: 'Afternoon',
        shiftType: '8H',
        startTime: '14:00',
        endTime: '22:00',
        requiredStaff: 2,
        minStaff: 1,
        maxStaff: 3,
        riskLevel: 'HIGH'
      },
      {
        name: 'Night',
        shiftType: '8H',
        startTime: '22:00',
        endTime: '06:00',
        requiredStaff: 2,
        minStaff: 1,
        maxStaff: 3,
        riskLevel: 'HIGH'
      }
    ],
    timingConfig: {
      rotationStrategy: 'A',
      maxConsecutiveShifts: 3,
      minRestBetweenShifts: 12,
      standbyRequirement: 2
    },
    active: true,
    description: 'Standard 8-hour shift pattern with morning, afternoon, and night rotations'
  },
  '12-12_EXTENDED': {
    id: '12-12_EXTENDED',
    patternName: '12-12 Extended',
    patternType: '12-12',
    shiftSequence: [
      {
        name: 'Day',
        shiftType: '12H',
        startTime: '06:00',
        endTime: '18:00',
        requiredStaff: 3,
        minStaff: 2,
        maxStaff: 4,
        riskLevel: 'MEDIUM'
      },
      {
        name: 'Night',
        shiftType: '12H',
        startTime: '18:00',
        endTime: '06:00',
        requiredStaff: 3,
        minStaff: 2,
        maxStaff: 4,
        riskLevel: 'HIGH'
      }
    ],
    timingConfig: {
      rotationStrategy: 'B',
      maxConsecutiveShifts: 2,
      minRestBetweenShifts: 12,
      standbyRequirement: 1
    },
    active: true,
    description: 'Extended 12-hour shift pattern for continuous coverage'
  },
  '4H_FLEXIBLE': {
    id: '4H_FLEXIBLE',
    patternName: '4H Flexible',
    patternType: '4H',
    shiftSequence: [
      {
        name: 'Early Morning',
        shiftType: '4H',
        startTime: '06:00',
        endTime: '10:00',
        requiredStaff: 2,
        minStaff: 1,
        maxStaff: 3,
        riskLevel: 'LOW'
      },
      {
        name: 'Late Morning',
        shiftType: '4H',
        startTime: '10:00',
        endTime: '14:00',
        requiredStaff: 3,
        minStaff: 2,
        maxStaff: 4,
        riskLevel: 'MEDIUM'
      },
      {
        name: 'Early Afternoon',
        shiftType: '4H',
        startTime: '14:00',
        endTime: '18:00',
        requiredStaff: 4,
        minStaff: 3,
        maxStaff: 5,
        riskLevel: 'HIGH'
      },
      {
        name: 'Late Afternoon',
        shiftType: '4H',
        startTime: '18:00',
        endTime: '22:00',
        requiredStaff: 3,
        minStaff: 2,
        maxStaff: 4,
        riskLevel: 'HIGH'
      },
      {
        name: 'Early Night',
        shiftType: '4H',
        startTime: '22:00',
        endTime: '02:00',
        requiredStaff: 2,
        minStaff: 1,
        maxStaff: 3,
        riskLevel: 'MEDIUM'
      },
      {
        name: 'Late Night',
        shiftType: '4H',
        startTime: '02:00',
        endTime: '06:00',
        requiredStaff: 1,
        minStaff: 1,
        maxStaff: 2,
        riskLevel: 'LOW'
      }
    ],
    timingConfig: {
      rotationStrategy: 'C',
      maxConsecutiveShifts: 4,
      minRestBetweenShifts: 4,
      standbyRequirement: 1
    },
    active: true,
    description: 'Flexible 4-hour shift pattern for peak coverage and part-time staffing'
  }
};

export type StandardPatternKey = keyof typeof STANDARD_SHIFT_PATTERNS;