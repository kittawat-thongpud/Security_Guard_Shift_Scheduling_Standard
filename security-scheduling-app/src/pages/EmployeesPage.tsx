import React, { useState } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useScheduleStore } from '../stores/scheduleStore';
import type { Employee, ShiftType } from '../types';

const EmployeesPage: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useScheduleStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
    name: '',
    position: 'Security Guard',
    hourlyRate: 300,
    overtimeRate: 450,
    maxWeeklyHours: 48,
    preferredShifts: [],
    unavailableDates: [],
  });

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        position: employee.position,
        hourlyRate: employee.hourlyRate,
        overtimeRate: employee.overtimeRate,
        maxWeeklyHours: employee.maxWeeklyHours,
        preferredShifts: employee.preferredShifts,
        unavailableDates: employee.unavailableDates,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        position: 'Security Guard',
        hourlyRate: 300,
        overtimeRate: 450,
        maxWeeklyHours: 48,
        preferredShifts: [],
        unavailableDates: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
  };

  const handleSubmit = () => {
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, formData);
    } else {
      addEmployee(formData);
    }
    handleCloseDialog();
  };

  const handlePreferredShiftsChange = (shifts: ShiftType[]) => {
    setFormData(prev => ({ ...prev, preferredShifts: shifts }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Employee Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Employee
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Hourly Rate</TableCell>
              <TableCell>Overtime Rate</TableCell>
              <TableCell>Max Weekly Hours</TableCell>
              <TableCell>Preferred Shifts</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>฿{employee.hourlyRate}</TableCell>
                <TableCell>฿{employee.overtimeRate}</TableCell>
                <TableCell>{employee.maxWeeklyHours}</TableCell>
                <TableCell>
                  {employee.preferredShifts.map((shift) => (
                    <Chip
                      key={shift}
                      label={shift}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleOpenDialog(employee)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => deleteEmployee(employee.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Hourly Rate"
              type="number"
              value={formData.hourlyRate}
              onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
              fullWidth
            />
            <TextField
              label="Overtime Rate"
              type="number"
              value={formData.overtimeRate}
              onChange={(e) => setFormData(prev => ({ ...prev, overtimeRate: Number(e.target.value) }))}
              fullWidth
            />
            <TextField
              label="Max Weekly Hours"
              type="number"
              value={formData.maxWeeklyHours}
              onChange={(e) => setFormData(prev => ({ ...prev, maxWeeklyHours: Number(e.target.value) }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Preferred Shifts</InputLabel>
              <Select
                multiple
                value={formData.preferredShifts}
                label="Preferred Shifts"
                onChange={(e) => handlePreferredShiftsChange(e.target.value as ShiftType[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="morning">Morning</MenuItem>
                <MenuItem value="afternoon">Afternoon</MenuItem>
                <MenuItem value="night">Night</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingEmployee ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeesPage;