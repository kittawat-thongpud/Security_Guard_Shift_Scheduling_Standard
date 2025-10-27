import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SiteConfiguration } from '../types/location';
import { DEFAULT_SITES } from '../types/location';
import type { RiskLevel } from '../types';

interface SiteState {
  sites: SiteConfiguration[];
  selectedSite: SiteConfiguration | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSites: (sites: SiteConfiguration[]) => void;
  addSite: (site: Omit<SiteConfiguration, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSite: (id: string, updates: Partial<SiteConfiguration>) => void;
  deleteSite: (id: string) => void;
  selectSite: (site: SiteConfiguration | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Selectors
  getSiteById: (id: string) => SiteConfiguration | undefined;
  getSitesByRiskLevel: (riskLevel: RiskLevel) => SiteConfiguration[];
  getActiveSites: () => SiteConfiguration[];
  searchSites: (query: string) => SiteConfiguration[];
  getSiteStaffingRequirements: (siteId: string, riskMultiplier?: number) => number;
}

export const useSiteStore = create<SiteState>()(
  persist(
    (set, get) => ({
      sites: DEFAULT_SITES,
      selectedSite: null,
      isLoading: false,
      error: null,

      // Actions
      setSites: (sites) => set({ sites }),

      addSite: (siteData) => {
        const newSite: SiteConfiguration = {
          ...siteData,
          id: `site-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          sites: [...state.sites, newSite],
        }));
      },

      updateSite: (id, updates) => {
        set((state) => ({
          sites: state.sites.map((site) =>
            site.id === id
              ? { ...site, ...updates, updatedAt: new Date().toISOString() }
              : site
          ),
        }));
      },

      deleteSite: (id) => {
        set((state) => ({
          sites: state.sites.filter((site) => site.id !== id),
          selectedSite: state.selectedSite?.id === id ? null : state.selectedSite,
        }));
      },

      selectSite: (site) => set({ selectedSite: site }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Selectors
      getSiteById: (id) => {
        const state = get();
        return state.sites.find((site) => site.id === id);
      },

      getSitesByRiskLevel: (riskLevel) => {
        const state = get();
        return state.sites.filter((site) => site.riskLevel === riskLevel);
      },

      getActiveSites: () => {
        const state = get();
        return state.sites; // All sites are considered active in this implementation
      },

      searchSites: (query) => {
        const state = get();
        const lowercaseQuery = query.toLowerCase();
        return state.sites.filter(
          (site) =>
            site.siteName.toLowerCase().includes(lowercaseQuery) ||
            site.address.toLowerCase().includes(lowercaseQuery) ||
            site.contactPerson.name.toLowerCase().includes(lowercaseQuery)
        );
      },

      getSiteStaffingRequirements: (siteId, riskMultiplier = 1.0) => {
        const state = get();
        const site = state.sites.find((s) => s.id === siteId);
        if (!site) return 0;

        // Apply risk-based multiplier
        let multiplier = riskMultiplier;
        switch (site.riskLevel) {
          case 'HIGH':
            multiplier *= 1.5;
            break;
          case 'MEDIUM':
            multiplier *= 1.2;
            break;
          case 'LOW':
            multiplier *= 1.0;
            break;
        }

        return Math.ceil(site.baseRequirement * multiplier);
      },
    }),
    {
      name: 'site-storage',
      partialize: (state) => ({ sites: state.sites }),
    }
  )
);