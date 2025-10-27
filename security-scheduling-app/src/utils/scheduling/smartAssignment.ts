import {
  Employee,
  Shift,
  SiteLocation,
  ShiftPattern,
  DateRange,
  AllocationStrategy,
  RiskLevel
} from '../../types';
import { AllocationEngine, batchAllocateShifts, AllocationResult } from './allocationEngine';
import { calculateHappiness, defaultHappinessConfig } from '../calculations/happinessEquation';

// Smart assignment configuration
export interface SmartAssignmentConfig {
  maxIterations: number;
  happinessWeight: number;
  coverageWeight: number;
  fairnessWeight: number;
  riskWeight: number;
  enableHappinessOptimization: boolean;
  enableFairnessOptimization: boolean;
  enableRiskOptimization: boolean;
}

// Default smart assignment configuration
export const defaultSmartAssignmentConfig: SmartAssignmentConfig = {
  maxIterations: 100,
  happinessWeight: 0.4,
  coverageWeight: 0.3,
  fairnessWeight: 0.2,
  riskWeight: 0.1,
  enableHappinessOptimization: true,
  enableFairnessOptimization: true,
  enableRiskOptimization: true
};

// Assignment optimization result
export interface AssignmentOptimization {
  allocationResults: AllocationResult[];
  overallScore: number;
  happinessScore: number;
  coverageScore: number;
  fairnessScore: number;
  riskScore: number;
  violations: string[];
  iterationCount: number;
  improvementHistory: number[];
}

// Smart assignment algorithm
export class SmartAssignmentAlgorithm {
  private config: SmartAssignmentConfig;
  private allocationEngine: AllocationEngine;

  constructor(
    allocationStrategy?: AllocationStrategy,
    config: SmartAssignmentConfig = defaultSmartAssignmentConfig
  ) {
    this.config = config;
    this.allocationEngine = new AllocationEngine(allocationStrategy);
  }

  // Main smart assignment method
  public optimizeAssignment(
    shifts: Shift[],
    employees: Employee[],
    sites: SiteLocation[],
    patterns: ShiftPattern[],
    dateRange: DateRange
  ): AssignmentOptimization {
    const improvementHistory: number[] = [];
    let bestAllocation: AllocationResult[] = [];
    let bestScore = -Infinity;

    // Initial allocation
    let currentAllocation = batchAllocateShifts(
      shifts,
      employees,
      sites,
      [], // No previous shifts for initial allocation
      dateRange
    );

    let currentScore = this.calculateOverallScore(currentAllocation, employees, shifts, sites);
    bestAllocation = [...currentAllocation];
    bestScore = currentScore;
    improvementHistory.push(currentScore);

    // Optimization iterations
    for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
      const candidateAllocation = this.generateCandidate(currentAllocation, employees, shifts, sites, dateRange);
      const candidateScore = this.calculateOverallScore(candidateAllocation, employees, shifts, sites);

      // Accept candidate if it improves the score
      if (candidateScore > currentScore) {
        currentAllocation = candidateAllocation;
        currentScore = candidateScore;
        improvementHistory.push(currentScore);

        // Update best allocation
        if (candidateScore > bestScore) {
          bestAllocation = [...candidateAllocation];
          bestScore = candidateScore;
        }
      }

      // Early termination if no improvement for several iterations
      if (iteration > 10 && improvementHistory.slice(-5).every(score => score <= bestScore)) {
        break;
      }
    }

    // Calculate final scores
    const finalScores = this.calculateComponentScores(bestAllocation, employees, shifts, sites);

