import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STANDARD_SHIFT_PATTERNS, StandardPatternKey } from '../types/shiftPattern';
import { ShiftPattern } from '../types';

interface PatternState {
  patterns: ShiftPattern[];
  selectedPattern: ShiftPattern | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPatterns: (patterns: ShiftPattern[]) => void;
  addPattern: (pattern: Omit<ShiftPattern, 'id'>) => void;
  updatePattern: (id: string, updates: Partial<ShiftPattern>) => void;
  deletePattern: (id: string) => void;
  selectPattern: (pattern: ShiftPattern | null) => void;
  loadStandardPattern: (patternKey: StandardPatternKey) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getPatternById: (id: string) => ShiftPattern | undefined;
  getActivePatterns: () => ShiftPattern[];
  getPatternsByType: (patternType: string) => ShiftPattern[];
  searchPatterns: (query: string) => ShiftPattern[];
  getPatternStaffingRequirements: (patternId: string) => number;
}

// Convert standard patterns to array format
const standardPatternsArray = Object.values(STANDARD_SHIFT_PATTERNS);

export const usePatternStore = create<PatternState>()(
  persist(
    (set, get) => ({
      patterns: standardPatternsArray,
      selectedPattern: null,
      isLoading: false,
      error: null,

      // Actions
      setPatterns: (patterns) => set({ patterns }),

      addPattern: (patternData) => {
        const newPattern: ShiftPattern = {
          ...patternData,
          id: `pattern-${Date.now()}`,
        };
        set((state) => ({
          patterns: [...state.patterns, newPattern],
        }));
      },

      updatePattern: (id, updates) => {
        set((state) => ({
          patterns: state.patterns.map((pattern) =>
            pattern.id === id ? { ...pattern, ...updates } : pattern
          ),
        }));
      },

      deletePattern: (id) => {
        set((state) => ({
          patterns: state.patterns.filter((pattern) => pattern.id !== id),
          selectedPattern: state.selectedPattern?.id === id ? null : state.selectedPattern,
        }));
      },

      selectPattern: (pattern) => set({ selectedPattern: pattern }),

      loadStandardPattern: (patternKey) => {
        const standardPattern = STANDARD_SHIFT_PATTERNS[patternKey];
        if (standardPattern) {
          const state = get();
          const exists = state.patterns.some(p => p.id === standardPattern.id);
          if (!exists) {
            set((state) => ({
              patterns: [...state.patterns, standardPattern],
            }));
          }
          set({ selectedPattern: standardPattern });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Selectors
      getPatternById: (id) => {
        const state = get();
        return state.patterns.find((pattern) => pattern.id === id);
      },

      getActivePatterns: () => {
        const state = get();
        return state.patterns.filter((pattern) => pattern.active);
      },

      getPatternsByType: (patternType) => {
        const state = get();
        return state.patterns.filter((pattern) => pattern.patternType === patternType);
      },

      searchPatterns: (query) => {
        const state = get();
        const lowercaseQuery = query.toLowerCase();
        return state.patterns.filter(
          (pattern) =>
            pattern.patternName.toLowerCase().includes(lowercaseQuery) ||
            pattern.description.toLowerCase().includes(lowercaseQuery) ||
            pattern.patternType.toLowerCase().includes(lowercaseQuery)
        );
      },

      getPatternStaffingRequirements: (patternId) => {
        const state = get();
        const pattern = state.patterns.find((p) => p.id === patternId);
        if (!pattern) return 0;

        return pattern.shiftSequence.reduce(
          (total, shift) => total + shift.requiredStaff,
          0
        );
      },
    }),
    {
      name: 'pattern-storage',
      partialize: (state) => ({ patterns: state.patterns }),
    }
  )
);