import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Employee, EmployeeType } from '../types';

interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  selectEmployee: (employee: Employee | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getEmployeeById: (id: string) => Employee | undefined;
  getEmployeesByType: (type: EmployeeType) => Employee[];
  getActiveEmployees: () => Employee[];
  searchEmployees: (query: string) => Employee[];
}

// Default employee data for demo
const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    employeeCode: 'SG001',
    fullName: 'John Smith',
    email: 'john.smith@security.com',
    phone: '+66-81-234-5678',
    hireDate: '2023-01-15',
    employeeType: 'OPERATIONAL',
    role: 'Security Guard',
    activeStatus: true,
    baseHappinessScore: 4.2,
    createdAt: '2023-01-15T00:00:00Z',
    preferences: {
      preferredShiftTypes: ['8H', '12H'],
      preferredTimeSlots: ['06:00-14:00', '14:00-22:00'],
      maxConsecutiveDays: 5,
      minRestBetweenShifts: 12,
      willingToWorkOvertime: true,
      standbyAvailability: true
    },
    constraints: {
      maxWeeklyHours: 48,
      maxConsecutiveNights: 3,
      maxWeeklyOvertime: 20,
      requiredDaysOff: 2,
      legalRestPeriod: 11
    },
    certifications: ['Basic Security', 'First Aid', 'CPR']
  },
  {
    id: 'emp-002',
    employeeCode: 'SG002',
    fullName: 'Maria Garcia',
    email: 'maria.garcia@security.com',
    phone: '+66-82-345-6789',
    hireDate: '2023-03-20',
    employeeType: 'OPERATIONAL',
    role: 'Security Guard',
    activeStatus: true,
    baseHappinessScore: 4.5,
    createdAt: '2023-03-20T00:00:00Z',
    preferences: {
      preferredShiftTypes: ['8H', '4H'],
      preferredTimeSlots: ['10:00-18:00', '14:00-22:00'],
      maxConsecutiveDays: 4,
      minRestBetweenShifts: 10,
      willingToWorkOvertime: false,
      standbyAvailability: true
    },
    constraints: {
      maxWeeklyHours: 40,
      maxConsecutiveNights: 2,
      maxWeeklyOvertime: 10,
      requiredDaysOff: 2,
      legalRestPeriod: 12
    },
    certifications: ['Basic Security', 'Crowd Control']
  },
  {
    id: 'emp-003',
    employeeCode: 'SG003',
    fullName: 'Robert Chen',
    email: 'robert.chen@security.com',
    phone: '+66-83-456-7890',
    hireDate: '2022-11-10',
    employeeType: 'SUPERVISORY',
    role: 'Security Supervisor',
    activeStatus: true,
    baseHappinessScore: 4.8,
    createdAt: '2022-11-10T00:00:00Z',
    preferences: {
      preferredShiftTypes: ['8H', '12H'],
      preferredTimeSlots: ['06:00-14:00', '22:00-06:00'],
      maxConsecutiveDays: 6,
      minRestBetweenShifts: 8,
      willingToWorkOvertime: true,
      standbyAvailability: true
    },
    constraints: {
      maxWeeklyHours: 50,
      maxConsecutiveNights: 4,
      maxWeeklyOvertime: 25,
      requiredDaysOff: 1,
      legalRestPeriod: 8
    },
    certifications: ['Advanced Security', 'Supervisor Training', 'Emergency Response']
  },
  {
    id: 'emp-004',
    employeeCode: 'SG004',
    fullName: 'Lisa Wang',
    email: 'lisa.wang@security.com',
    phone: '+66-84-567-8901',
    hireDate: '2024-01-05',
    employeeType: 'NEW',
    role: 'Security Guard Trainee',
    activeStatus: true,
    baseHappinessScore: 3.8,
    createdAt: '2024-01-05T00:00:00Z',
    preferences: {
      preferredShiftTypes: ['8H'],
      preferredTimeSlots: ['06:00-14:00'],
      maxConsecutiveDays: 3,
      minRestBetweenShifts: 12,
      willingToWorkOvertime: false,
      standbyAvailability: false
    },
    constraints: {
      maxWeeklyHours: 35,
      maxConsecutiveNights: 1,
      maxWeeklyOvertime: 5,
      requiredDaysOff: 3,
      legalRestPeriod: 12
    },
    certifications: ['Basic Security']
  }
];

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set, get) => ({
      employees: DEFAULT_EMPLOYEES,
      selectedEmployee: null,
      isLoading: false,
      error: null,

      // Actions
      setEmployees: (employees) => set({ employees }),

      addEmployee: (employeeData) => {
        const newEmployee: Employee = {
          ...employeeData,
          id: `emp-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          employees: [...state.employees, newEmployee],
        }));
      },

      updateEmployee: (id, updates) => {
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === id ? { ...emp, ...updates, updatedAt: new Date().toISOString() } : emp
          ),
        }));
      },

      deleteEmployee: (id) => {
        set((state) => ({
          employees: state.employees.filter((emp) => emp.id !== id),
          selectedEmployee: state.selectedEmployee?.id === id ? null : state.selectedEmployee,
        }));
      },

      selectEmployee: (employee) => set({ selectedEmployee: employee }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Selectors
      getEmployeeById: (id) => {
        const state = get();
        return state.employees.find((emp) => emp.id === id);
      },

      getEmployeesByType: (type) => {
        const state = get();
        return state.employees.filter((emp) => emp.employeeType === type);
      },

      getActiveEmployees: () => {
        const state = get();
        return state.employees.filter((emp) => emp.activeStatus);
      },

      searchEmployees: (query) => {
        const state = get();
        const lowercaseQuery = query.toLowerCase();
        return state.employees.filter(
          (emp) =>
            emp.fullName.toLowerCase().includes(lowercaseQuery) ||
            emp.employeeCode.toLowerCase().includes(lowercaseQuery) ||
            emp.email.toLowerCase().includes(lowercaseQuery) ||
            emp.role.toLowerCase().includes(lowercaseQuery)
        );
      },
    }),
    {
      name: 'employee-storage',
      partialize: (state) => ({ employees: state.employees }),
    }
  )
);