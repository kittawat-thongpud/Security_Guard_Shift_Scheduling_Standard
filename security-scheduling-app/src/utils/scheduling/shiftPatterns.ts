import type { Shift, ShiftPattern, SchedulingStrategy, Employee } from '../../types';
import { addDays, format, parseISO } from 'date-fns';

// Generate shifts based on different patterns
export const generateShifts = (
  pattern: ShiftPattern,
  startDate: string,
  endDate: string,
  employees: Employee[],
  _constraints: SchedulingStrategy['constraints']
): Omit<Shift, 'id'>[] => {
  const shifts: Omit<Shift, 'id'>[] = [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  let currentDate = start;
  let employeeIndex = 0;

  while (currentDate <= end) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');

    switch (pattern) {
      case '8-8-8':
        shifts.push(...generate8HourShifts(dateStr, employees, employeeIndex, _constraints));
        break;
      case '12-12':
        shifts.push(...generate12HourShifts(dateStr, employees, employeeIndex, _constraints));
        break;
      case '12-day-only':
        shifts.push(...generate12HourDayOnlyShifts(dateStr, employees, employeeIndex, _constraints));
        break;
      case '12-night-only':
        shifts.push(...generate12HourNightOnlyShifts(dateStr, employees, employeeIndex, _constraints));
        break;
      case 'mixed':
        shifts.push(...generateMixedShifts(dateStr, employees, employeeIndex, _constraints));
        break;
    }

    currentDate = addDays(currentDate, 1);
    employeeIndex = (employeeIndex + 1) % employees.length;
  }

  return shifts;
};

// 8-8-8 pattern: 3 shifts per day (6-14, 14-22, 22-6)
const generate8HourShifts = (
  date: string,
  employees: Employee[],
  startIndex: number,
  _constraints: SchedulingStrategy['constraints']
): Omit<Shift, 'id'>[] => {
  const shifts: Omit<Shift, 'id'>[] = [];
  const requiredShifts = [
    { type: 'morning' as const, startTime: '06:00', endTime: '14:00' },
    { type: 'afternoon' as const, startTime: '14:00', endTime: '22:00' },
    { type: 'night' as const, startTime: '22:00', endTime: '06:00' },
  ];

  for (let i = 0; i < requiredShifts.length; i++) {
    const shiftConfig = requiredShifts[i];
    const employee = employees[(startIndex + i) % employees.length];

    shifts.push({
      employeeId: employee.id,
      date,
      startTime: shiftConfig.startTime,
      endTime: shiftConfig.endTime,
      type: shiftConfig.type,
      isOvertime: false,
    });
  }

  return shifts;
};

// 12-12 pattern: 2 shifts per day (6-18, 18-6)
const generate12HourShifts = (
  date: string,
  employees: Employee[],
  startIndex: number,
  _constraints: SchedulingStrategy['constraints']
): Omit<Shift, 'id'>[] => {
  const shifts: Omit<Shift, 'id'>[] = [];
  const requiredShifts = [
    { type: 'morning' as const, startTime: '06:00', endTime: '18:00' },
    { type: 'night' as const, startTime: '18:00', endTime: '06:00' },
  ];

  for (let i = 0; i < requiredShifts.length; i++) {
    const shiftConfig = requiredShifts[i];
    const employee = employees[(startIndex + i) % employees.length];

    shifts.push({
      employeeId: employee.id,
      date,
      startTime: shiftConfig.startTime,
      endTime: shiftConfig.endTime,
      type: shiftConfig.type,
      isOvertime: false,
    });
  }

  return shifts;
};

// 12-hour day only pattern
const generate12HourDayOnlyShifts = (
  date: string,
  employees: Employee[],
  startIndex: number,
  _constraints: SchedulingStrategy['constraints']
): Omit<Shift, 'id'>[] => {
  return [{
    employeeId: employees[startIndex % employees.length].id,
    date,
    startTime: '06:00',
    endTime: '18:00',
    type: 'morning',
    isOvertime: false,
  }];
};

// 12-hour night only pattern
const generate12HourNightOnlyShifts = (
  date: string,
  employees: Employee[],
  startIndex: number,
  _constraints: SchedulingStrategy['constraints']
): Omit<Shift, 'id'>[] => {
  return [{
    employeeId: employees[startIndex % employees.length].id,
    date,
    startTime: '18:00',
    endTime: '06:00',
    type: 'night',
    isOvertime: false,
  }];
};

// Mixed pattern: Combination of different shift types
const generateMixedShifts = (
  date: string,
  employees: Employee[],
  startIndex: number,
  _constraints: SchedulingStrategy['constraints']
): Omit<Shift, 'id'>[] => {
  const shifts: Omit<Shift, 'id'>[] = [];

  // Alternate between 8-hour and 12-hour shifts
  const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 6 = Saturday

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Weekend: Use 12-hour shifts
    shifts.push(...generate12HourShifts(date, employees, startIndex, _constraints));
  } else {
    // Weekday: Use 8-hour shifts
    shifts.push(...generate8HourShifts(date, employees, startIndex, _constraints));
  }

  return shifts;
};

// Calculate shift hours
export const calculateShiftHours = (startTime: string, endTime: string): number => {
  const start = new Date(`2000-01-01T${startTime}`);
  let end = new Date(`2000-01-01T${endTime}`);

  // Handle overnight shifts
  if (end < start) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
};

// Check for scheduling conflicts
export const hasSchedulingConflict = (
  newShift: Omit<Shift, 'id'>,
  existingShifts: Shift[],
  _employee: Employee
): boolean => {
  const newStart = new Date(`${newShift.date}T${newShift.startTime}`);
  const newEnd = new Date(`${newShift.date}T${newShift.endTime}`);

  // Handle overnight shifts
  if (newEnd < newStart) {
    newEnd.setDate(newEnd.getDate() + 1);
  }

  for (const existingShift of existingShifts) {
    if (existingShift.employeeId === newShift.employeeId) {
      const existingStart = new Date(`${existingShift.date}T${existingShift.startTime}`);
      const existingEnd = new Date(`${existingShift.date}T${existingShift.endTime}`);

      // Handle overnight shifts
      if (existingEnd < existingStart) {
        existingEnd.setDate(existingEnd.getDate() + 1);
      }

      // Check for overlap
      if (newStart < existingEnd && newEnd > existingStart) {
        return true;
      }
    }
  }

  return false;
};

// Calculate overtime hours for an employee in a given period
export const calculateOvertimeHours = (
  employeeId: string,
  shifts: Shift[],
  periodStart: string,
  periodEnd: string
): number => {
  const employeeShifts = shifts.filter(
    shift =>
      shift.employeeId === employeeId &&
      shift.date >= periodStart &&
      shift.date <= periodEnd
  );

  const totalHours = employeeShifts.reduce((total, shift) => {
    return total + calculateShiftHours(shift.startTime, shift.endTime);
  }, 0);

  // Assume standard work week is 40 hours
  const standardHours = 40;
  return Math.max(0, totalHours - standardHours);
};