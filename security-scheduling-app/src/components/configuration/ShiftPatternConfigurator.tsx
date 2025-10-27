import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  IconButton,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type { ShiftDuration, CustomShiftPattern } from '../../types';
import type { TimeSlot, PatternConstraints } from '../../types/shiftPattern';
import { usePatternStore } from '../../stores/patternStore';

interface ShiftPatternConfiguratorProps {
  onPatternCreated?: (pattern: CustomShiftPattern) => void;
  initialPattern?: CustomShiftPattern;
}

const ShiftPatternConfigurator: React.FC<ShiftPatternConfiguratorProps> = ({
  onPatternCreated,
  initialPattern,
}) => {
  const { addPattern, updatePattern } = usePatternStore();

  const [pattern, setPattern] = useState<Partial<CustomShiftPattern>>(
    initialPattern || {
      name: '',
      description: '',
      duration: '8h' as ShiftDuration,
      timeSlots: [],
      locationAssignments: [],
      constraints: {
        maxConsecutiveShifts: 5,
        minRestBetweenShifts: 12,
        maxWeeklyHours: 40,
        maxOvertimeHours: 10,
        preferredShiftTypes: [],
        blackoutDates: [],
        mandatoryBreaks: [],
      },
      isActive: true,
    }
  );

  const [newTimeSlot, setNewTimeSlot] = useState<Partial<TimeSlot>>({
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    type: 'morning',
    minStaff: 1,
    maxStaff: 2,
    requiredSkills: [],
    priority: 'medium',
  });

  const handlePatternChange = (field: keyof CustomShiftPattern, value: any) => {
    setPattern(prev => ({ ...prev, [field]: value }));
  };

  const handleConstraintChange = (field: keyof PatternConstraints, value: any) => {
    setPattern(prev => ({
      ...prev,
      constraints: {
        ...prev.constraints!,
        [field]: value,
      },
    }));
  };

  const addTimeSlot = () => {
    if (!newTimeSlot.name || !newTimeSlot.startTime || !newTimeSlot.endTime) return;

    const timeSlot: TimeSlot = {
      ...newTimeSlot,
      id: Date.now().toString(),
      patternId: pattern.id || 'temp',
    } as TimeSlot;

    setPattern(prev => ({
      ...prev,
      timeSlots: [...(prev.timeSlots || []), timeSlot],
    }));

    // Reset new time slot form
    setNewTimeSlot({
      name: '',
      startTime: '08:00',
      endTime: '16:00',
      type: 'morning',
      minStaff: 1,
      maxStaff: 2,
      requiredSkills: [],
      priority: 'medium',
    });
  };

  const removeTimeSlot = (timeSlotId: string) => {
    setPattern(prev => ({
      ...prev,
      timeSlots: prev.timeSlots?.filter(ts => ts.id !== timeSlotId) || [],
    }));
  };

  const handleSave = () => {
    if (!pattern.name || !pattern.duration || !pattern.timeSlots?.length) {
      alert('Please fill in all required fields and add at least one time slot');
      return;
    }

    const patternData: Omit<CustomShiftPattern, 'id' | 'createdAt' | 'updatedAt'> = {
      name: pattern.name,
      description: pattern.description || '',
      duration: pattern.duration,
      timeSlots: pattern.timeSlots,
      locationAssignments: pattern.locationAssignments || [],
      constraints: pattern.constraints!,
      isActive: pattern.isActive !== false,
    };

    if (initialPattern) {
      updatePattern(initialPattern.id, patternData);
    } else {
      addPattern(patternData);
    }

    onPatternCreated?.(pattern as CustomShiftPattern);

    // Reset form if not editing
    if (!initialPattern) {
      setPattern({
        name: '',
        description: '',
        duration: '8h',
        timeSlots: [],
        locationAssignments: [],
        constraints: {
          maxConsecutiveShifts: 5,
          minRestBetweenShifts: 12,
          maxWeeklyHours: 40,
          maxOvertimeHours: 10,
          preferredShiftTypes: [],
          blackoutDates: [],
          mandatoryBreaks: [],
        },
        isActive: true,
      });
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {initialPattern ? 'Edit Shift Pattern' : 'Create Shift Pattern'}
      </Typography>

      {/* Basic Pattern Information */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Pattern Name"
              value={pattern.name || ''}
              onChange={(e) => handlePatternChange('name', e.target.value)}
              required
            />
          </Box>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <FormControl fullWidth>
              <InputLabel>Duration</InputLabel>
              <Select
                value={pattern.duration || '8h'}
                label="Duration"
                onChange={(e) => handlePatternChange('duration', e.target.value as ShiftDuration)}
              >
                <MenuItem value="4h">4 Hours</MenuItem>
                <MenuItem value="8h">8 Hours</MenuItem>
                <MenuItem value="12h">12 Hours</MenuItem>
                <MenuItem value="24h">24 Hours</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={pattern.description || ''}
              onChange={(e) => handlePatternChange('description', e.target.value)}
            />
          </Box>
          <Box sx={{ width: '100%' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={pattern.isActive !== false}
                  onChange={(e) => handlePatternChange('isActive', e.target.checked)}
                />
              }
              label="Active Pattern"
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Time Slots Configuration */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Time Slots
        </Typography>

        {/* Add New Time Slot Form */}
        <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Add Time Slot
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ width: { xs: '100%', md: 'calc(25% - 8px)' } }}>
              <TextField
                fullWidth
                label="Slot Name"
                value={newTimeSlot.name || ''}
                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, name: e.target.value }))}
              />
            </Box>
            <Box sx={{ width: { xs: 'calc(50% - 8px)', md: 'calc(16.666% - 8px)' } }}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={newTimeSlot.startTime || ''}
                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </Box>
            <Box sx={{ width: { xs: 'calc(50% - 8px)', md: 'calc(16.666% - 8px)' } }}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={newTimeSlot.endTime || ''}
                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </Box>
            <Box sx={{ width: { xs: 'calc(50% - 8px)', md: 'calc(16.666% - 8px)' } }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newTimeSlot.type || 'morning'}
                  label="Type"
                  onChange={(e) => setNewTimeSlot(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  <MenuItem value="morning">Morning</MenuItem>
                  <MenuItem value="afternoon">Afternoon</MenuItem>
                  <MenuItem value="night">Night</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: { xs: 'calc(50% - 8px)', md: 'calc(12.5% - 8px)' } }}>
              <TextField
                fullWidth
                label="Min Staff"
                type="number"
                value={newTimeSlot.minStaff || 1}
                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, minStaff: parseInt(e.target.value) }))}
              />
            </Box>
            <Box sx={{ width: { xs: 'calc(50% - 8px)', md: 'calc(12.5% - 8px)' } }}>
              <TextField
                fullWidth
                label="Max Staff"
                type="number"
                value={newTimeSlot.maxStaff || 2}
                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, maxStaff: parseInt(e.target.value) }))}
              />
            </Box>
            <Box sx={{ width: { xs: 'calc(50% - 8px)', md: 'calc(8.333% - 8px)' } }}>
              <IconButton
                color="primary"
                onClick={addTimeSlot}
                disabled={!newTimeSlot.name}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
        </Card>

        {/* Existing Time Slots */}
        {pattern.timeSlots?.map((timeSlot, index) => (
          <Card key={timeSlot.id} variant="outlined" sx={{ mb: 1, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ScheduleIcon color="action" />
                <Box>
                  <Typography variant="subtitle1">
                    {timeSlot.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {timeSlot.startTime} - {timeSlot.endTime} | {timeSlot.type}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={`Min: ${timeSlot.minStaff}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Max: ${timeSlot.maxStaff}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={timeSlot.priority}
                      size="small"
                      color={
                        timeSlot.priority === 'high' ? 'error' :
                        timeSlot.priority === 'medium' ? 'warning' : 'default'
                      }
                    />
                  </Box>
                </Box>
              </Box>
              <IconButton
                color="error"
                onClick={() => removeTimeSlot(timeSlot.id)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Card>
        ))}

        {!pattern.timeSlots?.length && (
          <Typography color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
            No time slots added yet. Add your first time slot above.
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Constraints Configuration */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Constraints
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Max Consecutive Shifts"
              type="number"
              value={pattern.constraints?.maxConsecutiveShifts || 5}
              onChange={(e) => handleConstraintChange('maxConsecutiveShifts', parseInt(e.target.value))}
            />
          </Box>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Min Rest Between Shifts (hours)"
              type="number"
              value={pattern.constraints?.minRestBetweenShifts || 12}
              onChange={(e) => handleConstraintChange('minRestBetweenShifts', parseInt(e.target.value))}
            />
          </Box>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Max Weekly Hours"
              type="number"
              value={pattern.constraints?.maxWeeklyHours || 40}
              onChange={(e) => handleConstraintChange('maxWeeklyHours', parseInt(e.target.value))}
            />
          </Box>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' } }}>
            <TextField
              fullWidth
              label="Max Overtime Hours"
              type="number"
              value={pattern.constraints?.maxOvertimeHours || 10}
              onChange={(e) => handleConstraintChange('maxOvertimeHours', parseInt(e.target.value))}
            />
          </Box>
        </Box>
      </Box>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!pattern.name || !pattern.timeSlots?.length}
        >
          {initialPattern ? 'Update Pattern' : 'Create Pattern'}
        </Button>
      </Box>
    </Paper>
  );
};

export default ShiftPatternConfigurator;