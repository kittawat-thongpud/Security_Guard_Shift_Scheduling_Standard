// Core entity types for Security Guard Shift Scheduling System

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ShiftType = '4H' | '8H' | '12H' | '24H';
export type EmployeeType = 'NEW' | 'OPERATIONAL' | 'SUPERVISORY';
export type AssignmentStatus = 'PENDING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Employee related types
export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  hireDate: string;
  employeeType: EmployeeType;
  role: string;
  activeStatus: boolean;
  baseHappinessScore: number;
  createdAt: string;

  // Preferences and constraints
  preferences: EmployeePreferences;
  constraints: EmployeeConstraints;
  certifications: string[];
}

export interface EmployeePreferences {
  preferredShiftTypes: ShiftType[];
  preferredTimeSlots: string[];
  maxConsecutiveDays: number;
  minRestBetweenShifts: number; // hours
  willingToWorkOvertime: boolean;
  standbyAvailability: boolean;
}

export interface EmployeeConstraints {
  maxWeeklyHours: number;
  maxConsecutiveNights: number;
  maxWeeklyOvertime: number;
  requiredDaysOff: number;
  legalRestPeriod: number; // hours
}

// Site/Location related types
export interface SiteLocation {
  id: string;
  siteName: string;
  address: string;
  riskLevel: RiskLevel;
  baseRequirement: number;
  operationalHours: OperationalHours;
  specialRequirements: string[];
  createdAt: string;
}

export interface OperationalHours {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
  is24Hours: boolean;
}

// Shift pattern related types
export interface ShiftPattern {
  id: string;
  patternName: string;
  patternType: string;
  shiftSequence: ShiftSequence[];
  timingConfig: TimingConfig;
  active: boolean;
  description: string;
}

export interface ShiftSequence {
  name: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  requiredStaff: number;
  minStaff: number;
  maxStaff: number;
}

export interface TimingConfig {
  rotationStrategy: string;
  maxConsecutiveShifts: number;
  minRestBetweenShifts: number;
  standbyRequirement: number;
}

// Shift related types
export interface Shift {
  id: string;
  patternId: string;
  siteId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  requiredStaff: number;
  assignedEmployees: string[];
  kpiMetrics: KPIMetrics;
  status: AssignmentStatus;
  createdAt: string;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  assignmentStatus: AssignmentStatus;
  happinessImpact: number;
  assignedAt: string;
  completedAt?: string;
}

// Task management types
export interface Task {
  id: string;
  shiftId: string;
  taskName: string;
  description: string;
  priority: TaskPriority;
  estimatedDuration: number; // minutes
  requirements: string[];
  mandatory: boolean;
  assignedEmployeeId?: string;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  employeeId: string;
  completedAt: string;
  completionStatus: 'COMPLETED' | 'PARTIAL' | 'NOT_COMPLETED';
  notes: string;
  actualDuration: number; // minutes
}

// KPI and Analytics types
export interface KPIMetrics {
  coverageRate: number;
  unfilledPosts: number;
  securityIncidents: number;
  responseTime: number; // minutes
  happinessIndex: number;
  productivityRate: number;
  overtimeUtilization: number;
  costPerHour: number;
}

export interface KPI {
  id: string;
  kpiType: string;
  recordDate: string;
  value: number;
  employeeId?: string;
  shiftId?: string;
  metadata: Record<string, any>;
}

// Happiness equation configuration
export interface HappinessConfig {
  id: string;
  configName: string;
  wlbWeights: HappinessWeights;
  fairnessWeights: HappinessWeights;
  recognitionWeights: HappinessWeights;
  growthWeights: HappinessWeights;
  stressWeights: HappinessWeights;
  exhaustionWeights: HappinessWeights;
  roleModifiers: Record<EmployeeType, RoleModifier>;
  effectiveDate: string;
}

export interface HappinessWeights {
  baseWeight: number;
  factors: Record<string, number>;
}

export interface RoleModifier {
  wlb: number;
  fairness: number;
  recognition: number;
  growth: number;
}

// Allocation strategy types
export interface AllocationStrategy {
  id: string;
  strategyName: string;
  riskMultipliers: Record<RiskLevel, number>;
  timeSlotConfig: TimeSlotConfig;
  rotationPatterns: RotationPattern[];
  constraints: AllocationConstraints;
  isDefault: boolean;
}

export interface TimeSlotConfig {
  peakHours: { start: string; end: string; multiplier: number };
  normalHours: { start: string; end: string; multiplier: number };
  lowHours: { start: string; end: string; multiplier: number };
}

export interface RotationPattern {
  name: string;
  sequence: string[];
  description: string;
}

export interface AllocationConstraints {
  maxConsecutiveNights: number;
  minRestHours: number;
  maxWeeklyOT: number;
  maxConsecutiveDays: number;
}

// Export and reporting types
export type ExportFormat = 'JSON' | 'CSV' | 'EXCEL' | 'HTML' | 'PDF';
export type ReportTemplate = 'KPI_SUMMARY' | 'SHIFT_SCHEDULE' | 'EMPLOYEE_PERFORMANCE' | 'COST_ANALYSIS';

export interface ExportConfig {
  format: ExportFormat;
  type: 'RAW_DATA' | 'REPORT';
  template?: ReportTemplate;
  includeCharts: boolean;
  dateRange?: DateRange;
  filters?: ExportFilters;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface ExportFilters {
  employeeIds?: string[];
  siteIds?: string[];
  shiftTypes?: ShiftType[];
}

// Utility types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query: string;
  filters: Record<string, any>;
}