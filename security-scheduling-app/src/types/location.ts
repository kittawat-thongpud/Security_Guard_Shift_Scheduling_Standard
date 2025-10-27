// Location and site management types for the Security Guard Scheduling System

import { RiskLevel } from './index';

export interface SiteConfiguration {
  id: string;
  siteName: string;
  address: string;
  riskLevel: RiskLevel;
  baseRequirement: number;
  operationalHours: OperationalHours;
  specialRequirements: string[];
  contactPerson: ContactPerson;
  emergencyProcedures: EmergencyProcedures;
  securityFeatures: SecurityFeature[];
  createdAt: string;
  updatedAt: string;
}

export interface OperationalHours {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
  is24Hours: boolean;
  peakHours: PeakHours[];
  holidaySchedule: HolidaySchedule;
}

export interface PeakHours {
  name: string;
  startTime: string;
  endTime: string;
  multiplier: number;
  description: string;
}

export interface HolidaySchedule {
  standardHolidays: string[];
  siteSpecificHolidays: string[];
  holidayMultiplier: number;
}

export interface ContactPerson {
  name: string;
  position: string;
  phone: string;
  email: string;
  emergencyContact: string;
}

export interface EmergencyProcedures {
  emergencyContacts: string[];
  evacuationPlan: string;
  incidentReporting: string;
  backupSite?: string;
}

export interface SecurityFeature {
  name: string;
  type: 'ACCESS_CONTROL' | 'SURVEILLANCE' | 'ALARM' | 'PATROL' | 'OTHER';
  description: string;
  maintenanceSchedule: string;
  critical: boolean;
}

// Risk assessment and allocation configuration
export interface RiskAssessment {
  siteId: string;
  assessmentDate: string;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  mitigationStrategies: MitigationStrategy[];
  recommendedStaffing: RecommendedStaffing;
}

export interface RiskFactor {
  category: 'CRIMINAL' | 'ENVIRONMENTAL' | 'OPERATIONAL' | 'HUMAN';
  factor: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: string;
}

export interface MitigationStrategy {
  strategy: string;
  requiredActions: string[];
  responsibleParty: string;
  timeline: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface RecommendedStaffing {
  baseStaffing: number;
  riskAdjustedStaffing: number;
  peakHourStaffing: number;
  holidayStaffing: number;
  standbyRequirement: number;
}

// Default site configurations
export const DEFAULT_SITES: SiteConfiguration[] = [
  {
    id: 'site-001',
    siteName: 'Corporate Headquarters',
    address: '123 Business District, Bangkok 10110',
    riskLevel: 'HIGH',
    baseRequirement: 8,
    operationalHours: {
      startTime: '06:00',
      endTime: '22:00',
      timezone: 'Asia/Bangkok',
      is24Hours: false,
      peakHours: [
        {
          name: 'Morning Rush',
          startTime: '07:00',
          endTime: '09:00',
          multiplier: 1.5,
          description: 'Employee arrival and building access'
        },
        {
          name: 'Evening Departure',
          startTime: '17:00',
          endTime: '19:00',
          multiplier: 1.3,
          description: 'Employee departure and visitor traffic'
        }
      ],
      holidaySchedule: {
        standardHolidays: ['2024-01-01', '2024-04-13', '2024-12-25'],
        siteSpecificHolidays: ['2024-03-15'],
        holidayMultiplier: 1.2
      }
    },
    specialRequirements: [
      'Access control at main entrance',
      'Patrol of parking areas',
      'Visitor escort service',
      'Emergency response team'
    ],
    contactPerson: {
      name: 'John Smith',
      position: 'Facility Manager',
      phone: '+66-81-234-5678',
      email: 'john.smith@company.com',
      emergencyContact: '+66-81-876-5432'
    },
    emergencyProcedures: {
      emergencyContacts: ['+66-191', '+66-199'],
      evacuationPlan: 'Primary exits: Main lobby, East wing, Parking garage',
      incidentReporting: 'Report to supervisor immediately, document in incident log',
      backupSite: 'Backup Operations Center'
    },
    securityFeatures: [
      {
        name: 'Main Entrance Access Control',
        type: 'ACCESS_CONTROL',
        description: 'Electronic card access with biometric verification',
        maintenanceSchedule: 'Monthly',
        critical: true
      },
      {
        name: 'CCTV Surveillance System',
        type: 'SURVEILLANCE',
        description: '360-degree coverage of all public areas',
        maintenanceSchedule: 'Quarterly',
        critical: true
      },
      {
        name: 'Perimeter Patrol',
        type: 'PATROL',
        description: 'Regular perimeter checks every 2 hours',
        maintenanceSchedule: 'Daily',
        critical: false
      }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'site-002',
    siteName: 'Retail Shopping Center',
    address: '456 Shopping Mall, Bangkok 10220',
    riskLevel: 'MEDIUM',
    baseRequirement: 6,
    operationalHours: {
      startTime: '10:00',
      endTime: '22:00',
      timezone: 'Asia/Bangkok',
      is24Hours: false,
      peakHours: [
        {
          name: 'Weekend Crowd',
          startTime: '14:00',
          endTime: '20:00',
          multiplier: 1.4,
          description: 'High customer traffic on weekends'
        },
        {
          name: 'Evening Shopping',
          startTime: '18:00',
          endTime: '21:00',
          multiplier: 1.2,
          description: 'After-work shopping hours'
        }
      ],
      holidaySchedule: {
        standardHolidays: ['2024-01-01', '2024-04-13', '2024-12-25'],
        siteSpecificHolidays: ['2024-11-11'],
        holidayMultiplier: 1.5
      }
    },
    specialRequirements: [
      'Customer service assistance',
      'Lost and found management',
      'Crowd control during events',
      'Parking lot security'
    ],
    contactPerson: {
      name: 'Maria Garcia',
      position: 'Mall Operations Manager',
      phone: '+66-82-345-6789',
      email: 'maria.garcia@mall.com',
      emergencyContact: '+66-82-987-6543'
    },
    emergencyProcedures: {
      emergencyContacts: ['+66-191', '+66-199'],
      evacuationPlan: 'Emergency exits at all anchor stores, Assembly point: Parking lot B',
      incidentReporting: 'Notify mall management and document incident',
      backupSite: 'Security Office Level 2'
    },
    securityFeatures: [
      {
        name: 'Shopping Mall CCTV',
        type: 'SURVEILLANCE',
        description: 'Complete coverage of common areas and entrances',
        maintenanceSchedule: 'Monthly',
        critical: true
      },
      {
        name: 'Public Address System',
        type: 'OTHER',
        description: 'Emergency announcements and general communications',
        maintenanceSchedule: 'Weekly',
        critical: false
      }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];