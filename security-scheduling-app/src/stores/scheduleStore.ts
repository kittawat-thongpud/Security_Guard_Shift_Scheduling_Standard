import { create } from 'zustand';
import type { Shift, Employee, Budget, SchedulingStrategy } from '../types';
import { generateShifts, hasSchedulingConflict } from '../utils/scheduling/shiftPatterns';
import { useLocationStore } from './locationStore';
import { usePatternStore } from './patternStore';

interface ScheduleState {
  // State
  shifts: Shift[];
  employees: Employee[];
  budgets: Budget[];
  currentStrategy: SchedulingStrategy | null;

  // Actions
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (shiftId: string, updates: Partial<Shift>) => void;
  deleteShift: (shiftId: string) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (employeeId: string, updates: Partial<Employee>) => void;
  deleteEmployee: (employeeId: string) => void;
  generateSchedule: (strategy: SchedulingStrategy) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => void;
  deleteBudget: (budgetId: string) => void;

  // Location and Pattern Integration
  getShiftsBySite: (siteId: string) => Shift[];
  getShiftsByZone: (zoneId: string) => Shift[];
  getShiftsByTeam: (teamId: string) => Shift[];
  getShiftsByPattern: (patternId: string) => Shift[];
  assignShiftToLocation: (shiftId: string, siteId: string, zoneId: string, teamId: string) => void;
  applyPatternToShift: (shiftId: string, patternId: string) => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  // Initial state
  shifts: [],
  employees: [
    {
      id: 'emp1',
      name: 'John Doe',
      position: 'Security Guard',
      hourlyRate: 300,
      overtimeRate: 450,
      maxWeeklyHours: 48,
      preferredShifts: ['morning', 'afternoon'],
      unavailableDates: [],
    },
    {
      id: 'emp2',
      name: 'Jane Smith',
      position: 'Security Guard',
      hourlyRate: 300,
      overtimeRate: 450,
      maxWeeklyHours: 48,
      preferredShifts: ['afternoon', 'night'],
      unavailableDates: [],
    },
    {
      id: 'emp3',
      name: 'Mike Johnson',
      position: 'Senior Guard',
      hourlyRate: 350,
      overtimeRate: 525,
      maxWeeklyHours: 48,
      preferredShifts: ['morning', 'night'],
      unavailableDates: [],
    },
  ],
  budgets: [
    {
      id: 'budget1',
      name: 'Monthly Budget',
      totalAmount: 500000,
      usedAmount: 0,
      period: 'month',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    },
  ],
  currentStrategy: null,

  // Actions
  addShift: (shift: Omit<Shift, 'id'>) => {
    const { employees, shifts } = get();
    const employee = employees.find(emp => emp.id === shift.employeeId);

    if (!employee) {
      console.error('Employee not found');
      return;
    }

    // Check for conflicts
    if (hasSchedulingConflict(shift, shifts, employee)) {
      console.error('Scheduling conflict detected');
      return;
    }

    const newShift: Shift = {
      ...shift,
      id: Date.now().toString(),
    };

    set(state => ({
      shifts: [...state.shifts, newShift],
    }));
  },

  updateShift: (shiftId: string, updates: Partial<Shift>) => {
    set(state => ({
      shifts: state.shifts.map(shift =>
        shift.id === shiftId ? { ...shift, ...updates } : shift
      ),
    }));
  },

  deleteShift: (shiftId: string) => {
    set(state => ({
      shifts: state.shifts.filter(shift => shift.id !== shiftId),
    }));
  },

  addEmployee: (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
    };

    set(state => ({
      employees: [...state.employees, newEmployee],
    }));
  },

  updateEmployee: (employeeId: string, updates: Partial<Employee>) => {
    set(state => ({
      employees: state.employees.map(employee =>
        employee.id === employeeId ? { ...employee, ...updates } : employee
      ),
    }));
  },

  deleteEmployee: (employeeId: string) => {
    set(state => ({
      employees: state.employees.filter(employee => employee.id !== employeeId),
      shifts: state.shifts.filter(shift => shift.employeeId !== employeeId),
    }));
  },

  generateSchedule: (strategy: SchedulingStrategy) => {
    const { employees } = get();

    const newShifts = generateShifts(
      strategy.pattern,
      strategy.startDate,
      strategy.endDate,
      employees,
      strategy.constraints
    );

    // Convert to Shift objects with IDs
    const shiftsWithIds: Shift[] = newShifts.map((shift, index) => ({
      ...shift,
      id: `auto-${Date.now()}-${index}`,
    }));

    set(state => ({
      shifts: [...state.shifts, ...shiftsWithIds],
      currentStrategy: strategy,
    }));
  },

  addBudget: (budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
    };

    set(state => ({
      budgets: [...state.budgets, newBudget],
    }));
  },

  updateBudget: (budgetId: string, updates: Partial<Budget>) => {
    set(state => ({
      budgets: state.budgets.map(budget =>
        budget.id === budgetId ? { ...budget, ...updates } : budget
      ),
    }));
  },

  deleteBudget: (budgetId: string) => {
    set(state => ({
      budgets: state.budgets.filter(budget => budget.id !== budgetId),
    }));
  },

  // Location and Pattern Integration
  getShiftsBySite: (siteId: string) => {
    const { shifts } = get();
    return shifts.filter(shift =>
      shift.locationAssignment?.siteId === siteId
    );
  },

  getShiftsByZone: (zoneId: string) => {
    const { shifts } = get();
    return shifts.filter(shift =>
      shift.locationAssignment?.zoneId === zoneId
    );
  },

  getShiftsByTeam: (teamId: string) => {
    const { shifts } = get();
    return shifts.filter(shift =>
      shift.locationAssignment?.teamId === teamId
    );
  },

  getShiftsByPattern: (patternId: string) => {
    const { shifts } = get();
    return shifts.filter(shift =>
      shift.patternId === patternId
    );
  },

  assignShiftToLocation: (shiftId: string, siteId: string, zoneId: string, teamId: string) => {
    const { getState } = useLocationStore;
    const locationStore = getState();

    // Verify the location hierarchy exists
    const site = locationStore.getSiteById(siteId);
    const zone = locationStore.getZoneById(zoneId);
    const team = locationStore.getTeamById(teamId);

    if (!site || !zone || !team) {
      console.error('Invalid location assignment');
      return;
    }

    set(state => ({
      shifts: state.shifts.map(shift =>
        shift.id === shiftId
          ? {
              ...shift,
              locationAssignment: {
                siteId,
                zoneId,
                teamId,
                assignmentId: `assignment-${Date.now()}`,
              }
            }
          : shift
      ),
    }));
  },

  applyPatternToShift: (shiftId: string, patternId: string) => {
    const { getState } = usePatternStore;
    const patternStore = getState();

    const pattern = patternStore.getPatternById(patternId);
    if (!pattern) {
      console.error('Pattern not found');
      return;
    }

    set(state => ({
      shifts: state.shifts.map(shift =>
        shift.id === shiftId
          ? {
              ...shift,
              patternId: pattern.id,
              duration: pattern.duration,
            }
          : shift
      ),
    }));
  },
}));