import React from 'react';
import { Typography, Box } from '@mui/material';
import SchedulingCalendar from '../components/calendar/SchedulingCalendar';
import { useScheduleStore } from '../stores/scheduleStore';

const SchedulePage: React.FC = () => {
  const { shifts, employees, updateShift } = useScheduleStore();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Schedule Management
      </Typography>
      <SchedulingCalendar
        shifts={shifts}
        employees={employees}
        onShiftUpdate={updateShift}
      />
    </Box>
  );
};

export default SchedulePage;