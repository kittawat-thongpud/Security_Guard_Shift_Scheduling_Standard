import { create } from 'zustand';
import type { CustomShiftPattern, ShiftDuration, ContextMenuState, ContextMenuAction } from '../types';

interface PatternState {
  // State
  patterns: CustomShiftPattern[];
  selectedPatternId: string | null;
  favoritePatternIds: string[];
  contextMenu: ContextMenuState;

  // Pattern Actions
  addPattern: (pattern: Omit<CustomShiftPattern, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePattern: (patternId: string, updates: Partial<CustomShiftPattern>) => void;
  deletePattern: (patternId: string) => void;
  selectPattern: (patternId: string | null) => void;
  duplicatePattern: (patternId: string) => void;
  togglePatternActive: (patternId: string) => void;

  // Pattern Library Actions
  addToFavorites: (patternId: string) => void;
  removeFromFavorites: (patternId: string) => void;
  createPredefinedPatterns: () => void;

  // Context Menu Actions
  openContextMenu: (position: { x: number; y: number }, targetShift?: any, availableActions?: ContextMenuAction[]) => void;
  closeContextMenu: () => void;
  executeContextAction: (action: ContextMenuAction) => void;

  // Utility Actions
  getPatternById: (patternId: string) => CustomShiftPattern | undefined;
  getPatternsByDuration: (duration: ShiftDuration) => CustomShiftPattern[];
  getActivePatterns: () => CustomShiftPattern[];
  getFavoritePatterns: () => CustomShiftPattern[];
}

export const usePatternStore = create<PatternState>((set, get) => ({
  // Initial state
  patterns: [],
  selectedPatternId: null,
  favoritePatternIds: [],
  contextMenu: {
    isOpen: false,
    position: { x: 0, y: 0 },
    targetShift: undefined,
    availableActions: [],
  },

  // Pattern Actions
  addPattern: (patternData) => {
    const newPattern: CustomShiftPattern = {
      ...patternData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set(state => ({
      patterns: [...state.patterns, newPattern],
    }));
  },

  updatePattern: (patternId, updates) => {
    set(state => ({
      patterns: state.patterns.map(pattern =>
        pattern.id === patternId
          ? { ...pattern, ...updates, updatedAt: new Date().toISOString() }
          : pattern
      ),
    }));
  },

  deletePattern: (patternId) => {
    set(state => ({
      patterns: state.patterns.filter(pattern => pattern.id !== patternId),
      favoritePatternIds: state.favoritePatternIds.filter(id => id !== patternId),
      selectedPatternId: state.selectedPatternId === patternId ? null : state.selectedPatternId,
    }));
  },

  selectPattern: (patternId) => {
    set({
      selectedPatternId: patternId,
    });
  },

  duplicatePattern: (patternId) => {
    const pattern = get().getPatternById(patternId);
    if (!pattern) return;

    const duplicatedPattern: CustomShiftPattern = {
      ...pattern,
      id: Date.now().toString(),
      name: `${pattern.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set(state => ({
      patterns: [...state.patterns, duplicatedPattern],
    }));
  },

  togglePatternActive: (patternId) => {
    set(state => ({
      patterns: state.patterns.map(pattern =>
        pattern.id === patternId
          ? { ...pattern, isActive: !pattern.isActive, updatedAt: new Date().toISOString() }
          : pattern
      ),
    }));
  },

  // Pattern Library Actions
  addToFavorites: (patternId) => {
    set(state => ({
      favoritePatternIds: [...state.favoritePatternIds, patternId],
    }));
  },

  removeFromFavorites: (patternId) => {
    set(state => ({
      favoritePatternIds: state.favoritePatternIds.filter(id => id !== patternId),
    }));
  },

  createPredefinedPatterns: () => {
    const predefinedPatterns: CustomShiftPattern[] = [
      {
        id: 'predef-4h-morning',
        name: '4h Morning Patrol',
        description: 'Short morning patrol shift',
        duration: '4h',
        timeSlots: [
          {
            id: 'ts1',
            patternId: 'predef-4h-morning',
            name: 'Morning Patrol',
            startTime: '08:00',
            endTime: '12:00',
            type: 'morning',
            minStaff: 1,
            maxStaff: 2,
            requiredSkills: ['Patrol'],
            priority: 'medium',
          },
        ],
        locationAssignments: [],
        constraints: {
          maxConsecutiveShifts: 5,
          minRestBetweenShifts: 12,
          maxWeeklyHours: 40,
          maxOvertimeHours: 10,
          preferredShiftTypes: ['morning'],
          blackoutDates: [],
          mandatoryBreaks: [
            { duration: 15, afterHours: 2, mandatory: true },
          ],
        },
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'predef-8h-standard',
        name: '8h Standard Shift',
        description: 'Standard 8-hour security shift',
        duration: '8h',
        timeSlots: [
          {
            id: 'ts2',
            patternId: 'predef-8h-standard',
            name: 'Day Shift',
            startTime: '08:00',
            endTime: '16:00',
            type: 'morning',
            minStaff: 1,
            maxStaff: 3,
            requiredSkills: ['Access Control', 'Patrol'],
            priority: 'medium',
          },
        ],
        locationAssignments: [],
        constraints: {
          maxConsecutiveShifts: 5,
          minRestBetweenShifts: 12,
          maxWeeklyHours: 40,
          maxOvertimeHours: 10,
          preferredShiftTypes: ['morning', 'afternoon'],
          blackoutDates: [],
          mandatoryBreaks: [
            { duration: 30, afterHours: 4, mandatory: true },
            { duration: 15, afterHours: 2, mandatory: true },
          ],
        },
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'predef-12h-extended',
        name: '12h Extended Coverage',
        description: 'Extended 12-hour coverage shift',
        duration: '12h',
        timeSlots: [
          {
            id: 'ts3',
            patternId: 'predef-12h-extended',
            name: 'Extended Day',
            startTime: '06:00',
            endTime: '18:00',
            type: 'morning',
            minStaff: 2,
            maxStaff: 4,
            requiredSkills: ['Access Control', 'Patrol', 'Emergency Response'],
            priority: 'high',
          },
        ],
        locationAssignments: [],
        constraints: {
          maxConsecutiveShifts: 3,
          minRestBetweenShifts: 24,
          maxWeeklyHours: 36,
          maxOvertimeHours: 8,
          preferredShiftTypes: ['morning'],
          blackoutDates: [],
          mandatoryBreaks: [
            { duration: 60, afterHours: 4, mandatory: true },
            { duration: 30, afterHours: 8, mandatory: true },
            { duration: 15, afterHours: 2, mandatory: true },
          ],
        },
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: 'predef-24h-full',
        name: '24h Full Coverage',
        description: '24-hour continuous coverage pattern',
        duration: '24h',
        timeSlots: [
          {
            id: 'ts4',
            patternId: 'predef-24h-full',
            name: 'Morning Coverage',
            startTime: '08:00',
            endTime: '16:00',
            type: 'morning',
            minStaff: 2,
            maxStaff: 3,
            requiredSkills: ['Access Control', 'Patrol'],
            priority: 'medium',
          },
          {
            id: 'ts5',
            patternId: 'predef-24h-full',
            name: 'Evening Coverage',
            startTime: '16:00',
            endTime: '00:00',
            type: 'afternoon',
            minStaff: 2,
            maxStaff: 3,
            requiredSkills: ['Access Control', 'Patrol'],
            priority: 'medium',
          },
          {
            id: 'ts6',
            patternId: 'predef-24h-full',
            name: 'Night Coverage',
            startTime: '00:00',
            endTime: '08:00',
            type: 'night',
            minStaff: 1,
            maxStaff: 2,
            requiredSkills: ['Patrol', 'Emergency Response'],
            priority: 'high',
          },
        ],
        locationAssignments: [],
        constraints: {
          maxConsecutiveShifts: 2,
          minRestBetweenShifts: 48,
          maxWeeklyHours: 48,
          maxOvertimeHours: 12,
          preferredShiftTypes: ['morning', 'afternoon', 'night'],
          blackoutDates: [],
          mandatoryBreaks: [
            { duration: 30, afterHours: 4, mandatory: true },
            { duration: 15, afterHours: 2, mandatory: true },
          ],
        },
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    set(state => ({
      patterns: [...state.patterns, ...predefinedPatterns],
    }));
  },

  // Context Menu Actions
  openContextMenu: (position, targetShift, availableActions = ['edit', 'delete', 'copy', 'move', 'swap', 'convert-overtime', 'assign-location', 'view-details', 'duplicate']) => {
    set({
      contextMenu: {
        isOpen: true,
        position,
        targetShift,
        availableActions,
      },
    });
  },

  closeContextMenu: () => {
    set({
      contextMenu: {
        isOpen: false,
        position: { x: 0, y: 0 },
        targetShift: undefined,
        availableActions: [],
      },
    });
  },

  executeContextAction: (action) => {
    const { contextMenu, closeContextMenu } = get();

    // Handle different context actions
    switch (action) {
      case 'edit':
        console.log('Edit shift:', contextMenu.targetShift);
        break;
      case 'delete':
        console.log('Delete shift:', contextMenu.targetShift);
        break;
      case 'copy':
        console.log('Copy shift:', contextMenu.targetShift);
        break;
      case 'move':
        console.log('Move shift:', contextMenu.targetShift);
        break;
      case 'swap':
        console.log('Swap shift:', contextMenu.targetShift);
        break;
      case 'convert-overtime':
        console.log('Convert to overtime:', contextMenu.targetShift);
        break;
      case 'assign-location':
        console.log('Assign location:', contextMenu.targetShift);
        break;
      case 'view-details':
        console.log('View details:', contextMenu.targetShift);
        break;
      case 'duplicate':
        console.log('Duplicate shift:', contextMenu.targetShift);
        break;
    }

    closeContextMenu();
  },

  // Utility Actions
  getPatternById: (patternId) => {
    return get().patterns.find(pattern => pattern.id === patternId);
  },

  getPatternsByDuration: (duration) => {
    return get().patterns.filter(pattern => pattern.duration === duration);
  },

  getActivePatterns: () => {
    return get().patterns.filter(pattern => pattern.isActive);
  },

  getFavoritePatterns: () => {
    const { patterns, favoritePatternIds } = get();
    return patterns.filter(pattern => favoritePatternIds.includes(pattern.id));
  },
}));