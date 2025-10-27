import {
  Employee,
  Shift,
  HappinessConfig,
  HappinessWeights,
  EmployeeType,
  ShiftType
} from '../../types';

// Default happiness configuration
export const defaultHappinessConfig: HappinessConfig = {
  id: 'default',
  configName: 'Default Happiness Configuration',
  effectiveDate: new Date().toISOString(),

  // Work-Life Balance weights
  wlbWeights: {
    baseWeight: 0.25,
    factors: {
      consecutiveDays: 0.3,
      restBetweenShifts: 0.25,
      weekendWork: 0.2,
      overtimeHours: 0.15,
      nightShifts: 0.1
    }
  },

  // Fairness weights
  fairnessWeights: {
    baseWeight: 0.20,
    factors: {
      shiftDistribution: 0.4,
      overtimeDistribution: 0.3,
      weekendDistribution: 0.2,
      holidayDistribution: 0.1
    }
  },

  // Recognition weights
  recognitionWeights: {
    baseWeight: 0.15,
    factors: {
      taskCompletion: 0.4,
      incidentResponse: 0.3,
      positiveFeedback: 0.2,
      certificationProgress: 0.1
    }
  },

  // Growth weights
  growthWeights: {
    baseWeight: 0.15,
    factors: {
      skillDevelopment: 0.4,
      crossTraining: 0.3,
      leadershipOpportunities: 0.2,
      certificationProgress: 0.1
    }
  },

  // Stress weights (negative impact)
  stressWeights: {
    baseWeight: -0.15,
    factors: {
      highRiskShifts: 0.4,
      consecutiveNights: 0.3,
      emergencyCalls: 0.2,
      equipmentIssues: 0.1
    }
  },

  // Exhaustion weights (negative impact)
  exhaustionWeights: {
    baseWeight: -0.10,
    factors: {
      longShifts: 0.5,
      shortRestPeriods: 0.3,
      highWorkload: 0.2
    }
  },

  // Role modifiers
  roleModifiers: {
    NEW: { wlb: 1.1, fairness: 1.0, recognition: 1.2, growth: 1.3 },
    OPERATIONAL: { wlb: 1.0, fairness: 1.0, recognition: 1.0, growth: 1.0 },
    SUPERVISORY: { wlb: 0.9, fairness: 1.1, recognition: 1.1, growth: 0.9 }
  }
};

// Calculate work-life balance score
export function calculateWorkLifeBalance(
  employee: Employee,
  assignedShifts: Shift[],
  config: HappinessConfig
): number {
  const weights = config.wlbWeights;
  let score = 0;

  // Calculate consecutive days worked
  const consecutiveDays = calculateConsecutiveDays(assignedShifts);
  const maxConsecutive = employee.constraints.maxConsecutiveDays;
  const consecutiveScore = Math.max(0, 1 - (consecutiveDays / maxConsecutive));
  score += consecutiveScore * weights.factors.consecutiveDays;

  // Calculate rest between shifts
  const avgRestHours = calculateAverageRestHours(assignedShifts);
  const minRequiredRest = employee.constraints.legalRestPeriod;
  const restScore = Math.min(1, avgRestHours / minRequiredRest);
  score += restScore * weights.factors.restBetweenShifts;

  // Calculate weekend work impact
  const weekendShifts = assignedShifts.filter(shift => isWeekendShift(shift)).length;
  const totalShifts = assignedShifts.length;
  const weekendScore = totalShifts > 0 ? 1 - (weekendShifts / totalShifts) : 1;
  score += weekendScore * weights.factors.weekendWork;

  // Calculate overtime impact
  const weeklyHours = calculateWeeklyHours(assignedShifts);
  const maxWeeklyHours = employee.constraints.maxWeeklyHours;
  const overtimeScore = Math.max(0, 1 - (Math.max(0, weeklyHours - maxWeeklyHours) / maxWeeklyHours));
  score += overtimeScore * weights.factors.overtimeHours;

  // Calculate night shift impact
  const nightShifts = assignedShifts.filter(shift => isNightShift(shift)).length;
  const nightScore = totalShifts > 0 ? 1 - (nightShifts / totalShifts) : 1;
  score += nightScore * weights.factors.nightShifts;

  return score * weights.baseWeight;
}

// Calculate fairness score
export function calculateFairness(
  employee: Employee,
  allEmployees: Employee[],
  allShifts: Shift[],
  config: HappinessConfig
): number {
  const weights = config.fairnessWeights;
  let score = 0;

  // Calculate shift distribution fairness
  const employeeShifts = allShifts.filter(shift => shift.assignedEmployees.includes(employee.id));
  const avgShiftsPerEmployee = allShifts.length / allEmployees.length;
  const shiftDistributionScore = Math.min(1, employeeShifts.length / avgShiftsPerEmployee);
  score += shiftDistributionScore * weights.factors.shiftDistribution;

  // Calculate overtime distribution
  const employeeOvertime = calculateOvertimeHours(employeeShifts, employee);
  const avgOvertime = allEmployees.reduce((sum, emp) => {
    const empShifts = allShifts.filter(shift => shift.assignedEmployees.includes(emp.id));
    return sum + calculateOvertimeHours(empShifts, emp);
  }, 0) / allEmployees.length;
  const overtimeScore = avgOvertime > 0 ? Math.min(1, employeeOvertime / avgOvertime) : 1;
  score += overtimeScore * weights.factors.overtimeDistribution;

  // Calculate weekend distribution
  const employeeWeekendShifts = employeeShifts.filter(shift => isWeekendShift(shift)).length;
  const avgWeekendShifts = allEmployees.reduce((sum, emp) => {
    const empShifts = allShifts.filter(shift => shift.assignedEmployees.includes(emp.id));
    return sum + empShifts.filter(shift => isWeekendShift(shift)).length;
  }, 0) / allEmployees.length;
  const weekendScore = avgWeekendShifts > 0 ? Math.min(1, employeeWeekendShifts / avgWeekendShifts) : 1;
  score += weekendScore * weights.factors.weekendDistribution;

  return score * weights.baseWeight;
}

// Calculate recognition score
export function calculateRecognition(
  employee: Employee,
  config: HappinessConfig
): number {
  const weights = config.recognitionWeights;
  let score = 0;

  // Task completion rate (placeholder - would come from actual data)
  const taskCompletionRate = 0.85; // Default value
  score += taskCompletionRate * weights.factors.taskCompletion;

  // Incident response effectiveness (placeholder)
  const incidentResponseScore = 0.9; // Default value
  score += incidentResponseScore * weights.factors.incidentResponse;

  // Positive feedback (placeholder)
  const positiveFeedbackScore = 0.8; // Default value
  score += positiveFeedbackScore * weights.factors.positiveFeedback;

  // Certification progress
  const certificationProgress = employee.certifications.length / 5; // Assuming 5 possible certifications
  score += certificationProgress * weights.factors.certificationProgress;

  return score * weights.baseWeight;
}

// Calculate growth score
export function calculateGrowth(
  employee: Employee,
  config: HappinessConfig
): number {
  const weights = config.growthWeights;
  let score = 0;

  // Skill development (based on shift variety)
  const shiftVariety = calculateShiftVariety(employee);
  score += shiftVariety * weights.factors.skillDevelopment;

  // Cross-training opportunities (placeholder)
  const crossTrainingScore = 0.7; // Default value
  score += crossTrainingScore * weights.factors.crossTraining;

  // Leadership opportunities (based on employee type)
  const leadershipScore = employee.employeeType === 'SUPERVISORY' ? 0.9 : 0.5;
  score += leadershipScore * weights.factors.leadershipOpportunities;

  // Certification progress
  const certificationProgress = employee.certifications.length / 5;
  score += certificationProgress * weights.factors.certificationProgress;

  return score * weights.baseWeight;
}

// Calculate stress score (negative impact)
export function calculateStress(
  employee: Employee,
  assignedShifts: Shift[],
  config: HappinessConfig
): number {
  const weights = config.stressWeights;
  let score = 0;

  // High-risk shifts
  const highRiskShifts = assignedShifts.filter(shift => {
    // This would check if the site has high risk level
    return false; // Placeholder
  }).length;
  const highRiskScore = assignedShifts.length > 0 ? highRiskShifts / assignedShifts.length : 0;
  score += highRiskScore * weights.factors.highRiskShifts;

  // Consecutive night shifts
  const consecutiveNights = calculateConsecutiveNightShifts(assignedShifts);
  const maxConsecutiveNights = employee.constraints.maxConsecutiveNights;
  const nightScore = Math.min(1, consecutiveNights / maxConsecutiveNights);
  score += nightScore * weights.factors.consecutiveNights;

  // Emergency calls (placeholder)
  const emergencyScore = 0.1; // Default low value
  score += emergencyScore * weights.factors.emergencyCalls;

  return score * weights.baseWeight;
}

// Calculate exhaustion score (negative impact)
export function calculateExhaustion(
  employee: Employee,
  assignedShifts: Shift[],
  config: HappinessConfig
): number {
  const weights = config.exhaustionWeights;
  let score = 0;

  // Long shifts impact
  const longShifts = assignedShifts.filter(shift => {
    const shiftDuration = calculateShiftDuration(shift);
    return shiftDuration > 8; // More than 8 hours
  }).length;
  const longShiftScore = assignedShifts.length > 0 ? longShifts / assignedShifts.length : 0;
  score += longShiftScore * weights.factors.longShifts;

  // Short rest periods
  const shortRestPeriods = calculateShortRestPeriods(assignedShifts, employee);
  const shortRestScore = assignedShifts.length > 0 ? shortRestPeriods / assignedShifts.length : 0;
  score += shortRestScore * weights.factors.shortRestPeriods;

  // High workload (based on consecutive days and shift density)
  const workloadScore = calculateWorkloadIntensity(assignedShifts);
  score += workloadScore * weights.factors.highWorkload;

  return score * weights.baseWeight;
}

