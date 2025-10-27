import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/common/Layout';
import SchedulePage from './pages/SchedulePage';
import EmployeesPage from './pages/EmployeesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderPage = () => {
    switch (currentTab) {
      case 0:
        return <SchedulePage />;
      case 1:
        return <EmployeesPage />;
      case 2:
        return <ReportsPage />;
      case 3:
        return <SettingsPage />;
      default:
        return <SchedulePage />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout currentTab={currentTab} onTabChange={handleTabChange}>
        {renderPage()}
      </Layout>
    </ThemeProvider>
  );
}

export default App
