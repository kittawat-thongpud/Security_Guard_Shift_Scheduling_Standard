# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a comprehensive standard for security guard shift scheduling systems. The documentation is written in Thai and provides detailed specifications for shift patterns, performance metrics, employee happiness equations, allocation strategies, and decision logic.

## Key Documentation

- **Main Standard Document**: `Security_Guard_Shift_Scheduling_Standard.md` - Contains the complete standard specification in Thai

## Architecture and Components

### Shift Scheduling Standards
- **Standard Shift Patterns**: 8-8-8 (3 shifts) and 12-12 (2 shifts) systems
- **Selection Criteria**: Based on area coverage requirements and budget constraints

### Performance Metrics (KPIs)
- **Operational Metrics**: Coverage rate, response time, security incidents
- **HR Metrics**: Employee happiness index, turnover rate, productivity
- **Cost Metrics**: Labor costs, OT budget usage, ROI

### Employee Happiness Equation
- **Core Formula**: `H = (0.3×WLB + 0.25×F + 0.2×R + 0.25×G) / (0.6×S + 0.4×E)`
- **Variables**: Work-Life Balance (WLB), Fairness (F), Recognition (R), Growth (G), Stress (S), Exhaustion (E)
- **Employee Type Weights**: Different weightings for new employees, operational staff, and supervisors

### Allocation Strategies
- **Risk-Based Allocation**: Multipliers based on risk levels (HIGH: 1.5x, MEDIUM: 1.2x, LOW: 1.0x)
- **Time-Based Strategies**: Different multipliers for peak, normal, and low hours
- **Rotation Strategies**: Multiple shift rotation patterns for different employee types

### Decision Logic
- **Decision Matrix**: Risk assessment → Legal constraints → Employee selection → Happiness evaluation
- **Employee Selection**: Constraints include max consecutive nights, minimum rest hours, OT limits
- **Approval Criteria**: Happiness index must be ≥ 4.0/5.0 for schedule approval

## Visual Documentation

The standard includes:
- **Mermaid diagrams** for shift patterns and decision flows
- **Graphviz diagrams** for scheduling logic and happiness assessment
- **Python code snippets** for allocation strategies and employee selection

## Development Notes

- This is primarily a documentation repository with standards and specifications
- No actual code implementation exists in the repository
- The documentation serves as a reference for implementing security guard scheduling systems
- All content is in Thai language with technical specifications and mathematical formulas