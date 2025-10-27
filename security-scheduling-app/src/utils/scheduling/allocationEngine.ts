import {
  Employee,
  Shift,
  SiteLocation,
  ShiftPattern,
  AllocationStrategy,
  RiskLevel,
  EmployeeType,
  ShiftType,
  DateRange
} from '../../types';

// Default allocation strategy
export const defaultAllocationStrategy: AllocationStrategy = {
  id: 'default',
  strategyName: 'Default Allocation Strategy',
  isDefault: true,

  // Risk multipliers for different risk levels
  riskMultipliers: {
    LOW: 1.0,
    MEDIUM: 1.2,
    HIGH: 1.5
  },

  // Time slot configuration
  timeSlotConfig: {
    peakHours: { start: '06:00', end: '18:00', multiplier: 1.2 },
    normalHours: { start: '18:00', end: '22:00', multiplier: 1.0 },
    lowHours: { start: '22:00', end: '06:00', multiplier: 0.8 }
  },

  // Rotation patterns
  rotationPatterns: [
    {
      name: 'Standard 8-8-8',
      sequence: ['06:00-14:00', '14:00-22:00', '22:00-06:00'],
      description: 'Standard 3-shift rotation'
    },
    {
      name: '12-12 Pattern',
      sequence: ['06:00-18:00', '18:00-06:00'],
      description: '12-hour shift pattern'
    },
    {
      name: '4H Pattern',
      sequence: ['06:00-10:00', '10:00-14:00', '14:00-18:00', '18:00-22:00'],
      description: '4-hour shift pattern'
    }
  ],

  // Allocation constraints
  constraints: {
    maxConsecutiveNights: 3,
    minRestHours: 11,
    maxWeeklyOT: 20,
    maxConsecutiveDays: 5
  }
};

// Allocation result interface
export interface AllocationResult {
  shift: Shift;
  assignedEmployees: Employee[];
  score: number;
  violations: string[];
  happinessImpact: number;
}

// Employee suitability score interface
export interface EmployeeSuitability {
  employee: Employee;
  score: number;
  breakdown: {
    preferenceMatch: number;
    skillMatch: number;
    constraintCompliance: number;
    fairnessScore: number;
    happinessImpact: number;
  };
  violations: string[];
}

// Main allocation engine
export class AllocationEngine {
  private strategy: AllocationStrategy;

  constructor(strategy: AllocationStrategy = defaultAllocationStrategy) {
    this.strategy = strategy;
  }

  // Generate optimal allocation for a shift
  public allocateShift(
    shift: Shift,
    availableEmployees: Employee[],
    site: SiteLocation,
    allShifts: Shift[],
    dateRange: DateRange
  ): AllocationResult {
    const suitableEmployees = this.findSuitableEmployees(
      shift,
      availableEmployees,
      site,
      allShifts,
      dateRange
    );

    // Sort by suitability score
    suitableEmployees.sort((a, b) => b.score - a.score);

    // Select top employees based on required staff
    const selectedEmployees = suitableEmployees
      .slice(0, shift.requiredStaff)
      .map(s => s.employee);

    // Calculate overall score and violations
    const score = this.calculateAllocationScore(suitableEmployees, selectedEmployees.length, shift.requiredStaff);
    const violations = this.aggregateViolations(suitableEmployees);
    const happinessImpact = this.calculateHappinessImpact(selectedEmployees, shift, allShifts);

    return {
      shift,
      assignedEmployees: selectedEmployees,
      score,
      violations,
      happinessImpact
    };
  }

  // Find suitable employees for a shift
  private findSuitableEmployees(
    shift: Shift,
    availableEmployees: Employee[],
    site: SiteLocation,
    allShifts: Shift[],
    dateRange: DateRange
  ): EmployeeSuitability[] {
    return availableEmployees.map(employee => {
      const suitability = this.calculateEmployeeSuitability(
        employee,
        shift,
        site,
        allShifts,
        dateRange
      );
      return suitability;
    }).filter(suitability => suitability.score > 0); // Only include suitable employees
  }

