# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Security Guard Shift Scheduling System** - a comprehensive React + TypeScript application for managing security guard shifts, employee assignments, and operational KPIs. The system implements sophisticated scheduling algorithms with employee happiness optimization and multi-format export capabilities.

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: Material-UI (MUI) v7 with Emotion
- **State Management**: Zustand
- **Calendar**: FullCalendar for scheduling interface
- **Charts**: Chart.js for analytics
- **Export**: jsPDF, html2canvas for multi-format reports
- **Date Handling**: date-fns + MUI Date Pickers

## Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

### Docker Development
```bash
# Start development container
docker-compose up app

# Build and run production container
docker-compose up app-prod
```

## Architecture Overview

### Core Modules
- **Shift Management**: Pattern-based scheduling with 4H, 8H, 12H, 24H shift types
- **Employee Management**: Role-based allocation with availability tracking
- **Site Management**: Location-specific requirements and risk assessment
- **Task Management**: Automated task list generation per shift
- **Analytics Engine**: KPI computation and happiness equation optimization
- **Export System**: Multi-format (JSON, CSV, Excel, HTML, PDF) data export

### Data Flow
1. **Configuration**: Load shift patterns, KPI targets, happiness weights
2. **Schedule Generation**: Create shifts based on patterns and site requirements
3. **Employee Allocation**: Assign employees considering constraints and happiness
4. **Task Generation**: Create task lists for each shift
5. **KPI Computation**: Calculate performance metrics
6. **Happiness Assessment**: Evaluate employee satisfaction
7. **Optimization Loop**: Re-balance if targets not met

### Key Business Logic

#### Happiness Equation
```
Happiness = (WLB × w_wlb + Fairness × w_fairness + Recognition × w_recognition + Growth × w_growth)
             / (0.6 × Stress + 0.4 × Exhaustion)
```

#### Shift Patterns
- **8-8-8 Standard**: Morning (06:00-14:00), Afternoon (14:00-22:00), Night (22:00-06:00)
- **12-12 Extended**: Day (06:00-18:00), Night (18:00-06:00)
- **4H Flexible**: Multiple short shifts for peak coverage
- **24H Continuous**: Emergency and special events

## File Structure

```
security-scheduling-app/
├── src/
│   ├── components/
│   │   ├── calendar/          # Scheduling interface components
│   │   ├── common/            # Shared UI components
│   │   ├── configuration/     # Pattern and site configuration
│   │   └── location/          # Site management
│   ├── pages/                 # Main application pages
│   ├── stores/                # Zustand state management
│   ├── types/                 # TypeScript type definitions
│   └── utils/
│       ├── calculations/      # KPI and cost analysis
│       ├── export/            # Multi-format export system
│       └── scheduling/        # Shift pattern algorithms
├── package.json
├── vite.config.ts
└── docker-compose.yml
```

## Key Implementation Details

### State Management (Zustand Stores)
- `scheduleStore`: Manages shift assignments and scheduling state
- `locationStore`: Handles site configurations and requirements
- `patternStore`: Manages shift pattern definitions

### Export System Features
- **Raw Data Export**: JSON, CSV, Excel formats with metadata
- **Report Export**: PDF, HTML, Excel with charts and recommendations
- **Progress Tracking**: Real-time export progress with cancellation
- **History Management**: Export history with storage optimization

### Shift Assignment Algorithm
1. **Availability Check**: Filter employees by availability and preferences
2. **Happiness Optimization**: Prioritize assignments that maximize happiness
3. **Constraint Validation**: Enforce legal and operational constraints
4. **Standby Management**: Automatic standby activation for gaps
5. **Fairness Rotation**: Ensure equitable shift distribution

## Development Guidelines

### Component Patterns
- Use Material-UI components for consistent UI
- Implement proper TypeScript interfaces for all props
- Follow React 19 patterns with hooks and functional components
- Use Zustand for global state management

### Data Handling
- All data persisted in localStorage (no backend in current implementation)
- Implement proper data validation and error handling
- Use TypeScript for type safety throughout

### Testing Strategy
- Component unit tests with React Testing Library
- Integration tests for scheduling workflows
- E2E tests for complete user journeys
- API testing with Swagger documentation

## Configuration Files

### TypeScript Configuration
- `tsconfig.json`: Project references setup
- `tsconfig.app.json`: Application-specific TypeScript config
- `tsconfig.node.json`: Node.js tooling configuration

### Build Configuration
- `vite.config.ts`: Vite build configuration with React plugin
- `eslint.config.js`: ESLint configuration with TypeScript support
- `docker-compose.yml`: Multi-stage Docker setup for dev/prod

## Common Development Tasks

### Adding New Shift Types
1. Update `ShiftType` interface in `src/types/shiftPattern.ts`
2. Add pattern configuration in `src/utils/scheduling/shiftPatterns.ts`
3. Update UI components in `src/components/configuration/`

### Implementing New KPIs
1. Define KPI interface in `src/types/index.ts`
2. Implement calculation in `src/utils/calculations/`
3. Add to analytics dashboard in `src/pages/ReportsPage.tsx`

### Adding Export Formats
1. Extend `ExportFormat` type in export utilities
2. Implement new format handler in `src/utils/export/`
3. Update export modal UI components

## Performance Considerations

- Implement virtualization for large employee lists
- Use memoization for expensive calculations
- Optimize chart rendering for export
- Implement data compression for large exports

This system is designed for security operations management with a focus on employee satisfaction, operational efficiency, and comprehensive reporting capabilities.