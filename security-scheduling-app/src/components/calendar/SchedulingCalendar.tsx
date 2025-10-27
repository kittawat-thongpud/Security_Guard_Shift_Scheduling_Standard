import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { Shift, ShiftPattern, Employee } from '../../types';
import { useLocationStore } from '../../stores/locationStore';
import { usePatternStore } from '../../stores/patternStore';
// Context menu and modal functionality will be implemented in future versions

interface SchedulingCalendarProps {
  shifts: Shift[];
  employees: Employee[];
  onShiftUpdate: (shiftId: string, updates: Partial<Shift>) => void;
}

const SchedulingCalendar: React.FC<SchedulingCalendarProps> = ({
  shifts,
  employees,
  onShiftUpdate,
}) => {
  const { sites, getLocationAssignmentByShiftId } = useLocationStore();
  const { openContextMenu: _openContextMenu } = usePatternStore();

  const [selectedPattern, setSelectedPattern] = useState<ShiftPattern>('8-8-8');
  const [viewType, setViewType] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('timeGridWeek');
  const [selectedSite, setSelectedSite] = useState<string>('all');

  const calendarRef = useRef<any>(null);

  const calendarEvents = shifts
    .filter(shift => {
      if (selectedSite === 'all') return true;
      const locationAssignment = getLocationAssignmentByShiftId(shift.id);
      return locationAssignment?.siteId === selectedSite;
    })
    .map(shift => {
      const employee = employees.find(emp => emp.id === shift.employeeId);
      const locationAssignment = getLocationAssignmentByShiftId(shift.id);
      const zone = locationAssignment ? sites
        .flatMap(site => site.zones)
        .find(zone => zone.id === locationAssignment.zoneId) : null;

      return {
        id: shift.id,
        title: `${employee?.name || 'Unknown'} - ${shift.type}`,
        start: `${shift.date}T${shift.startTime}`,
        end: `${shift.date}T${shift.endTime}`,
        backgroundColor: shift.isOvertime ? '#ff6b6b' :
          zone?.color || (
            shift.type === 'morning' ? '#4ecdc4' :
            shift.type === 'afternoon' ? '#45b7d1' : '#96ceb4'
          ),
        borderColor: zone?.color || 'transparent',
        textColor: shift.isOvertime ? '#fff' : '#000',
        extendedProps: {
          employeeId: shift.employeeId,
          type: shift.type,
          isOvertime: shift.isOvertime,
          notes: shift.notes,
          locationAssignment: shift.locationAssignment,
          zoneColor: zone?.color,
        },
      };
    });

  const handleDateSelect = (selectInfo: any) => {
    console.log('Date selected:', selectInfo);
    // Date selection functionality will be implemented in future versions
  };

  const handleEventClick = (clickInfo: any) => {
    const shift = shifts.find(s => s.id === clickInfo.event.id);
    if (shift) {
      console.log('Event clicked:', shift);
      // Event click functionality will be implemented in future versions
    }
  };

  const handleEventDrop = (dropInfo: any) => {
    const shiftId = dropInfo.event.id;
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;

    onShiftUpdate(shiftId, {
      date: newStart.toISOString().split('T')[0],
      startTime: newStart.toTimeString().split(' ')[0].substring(0, 5),
      endTime: newEnd ? newEnd.toTimeString().split(' ')[0].substring(0, 5) : '',
    });
  };

  // Context menu and modal functionality will be implemented in future versions

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 8px)' } }}>
          <FormControl fullWidth>
            <InputLabel>Shift Pattern</InputLabel>
            <Select
              value={selectedPattern}
              label="Shift Pattern"
              onChange={(e) => setSelectedPattern(e.target.value as ShiftPattern)}
            >
              <MenuItem value="8-8-8">8-8-8 (3 Shifts)</MenuItem>
              <MenuItem value="12-12">12-12 (2 Shifts)</MenuItem>
              <MenuItem value="12-day-only">12 Day Only</MenuItem>
              <MenuItem value="12-night-only">12 Night Only</MenuItem>
              <MenuItem value="mixed">Mixed Pattern</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 8px)' } }}>
          <FormControl fullWidth>
            <InputLabel>View</InputLabel>
            <Select
              value={viewType}
              label="View"
              onChange={(e) => setViewType(e.target.value as any)}
            >
              <MenuItem value="timeGridWeek">Week</MenuItem>
              <MenuItem value="timeGridDay">Day</MenuItem>
              <MenuItem value="dayGridMonth">Month</MenuItem>
              <MenuItem value="listWeek">List</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 8px)' } }}>
          <FormControl fullWidth>
            <InputLabel>Filter by Site</InputLabel>
            <Select
              value={selectedSite}
              label="Filter by Site"
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <MenuItem value="all">All Sites</MenuItem>
              {sites.map((site) => (
                <MenuItem key={site.id} value={site.id}>
                  {site.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Paper sx={{ p: 2 }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          initialView={viewType}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={calendarEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
        />
      </Paper>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
        <Box sx={{ width: { xs: '100%', md: 'calc(33.333% - 8px)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Shift Legend
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#4ecdc4', borderRadius: 1 }} />
                  <Typography>Morning Shift</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#45b7d1', borderRadius: 1 }} />
                  <Typography>Afternoon Shift</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#96ceb4', borderRadius: 1 }} />
                  <Typography>Night Shift</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 20, height: 20, backgroundColor: '#ff6b6b', borderRadius: 1 }} />
                  <Typography>Overtime</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default SchedulingCalendar;