    return {
      allocationResults: bestAllocation,
      overallScore: bestScore,
      happinessScore: finalScores.happiness,
      coverageScore: finalScores.coverage,
      fairnessScore: finalScores.fairness,
      riskScore: finalScores.risk,
      violations: this.aggregateViolations(bestAllocation),
      iterationCount: improvementHistory.length,
      improvementHistory
    };
  }

  // Generate candidate allocation by making small changes
  private generateCandidate(
    currentAllocation: AllocationResult[],
    employees: Employee[],
    shifts: Shift[],
    sites: SiteLocation[],
    dateRange: DateRange
  ): AllocationResult[] {
    const candidate = [...currentAllocation];

    // Randomly select a mutation operation
    const operations = [
      () => this.swapEmployees(candidate, employees),
      () => this.reassignShift(candidate, employees, shifts, sites, dateRange),
      () => this.rotateAssignment(candidate, employees)
    ];

    const randomOperation = operations[Math.floor(Math.random() * operations.length)];
    randomOperation();

    return candidate;
  }

  // Swap two employees between shifts
  private swapEmployees(allocation: AllocationResult[], employees: Employee[]): void {
    const shift1Index = Math.floor(Math.random() * allocation.length);
    const shift2Index = Math.floor(Math.random() * allocation.length);

    if (shift1Index === shift2Index) return;

    const shift1 = allocation[shift1Index];
    const shift2 = allocation[shift2Index];

    if (shift1.assignedEmployees.length === 0 || shift2.assignedEmployees.length === 0) return;

    const emp1Index = Math.floor(Math.random() * shift1.assignedEmployees.length);
    const emp2Index = Math.floor(Math.random() * shift2.assignedEmployees.length);

    const temp = shift1.assignedEmployees[emp1Index];
    shift1.assignedEmployees[emp1Index] = shift2.assignedEmployees[emp2Index];
    shift2.assignedEmployees[emp2Index] = temp;
  }

  // Reassign a random shift
  private reassignShift(
    allocation: AllocationResult[],
    employees: Employee[],
    shifts: Shift[],
    sites: SiteLocation[],
    dateRange: DateRange
  ): void {
    const shiftIndex = Math.floor(Math.random() * allocation.length);
    const shift = allocation[shiftIndex].shift;
    const site = sites.find(s => s.id === shift.siteId);

    if (!site) return;

    // Get available employees (not assigned to this shift)
    const availableEmployees = employees.filter(emp =>
      !allocation[shiftIndex].assignedEmployees.some(assigned => assigned.id === emp.id)
    );

    // Reallocate this shift
    const result = this.allocationEngine.allocateShift(
      shift,
      availableEmployees,
      site,
      allocation.flatMap(a => a.shift),
      dateRange
    );

    allocation[shiftIndex] = result;
  }

  // Rotate assignments within a pattern
  private rotateAssignment(allocation: AllocationResult[], employees: Employee[]): void {
    // Find shifts that belong to the same pattern and site
    const patternGroups = this.groupShiftsByPattern(allocation);

    if (patternGroups.size === 0) return;

    // Select a random pattern group
    const groups = Array.from(patternGroups.values());
    const group = groups[Math.floor(Math.random() * groups.length)];

    if (group.length < 2) return;

    // Rotate employees within the group
    const firstShift = group[0];
    const tempEmployees = [...firstShift.assignedEmployees];

    for (let i = 0; i < group.length - 1; i++) {
      group[i].assignedEmployees = [...group[i + 1].assignedEmployees];
    }

    group[group.length - 1].assignedEmployees = tempEmployees;
  }

  // Calculate overall optimization score
  private calculateOverallScore(
    allocation: AllocationResult[],
    employees: Employee[],
    shifts: Shift[],
    sites: SiteLocation[]
  ): number {
    const scores = this.calculateComponentScores(allocation, employees, shifts, sites);

    let totalScore = 0;

    if (this.config.enableHappinessOptimization) {
      totalScore += scores.happiness * this.config.happinessWeight;
    }

    if (this.config.enableFairnessOptimization) {
      totalScore += scores.fairness * this.config.fairnessWeight;
    }

    if (this.config.enableRiskOptimization) {
      totalScore += scores.risk * this.config.riskWeight;
    }

    totalScore += scores.coverage * this.config.coverageWeight;

    return totalScore;
  }

  // Calculate individual component scores
  private calculateComponentScores(
    allocation: AllocationResult[],
    employees: Employee[],
    shifts: Shift[],
    sites: SiteLocation[]
  ) {
    return {
      happiness: this.calculateHappinessScore(allocation, employees),
      coverage: this.calculateCoverageScore(allocation),
      fairness: this.calculateFairnessScore(allocation, employees),
      risk: this.calculateRiskScore(allocation, sites)
    };
  }

  // Calculate happiness score
  private calculateHappinessScore(allocation: AllocationResult[], employees: Employee[]): number {
    if (allocation.length === 0) return 0;

    const allShifts = allocation.map(a => a.shift);
    let totalHappiness = 0;
    let employeeCount = 0;

    for (const employee of employees) {
      const assignedShifts = allShifts.filter(shift =>
        shift.assignedEmployees.includes(employee.id)
      );

      if (assignedShifts.length > 0) {
        const happiness = calculateHappiness(
          employee,
          assignedShifts,
          employees,
          allShifts,
          defaultHappinessConfig
        );
        totalHappiness += happiness;
        employeeCount++;
      }
    }

    return employeeCount > 0 ? totalHappiness / employeeCount / 5 : 0; // Normalize to 0-1
  }

  // Calculate coverage score
  private calculateCoverageScore(allocation: AllocationResult[]): number {
    if (allocation.length === 0) return 0;

    let totalCoverage = 0;

    for (const result of allocation) {
      const coverageRate = result.assignedEmployees.length / result.shift.requiredStaff;
      totalCoverage += Math.min(1, coverageRate);
    }

    return totalCoverage / allocation.length;
  }

  // Calculate fairness score
  private calculateFairnessScore(allocation: AllocationResult[], employees: Employee[]): number {
    if (allocation.length === 0 || employees.length === 0) return 0;

    const allShifts = allocation.map(a => a.shift);
    const shiftCounts = new Map<string, number>();

    // Count shifts per employee
    for (const employee of employees) {
      const count = allShifts.filter(shift =>
        shift.assignedEmployees.includes(employee.id)
      ).length;
      shiftCounts.set(employee.id, count);
    }

    // Calculate fairness (lower variance is better)
    const counts = Array.from(shiftCounts.values());
    const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length;

    // Convert variance to fairness score (lower variance = higher fairness)
    return Math.max(0, 1 - (variance / (mean || 1)));
  }

  // Calculate risk score
  private calculateRiskScore(allocation: AllocationResult[], sites: SiteLocation[]): number {
    if (allocation.length === 0) return 0;

    let totalRiskScore = 0;
    let shiftCount = 0;

    for (const result of allocation) {
      const site = sites.find(s => s.id === result.shift.siteId);
      if (!site) continue;

      const riskMultiplier = this.getRiskMultiplier(site.riskLevel);
      const coverageRate = result.assignedEmployees.length / result.shift.requiredStaff;

      // Higher risk sites should have better coverage
      const riskScore = riskMultiplier * coverageRate;
      totalRiskScore += riskScore;
      shiftCount++;
    }

    return shiftCount > 0 ? totalRiskScore / shiftCount : 0;
  }

  // Group shifts by pattern
  private groupShiftsByPattern(allocation: AllocationResult[]): Map<string, AllocationResult[]> {
    const groups = new Map<string, AllocationResult[]>();

    for (const result of allocation) {
      const key = `${result.shift.patternId}-${result.shift.siteId}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(result);
    }

    return groups;
  }

  // Aggregate violations from all allocations
  private aggregateViolations(allocation: AllocationResult[]): string[] {
    const allViolations = allocation.flatMap(result => result.violations);
    return [...new Set(allViolations)]; // Remove duplicates
  }

  // Get risk multiplier
  private getRiskMultiplier(riskLevel: RiskLevel): number {
    switch (riskLevel) {
      case 'LOW': return 1.0;
      case 'MEDIUM': return 1.5;
      case 'HIGH': return 2.0;
      default: return 1.0;
    }
  }
}

// Utility function for quick assignment
export function quickAssign(
  shifts: Shift[],
  employees: Employee[],
  sites: SiteLocation[],
  dateRange: DateRange,
  strategy?: AllocationStrategy
): AssignmentOptimization {
  const algorithm = new SmartAssignmentAlgorithm(strategy, {
    ...defaultSmartAssignmentConfig,
    maxIterations: 50 // Faster but less optimal
  });

  return algorithm.optimizeAssignment(shifts, employees, sites, [], dateRange);
}

// Utility function for comprehensive assignment
export function comprehensiveAssign(
  shifts: Shift[],
  employees: Employee[],
  sites: SiteLocation[],
  patterns: ShiftPattern[],
  dateRange: DateRange,
  strategy?: AllocationStrategy
): AssignmentOptimization {
  const algorithm = new SmartAssignmentAlgorithm(strategy, {
    ...defaultSmartAssignmentConfig,
    maxIterations: 200, // More iterations for better optimization
    enableHappinessOptimization: true,
    enableFairnessOptimization: true,
    enableRiskOptimization: true
  });

  return algorithm.optimizeAssignment(shifts, employees, sites, patterns, dateRange);
}