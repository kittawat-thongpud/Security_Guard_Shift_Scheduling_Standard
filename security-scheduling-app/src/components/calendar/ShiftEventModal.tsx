import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Chip,
  Divider,
  Autocomplete,
  Card,
  CardContent,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import type { Shift, CustomShiftPattern } from '../../types';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useLocationStore } from '../../stores/locationStore';
import { usePatternStore } from '../../stores/patternStore';

interface ShiftEventModalProps {
  open: boolean;
  onClose: () => void;
  shift?: Shift;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
}

const ShiftEventModal: React.FC<ShiftEventModalProps> = ({
  open,
  onClose,
  shift,
  initialDate,
  initialStartTime,
  initialEndTime,
}) => {
  const { employees, addShift, updateShift } = useScheduleStore();
  const { sites, getSiteById, getZoneById } = useLocationStore();
  const { getActivePatterns } = usePatternStore();

  const [formData, setFormData] = useState<Partial<Shift>>({
    employeeId: '',
    date: initialDate || '',
    startTime: initialStartTime || '08:00',
    endTime: initialEndTime || '16:00',
    type: 'morning',
    isOvertime: false,
    notes: '',
    duration: '8h',
  });

  const [selectedPattern, setSelectedPattern] = useState<CustomShiftPattern | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  useEffect(() => {
    if (shift) {
      setFormData({
        ...shift,
      });

      // Load location assignment if exists
      if (shift.locationAssignment) {
        setSelectedSite(shift.locationAssignment.siteId);
        setSelectedZone(shift.locationAssignment.zoneId);
        setSelectedTeam(shift.locationAssignment.teamId);
      }
    } else {
      setFormData({
        employeeId: '',
        date: initialDate || '',
        startTime: initialStartTime || '08:00',
        endTime: initialEndTime || '16:00',
        type: 'morning',
        isOvertime: false,
        notes: '',
        duration: '8h',
      });
      setSelectedPattern(null);
      setSelectedSite('');
      setSelectedZone('');
      setSelectedTeam('');
    }
  }, [shift, initialDate, initialStartTime, initialEndTime]);

  const handleFormChange = (field: keyof Shift, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePatternChange = (pattern: CustomShiftPattern | null) => {
    setSelectedPattern(pattern);
    if (pattern) {
      // Apply pattern settings to form
      setFormData(prev => ({
        ...prev,
        duration: pattern.duration,
        patternId: pattern.id,
      }));
    }
  };

  const handleSave = () => {
    if (!formData.employeeId || !formData.date || !formData.startTime || !formData.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    const shiftData: Partial<Shift> = {
      ...formData,
    };

    // Add location assignment if selected
    if (selectedSite && selectedZone && selectedTeam) {
      shiftData.locationAssignment = {
        siteId: selectedSite,
        zoneId: selectedZone,
        teamId: selectedTeam,
        assignmentId: '', // This would be set based on assignment selection
      };
    }

    if (shift) {
      // Update existing shift
      updateShift(shift.id, shiftData);
    } else {
      // Create new shift
      addShift(shiftData as Omit<Shift, 'id'>);
    }

    onClose();
  };

  const getSelectedEmployee = () => {
    return employees.find(emp => emp.id === formData.employeeId);
  };

  const getAvailableZones = () => {
    if (!selectedSite) return [];
    const site = getSiteById(selectedSite);
    return site?.zones || [];
  };

  const getAvailableTeams = () => {
    if (!selectedZone) return [];
    const zone = getZoneById(selectedZone);
    return zone?.teams || [];
  };

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return '0h';

    const start = new Date(`2000-01-01T${formData.startTime}`);
    let end = new Date(`2000-01-01T${formData.endTime}`);

    // Handle overnight shifts
    if (end < start) {
      end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    }

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `${hours.toFixed(1)}h`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon />
          {shift ? 'Edit Shift' : 'Create New Shift'}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Basic Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={formData.employeeId || ''}
                  label="Employee"
                  onChange={(e) => handleFormChange('employeeId', e.target.value)}
                  required
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" />
                        {employee.name} - {employee.position}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleFormChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>

            <Box sx={{ width: { xs: '100%', md: 'calc(25% - 12px)' } }}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={formData.startTime || ''}
                onChange={(e) => handleFormChange('startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>

            <Box sx={{ width: { xs: '100%', md: 'calc(25% - 12px)' } }}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={formData.endTime || ''}
                onChange={(e) => handleFormChange('endTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>

            <Box sx={{ width: { xs: '100%', md: 'calc(25% - 12px)' } }}>
              <FormControl fullWidth>
                <InputLabel>Shift Type</InputLabel>
                <Select
                  value={formData.type || 'morning'}
                  label="Shift Type"
                  onChange={(e) => handleFormChange('type', e.target.value)}
                >
                  <MenuItem value="morning">Morning</MenuItem>
                  <MenuItem value="afternoon">Afternoon</MenuItem>
                  <MenuItem value="night">Night</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ width: { xs: '100%', md: 'calc(25% - 12px)' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" color="textSecondary">
                  Duration: {calculateDuration()}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isOvertime || false}
                  onChange={(e) => handleFormChange('isOvertime', e.target.checked)}
                  color="warning"
                />
              }
              label="Overtime Shift"
            />
          </Box>

          <Divider />

          {/* Shift Pattern */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Shift Pattern
            </Typography>
            <Autocomplete
              options={getActivePatterns()}
              getOptionLabel={(option) => option.name}
              value={selectedPattern}
              onChange={(_, newValue) => handlePatternChange(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Pattern"
                  placeholder="Choose a predefined shift pattern"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {option.duration} | {option.description}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Box>

          <Divider />

          {/* Location Assignment */}
          <Box>
            <Typography variant="h6" gutterBottom>
              <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Location Assignment
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 12px)' } }}>
              <FormControl fullWidth>
                <InputLabel>Site</InputLabel>
                <Select
                  value={selectedSite}
                  label="Site"
                  onChange={(e) => {
                    setSelectedSite(e.target.value);
                    setSelectedZone('');
                    setSelectedTeam('');
                  }}
                >
                  {sites.map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 12px)' } }}>
              <FormControl fullWidth disabled={!selectedSite}>
                <InputLabel>Zone</InputLabel>
                <Select
                  value={selectedZone}
                  label="Zone"
                  onChange={(e) => {
                    setSelectedZone(e.target.value);
                    setSelectedTeam('');
                  }}
                >
                  {getAvailableZones().map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: zone.color,
                            borderRadius: '50%',
                          }}
                        />
                        {zone.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 12px)' } }}>
              <FormControl fullWidth disabled={!selectedZone}>
                <InputLabel>Team</InputLabel>
                <Select
                  value={selectedTeam}
                  label="Team"
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  {getAvailableTeams().map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Divider />

          {/* Notes */}
          <Box>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              placeholder="Add any special instructions or notes for this shift..."
            />
          </Box>

          {/* Employee Information */}
          {getSelectedEmployee() && (
            <Box>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Employee Information
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={`Rate: ฿${getSelectedEmployee()?.hourlyRate}/h`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`OT Rate: ฿${getSelectedEmployee()?.overtimeRate}/h`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Max Weekly: ${getSelectedEmployee()?.maxWeeklyHours}h`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!formData.employeeId || !formData.date || !formData.startTime || !formData.endTime}
        >
          {shift ? 'Update Shift' : 'Create Shift'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftEventModal;