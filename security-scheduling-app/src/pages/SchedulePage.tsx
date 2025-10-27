import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid2 as Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useScheduleStore } from '../stores/scheduleStore';
import { useSiteStore } from '../stores/siteStore';
import { usePatternStore } from '../stores/patternStore';
import { useEmployeeStore } from '../stores/employeeStore';
import { DateRange } from '../types';

export default function SchedulePage() {
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedPattern, setSelectedPattern] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const scheduleStore = useScheduleStore();
  const siteStore = useSiteStore();
  const patternStore = usePatternStore();
  const employeeStore = useEmployeeStore();

  // Generate schedule
  const handleGenerateSchedule = () => {
    if (!selectedSite || !selectedPattern) {
      alert('Please select both a site and a pattern');
      return;
    }
    scheduleStore.generateSchedule(selectedSite, selectedPattern, dateRange);
  };

  // Convert shifts to calendar events
  const calendarEvents = useMemo(() => {
    return scheduleStore.shifts.map(shift => {
      const site = siteStore.getSiteById(shift.siteId);
      const pattern = patternStore.getPatternById(shift.patternId);
      const assignedCount = shift.assignedEmployees.length;
      const coverageRate = (assignedCount / shift.requiredStaff) * 100;

      return {
        id: shift.id,
        title: `${site?.siteName || 'Unknown Site'} - ${shift.shiftType}`,
        start: `${shift.shiftDate}T${shift.startTime}`,
        end: `${shift.shiftDate}T${shift.endTime}`,
        extendedProps: {
          siteName: site?.siteName,
          shiftType: shift.shiftType,
          requiredStaff: shift.requiredStaff,
          assignedCount,
          coverageRate,
          patternName: pattern?.patternName,
          status: shift.status,
        },
        backgroundColor: coverageRate === 100 ? '#4caf50' :
                       coverageRate >= 75 ? '#ff9800' : '#f44336',
        borderColor: coverageRate === 100 ? '#388e3c' :
                    coverageRate >= 75 ? '#f57c00' : '#d32f2f',
      };
    });
  }, [scheduleStore.shifts, siteStore.sites, patternStore.patterns]);

  // Calculate KPIs
  const kpis = scheduleStore.calculateKPIs(dateRange);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Schedule Management
      </Typography>

      {/* Schedule Generation Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generate Schedule
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Select Site</InputLabel>
              <Select
                value={selectedSite}
                label="Select Site"
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                {siteStore.sites.map(site => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.siteName} ({site.riskLevel})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Select Pattern</InputLabel>
              <Select
                value={selectedPattern}
                label="Select Pattern"
                onChange={(e) => setSelectedPattern(e.target.value)}
              >
                {patternStore.patterns.map(pattern => (
                  <MenuItem key={pattern.id} value={pattern.id}>
                    {pattern.patternName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleGenerateSchedule}
              disabled={!selectedSite || !selectedPattern}
            >
              Generate Schedule
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* KPI Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Coverage Rate
              </Typography>
              <Typography variant="h5" component="div">
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
              <Typography variant="h5" component="div">
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
                Total Shifts
              </Typography>
              <Typography variant="h5" component="div">
                {kpis.totalShifts}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                in selected period
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
              <Typography variant="h5" component="div">
                {kpis.securityIncidents}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                reported incidents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Calendar View */}
      <Paper sx={{ p: 2 }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          initialView="timeGridWeek"
          events={calendarEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          eventContent={(eventInfo) => (
            <div>
              <b>{eventInfo.event.title}</b>
              <br />
              <small>
                {eventInfo.event.extendedProps.assignedCount}/{eventInfo.event.extendedProps.requiredStaff} staff
              </small>
            </div>
          )}
          eventClick={(info) => {
            const event = info.event;
            alert(`Shift Details:\n\n` +
              `Site: ${event.extendedProps.siteName}\n` +
              `Shift Type: ${event.extendedProps.shiftType}\n` +
              `Staff: ${event.extendedProps.assignedCount}/${event.extendedProps.requiredStaff}\n` +
              `Coverage: ${event.extendedProps.coverageRate.toFixed(1)}%\n` +
              `Status: ${event.extendedProps.status}`);
          }}
          height="auto"
        />
      </Paper>

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Coverage Legend:
        </Typography>
        <Chip label="100%" size="small" sx={{ backgroundColor: '#4caf50', color: 'white' }} />
        <Chip label="75-99%" size="small" sx={{ backgroundColor: '#ff9800', color: 'white' }} />
        <Chip label="<75%" size="small" sx={{ backgroundColor: '#f44336', color: 'white' }} />
      </Box>
    </Box>
  );
}