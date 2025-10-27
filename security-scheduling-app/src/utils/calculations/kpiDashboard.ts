import {
  Employee,
  Shift,
  SiteLocation,
  KPIMetrics,
  DateRange,
  RiskLevel,
  EmployeeType
} from '../../types';
import { calculateHappiness, defaultHappinessConfig } from './happinessEquation';

// KPI Dashboard configuration
export interface KPIDashboardConfig {
  includeHappinessMetrics: boolean;
  includeCostMetrics: boolean;
  includePerformanceMetrics: boolean;
  includeRiskMetrics: boolean;
  realTimeUpdateInterval: number; // milliseconds
}

// Default KPI dashboard configuration
export const defaultKPIDashboardConfig: KPIDashboardConfig = {
  includeHappinessMetrics: true,
  includeCostMetrics: true,
  includePerformanceMetrics: true,
  includeRiskMetrics: true,
  realTimeUpdateInterval: 30000 // 30 seconds
};

// Comprehensive KPI metrics
export interface ComprehensiveKPIMetrics extends KPIMetrics {
  // Happiness metrics
  averageHappiness: number;
  happinessDistribution: {
    veryLow: number; // 1-2
    low: number;     // 2-3
    medium: number;  // 3-4
    high: number;    // 4-5
  };

  // Cost metrics
  totalLaborCost: number;
  averageCostPerHour: number;
  overtimeCost: number;
  costEfficiency: number;

  // Performance metrics
  taskCompletionRate: number;
  incidentResponseTime: number;
  productivityRate: number;
  qualityScore: number;

  // Risk metrics
  riskCoverageScore: number;
  highRiskCoverage: number;
  complianceRate: number;
  safetyIncidents: number;

  // Staffing metrics
  employeeUtilization: number;
  turnoverRate: number;
  trainingCoverage: number;

  // Time-based metrics
  peakHourCoverage: number;
  weekendCoverage: number;
  holidayCoverage: number;
}

// KPI calculation engine
export class KPICalculationEngine {
  private config: KPIDashboardConfig;

  constructor(config: KPIDashboardConfig = defaultKPIDashboardConfig) {
    this.config = config;
  }

  // Calculate comprehensive KPIs for a date range
  public calculateComprehensiveKPIs(
    employees: Employee[],
    shifts: Shift[],
    sites: SiteLocation[],
    dateRange: DateRange
  ): ComprehensiveKPIMetrics {
    const filteredShifts = this.filterShiftsByDateRange(shifts, dateRange);

    return {
      // Basic metrics
      coverageRate: this.calculateCoverageRate(filteredShifts),
      unfilledPosts: this.calculateUnfilledPosts(filteredShifts),
      securityIncidents: this.calculateSecurityIncidents(filteredShifts),
      responseTime: this.calculateAverageResponseTime(filteredShifts),
      happinessIndex: this.calculateAverageHappiness(employees, filteredShifts),
      productivityRate: this.calculateProductivityRate(filteredShifts),
      overtimeUtilization: this.calculateOvertimeUtilization(employees, filteredShifts),
      costPerHour: this.calculateAverageCostPerHour(employees, filteredShifts),

      // Happiness metrics
      averageHappiness: this.calculateAverageHappiness(employees, filteredShifts),
      happinessDistribution: this.calculateHappinessDistribution(employees, filteredShifts),

      // Cost metrics
      totalLaborCost: this.calculateTotalLaborCost(employees, filteredShifts),
      averageCostPerHour: this.calculateAverageCostPerHour(employees, filteredShifts),
      overtimeCost: this.calculateOvertimeCost(employees, filteredShifts),
      costEfficiency: this.calculateCostEfficiency(employees, filteredShifts, sites),

      // Performance metrics
      taskCompletionRate: this.calculateTaskCompletionRate(filteredShifts),
      incidentResponseTime: this.calculateAverageResponseTime(filteredShifts),
      productivityRate: this.calculateProductivityRate(filteredShifts),
      qualityScore: this.calculateQualityScore(filteredShifts),

      // Risk metrics
      riskCoverageScore: this.calculateRiskCoverageScore(filteredShifts, sites),
      highRiskCoverage: this.calculateHighRiskCoverage(filteredShifts, sites),
      complianceRate: this.calculateComplianceRate(employees, filteredShifts),
      safetyIncidents: this.calculateSafetyIncidents(filteredShifts),

      // Staffing metrics
      employeeUtilization: this.calculateEmployeeUtilization(employees, filteredShifts),
      turnoverRate: this.calculateTurnoverRate(employees),
      trainingCoverage: this.calculateTrainingCoverage(employees),

      // Time-based metrics
      peakHourCoverage: this.calculatePeakHourCoverage(filteredShifts),
      weekendCoverage: this.calculateWeekendCoverage(filteredShifts),
      holidayCoverage: this.calculateHolidayCoverage(filteredShifts)
    };
  }

  // Calculate real-time KPIs (for dashboard updates)
  public calculateRealTimeKPIs(
    employees: Employee[],
    shifts: Shift[],
    sites: SiteLocation[]
  ): Partial<ComprehensiveKPIMetrics> {
    const today = new Date().toISOString().split('T')[0];
    const todayShifts = shifts.filter(shift => shift.shiftDate === today);

    return {
      coverageRate: this.calculateCoverageRate(todayShifts),
      unfilledPosts: this.calculateUnfilledPosts(todayShifts),
      averageHappiness: this.calculateAverageHappiness(employees, todayShifts),
      employeeUtilization: this.calculateEmployeeUtilization(employees, todayShifts),
      riskCoverageScore: this.calculateRiskCoverageScore(todayShifts, sites)
    };
  }

  // Calculate KPIs by site
  public calculateKPIsBySite(
    employees: Employee[],
    shifts: Shift[],
    sites: SiteLocation[],
    dateRange: DateRange
  ): Record<string, ComprehensiveKPIMetrics> {
    const result: Record<string, ComprehensiveKPIMetrics> = {};

    for (const site of sites) {
      const siteShifts = shifts.filter(shift => shift.siteId === site.id);
      const siteEmployees = employees.filter(emp =>
        siteShifts.some(shift => shift.assignedEmployees.includes(emp.id))
      );

      result[site.id] = this.calculateComprehensiveKPIs(
        siteEmployees,
        siteShifts,
        [site],
        dateRange
      );
    }

    return result;
  }

  // Calculate KPIs by employee type
  public calculateKPIsByEmployeeType(
    employees: Employee[],
    shifts: Shift[],
    sites: SiteLocation[],
    dateRange: DateRange
  ): Record<EmployeeType, Partial<ComprehensiveKPIMetrics>> {
    const result: Record<EmployeeType, Partial<ComprehensiveKPIMetrics>> = {
      NEW: {},
      OPERATIONAL: {},
      SUPERVISORY: {}
    };

    for (const employeeType of ['NEW', 'OPERATIONAL', 'SUPERVISORY'] as EmployeeType[]) {
      const typeEmployees = employees.filter(emp => emp.employeeType === employeeType);
      const typeShifts = shifts.filter(shift =>
        shift.assignedEmployees.some(empId =>
          typeEmployees.some(emp => emp.id === empId)
        )
      );

      result[employeeType] = {
        averageHappiness: this.calculateAverageHappiness(typeEmployees, typeShifts),
        employeeUtilization: this.calculateEmployeeUtilization(typeEmployees, typeShifts),
        productivityRate: this.calculateProductivityRate(typeShifts),
        costPerHour: this.calculateAverageCostPerHour(typeEmployees, typeShifts)
      };
    }

    return result;
  }

  // Calculate trend data for KPIs
  public calculateKPITrends(
    employees: Employee[],
    shifts: Shift[],
    sites: SiteLocation[],
    periods: number = 7 // Last 7 days
  ): Record<string, number[]> {
    const trends: Record<string, number[]> = {};
    const today = new Date();

    for (let i = 0; i < periods; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayShifts = shifts.filter(shift => shift.shiftDate === dateStr);
      const kpis = this.calculateRealTimeKPIs(employees, dayShifts, sites);

      for (const [key, value] of Object.entries(kpis)) {
        if (!trends[key]) {
          trends[key] = [];
        }
        trends[key].unshift(value as number);
      }
    }

    return trends;
  }

  // Private calculation methods

  private filterShiftsByDateRange(shifts: Shift[], dateRange: DateRange): Shift[] {
    return shifts.filter(shift =>
      shift.shiftDate >= dateRange.start && shift.shiftDate <= dateRange.end
    );
  }

  private calculateCoverageRate(shifts: Shift[]): number {
    if (shifts.length === 0) return 0;

    const totalRequired = shifts.reduce((sum, shift) => sum + shift.requiredStaff, 0);
    const totalAssigned = shifts.reduce((sum, shift) => sum + shift.assignedEmployees.length, 0);

    return totalRequired > 0 ? (totalAssigned / totalRequired) * 100 : 0;
  }

  private calculateUnfilledPosts(shifts: Shift[]): number {
    return shifts.reduce((sum, shift) => {
      return sum + Math.max(0, shift.requiredStaff - shift.assignedEmployees.length);
    }, 0);
  }

  private calculateSecurityIncidents(shifts: Shift[]): number {
    // Placeholder - would come from actual incident data
    return shifts.reduce((sum, shift) => sum + (shift.kpiMetrics?.securityIncidents || 0), 0);
  }

  private calculateAverageResponseTime(shifts: Shift[]): number {
    // Placeholder - would come from actual response time data
    const totalResponseTime = shifts.reduce((sum, shift) => {
      return sum + (shift.kpiMetrics?.responseTime || 5); // Default 5 minutes
    }, 0);

    return shifts.length > 0 ? totalResponseTime / shifts.length : 0;
  }

  private calculateAverageHappiness(employees: Employee[], shifts: Shift[]): number {
    if (employees.length === 0) return 0;

    let totalHappiness = 0;
    let employeeCount = 0;

    for (const employee of employees) {
      const assignedShifts = shifts.filter(shift =>
        shift.assignedEmployees.includes(employee.id)
      );

      if (assignedShifts.length > 0) {
        const happiness = calculateHappiness(
          employee,
          assignedShifts,
          employees,
          shifts,
          defaultHappinessConfig
        );
        totalHappiness += happiness;
        employeeCount++;
      }
    }

    return employeeCount > 0 ? totalHappiness / employeeCount : 0;
  }

  private calculateProductivityRate(shifts: Shift[]): number {
    // Placeholder - would come from actual productivity data
    return shifts.length > 0 ? 0.85 : 0; // Default 85%
  }

  private calculateOvertimeUtilization(employees: Employee[], shifts: Shift[]): number {
    // Placeholder - calculate actual overtime utilization
    return 0.15; // Default 15%
  }

  private calculateAverageCostPerHour(employees: Employee[], shifts: Shift[]): number {
    // Placeholder - would use actual cost data
    const totalHours = shifts.reduce((sum, shift) => {
      const duration = this.calculateShiftDuration(shift);
      return sum + (duration * shift.assignedEmployees.length);
    }, 0);

    const totalCost = this.calculateTotalLaborCost(employees, shifts);

    return totalHours > 0 ? totalCost / totalHours : 0;
  }

  private calculateHappinessDistribution(employees: Employee[], shifts: Shift[]): {
    veryLow: number;
    low: number;
    medium: number;
    high: number;
  } {
    const distribution = { veryLow: 0, low: 0, medium: 0, high: 0 };
    let totalEmployees = 0;

    for (const employee of employees) {
      const assignedShifts = shifts.filter(shift =>
        shift.assignedEmployees.includes(employee.id)
      );

      if (assignedShifts.length > 0) {
        const happiness = calculateHappiness(
          employee,
          assignedShifts,
          employees,
          shifts,
          defaultHappinessConfig
        );

        if (happiness <= 2) distribution.veryLow++;
        else if (happiness <= 3) distribution.low++;
        else if (happiness <= 4) distribution.medium++;
        else distribution.high++;

        totalEmployees++;
      }
    }

    if (totalEmployees > 0) {
      distribution.veryLow = (distribution.veryLow / totalEmployees) * 100;
      distribution.low = (distribution.low / totalEmployees) * 100;
      distribution.medium = (distribution.medium / totalEmployees) * 100;
      distribution.high = (distribution.high / totalEmployees) * 100;
    }

    return distribution;
  }

  private calculateTotalLaborCost(employees: Employee[], shifts: Shift[]): number {
    // Placeholder - would use actual cost data
    let totalCost = 0;

    for (const shift of shifts) {
      const duration = this.calculateShiftDuration(shift);
      const hourlyRate = 25; // Default hourly rate
      totalCost += duration * shift.assignedEmployees.length * hourlyRate;
    }

    return totalCost;
  }

  private calculateOvertimeCost(employees: Employee[], shifts: Shift[]): number {
    // Placeholder - calculate actual overtime costs
    return this.calculateTotalLaborCost(employees, shifts) * 0.15; // 15% overtime
  }

  private calculateCostEfficiency(employees: Employee[], shifts: Shift[], sites: SiteLocation[]): number {
    const totalCost = this.calculateTotalLaborCost(employees, shifts);
    const riskCoverage = this.calculateRiskCoverageScore(shifts, sites);

    // Higher efficiency when good coverage is achieved with lower cost
    return riskCoverage > 0 ? (riskCoverage / totalCost) * 1000 : 0; // Scale factor
  }

  private calculateTaskCompletionRate(shifts: Shift[]): number {
    // Placeholder - would come from actual task completion data
    return shifts.length > 0 ? 0.92 : 0; // Default 92%
  }

  private calculateQualityScore(shifts: Shift[]): number {
    // Placeholder - would come from quality metrics
    return shifts.length > 0 ? 0.88 : 0; // Default 88%
  }

  private calculateRiskCoverageScore(shifts: Shift[], sites: SiteLocation[]): number {
    if (shifts.length === 0) return 0;

    let totalScore = 0;
    let shiftCount = 0;

    for (const shift of shifts) {
      const site = sites.find(s => s.id === shift.siteId);
      if (!site) continue;

      const riskMultiplier = this.getRiskMultiplier(site.riskLevel);
      const coverageRate = shift.assignedEmployees.length / shift.requiredStaff;
      const score = riskMultiplier * coverageRate;

      totalScore += score;
      shiftCount++;
    }

    return shiftCount > 0 ? totalScore / shiftCount : 0;
  }

  private calculateHighRiskCoverage(shifts: Shift[], sites: SiteLocation[]): number {
    const highRiskShifts = shifts.filter(shift => {
      const site = sites.find(s => s.id === shift.siteId);
      return site?.riskLevel === 'HIGH';
    });

    return this.calculateCoverageRate(highRiskShifts);
  }

  private calculateComplianceRate(employees: Employee[], shifts: Shift[]): number {
    // Placeholder - would check actual compliance with regulations
    return 0.95; // Default 95%
  }

  private calculateSafetyIncidents(shifts: Shift[]): number {
    // Placeholder - would come from safety incident data
    return Math.floor(shifts.length * 0.01); // 1% of shifts have incidents
  }

  private calculateEmployeeUtilization(employees: Employee[], shifts: Shift[]): number {
    if (employees.length === 0) return 0;

    const totalPossibleHours = employees.length * 8 * 5; // 8 hours/day, 5 days/week
    const actualHours = shifts.reduce((sum, shift) => {
      const duration = this.calculateShiftDuration(shift);
      return sum + (duration * shift.assignedEmployees.length);
    }, 0);

    return totalPossibleHours > 0 ? (actualHours / totalPossibleHours) * 100 : 0;
  }

  private calculateTurnoverRate(employees: Employee[]): number {
    // Placeholder - would calculate actual turnover
    return 0.05; // Default 5%
  }

  private calculateTrainingCoverage(employees: Employee[]): number {
    // Placeholder - would check training completion
    const trainedEmployees = employees.filter(emp => emp.certifications.length >= 2);
    return employees.length > 0 ? (trainedEmployees.length / employees.length) * 100 : 0;
  }

  private calculatePeakHourCoverage(shifts: Shift[]): number {
    const peakShifts = shifts.filter(shift => {
      const hour = parseInt(shift.startTime.split(':')[0]);
      return hour >= 6 && hour < 18; // 6 AM to 6 PM
    });

    return this.calculateCoverageRate(peakShifts);
  }

  private calculateWeekendCoverage(shifts: Shift[]): number {
    const weekendShifts = shifts.filter(shift => {
      const date = new Date(shift.shiftDate);
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });

    return this.calculateCoverageRate(weekendShifts);
  }

  private calculateHolidayCoverage(shifts: Shift[]): number {
    // Placeholder - would check actual holiday coverage
    const holidayShifts = shifts.filter(shift => {
      // This would check if the date is a holiday
      return false;
    });

    return this.calculateCoverageRate(holidayShifts);
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

  private getRiskMultiplier(riskLevel: RiskLevel): number {
    switch (riskLevel) {
      case 'LOW': return 1.0;
      case 'MEDIUM': return 1.5;
      case 'HIGH': return 2.0;
      default: return 1.0;
    }
  }
}