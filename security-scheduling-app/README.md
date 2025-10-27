# Security Guard Shift Scheduling App

A comprehensive React-based web application for managing security guard shift scheduling with Docker deployment support. This application provides hybrid scheduling capabilities (automated + manual), budget analysis, and comprehensive reporting.

## Features

### 🗓️ Scheduling System
- **Multiple Shift Patterns**: 8-8-8 (3 shifts), 12-12 (2 shifts), 12-day only, 12-night only, and mixed patterns
- **Hybrid Scheduling**: Automated algorithms combined with manual drag-and-drop adjustments
- **Conflict Detection**: Prevents overlapping shifts and rule violations
- **Time Windows**: Week, month, and year planning with configurable start/stop dates

### 👥 Employee Management
- Employee profiles with hourly rates, overtime rates, and preferences
- Preferred shift assignments and availability tracking
- Workload monitoring and happiness scoring

### 💰 Budget & Cost Analysis
- Real-time cost calculations for regular and overtime hours
- Budget utilization tracking
- Cost breakdown by employee and shift type
- Budget constraint enforcement

### 📊 Reporting & Analytics
- Comprehensive dashboards with key metrics
- Cost distribution charts and employee workload analysis
- Employee happiness scoring based on workload factors
- Printable PDF reports for paper analysis

### 🐳 Docker Deployment
- Single container setup for development and production
- Hot reload support for development
- Production-ready nginx configuration

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Material-UI (MUI)
- **State Management**: Zustand
- **Calendar**: FullCalendar
- **Charts**: Chart.js
- **PDF Export**: jsPDF + html2canvas
- **Containerization**: Docker + Docker Compose

## Quick Start

### Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   Navigate to `http://localhost:5173`

### Docker Development

1. **Start with Docker Compose**:
   ```bash
   docker-compose up app
   ```

2. **Access the application**:
   Navigate to `http://localhost:5173`

### Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Preview production build**:
   ```bash
   npm run preview
   ```

### Docker Production

1. **Build and run production container**:
   ```bash
   docker-compose up app-prod
   ```

2. **Access the application**:
   Navigate to `http://localhost:80`

## Project Structure

```
src/
├── components/
│   ├── calendar/          # Scheduling calendar components
│   ├── forms/            # Shift and employee forms
│   ├── reports/          # Report generation components
│   └── common/           # Shared UI components
├── stores/
│   ├── scheduleStore.ts  # Zustand store for scheduling
│   └── ...
├── utils/
│   ├── scheduling/       # Scheduling algorithms
│   ├── calculations/     # Budget and OT calculations
│   └── export/           # Report export functions
├── types/
│   └── index.ts          # TypeScript type definitions
└── pages/
    ├── SchedulePage.tsx  # Main scheduling interface
    ├── ReportsPage.tsx   # Analytics and reports
    └── ...
```

## Shift Patterns

### 8-8-8 Pattern
- **Morning**: 06:00 - 14:00
- **Afternoon**: 14:00 - 22:00
- **Night**: 22:00 - 06:00

### 12-12 Pattern
- **Day**: 06:00 - 18:00
- **Night**: 18:00 - 06:00

### Mixed Pattern
- Combination of different shift types based on day of week
- Weekends: 12-hour shifts
- Weekdays: 8-hour shifts

## Employee Happiness Scoring

The application calculates employee happiness scores based on:
- Workload distribution
- Overtime hours
- Consecutive working days
- Preferred shift assignments

## Reporting Features

- **Cost Analysis**: Total costs, overtime expenses, budget utilization
- **Employee Workload**: Hours worked, overtime, consecutive days
- **Shift Coverage**: Gap analysis and coverage reports
- **PDF Export**: Printable reports for paper analysis

## Configuration

### Environment Variables
- `NODE_ENV`: Development or production mode
- Customizable budget constraints and scheduling rules

### Docker Configuration
- Development: Hot reload enabled
- Production: Optimized nginx server

## License

This project is licensed under the MIT License.
