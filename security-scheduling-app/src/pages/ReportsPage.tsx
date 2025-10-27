import React, { useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { useScheduleStore } from '../stores/scheduleStore';
import {
  calculateCostAnalysis,
  calculateEmployeeWorkloads,
  generateCostBreakdown,
} from '../utils/calculations/costAnalysis';
import { generatePDFReport } from '../utils/export/pdfExport';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ReportsPage: React.FC = () => {
  const { shifts, employees, budgets } = useScheduleStore();
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Calculate report data
  const costAnalysis = calculateCostAnalysis(shifts, employees, budgets[0]);
  const employeeWorkloads = calculateEmployeeWorkloads(shifts, employees, '2024-01-01', '2024-01-31');
  const costBreakdown = generateCostBreakdown(shifts, employees);

  // Chart data for cost distribution
  const costDistributionData = {
    labels: ['Regular Hours', 'Overtime Hours'],
    datasets: [
      {
        data: [costAnalysis.regularCost, costAnalysis.overtimeCost],
        backgroundColor: ['#4ecdc4', '#ff6b6b'],
        borderColor: ['#4ecdc4', '#ff6b6b'],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for employee workload
  const workloadData = {
    labels: employeeWorkloads.map(w => {
      const employee = employees.find(e => e.id === w.employeeId);
      return employee?.name || 'Unknown';
    }),
    datasets: [
      {
        label: 'Total Hours',
        data: employeeWorkloads.map(w => w.totalHours),
        backgroundColor: '#45b7d1',
      },
      {
        label: 'Overtime Hours',
        data: employeeWorkloads.map(w => w.overtimeHours),
        backgroundColor: '#ff6b6b',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const handleExportPDF = async () => {
    try {
      await generatePDFReport(
        shifts,
        employees,
        budgets,
        costAnalysis,
        employeeWorkloads,
        { start: '2024-01-01', end: '2024-01-31' }
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reports & Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={reportPeriod}
              label="Period"
              onChange={(e) => setReportPeriod(e.target.value as 'week' | 'month' | 'year')}
            >
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Key Metrics Cards */}
        <Box sx={{ width: { xs: '100%', md: 'calc(25% - 9px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Cost
              </Typography>
              <Typography variant="h5" component="div">
                ฿{costAnalysis.totalCost.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(25% - 9px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Hours
              </Typography>
              <Typography variant="h5" component="div">
                {costAnalysis.totalHours.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(25% - 9px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overtime Hours
              </Typography>
              <Typography variant="h5" component="div" color="error">
                {costAnalysis.overtimeHours.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(25% - 9px)' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Budget Utilization
              </Typography>
              <Typography variant="h5" component="div">
                {costAnalysis.budgetUtilization.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Charts */}
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 9px)' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cost Distribution
            </Typography>
            <Doughnut data={costDistributionData} options={chartOptions} />
          </Paper>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(50% - 9px)' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Employee Workload
            </Typography>
            <Bar data={workloadData} options={chartOptions} />
          </Paper>
        </Box>

        {/* Cost Breakdown Table */}
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cost Breakdown by Employee
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell align="right">Regular Hours</TableCell>
                    <TableCell align="right">Overtime Hours</TableCell>
                    <TableCell align="right">Regular Cost</TableCell>
                    <TableCell align="right">Overtime Cost</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {costBreakdown.map((row) => (
                    <TableRow key={row.employeeName}>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell align="right">{row.regularHours.toFixed(1)}</TableCell>
                      <TableCell align="right">{row.overtimeHours.toFixed(1)}</TableCell>
                      <TableCell align="right">฿{row.regularCost.toLocaleString()}</TableCell>
                      <TableCell align="right">฿{row.overtimeCost.toLocaleString()}</TableCell>
                      <TableCell align="right">฿{row.totalCost.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>

        {/* Employee Happiness Scores */}
        <Box sx={{ width: '100%' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Employee Happiness Scores
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {employeeWorkloads.map((workload) => {
                const employee = employees.find(e => e.id === workload.employeeId);
                const scoreColor =
                  workload.happinessScore >= 4 ? 'success' :
                  workload.happinessScore >= 3 ? 'warning' : 'error';

                return (
                  <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.333% - 8px)' } }} key={workload.employeeId}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {employee?.name}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">
                            Total Hours: {workload.totalHours.toFixed(1)}
                          </Typography>
                          <Chip
                            label={workload.happinessScore.toFixed(1)}
                            color={scoreColor}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          OT: {workload.overtimeHours.toFixed(1)}h | Consecutive: {workload.consecutiveDays}d
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ReportsPage;