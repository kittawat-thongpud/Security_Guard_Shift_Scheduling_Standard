import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useEmployeeStore } from '../stores/employeeStore';
import type { Employee, EmployeeType } from '../types';

export default function EmployeesPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    employeeCode: '',
    fullName: '',
    email: '',
    phone: '',
    hireDate: '',
    employeeType: 'OPERATIONAL' as EmployeeType,
    role: '',
    activeStatus: true,
    baseHappinessScore: 4.0,
    preferences: {
      preferredShiftTypes: ['8H' as const],
      preferredTimeSlots: ['06:00-14:00'],
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
    certifications: ['Basic Security']
  });

  const employeeStore = useEmployeeStore();

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        hireDate: employee.hireDate,
        employeeType: employee.employeeType,
        role: employee.role,
        activeStatus: employee.activeStatus,
        baseHappinessScore: employee.baseHappinessScore,
        preferences: employee.preferences,
        constraints: employee.constraints,
        certifications: employee.certifications
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        employeeCode: '',
        fullName: '',
        email: '',
        phone: '',
        hireDate: new Date().toISOString().split('T')[0],
        employeeType: 'OPERATIONAL',
        role: '',
        activeStatus: true,
        baseHappinessScore: 4.0,
        preferences: {
          preferredShiftTypes: ['8H' as const],
          preferredTimeSlots: ['06:00-14:00'],
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
        certifications: ['Basic Security']
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
      employeeStore.updateEmployee(editingEmployee.id, formData);
    } else {
      employeeStore.addEmployee(formData);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      employeeStore.deleteEmployee(id);
    }
  };

  const getEmployeeTypeColor = (type: EmployeeType) => {
    switch (type) {
      case 'OPERATIONAL': return 'primary';
      case 'SUPERVISORY': return 'secondary';
      case 'NEW': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Employee Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Employee
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Happiness Score</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employeeStore.employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.employeeCode}</TableCell>
                <TableCell>{employee.fullName}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell>
                  <Chip
                    label={employee.employeeType}
                    color={getEmployeeTypeColor(employee.employeeType)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={employee.baseHappinessScore.toFixed(1)}
                    color={employee.baseHappinessScore >= 4.0 ? 'success' :
                           employee.baseHappinessScore >= 3.0 ? 'warning' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={employee.activeStatus ? 'Active' : 'Inactive'}
                    color={employee.activeStatus ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(employee)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(employee.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee Code"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hire Date"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Employee Type</InputLabel>
                <Select
                  value={formData.employeeType}
                  label="Employee Type"
                  onChange={(e) => setFormData({ ...formData, employeeType: e.target.value as EmployeeType })}
                >
                  <MenuItem value="OPERATIONAL">Operational</MenuItem>
                  <MenuItem value="SUPERVISORY">Supervisory</MenuItem>
                  <MenuItem value="NEW">New</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Happiness Score"
                type="number"
                inputProps={{ min: 1, max: 5, step: 0.1 }}
                value={formData.baseHappinessScore}
                onChange={(e) => setFormData({ ...formData, baseHappinessScore: parseFloat(e.target.value) })}
              />
            </Grid>
          </Grid>
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
}