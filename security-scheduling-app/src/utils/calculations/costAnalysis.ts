import type { Shift, Employee, Budget, CostAnalysis, EmployeeWorkload } from '../../types';
import { calculateShiftHours } from '../scheduling/shiftPatterns';

export const calculateCostAnalysis = (
  shifts: Shift[],
  employees: Employee[],
  budget: Budget | null
): CostAnalysis => {
  let totalHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  let regularCost = 0;
  let overtimeCost = 0;

  shifts.forEach(shift => {
    const employee = employees.find(emp => emp.id === shift.employeeId);
    if (!employee) return;

    const hours = calculateShiftHours(shift.startTime, shift.endTime);
    totalHours += hours;

    if (shift.isOvertime) {
      overtimeHours += hours;
      overtimeCost += hours * employee.overtimeRate;
    } else {
      regularHours += hours;
      regularCost += hours * employee.hourlyRate;
    }
  });

  const totalCost = regularCost + overtimeCost;
  const budgetUtilization = budget ? (totalCost / budget.totalAmount) * 100 : 0;

  return {
    totalHours,
    regularHours,
    overtimeHours,
    regularCost,
    overtimeCost,
    totalCost,
    budgetUtilization,
  };
};

export const calculateEmployeeWorkloads = (
  shifts: Shift[],
  employees: Employee[],
  periodStart: string,
  periodEnd: string
): EmployeeWorkload[] => {
  return employees.map(employee => {
    const employeeShifts = shifts.filter(
      shift =>
        shift.employeeId === employee.id &&
        shift.date >= periodStart &&
        shift.date <= periodEnd
    );

    let totalHours = 0;
    let overtimeHours = 0;
    let consecutiveDays = 0;

    employeeShifts.forEach(shift => {
      const hours = calculateShiftHours(shift.startTime, shift.endTime);
      totalHours += hours;
      if (shift.isOvertime) {
        overtimeHours += hours;
      }
    });

    // Calculate consecutive days (simplified)
    const sortedDates = employeeShifts
      .map(shift => new Date(shift.date))
      .sort((a, b) => a.getTime() - b.getTime());

    let currentConsecutive = 1;
    let maxConsecutive = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currentDate = sortedDates[i];
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    consecutiveDays = maxConsecutive;

    // Calculate happiness score (simplified)
    const happinessScore = calculateEmployeeHappiness(employee, {
      totalHours,
      overtimeHours,
      consecutiveDays,
    });

    return {
      employeeId: employee.id,
      totalHours,
      overtimeHours,
      consecutiveDays,
      happinessScore,
    };
  });
};

const calculateEmployeeHappiness = (
  employee: Employee,
  workload: { totalHours: number; overtimeHours: number; consecutiveDays: number }
): number => {
  const { totalHours, overtimeHours, consecutiveDays } = workload;

  // Simplified happiness calculation based on workload factors
  let score = 5.0; // Start with perfect score

  // Deduct points for overtime
  if (overtimeHours > 0) {
    score -= (overtimeHours / totalHours) * 2;
  }

  // Deduct points for long consecutive days
  if (consecutiveDays > 5) {
    score -= (consecutiveDays - 5) * 0.2;
  }

  // Deduct points for exceeding preferred hours
  const preferredMaxHours = employee.maxWeeklyHours;
  if (totalHours > preferredMaxHours) {
    score -= ((totalHours - preferredMaxHours) / preferredMaxHours) * 3;
  }

  // Ensure score stays within reasonable bounds
  return Math.max(1.0, Math.min(5.0, score));
};

export const calculateBudgetUtilization = (
  costAnalysis: CostAnalysis,
  budget: Budget
): {
  usedAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  isOverBudget: boolean;
} => {
  const usedAmount = costAnalysis.totalCost;
  const remainingAmount = Math.max(0, budget.totalAmount - usedAmount);
  const utilizationPercentage = (usedAmount / budget.totalAmount) * 100;
  const isOverBudget = usedAmount > budget.totalAmount;

  return {
    usedAmount,
    remainingAmount,
    utilizationPercentage,
    isOverBudget,
  };
};

export const generateCostBreakdown = (
  shifts: Shift[],
  employees: Employee[]
): Array<{
  employeeName: string;
  regularHours: number;
  overtimeHours: number;
  regularCost: number;
  overtimeCost: number;
  totalCost: number;
}> => {
  return employees.map(employee => {
    const employeeShifts = shifts.filter(shift => shift.employeeId === employee.id);

    let regularHours = 0;
    let overtimeHours = 0;
    let regularCost = 0;
    let overtimeCost = 0;

    employeeShifts.forEach(shift => {
      const hours = calculateShiftHours(shift.startTime, shift.endTime);
      if (shift.isOvertime) {
        overtimeHours += hours;
        overtimeCost += hours * employee.overtimeRate;
      } else {
        regularHours += hours;
        regularCost += hours * employee.hourlyRate;
      }
    });

    const totalCost = regularCost + overtimeCost;

    return {
      employeeName: employee.name,
      regularHours,
      overtimeHours,
      regularCost,
      overtimeCost,
      totalCost,
    };
  }).filter(breakdown => breakdown.totalCost > 0);
};