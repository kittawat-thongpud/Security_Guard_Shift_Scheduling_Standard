import React from 'react';
import { Typography, Box } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings & Configuration
      </Typography>
      <Typography variant="body1">
        This is where application settings will be configured.
      </Typography>
    </Box>
  );
};

export default SettingsPage;