// Main happiness calculation function
export function calculateHappiness(
  employee: Employee,
  assignedShifts: Shift[],
  allEmployees: Employee[],
  allShifts: Shift[],
  config: HappinessConfig = defaultHappinessConfig
): number {
  const roleModifier = config.roleModifiers[employee.employeeType];

  // Calculate all component scores
  const wlbScore = calculateWorkLifeBalance(employee, assignedShifts, config) * roleModifier.wlb;
  const fairnessScore = calculateFairness(employee, allEmployees, allShifts, config) * roleModifier.fairness;
  const recognitionScore = calculateRecognition(employee, config) * roleModifier.recognition;
  const growthScore = calculateGrowth(employee, config) * roleModifier.growth;
  const stressScore = calculateStress(employee, assignedShifts, config);
  const exhaustionScore = calculateExhaustion(employee, assignedShifts, config);

  // Combine scores with employee's base happiness
  const totalScore = employee.baseHappinessScore +
    wlbScore + fairnessScore + recognitionScore + growthScore +
    stressScore + exhaustionScore;

  // Ensure score is within 1-5 range
  return Math.max(1, Math.min(5, totalScore));
}

// Utility functions
function calculateConsecutiveDays(shifts: Shift[]): number {
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

function calculateAverageRestHours(shifts: Shift[]): number {
  if (shifts.length < 2) return 24; // Default rest if only one shift

  const sortedShifts = [...shifts].sort((a, b) =>
    new Date(a.shiftDate + 'T' + a.endTime).getTime() - new Date(b.shiftDate + 'T' + b.endTime).getTime()
  );

  let totalRest = 0;
  let count = 0;

  for (let i = 1; i < sortedShifts.length; i++) {
    const prevEnd = new Date(sortedShifts[i - 1].shiftDate + 'T' + sortedShifts[i - 1].endTime);
    const currStart = new Date(sortedShifts[i].shiftDate + 'T' + sortedShifts[i].startTime);
    const restHours = (currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60);

    if (restHours > 0) {
      totalRest += restHours;
      count++;
    }
  }

  return count > 0 ? totalRest / count : 24;
}

function isWeekendShift(shift: Shift): boolean {
  const date = new Date(shift.shiftDate);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

function isNightShift(shift: Shift): boolean {
  const startHour = parseInt(shift.startTime.split(':')[0]);
  return startHour >= 22 || startHour < 6;
}

function calculateWeeklyHours(shifts: Shift[]): number {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentShifts = shifts.filter(shift => new Date(shift.shiftDate) >= oneWeekAgo);

  return recentShifts.reduce((total, shift) => {
    const duration = calculateShiftDuration(shift);
    return total + duration;
  }, 0);
}

function calculateShiftDuration(shift: Shift): number {
  const start = new Date(shift.shiftDate + 'T' + shift.startTime);
  const end = new Date(shift.shiftDate + 'T' + shift.endTime);

  // Handle overnight shifts
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }

  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function calculateOvertimeHours(shifts: Shift[], employee: Employee): number {
  const weeklyHours = calculateWeeklyHours(shifts);
  return Math.max(0, weeklyHours - employee.constraints.maxWeeklyHours);
}

function calculateShiftVariety(employee: Employee): number {
  const shiftTypes = employee.preferences.preferredShiftTypes;
  return shiftTypes.length / 4; // 4 possible shift types
}

function calculateConsecutiveNightShifts(shifts: Shift[]): number {
  const nightShifts = shifts.filter(isNightShift);
  return calculateConsecutiveDays(nightShifts);
}

function calculateShortRestPeriods(shifts: Shift[], employee: Employee): number {
  const minRequiredRest = employee.constraints.legalRestPeriod;
  const sortedShifts = [...shifts].sort((a, b) =>
    new Date(a.shiftDate + 'T' + a.endTime).getTime() - new Date(b.shiftDate + 'T' + b.endTime).getTime()
  );

  let shortRestCount = 0;

  for (let i = 1; i < sortedShifts.length; i++) {
    const prevEnd = new Date(sortedShifts[i - 1].shiftDate + 'T' + sortedShifts[i - 1].endTime);
    const currStart = new Date(sortedShifts[i].shiftDate + 'T' + sortedShifts[i].startTime);
    const restHours = (currStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60);

    if (restHours < minRequiredRest) {
      shortRestCount++;
    }
  }

  return shortRestCount;
}

function calculateWorkloadIntensity(shifts: Shift[]): number {
  if (shifts.length === 0) return 0;

  const consecutiveDays = calculateConsecutiveDays(shifts);
  const avgShiftDuration = shifts.reduce((sum, shift) => sum + calculateShiftDuration(shift), 0) / shifts.length;

  // Simple workload intensity calculation
  return (consecutiveDays * avgShiftDuration) / 100; // Normalize to 0-1 range
}