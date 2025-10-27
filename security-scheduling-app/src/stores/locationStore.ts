import { create } from 'zustand';
import type { Site, Zone, Team, Assignment, LocationAssignment } from '../types';

interface LocationState {
  // State
  sites: Site[];
  selectedSiteId: string | null;
  selectedZoneId: string | null;
  selectedTeamId: string | null;
  locationAssignments: LocationAssignment[];

  // Site Actions
  addSite: (site: Omit<Site, 'id' | 'zones' | 'createdAt' | 'updatedAt'>) => void;
  updateSite: (siteId: string, updates: Partial<Site>) => void;
  deleteSite: (siteId: string) => void;
  selectSite: (siteId: string | null) => void;

  // Zone Actions
  addZone: (zone: Omit<Zone, 'id' | 'teams' | 'createdAt' | 'updatedAt'>) => void;
  updateZone: (zoneId: string, updates: Partial<Zone>) => void;
  deleteZone: (zoneId: string) => void;
  selectZone: (zoneId: string | null) => void;

  // Team Actions
  addTeam: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  deleteTeam: (teamId: string) => void;
  selectTeam: (teamId: string | null) => void;

  // Assignment Actions
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAssignment: (assignmentId: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (assignmentId: string) => void;

  // Location Assignment Actions
  assignLocationToShift: (assignment: Omit<LocationAssignment, 'id' | 'assignedAt'>) => void;
  updateLocationAssignment: (shiftId: string, updates: Partial<LocationAssignment>) => void;
  removeLocationAssignment: (shiftId: string) => void;

  // Utility Actions
  getSiteById: (siteId: string) => Site | undefined;
  getZoneById: (zoneId: string) => Zone | undefined;
  getTeamById: (teamId: string) => Team | undefined;
  getAssignmentById: (assignmentId: string) => Assignment | undefined;
  getLocationAssignmentByShiftId: (shiftId: string) => LocationAssignment | undefined;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  // Initial state with sample data
  sites: [
    {
      id: 'site1',
      name: 'Corporate Headquarters',
      description: 'Main corporate office building',
      address: '123 Business District, City Center',
      contactInfo: '555-0101',
      zones: [
        {
          id: 'zone1',
          siteId: 'site1',
          name: 'Main Entrance',
          description: 'Primary entrance and lobby area',
          capacity: 2,
          securityLevel: 'high',
          color: '#4ecdc4',
          teams: [
            {
              id: 'team1',
              zoneId: 'zone1',
              name: 'Front Desk Security',
              description: 'Responsible for main entrance security',
              teamLeadId: 'emp1',
              memberIds: ['emp1', 'emp2'],
              specialization: 'Access Control',
              maxConcurrentShifts: 2,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
            },
          ],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'zone2',
          siteId: 'site1',
          name: 'Parking Garage',
          description: 'Underground parking facility',
          capacity: 1,
          securityLevel: 'medium',
          color: '#45b7d1',
          teams: [
            {
              id: 'team2',
              zoneId: 'zone2',
              name: 'Parking Patrol',
              description: 'Monitors parking garage and vehicle access',
              teamLeadId: 'emp3',
              memberIds: ['emp3'],
              specialization: 'Patrol',
              maxConcurrentShifts: 1,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
            },
          ],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ],
  selectedSiteId: null,
  selectedZoneId: null,
  selectedTeamId: null,
  locationAssignments: [],

  // Site Actions
  addSite: (siteData) => {
    const newSite: Site = {
      ...siteData,
      id: Date.now().toString(),
      zones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set(state => ({
      sites: [...state.sites, newSite],
    }));
  },

  updateSite: (siteId, updates) => {
    set(state => ({
      sites: state.sites.map(site =>
        site.id === siteId
          ? { ...site, ...updates, updatedAt: new Date().toISOString() }
          : site
      ),
    }));
  },

  deleteSite: (siteId) => {
    set(state => ({
      sites: state.sites.filter(site => site.id !== siteId),
      selectedSiteId: state.selectedSiteId === siteId ? null : state.selectedSiteId,
    }));
  },

  selectSite: (siteId) => {
    set({
      selectedSiteId: siteId,
      selectedZoneId: null,
      selectedTeamId: null,
    });
  },

  // Zone Actions
  addZone: (zoneData) => {
    const newZone: Zone = {
      ...zoneData,
      id: Date.now().toString(),
      teams: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set(state => ({
      sites: state.sites.map(site =>
        site.id === zoneData.siteId
          ? { ...site, zones: [...site.zones, newZone], updatedAt: new Date().toISOString() }
          : site
      ),
    }));
  },

  updateZone: (zoneId, updates) => {
    set(state => ({
      sites: state.sites.map(site => ({
        ...site,
        zones: site.zones.map(zone =>
          zone.id === zoneId
            ? { ...zone, ...updates, updatedAt: new Date().toISOString() }
            : zone
        ),
        updatedAt: site.zones.some(zone => zone.id === zoneId) ? new Date().toISOString() : site.updatedAt,
      })),
    }));
  },

  deleteZone: (zoneId) => {
    set(state => ({
      sites: state.sites.map(site => ({
        ...site,
        zones: site.zones.filter(zone => zone.id !== zoneId),
        updatedAt: site.zones.some(zone => zone.id === zoneId) ? new Date().toISOString() : site.updatedAt,
      })),
      selectedZoneId: state.selectedZoneId === zoneId ? null : state.selectedZoneId,
    }));
  },

  selectZone: (zoneId) => {
    set({
      selectedZoneId: zoneId,
      selectedTeamId: null,
    });
  },

  // Team Actions
  addTeam: (teamData) => {
    const newTeam: Team = {
      ...teamData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set(state => ({
      sites: state.sites.map(site => ({
        ...site,
        zones: site.zones.map(zone =>
          zone.id === teamData.zoneId
            ? { ...zone, teams: [...zone.teams, newTeam], updatedAt: new Date().toISOString() }
            : zone
        ),
        updatedAt: site.zones.some(zone => zone.id === teamData.zoneId) ? new Date().toISOString() : site.updatedAt,
      })),
    }));
  },

  updateTeam: (teamId, updates) => {
    set(state => ({
      sites: state.sites.map(site => ({
        ...site,
        zones: site.zones.map(zone => ({
          ...zone,
          teams: zone.teams.map(team =>
            team.id === teamId
              ? { ...team, ...updates, updatedAt: new Date().toISOString() }
              : team
          ),
          updatedAt: zone.teams.some(team => team.id === teamId) ? new Date().toISOString() : zone.updatedAt,
        })),
      })),
    }));
  },

  deleteTeam: (teamId) => {
    set(state => ({
      sites: state.sites.map(site => ({
        ...site,
        zones: site.zones.map(zone => ({
          ...zone,
          teams: zone.teams.filter(team => team.id !== teamId),
          updatedAt: zone.teams.some(team => team.id === teamId) ? new Date().toISOString() : zone.updatedAt,
        })),
      })),
      selectedTeamId: state.selectedTeamId === teamId ? null : state.selectedTeamId,
    }));
  },

  selectTeam: (teamId) => {
    set({
      selectedTeamId: teamId,
    });
  },

  // Assignment Actions
  addAssignment: (_assignmentData) => {
    // Implementation for adding assignments
  },

  updateAssignment: (_assignmentId, _updates) => {
    // Implementation for updating assignments
  },

  deleteAssignment: (_assignmentId) => {
    // Implementation for deleting assignments
  },

  // Location Assignment Actions
  assignLocationToShift: (assignmentData) => {
    const newAssignment: LocationAssignment = {
      ...assignmentData,
      assignedAt: new Date().toISOString(),
    };

    set(state => ({
      locationAssignments: [...state.locationAssignments, newAssignment],
    }));
  },

  updateLocationAssignment: (shiftId, updates) => {
    set(state => ({
      locationAssignments: state.locationAssignments.map(assignment =>
        assignment.shiftId === shiftId
          ? { ...assignment, ...updates }
          : assignment
      ),
    }));
  },

  removeLocationAssignment: (shiftId) => {
    set(state => ({
      locationAssignments: state.locationAssignments.filter(assignment => assignment.shiftId !== shiftId),
    }));
  },

  // Utility Actions
  getSiteById: (siteId) => {
    return get().sites.find(site => site.id === siteId);
  },

  getZoneById: (zoneId) => {
    const { sites } = get();
    for (const site of sites) {
      const zone = site.zones.find(z => z.id === zoneId);
      if (zone) return zone;
    }
    return undefined;
  },

  getTeamById: (teamId) => {
    const { sites } = get();
    for (const site of sites) {
      for (const zone of site.zones) {
        const team = zone.teams.find(t => t.id === teamId);
        if (team) return team;
      }
    }
    return undefined;
  },

  getAssignmentById: (assignmentId) => {
    // Implementation would depend on how assignments are stored
    return undefined;
  },

  getLocationAssignmentByShiftId: (shiftId) => {
    return get().locationAssignments.find(assignment => assignment.shiftId === shiftId);
  },
}));