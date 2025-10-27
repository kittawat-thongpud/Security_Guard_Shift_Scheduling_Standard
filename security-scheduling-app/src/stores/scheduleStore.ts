import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Shift, ShiftAssignment, AssignmentStatus, DateRange } from '../types';
import { useEmployeeStore } from './employeeStore';
import { useSiteStore } from './siteStore';
import { usePatternStore } from './patternStore';

interface ScheduleState {
  shifts: Shift[];
  assignments: ShiftAssignment[];
  selectedDateRange: DateRange | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setShifts: (shifts: Shift[]) => void;
  addShift: (shift: Omit<Shift, 'id' | 'createdAt' | 'kpiMetrics'>) => void;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  assignEmployee: (shiftId: string, employeeId: string) => void;
  unassignEmployee: (shiftId: string, employeeId: string) => void;
  setAssignmentStatus: (assignmentId: string, status: AssignmentStatus) => void;
  setDateRange: (dateRange: DateRange) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getShiftById: (id: string) => Shift | undefined;
  getShiftsByDateRange: (dateRange: DateRange) => Shift[];
  getShiftsBySite: (siteId: string) => Shift[];
  getAssignmentsByShift: (shiftId: string) => ShiftAssignment[];
  getAssignmentsByEmployee: (employeeId: string) => ShiftAssignment[];
  getEmployeeAssignmentsInPeriod: (employeeId: string, dateRange: DateRange) => ShiftAssignment[];
  getShiftCoverage: (shiftId: string) => number;
  calculateKPIs: (dateRange: DateRange) => any;
  generateSchedule: (siteId: string, patternId: string, dateRange: DateRange) => void;
}

