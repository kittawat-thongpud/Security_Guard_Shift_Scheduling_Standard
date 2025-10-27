import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
} from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentTab, onTabChange }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Security Guard Scheduling
          </Typography>
        </Toolbar>
        <Tabs
          value={currentTab}
          onChange={onTabChange}
          textColor="inherit"
          indicatorColor="secondary"
          centered
        >
          <Tab label="Schedule" />
          <Tab label="Employees" />
          <Tab label="Reports" />
          <Tab label="Settings" />
        </Tabs>
      </AppBar>
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;