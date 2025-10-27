import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Divider,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Delete, Save, Restore } from '@mui/icons-material';
import { usePatternStore } from '../stores/patternStore';
import { useSiteStore } from '../stores/siteStore';
import { ShiftPattern } from '../types/shiftPattern';
import { SiteConfiguration } from '../types/location';

export default function SettingsPage() {
  const [openPatternDialog, setOpenPatternDialog] = useState(false);
  const [openSiteDialog, setOpenSiteDialog] = useState(false);
  const [editingPattern, setEditingPattern] = useState<ShiftPattern | null>(null);
  const [editingSite, setEditingSite] = useState<SiteConfiguration | null>(null);

  const patternStore = usePatternStore();
  const siteStore = useSiteStore();

  // Pattern form state
  const [patternForm, setPatternForm] = useState({
    patternName: '',
    description: '',
    patternType: 'ROTATING',
    active: true,
    shiftSequence: [
      { shiftType: '8H', startTime: '06:00', endTime: '14:00', requiredStaff: 2 },
      { shiftType: '8H', startTime: '14:00', endTime: '22:00', requiredStaff: 2 },
      { shiftType: '8H', startTime: '22:00', endTime: '06:00', requiredStaff: 2 },
    ],
  });

  // Site form state
  const [siteForm, setSiteForm] = useState({
    siteName: '',
    address: '',
    riskLevel: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    baseRequirement: 2,
    contactPerson: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // Handle pattern operations
  const handleOpenPatternDialog = (pattern?: ShiftPattern) => {
    if (pattern) {
      setEditingPattern(pattern);
      setPatternForm({
        patternName: pattern.patternName,
        description: pattern.description,
        patternType: pattern.patternType,
        active: pattern.active,
        shiftSequence: pattern.shiftSequence,
      });
    } else {
      setEditingPattern(null);
      setPatternForm({
        patternName: '',
        description: '',
        patternType: 'ROTATING',
        active: true,
        shiftSequence: [
          { shiftType: '8H', startTime: '06:00', endTime: '14:00', requiredStaff: 2 },
          { shiftType: '8H', startTime: '14:00', endTime: '22:00', requiredStaff: 2 },
          { shiftType: '8H', startTime: '22:00', endTime: '06:00', requiredStaff: 2 },
        ],
      });
    }
    setOpenPatternDialog(true);
  };

  const handleSavePattern = () => {
    if (editingPattern) {
      patternStore.updatePattern(editingPattern.id, patternForm);
    } else {
      patternStore.addPattern(patternForm);
    }
    setOpenPatternDialog(false);
  };

  const handleDeletePattern = (id: string) => {
    if (window.confirm('Are you sure you want to delete this pattern?')) {
      patternStore.deletePattern(id);
    }
  };

  // Handle site operations
  const handleOpenSiteDialog = (site?: SiteConfiguration) => {
    if (site) {
      setEditingSite(site);
      setSiteForm({
        siteName: site.siteName,
        address: site.address,
        riskLevel: site.riskLevel,
        baseRequirement: site.baseRequirement,
        contactPerson: site.contactPerson,
      });
    } else {
      setEditingSite(null);
      setSiteForm({
        siteName: '',
        address: '',
        riskLevel: 'MEDIUM',
        baseRequirement: 2,
        contactPerson: {
          name: '',
          email: '',
          phone: '',
        },
      });
    }
    setOpenSiteDialog(true);
  };

  const handleSaveSite = () => {
    if (editingSite) {
      siteStore.updateSite(editingSite.id, siteForm);
    } else {
      siteStore.addSite(siteForm);
    }
    setOpenSiteDialog(false);
  };

  const handleDeleteSite = (id: string) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      siteStore.deleteSite(id);
    }
  };

  // Reset all data
  const handleResetData = () => {
    if (window.confirm('This will reset all data to defaults. Are you sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Shift Patterns Management */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Shift Patterns
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => handleOpenPatternDialog()}
                >
                  Add Pattern
                </Button>
              </Box>

              <List>
                {patternStore.patterns.map((pattern) => (
                  <ListItem key={pattern.id} divider>
                    <ListItemText
                      primary={pattern.patternName}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {pattern.description}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {pattern.shiftSequence.map((shift, index) => (
                              <Chip
                                key={index}
                                label={`${shift.shiftType} (${shift.startTime}-${shift.endTime})`}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenPatternDialog(pattern)}
                      >
                        <Save />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeletePattern(pattern.id)}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Site Management */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Site Management
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => handleOpenSiteDialog()}
                >
                  Add Site
                </Button>
              </Box>

              <List>
                {siteStore.sites.map((site) => (
                  <ListItem key={site.id} divider>
                    <ListItemText
                      primary={site.siteName}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {site.address}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`Risk: ${site.riskLevel}`}
                              color={site.riskLevel === 'HIGH' ? 'error' :
                                     site.riskLevel === 'MEDIUM' ? 'warning' : 'success'}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={`Base Staff: ${site.baseRequirement}`}
                              size="small"
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenSiteDialog(site)}
                      >
                        <Save />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSite(site.id)}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Settings */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Configuration
              </Typography>

              <Grid container spacing={3}>
                <Grid xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable Auto-Scheduling"
                  />
                  <Typography variant="body2" color="textSecondary">
                    Automatically assign employees based on availability and preferences
                  </Typography>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable KPI Tracking"
                  />
                  <Typography variant="body2" color="textSecondary">
                    Track and display performance metrics
                  </Typography>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch />}
                    label="Enable Email Notifications"
                  />
                  <Typography variant="body2" color="textSecondary">
                    Send schedule notifications to employees
                  </Typography>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable Conflict Detection"
                  />
                  <Typography variant="body2" color="textSecondary">
                    Detect scheduling conflicts and violations
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Data Management
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Reset all data to default values
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Restore />}
                  onClick={handleResetData}
                >
                  Reset All Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pattern Dialog */}
      <Dialog open={openPatternDialog} onClose={() => setOpenPatternDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPattern ? 'Edit Pattern' : 'Add New Pattern'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pattern Name"
                value={patternForm.patternName}
                onChange={(e) => setPatternForm({ ...patternForm, patternName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={patternForm.description}
                onChange={(e) => setPatternForm({ ...patternForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Pattern Type</InputLabel>
                <Select
                  value={patternForm.patternType}
                  label="Pattern Type"
                  onChange={(e) => setPatternForm({ ...patternForm, patternType: e.target.value })}
                >
                  <MenuItem value="ROTATING">Rotating</MenuItem>
                  <MenuItem value="FIXED">Fixed</MenuItem>
                  <MenuItem value="CUSTOM">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPatternDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePattern} variant="contained">
            {editingPattern ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Site Dialog */}
      <Dialog open={openSiteDialog} onClose={() => setOpenSiteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSite ? 'Edit Site' : 'Add New Site'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Site Name"
                value={siteForm.siteName}
                onChange={(e) => setSiteForm({ ...siteForm, siteName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={siteForm.address}
                onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Risk Level</InputLabel>
                <Select
                  value={siteForm.riskLevel}
                  label="Risk Level"
                  onChange={(e) => setSiteForm({ ...siteForm, riskLevel: e.target.value as any })}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Staff Requirement"
                type="number"
                value={siteForm.baseRequirement}
                onChange={(e) => setSiteForm({ ...siteForm, baseRequirement: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Contact Person
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Name"
                value={siteForm.contactPerson.name}
                onChange={(e) => setSiteForm({
                  ...siteForm,
                  contactPerson: { ...siteForm.contactPerson, name: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={siteForm.contactPerson.email}
                onChange={(e) => setSiteForm({
                  ...siteForm,
                  contactPerson: { ...siteForm.contactPerson, email: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Phone"
                value={siteForm.contactPerson.phone}
                onChange={(e) => setSiteForm({
                  ...siteForm,
                  contactPerson: { ...siteForm.contactPerson, phone: e.target.value }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSiteDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSite} variant="contained">
            {editingSite ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}