// Helper function to generate shifts from pattern
export const generateShiftsFromPattern = (
  patternId: string,
  siteId: string,
  dateRange: DateRange
): Omit<Shift, 'id' | 'createdAt' | 'kpiMetrics'>[] => {
  const patternStore = usePatternStore.getState();
  const pattern = patternStore.getPatternById(patternId);

  if (!pattern) return [];

  const shifts: Omit<Shift, 'id' | 'createdAt' | 'kpiMetrics'>[] = [];
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];

    pattern.shiftSequence.forEach((sequence) => {
      shifts.push({
        patternId,
        siteId,
        shiftDate: dateStr,
        startTime: sequence.startTime,
        endTime: sequence.endTime,
        shiftType: sequence.shiftType,
        requiredStaff: sequence.requiredStaff,
        assignedEmployees: [],
        kpiMetrics: {
          coverageRate: 0,
          unfilledPosts: sequence.requiredStaff,
          securityIncidents: 0,
          responseTime: 0,
          happinessIndex: 0,
          productivityRate: 0,
          overtimeUtilization: 0,
          costPerHour: 0,
        },
        status: 'PENDING',
      });
    });
  }

  return shifts;
};

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      shifts: [],
      assignments: [],
      selectedDateRange: null,
      isLoading: false,
      error: null,

      // Actions
      setShifts: (shifts) => set({ shifts }),

      addShift: (shiftData) => {
        const newShift: Shift = {
          ...shiftData,
          id: `shift-${Date.now()}`,
          createdAt: new Date().toISOString(),
          kpiMetrics: {
            coverageRate: 0,
            unfilledPosts: shiftData.requiredStaff,
            securityIncidents: 0,
            responseTime: 0,
            happinessIndex: 0,
            productivityRate: 0,
            overtimeUtilization: 0,
            costPerHour: 0,
          },
        };
        set((state) => ({
          shifts: [...state.shifts, newShift],
        }));
      },

      updateShift: (id, updates) => {
        set((state) => ({
          shifts: state.shifts.map((shift) =>
            shift.id === id ? { ...shift, ...updates } : shift
          ),
        }));
      },

      deleteShift: (id) => {
        set((state) => ({
          shifts: state.shifts.filter((shift) => shift.id !== id),
          assignments: state.assignments.filter((assignment) => assignment.shiftId !== id),
        }));
      },

      assignEmployee: (shiftId, employeeId) => {
        const state = get();
        const shift = state.shifts.find((s) => s.id === shiftId);

        if (!shift) return;

        // Check if employee is already assigned
        const existingAssignment = state.assignments.find(
          (a) => a.shiftId === shiftId && a.employeeId === employeeId
        );

        if (existingAssignment) return;

        // Create new assignment
        const newAssignment: ShiftAssignment = {
          id: `assignment-${Date.now()}`,
          employeeId,
          shiftId,
          assignmentStatus: 'ASSIGNED',
          happinessImpact: 0, // Will be calculated later
          assignedAt: new Date().toISOString(),
        };

        // Update shift assigned employees
        const updatedShift = {
          ...shift,
          assignedEmployees: [...shift.assignedEmployees, employeeId],
        };

        set({
          shifts: state.shifts.map((s) => (s.id === shiftId ? updatedShift : s)),
          assignments: [...state.assignments, newAssignment],
        });
      },

      unassignEmployee: (shiftId, employeeId) => {
        const state = get();
        const shift = state.shifts.find((s) => s.id === shiftId);

        if (!shift) return;

        // Remove employee from shift
        const updatedShift = {
          ...shift,
          assignedEmployees: shift.assignedEmployees.filter((id) => id !== employeeId),
        };

        // Remove assignment
        const updatedAssignments = state.assignments.filter(
          (a) => !(a.shiftId === shiftId && a.employeeId === employeeId)
        );

        set({
          shifts: state.shifts.map((s) => (s.id === shiftId ? updatedShift : s)),
          assignments: updatedAssignments,
        });
      },

      setAssignmentStatus: (assignmentId, status) => {
        set((state) => ({
          assignments: state.assignments.map((assignment) =>
            assignment.id === assignmentId
              ? {
                  ...assignment,
                  assignmentStatus: status,
                  completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined,
                }
              : assignment
          ),
        }));
      },

      setDateRange: (dateRange) => set({ selectedDateRange: dateRange }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Selectors
      getShiftById: (id) => {
        const state = get();
        return state.shifts.find((shift) => shift.id === id);
      },

      getShiftsByDateRange: (dateRange) => {
        const state = get();
        return state.shifts.filter(
          (shift) => shift.shiftDate >= dateRange.start && shift.shiftDate <= dateRange.end
        );
      },

      getShiftsBySite: (siteId) => {
        const state = get();
        return state.shifts.filter((shift) => shift.siteId === siteId);
      },

      getAssignmentsByShift: (shiftId) => {
        const state = get();
        return state.assignments.filter((assignment) => assignment.shiftId === shiftId);
      },

      getAssignmentsByEmployee: (employeeId) => {
        const state = get();
        return state.assignments.filter((assignment) => assignment.employeeId === employeeId);
      },

      getEmployeeAssignmentsInPeriod: (employeeId, dateRange) => {
        const state = get();
        const shiftsInPeriod = state.shifts.filter(
          (shift) => shift.shiftDate >= dateRange.start && shift.shiftDate <= dateRange.end
        );
        const shiftIdsInPeriod = shiftsInPeriod.map((shift) => shift.id);

        return state.assignments.filter(
          (assignment) =>
            assignment.employeeId === employeeId &&
            shiftIdsInPeriod.includes(assignment.shiftId)
        );
      },

      getShiftCoverage: (shiftId) => {
        const state = get();
        const shift = state.shifts.find((s) => s.id === shiftId);
        if (!shift) return 0;

        const assignedCount = shift.assignedEmployees.length;
        return assignedCount / shift.requiredStaff;
      },

      calculateKPIs: (dateRange) => {
        const state = get();
        const shiftsInPeriod = state.getShiftsByDateRange(dateRange);

        if (shiftsInPeriod.length === 0) {
          return {
            coverageRate: 0,
            unfilledPosts: 0,
            securityIncidents: 0,
            averageResponseTime: 0,
            averageHappiness: 0,
            totalShifts: 0,
            totalAssigned: 0,
            totalRequired: 0,
          };
        }

        const totalRequired = shiftsInPeriod.reduce(
          (sum, shift) => sum + shift.requiredStaff,
          0
        );
        const totalAssigned = shiftsInPeriod.reduce(
          (sum, shift) => sum + shift.assignedEmployees.length,
          0
        );
        const totalIncidents = shiftsInPeriod.reduce(
          (sum, shift) => sum + shift.kpiMetrics.securityIncidents,
          0
        );
        const totalResponseTime = shiftsInPeriod.reduce(
          (sum, shift) => sum + shift.kpiMetrics.responseTime,
          0
        );
        const totalHappiness = shiftsInPeriod.reduce(
          (sum, shift) => sum + shift.kpiMetrics.happinessIndex,
          0
        );

        return {
          coverageRate: totalRequired > 0 ? (totalAssigned / totalRequired) * 100 : 0,
          unfilledPosts: totalRequired - totalAssigned,
          securityIncidents: totalIncidents,
          averageResponseTime: shiftsInPeriod.length > 0 ? totalResponseTime / shiftsInPeriod.length : 0,
          averageHappiness: shiftsInPeriod.length > 0 ? totalHappiness / shiftsInPeriod.length : 0,
          totalShifts: shiftsInPeriod.length,
          totalAssigned,
          totalRequired,
        };
      },

      generateSchedule: (siteId, patternId, dateRange) => {
        const shifts = generateShiftsFromPattern(patternId, siteId, dateRange);
        shifts.forEach((shift) => {
          get().addShift(shift);
        });
        set({ selectedDateRange: dateRange });
      },
    }),
    {
      name: 'schedule-storage',
      partialize: (state) => ({
        shifts: state.shifts,
        assignments: state.assignments,
        selectedDateRange: state.selectedDateRange,
      }),
    }
  )
);