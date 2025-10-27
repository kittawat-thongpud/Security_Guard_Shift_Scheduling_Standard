import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useScheduleStore } from '../stores/scheduleStore';
import { useSiteStore } from '../stores/siteStore';
import { DateRange } from '../types';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'coverage' | 'performance' | 'staffing'>('coverage');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const scheduleStore = useScheduleStore();
  const siteStore = useSiteStore();

  // Calculate KPIs for the selected date range
  const kpis = scheduleStore.calculateKPIs(dateRange);

  // Generate coverage report by site
  const coverageReport = siteStore.sites.map(site => {
    const siteShifts = scheduleStore.getShiftsBySite(site.id).filter(
      shift => shift.shiftDate >= dateRange.start && shift.shiftDate <= dateRange.end
    );

    const totalRequired = siteShifts.reduce((sum, shift) => sum + shift.requiredStaff, 0);
    const totalAssigned = siteShifts.reduce((sum, shift) => sum + shift.assignedEmployees.length, 0);
    const coverageRate = totalRequired > 0 ? (totalAssigned / totalRequired) * 100 : 0;

    return {
      siteName: site.siteName,
      riskLevel: site.riskLevel,
      totalShifts: siteShifts.length,
      totalRequired,
      totalAssigned,
      coverageRate,
      unfilledPosts: totalRequired - totalAssigned,
    };
  });

  // Export data as JSON
  const handleExportJSON = () => {
    const reportData = {
      reportType,
      dateRange,
      kpis,
      coverageReport,
      generatedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-scheduling-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Export data as CSV
  const handleExportCSV = () => {
    const headers = ['Site Name', 'Risk Level', 'Total Shifts', 'Required Staff', 'Assigned Staff', 'Coverage Rate', 'Unfilled Posts'];
    const csvData = coverageReport.map(row => [
      row.siteName,
      row.riskLevel,
      row.totalShifts,
      row.totalRequired,
      row.totalAssigned,
      `${row.coverageRate.toFixed(1)}%`,
      row.unfilledPosts
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-scheduling-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>

      {/* Report Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value as any)}
              >
                <MenuItem value="coverage">Coverage Report</MenuItem>
                <MenuItem value="performance">Performance Report</MenuItem>
                <MenuItem value="staffing">Staffing Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid xs={12} sm={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid xs={12} sm={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExportJSON}
              >
                JSON
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExportCSV}
              >
                CSV
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overall Coverage
              </Typography>
              <Typography variant="h4" component="div">
                {kpis.coverageRate.toFixed(1)}%
              </Typography>
              <Chip
                label={kpis.coverageRate >= 90 ? "Excellent" : kpis.coverageRate >= 75 ? "Good" : "Needs Attention"}
                color={kpis.coverageRate >= 90 ? "success" : kpis.coverageRate >= 75 ? "warning" : "error"}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Unfilled Posts
              </Typography>
              <Typography variant="h4" component="div">
                {kpis.unfilledPosts}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                out of {kpis.totalRequired} required
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Security Incidents
              </Typography>
              <Typography variant="h4" component="div">
                {kpis.securityIncidents}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                reported incidents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Happiness
              </Typography>
              <Typography variant="h4" component="div">
                {kpis.averageHappiness.toFixed(1)}
              </Typography>
              <Chip
                label={kpis.averageHappiness >= 4.0 ? "High" : kpis.averageHappiness >= 3.0 ? "Medium" : "Low"}
                color={kpis.averageHappiness >= 4.0 ? "success" : kpis.averageHappiness >= 3.0 ? "warning" : "error"}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Coverage Report Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Coverage Report by Site
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Site Name</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>Total Shifts</TableCell>
                <TableCell>Required Staff</TableCell>
                <TableCell>Assigned Staff</TableCell>
                <TableCell>Coverage Rate</TableCell>
                <TableCell>Unfilled Posts</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coverageReport.map((report, index) => (
                <TableRow key={index}>
                  <TableCell>{report.siteName}</TableCell>
                  <TableCell>
                    <Chip
                      label={report.riskLevel}
                      color={report.riskLevel === 'HIGH' ? 'error' :
                             report.riskLevel === 'MEDIUM' ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{report.totalShifts}</TableCell>
                  <TableCell>{report.totalRequired}</TableCell>
                  <TableCell>{report.totalAssigned}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${report.coverageRate.toFixed(1)}%`}
                      color={report.coverageRate >= 90 ? 'success' :
                             report.coverageRate >= 75 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.unfilledPosts}
                      color={report.unfilledPosts === 0 ? 'success' :
                             report.unfilledPosts <= 5 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}