  // Calculate employee suitability score
  private calculateEmployeeSuitability(
    employee: Employee,
    shift: Shift,
    site: SiteLocation,
    allShifts: Shift[],
    dateRange: DateRange
  ): EmployeeSuitability {
    const violations: string[] = [];
    let totalScore = 0;

    // 1. Preference match (30% weight)
    const preferenceScore = this.calculatePreferenceMatch(employee, shift, violations);
    totalScore += preferenceScore * 0.3;

    // 2. Skill and certification match (25% weight)
    const skillScore = this.calculateSkillMatch(employee, site, violations);
    totalScore += skillScore * 0.25;

    // 3. Constraint compliance (25% weight)
    const constraintScore = this.calculateConstraintCompliance(employee, shift, allShifts, dateRange, violations);
    totalScore += constraintScore * 0.25;

    // 4. Fairness consideration (20% weight)
    const fairnessScore = this.calculateFairnessScore(employee, allShifts, dateRange);
    totalScore += fairnessScore * 0.2;

    // Apply risk multiplier
    const riskMultiplier = this.strategy.riskMultipliers[site.riskLevel];
    totalScore *= riskMultiplier;

    // Apply time slot multiplier
    const timeMultiplier = this.getTimeSlotMultiplier(shift.startTime);
    totalScore *= timeMultiplier;

    // Calculate happiness impact
    const happinessImpact = this.calculateIndividualHappinessImpact(employee, shift, allShifts);

    return {
      employee,
      score: Math.max(0, Math.min(1, totalScore)),
      breakdown: {
        preferenceMatch: preferenceScore,
        skillMatch: skillScore,
        constraintCompliance: constraintScore,
        fairnessScore: fairnessScore,
        happinessImpact
      },
      violations
    };
  }

  // Calculate preference match score
  private calculatePreferenceMatch(employee: Employee, shift: Shift, violations: string[]): number {
    let score = 0;

    // Shift type preference
    const prefersShiftType = employee.preferences.preferredShiftTypes.includes(shift.shiftType);
    if (prefersShiftType) {
      score += 0.4;
    } else {
      violations.push(`Shift type ${shift.shiftType} not preferred`);
    }

    // Time slot preference
    const shiftTimeSlot = `${shift.startTime}-${shift.endTime}`;
    const prefersTimeSlot = employee.preferences.preferredTimeSlots.includes(shiftTimeSlot);
    if (prefersTimeSlot) {
      score += 0.4;
    } else {
      violations.push(`Time slot ${shiftTimeSlot} not preferred`);
    }

    // Overtime willingness
    const isOvertime = this.isOvertimeShift(shift, employee);
    if (isOvertime && !employee.preferences.willingToWorkOvertime) {
      violations.push('Employee not willing to work overtime');
      score -= 0.2;
    }

    // Standby availability
    if (shift.shiftType === '24H' && !employee.preferences.standbyAvailability) {
      violations.push('Employee not available for standby');
      score -= 0.2;
    }

    return Math.max(0, score);
  }

  // Calculate skill and certification match
  private calculateSkillMatch(employee: Employee, site: SiteLocation, violations: string[]): number {
    let score = 0;

    // Basic security certification check
    const hasBasicCert = employee.certifications.includes('Basic Security');
    if (hasBasicCert) {
      score += 0.3;
    } else {
      violations.push('Missing basic security certification');
    }

    // Risk level specific certifications
    if (site.riskLevel === 'HIGH') {
      const hasAdvancedCert = employee.certifications.some(cert =>
        cert.includes('Advanced') || cert.includes('Specialized')
      );
      if (hasAdvancedCert) {
        score += 0.4;
      } else {
        violations.push('Missing advanced certification for high-risk site');
      }
    } else {
      score += 0.4; // Medium and low risk sites don't require advanced certs
    }

    // Employee type consideration
    if (site.riskLevel === 'HIGH' && employee.employeeType === 'SUPERVISORY') {
      score += 0.3;
    }

    return Math.max(0, score);
  }

  // Calculate constraint compliance
  private calculateConstraintCompliance(
    employee: Employee,
    shift: Shift,
    allShifts: Shift[],
    dateRange: DateRange,
    violations: string[]
  ): number {
    let score = 1.0; // Start with perfect score

    // Check consecutive days
    const employeeShifts = allShifts.filter(s => s.assignedEmployees.includes(employee.id));
    const consecutiveDays = this.calculateConsecutiveDays([...employeeShifts, shift]);
    if (consecutiveDays > employee.constraints.maxConsecutiveDays) {
      violations.push(`Exceeds max consecutive days (${consecutiveDays}/${employee.constraints.maxConsecutiveDays})`);
      score -= 0.3;
    }

    // Check rest periods
    const lastShift = this.getLastShift(employeeShifts, shift.shiftDate);
    if (lastShift) {
      const restHours = this.calculateRestHours(lastShift, shift);
      if (restHours < employee.constraints.legalRestPeriod) {
        violations.push(`Insufficient rest (${restHours}h/${employee.constraints.legalRestPeriod}h)`);
        score -= 0.3;
      }
    }

    // Check weekly hours
    const weeklyHours = this.calculateWeeklyHours([...employeeShifts, shift]);
    if (weeklyHours > employee.constraints.maxWeeklyHours) {
      const overtime = weeklyHours - employee.constraints.maxWeeklyHours;
      if (overtime > employee.constraints.maxWeeklyOvertime) {
        violations.push(`Exceeds max weekly overtime (${overtime}h/${employee.constraints.maxWeeklyOvertime}h)`);
        score -= 0.4;
      }
    }

    // Check consecutive night shifts
    if (this.isNightShift(shift)) {
      const consecutiveNights = this.calculateConsecutiveNightShifts([...employeeShifts, shift]);
      if (consecutiveNights > employee.constraints.maxConsecutiveNights) {
        violations.push(`Exceeds max consecutive night shifts (${consecutiveNights}/${employee.constraints.maxConsecutiveNights})`);
        score -= 0.3;
      }
    }

    return Math.max(0, score);
  }

  // Calculate fairness score
  private calculateFairnessScore(employee: Employee, allShifts: Shift[], dateRange: DateRange): number {
    const employeeShifts = allShifts.filter(s =>
      s.assignedEmployees.includes(employee.id) &&
      s.shiftDate >= dateRange.start &&
      s.shiftDate <= dateRange.end
    );

    const allEmployeeShifts = allShifts.filter(s =>
      s.shiftDate >= dateRange.start &&
      s.shiftDate <= dateRange.end
    );

    const avgShiftsPerEmployee = allEmployeeShifts.length / new Set(allEmployeeShifts.flatMap(s => s.assignedEmployees)).size;
    const employeeShiftCount = employeeShifts.length;

    // Lower score if employee has significantly more shifts than average
    if (employeeShiftCount > avgShiftsPerEmployee * 1.5) {
      return 0.5;
    }

    // Higher score if employee has fewer shifts than average
    if (employeeShiftCount < avgShiftsPerEmployee * 0.8) {
      return 1.0;
    }

    return 0.8; // Normal case
  }

  // Calculate allocation score
  private calculateAllocationScore(
    suitableEmployees: EmployeeSuitability[],
    assignedCount: number,
    requiredCount: number
  ): number {
    if (suitableEmployees.length === 0) return 0;

    const avgSuitability = suitableEmployees.reduce((sum, s) => sum + s.score, 0) / suitableEmployees.length;
    const coverageRate = assignedCount / requiredCount;

    return (avgSuitability * 0.7) + (coverageRate * 0.3);
  }

  // Aggregate violations from all suitable employees
  private aggregateViolations(suitableEmployees: EmployeeSuitability[]): string[] {
    const allViolations = suitableEmployees.flatMap(s => s.violations);
    return [...new Set(allViolations)]; // Remove duplicates
  }

  // Calculate happiness impact for selected employees
  private calculateHappinessImpact(employees: Employee[], shift: Shift, allShifts: Shift[]): number {
    if (employees.length === 0) return 0;

    // This would integrate with the happiness equation
    // For now, return a placeholder value
    return 0.8;
  }

  // Calculate individual happiness impact
  private calculateIndividualHappinessImpact(employee: Employee, shift: Shift, allShifts: Shift[]): number {
    // Placeholder implementation
    // This would integrate with the happiness equation
    return 0.8;
  }

  // Utility functions
  private isOvertimeShift(shift: Shift, employee: Employee): boolean {
    const shiftDuration = this.calculateShiftDuration(shift);
    return shiftDuration > 8; // More than 8 hours is overtime
  }

  private getTimeSlotMultiplier(startTime: string): number {
    const hour = parseInt(startTime.split(':')[0]);
    const config = this.strategy.timeSlotConfig;

    if (hour >= 6 && hour < 18) return config.peakHours.multiplier;
    if (hour >= 18 && hour < 22) return config.normalHours.multiplier;
    return config.lowHours.multiplier;
  }

  private calculateConsecutiveDays(shifts: Shift[]): number {
    if (shifts.length === 0) return 0;

    const sortedDates = [...new Set(shifts.map(s => s.shiftDate))].sort();
    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    return maxConsecutive;
  }

  private getLastShift(shifts: Shift[], beforeDate: string): Shift | null {
    const shiftsBefore = shifts.filter(s => s.shiftDate < beforeDate);
    if (shiftsBefore.length === 0) return null;

    return shiftsBefore.reduce((latest, shift) => {
      const latestDate = new Date(latest.shiftDate + 'T' + latest.endTime);
      const currentDate = new Date(shift.shiftDate + 'T' + shift.endTime);
      return currentDate > latestDate ? shift : latest;
    });
  }

  private calculateRestHours(previousShift: Shift, currentShift: Shift): number {
    const prevEnd = new Date(previousShift.shiftDate + 'T' + previousShift.endTime);
    const currStart = new Date(currentShift.shiftDate + 'T' + currentShift.startTime);

    // Handle overnight shifts
    if (currStart < prevEnd) {
      currStart.setDate(currStart.getDate() + 1);
    }

    return (currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60);
  }

  private calculateWeeklyHours(shifts: Shift[]): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentShifts = shifts.filter(shift => new Date(shift.shiftDate) >= oneWeekAgo);

    return recentShifts.reduce((total, shift) => {
      const duration = this.calculateShiftDuration(shift);
      return total + duration;
    }, 0);
  }

  private isNightShift(shift: Shift): boolean {
    const startHour = parseInt(shift.startTime.split(':')[0]);
    return startHour >= 22 || startHour < 6;
  }

  private calculateConsecutiveNightShifts(shifts: Shift[]): number {
    const nightShifts = shifts.filter(s => this.isNightShift(s));
    return this.calculateConsecutiveDays(nightShifts);
  }

  private calculateShiftDuration(shift: Shift): number {
    const start = new Date(shift.shiftDate + 'T' + shift.startTime);
    const end = new Date(shift.shiftDate + 'T' + shift.endTime);

    // Handle overnight shifts
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }
}

// Batch allocation for multiple shifts
export function batchAllocateShifts(
  shifts: Shift[],
  availableEmployees: Employee[],
  sites: SiteLocation[],
  allShifts: Shift[],
  dateRange: DateRange,
  strategy: AllocationStrategy = defaultAllocationStrategy
): AllocationResult[] {
  const engine = new AllocationEngine(strategy);
  const results: AllocationResult[] = [];

  // Sort shifts by priority (high risk first, then time)
  const sortedShifts = [...shifts].sort((a, b) => {
    const siteA = sites.find(s => s.id === a.siteId);
    const siteB = sites.find(s => s.id === b.siteId);

    if (!siteA || !siteB) return 0;

    const riskOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const riskDiff = riskOrder[siteB.riskLevel] - riskOrder[siteA.riskLevel];

    if (riskDiff !== 0) return riskDiff;

    // Same risk level, sort by time
    return new Date(a.shiftDate + 'T' + a.startTime).getTime() -
           new Date(b.shiftDate + 'T' + b.startTime).getTime();
  });

  // Allocate each shift
  for (const shift of sortedShifts) {
    const site = sites.find(s => s.id === shift.siteId);
    if (!site) continue;

    const result = engine.allocateShift(shift, availableEmployees, site, allShifts, dateRange);
    results.push(result);

    // Remove assigned employees from available pool for subsequent shifts
    // This prevents double-booking within the same allocation batch
    availableEmployees = availableEmployees.filter(emp =>
      !result.assignedEmployees.some(assigned => assigned.id === emp.id)
    );
  }

  return results;
}