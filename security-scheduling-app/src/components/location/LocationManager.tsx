import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import type { Site, Zone, Team, Assignment } from '../../types';
import { useLocationStore } from '../../stores/locationStore';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`location-tabpanel-${index}`}
      aria-labelledby={`location-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const LocationManager: React.FC = () => {
  const {
    sites,
    selectedSiteId,
    selectedZoneId,
    selectedTeamId,
    addSite,
    updateSite,
    deleteSite,
    selectSite,
    addZone,
    updateZone,
    deleteZone,
    selectZone,
    addTeam,
    updateTeam,
    deleteTeam,
    selectTeam,
  } = useLocationStore();

  const [activeTab, setActiveTab] = useState(0);
  const [newSite, setNewSite] = useState<Partial<Site>>({
    name: '',
    description: '',
    address: '',
    contactInfo: '',
  });

  const [newZone, setNewZone] = useState<Partial<Zone>>({
    name: '',
    description: '',
    capacity: 1,
    securityLevel: 'medium' as const,
    color: '#4ecdc4',
  });

  const [newTeam, setNewTeam] = useState<Partial<Team>>({
    name: '',
    description: '',
    teamLeadId: '',
    memberIds: [],
    specialization: '',
    maxConcurrentShifts: 1,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAddSite = () => {
    if (!newSite.name) return;

    addSite({
      name: newSite.name,
      description: newSite.description || '',
      address: newSite.address || '',
      contactInfo: newSite.contactInfo || '',
    });

    setNewSite({
      name: '',
      description: '',
      address: '',
      contactInfo: '',
    });
  };

  const handleAddZone = () => {
    if (!newZone.name || !selectedSiteId) return;

    addZone({
      siteId: selectedSiteId,
      name: newZone.name,
      description: newZone.description || '',
      capacity: newZone.capacity || 1,
      securityLevel: newZone.securityLevel || 'medium',
      color: newZone.color || '#4ecdc4',
    });

    setNewZone({
      name: '',
      description: '',
      capacity: 1,
      securityLevel: 'medium',
      color: '#4ecdc4',
    });
  };

  const handleAddTeam = () => {
    if (!newTeam.name || !selectedZoneId) return;

    addTeam({
      zoneId: selectedZoneId,
      name: newTeam.name,
      description: newTeam.description || '',
      teamLeadId: newTeam.teamLeadId || '',
      memberIds: newTeam.memberIds || [],
      specialization: newTeam.specialization || '',
      maxConcurrentShifts: newTeam.maxConcurrentShifts || 1,
    });

    setNewTeam({
      name: '',
      description: '',
      teamLeadId: '',
      memberIds: [],
      specialization: '',
      maxConcurrentShifts: 1,
    });
  };

  const getSelectedSite = () => {
    return sites.find(site => site.id === selectedSiteId);
  };

  const getSelectedZone = () => {
    const site = getSelectedSite();
    return site?.zones.find(zone => zone.id === selectedZoneId);
  };

  const getSelectedTeam = () => {
    const zone = getSelectedZone();
    return zone?.teams.find(team => team.id === selectedTeamId);
  };

  return (
    <Paper sx={{ width: '100%' }}>
      <Typography variant="h5" sx={{ p: 2 }}>
        Location & Team Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Sites" />
          <Tab label="Zones" disabled={!selectedSiteId} />
          <Tab label="Teams" disabled={!selectedZoneId} />
          <Tab label="Assignments" disabled={!selectedTeamId} />
        </Tabs>
      </Box>

      {/* Sites Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {/* Add Site Form */}
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add New Site
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Site Name"
                    value={newSite.name}
                    onChange={(e) => setNewSite(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <TextField
                    label="Description"
                    multiline
                    rows={2}
                    value={newSite.description}
                    onChange={(e) => setNewSite(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <TextField
                    label="Address"
                    value={newSite.address}
                    onChange={(e) => setNewSite(prev => ({ ...prev, address: e.target.value }))}
                  />
                  <TextField
                    label="Contact Info"
                    value={newSite.contactInfo}
                    onChange={(e) => setNewSite(prev => ({ ...prev, contactInfo: e.target.value }))}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddSite}
                    disabled={!newSite.name}
                    startIcon={<AddIcon />}
                  >
                    Add Site
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sites List */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Existing Sites
            </Typography>
            <List>
              {sites.map((site) => (
                <ListItem
                  key={site.id}
                  button
                  selected={selectedSiteId === site.id}
                  onClick={() => selectSite(site.id)}
                >
                  <LocationIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary={site.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {site.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip
                            label={`${site.zones.length} Zones`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={site.address ? 'Has Address' : 'No Address'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => deleteSite(site.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Zones Tab */}
      <TabPanel value={activeTab} index={1}>
        {selectedSiteId && (
          <Grid container spacing={3}>
            {/* Add Zone Form */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Add Zone to {getSelectedSite()?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Zone Name"
                      value={newZone.name}
                      onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <TextField
                      label="Description"
                      multiline
                      rows={2}
                      value={newZone.description}
                      onChange={(e) => setNewZone(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <TextField
                      label="Capacity"
                      type="number"
                      value={newZone.capacity}
                      onChange={(e) => setNewZone(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Security Level</InputLabel>
                      <Select
                        value={newZone.securityLevel}
                        label="Security Level"
                        onChange={(e) => setNewZone(prev => ({ ...prev, securityLevel: e.target.value as any }))}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Color"
                      type="color"
                      value={newZone.color}
                      onChange={(e) => setNewZone(prev => ({ ...prev, color: e.target.value }))}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddZone}
                      disabled={!newZone.name}
                      startIcon={<AddIcon />}
                    >
                      Add Zone
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Zones List */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Zones in {getSelectedSite()?.name}
              </Typography>
              <List>
                {getSelectedSite()?.zones.map((zone) => (
                  <ListItem
                    key={zone.id}
                    button
                    selected={selectedZoneId === zone.id}
                    onClick={() => selectZone(zone.id)}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        backgroundColor: zone.color,
                        borderRadius: 1,
                        mr: 2,
                      }}
                    />
                    <ListItemText
                      primary={zone.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {zone.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                              label={`Capacity: ${zone.capacity}`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={zone.securityLevel}
                              size="small"
                              color={
                                zone.securityLevel === 'high' ? 'error' :
                                zone.securityLevel === 'medium' ? 'warning' : 'default'
                              }
                            />
                            <Chip
                              label={`${zone.teams.length} Teams`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => deleteZone(zone.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Teams Tab */}
      <TabPanel value={activeTab} index={2}>
        {selectedZoneId && (
          <Grid container spacing={3}>
            {/* Add Team Form */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Add Team to {getSelectedZone()?.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Team Name"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <TextField
                      label="Description"
                      multiline
                      rows={2}
                      value={newTeam.description}
                      onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <TextField
                      label="Specialization"
                      value={newTeam.specialization}
                      onChange={(e) => setNewTeam(prev => ({ ...prev, specialization: e.target.value }))}
                    />
                    <TextField
                      label="Max Concurrent Shifts"
                      type="number"
                      value={newTeam.maxConcurrentShifts}
                      onChange={(e) => setNewTeam(prev => ({ ...prev, maxConcurrentShifts: parseInt(e.target.value) }))}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddTeam}
                      disabled={!newTeam.name}
                      startIcon={<AddIcon />}
                    >
                      Add Team
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Teams List */}
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Teams in {getSelectedZone()?.name}
              </Typography>
              <List>
                {getSelectedZone()?.teams.map((team) => (
                  <ListItem
                    key={team.id}
                    button
                    selected={selectedTeamId === team.id}
                    onClick={() => selectTeam(team.id)}
                  >
                    <GroupIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <ListItemText
                      primary={team.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {team.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                              label={`${team.memberIds.length} Members`}
                              size="small"
                              variant="outlined"
                            />
                            {team.specialization && (
                              <Chip
                                label={team.specialization}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            <Chip
                              label={`Max Shifts: ${team.maxConcurrentShifts}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => deleteTeam(team.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Assignments Tab */}
      <TabPanel value={activeTab} index={3}>
        {selectedTeamId && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Assignments for {getSelectedTeam()?.name}
            </Typography>
            <Typography color="textSecondary">
              Assignment management functionality will be implemented here.
            </Typography>
          </Box>
        )}
      </TabPanel>
    </Paper>
  );
};

export default LocationManager;