import {
  Employee,
  Shift,
  SiteLocation,
  ShiftPattern,
  DateRange,
  ExportFormat,
  ExportConfig,
  ExportFilters,
  ReportTemplate
} from '../../types';
import { ComprehensiveKPIMetrics, KPICalculationEngine } from '../calculations/kpiDashboard';
import { AssignmentOptimization } from '../scheduling/smartAssignment';

// Enhanced export configuration
export interface EnhancedExportConfig extends ExportConfig {
  includeKPIs: boolean;
  includeOptimizationResults: boolean;
  includeHappinessData: boolean;
  includeCostAnalysis: boolean;
  includeTrends: boolean;
  compressionLevel: 'none' | 'low' | 'high';
  dataFormat: 'raw' | 'aggregated' | 'summary';
}

// Export result interface
export interface ExportResult {
  fileName: string;
  fileSize: number;
  format: ExportFormat;
  downloadUrl: string;
  metadata: {
    generatedAt: string;
    recordCount: number;
    dateRange: DateRange;
    filters: ExportFilters;
  };
}

// Enhanced export engine
export class EnhancedExportEngine {
  private kpiEngine: KPICalculationEngine;

  constructor() {
    this.kpiEngine = new KPICalculationEngine();
  }

  // Main export method
  public async exportData(
    employees: Employee[],
    shifts: Shift[],
    sites: SiteLocation[],
    patterns: ShiftPattern[],
    config: EnhancedExportConfig
  ): Promise<ExportResult> {
    const filteredData = this.applyFilters(employees, shifts, sites, config.filters);
    const kpis = config.includeKPIs
      ? this.kpiEngine.calculateComprehensiveKPIs(filteredData.employees, filteredData.shifts, filteredData.sites, config.dateRange || this.getDefaultDateRange())
      : undefined;

    let exportContent: string;
    let fileName: string;

    switch (config.format) {
      case 'JSON':
        ({ content: exportContent, fileName } = this.exportToJSON(filteredData, kpis, config));
        break;
      case 'CSV':
        ({ content: exportContent, fileName } = this.exportToCSV(filteredData, kpis, config));
        break;
      case 'EXCEL':
        ({ content: exportContent, fileName } = await this.exportToExcel(filteredData, kpis, config));
        break;
      case 'HTML':
        ({ content: exportContent, fileName } = this.exportToHTML(filteredData, kpis, config));
        break;
      case 'PDF':
        ({ content: exportContent, fileName } = await this.exportToPDF(filteredData, kpis, config));
        break;
      default:
        throw new Error(`Unsupported export format: ${config.format}`);
    }

    // Apply compression if requested
    if (config.compressionLevel !== 'none') {
      exportContent = this.compressData(exportContent, config.compressionLevel);
    }

    return this.createDownload(exportContent, fileName, config);
  }

  // Export to JSON format
  private exportToJSON(
    data: { employees: Employee[]; shifts: Shift[]; sites: SiteLocation[] },
    kpis: ComprehensiveKPIMetrics | undefined,
    config: EnhancedExportConfig
  ): { content: string; fileName: string } {
    const exportData = {
      metadata: {
        exportType: config.type,
        template: config.template,
        generatedAt: new Date().toISOString(),
        dateRange: config.dateRange,
        filters: config.filters,
        recordCounts: {
          employees: data.employees.length,
          shifts: data.shifts.length,
          sites: data.sites.length
        }
      },
      data: config.type === 'RAW_DATA' ? data : undefined,
      report: config.type === 'REPORT' ? this.generateReport(data, kpis, config) : undefined,
      kpis: config.includeKPIs ? kpis : undefined
    };

    const content = JSON.stringify(exportData, null, 2);
    const fileName = this.generateFileName('json', config);

    return { content, fileName };
  }

  // Export to CSV format
  private exportToCSV(
    data: { employees: Employee[]; shifts: Shift[]; sites: SiteLocation[] },
    kpis: ComprehensiveKPIMetrics | undefined,
    config: EnhancedExportConfig
  ): { content: string; fileName: string } {
    let csvContent = '';

    if (config.type === 'RAW_DATA') {
      // Export employees
      csvContent += '=== EMPLOYEES ===\n';
      csvContent += this.arrayToCSV(data.employees, [
        'employeeCode', 'fullName', 'email', 'phone', 'employeeType', 'role', 'activeStatus', 'baseHappinessScore'
      ]);
      csvContent += '\n\n';

      // Export shifts
      csvContent += '=== SHIFTS ===\n';
      csvContent += this.arrayToCSV(data.shifts, [
        'shiftDate', 'startTime', 'endTime', 'shiftType', 'requiredStaff', 'assignedEmployees'
      ]);
      csvContent += '\n\n';

      // Export sites
      csvContent += '=== SITES ===\n';
      csvContent += this.arrayToCSV(data.sites, [
        'siteName', 'address', 'riskLevel', 'baseRequirement'
      ]);
    } else {
      // Export report data
      const report = this.generateReport(data, kpis, config);
      csvContent += '=== REPORT SUMMARY ===\n';
      csvContent += this.objectToCSV(report.summary);
      csvContent += '\n\n';

      if (report.detailed) {
        csvContent += '=== DETAILED DATA ===\n';
        csvContent += this.arrayToCSV(report.detailed, Object.keys(report.detailed[0] || {}));
      }
    }

    if (config.includeKPIs && kpis) {
      csvContent += '\n\n=== KPIs ===\n';
      csvContent += this.objectToCSV(kpis);
    }

    const fileName = this.generateFileName('csv', config);
    return { content: csvContent, fileName };
  }

  // Export to Excel format (placeholder - would use a library like SheetJS)
  private async exportToExcel(
    data: { employees: Employee[]; shifts: Shift[]; sites: SiteLocation[] },
    kpis: ComprehensiveKPIMetrics | undefined,
    config: EnhancedExportConfig
  ): Promise<{ content: string; fileName: string }> {
    // Placeholder implementation
    // In a real implementation, this would use SheetJS or similar library
    const excelContent = JSON.stringify({
      data,
      kpis,
      metadata: {
        generatedAt: new Date().toISOString(),
        format: 'EXCEL_PLACEHOLDER'
      }
    });

    const fileName = this.generateFileName('xlsx', config);
    return { content: excelContent, fileName };
  }

  // Export to HTML format
  private exportToHTML(
    data: { employees: Employee[]; shifts: Shift[]; sites: SiteLocation[] },
    kpis: ComprehensiveKPIMetrics | undefined,
    config: EnhancedExportConfig
  ): { content: string; fileName: string } {
    const report = this.generateReport(data, kpis, config);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Security Scheduling Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .kpi-card { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Guard Shift Scheduling Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Date Range: ${config.dateRange?.start} to ${config.dateRange?.end}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="kpi-grid">
            ${Object.entries(report.summary).map(([key, value]) => `
                <div class="kpi-card">
                    <strong>${this.formatKey(key)}</strong><br>
                    <span style="font-size: 24px; font-weight: bold;">${this.formatValue(value)}</span>
                </div>
            `).join('')}
        </div>
    </div>

    ${kpis ? `
    <div class="section">
        <h2>Key Performance Indicators</h2>
        <div class="kpi-grid">
            ${Object.entries(kpis).slice(0, 8).map(([key, value]) => `
                <div class="kpi-card">
                    <strong>${this.formatKey(key)}</strong><br>
                    <span>${this.formatValue(value)}</span>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${report.detailed && report.detailed.length > 0 ? `
    <div class="section">
        <h2>Detailed Data</h2>
        <table>
            <thead>
                <tr>
                    ${Object.keys(report.detailed[0]).map(key => `<th>${this.formatKey(key)}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${report.detailed.map(row => `
                    <tr>
                        ${Object.values(row).map(value => `<td>${this.formatValue(value)}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}
</body>
</html>
    `;

    const fileName = this.generateFileName('html', config);
    return { content: htmlContent, fileName };
  }

  // Export to PDF format (placeholder - would use a library like jsPDF)
  private async exportToPDF(
    data: { employees: Employee[]; shifts: Shift[]; sites: SiteLocation[] },
    kpis: ComprehensiveKPIMetrics | undefined,
    config: EnhancedExportConfig
  ): Promise<{ content: string; fileName: string }> {
    // Placeholder implementation
    // In a real implementation, this would use jsPDF or similar library
    const pdfContent = JSON.stringify({
      data,
      kpis,
      metadata: {
        generatedAt: new Date().toISOString(),
        format: 'PDF_PLACEHOLDER'
      }
    });

    const fileName = this.generateFileName('pdf', config);
    return { content: pdfContent, fileName };
  }

  // Apply filters to data
  private applyFilters(
    employees: Employee[],
    shifts: Shift[],
    sites: SiteLocation[],
    filters?: ExportFilters
  ): { employees: Employee[]; shifts: Shift[]; sites: SiteLocation[] } {
    let filteredEmployees = [...employees];
    let filteredShifts = [...shifts];
    let filteredSites = [...sites];

    if (filters) {
      if (filters.employeeIds) {
        filteredEmployees = employees.filter(emp => filters.employeeIds!.includes(emp.id));
        filteredShifts = shifts.filter(shift =>
          shift.assignedEmployees.some(empId => filters.employeeIds!.includes(empId))
        );
      }

      if (filters.siteIds) {
        filteredSites = sites.filter(site => filters.siteIds!.includes(site.id));
        filteredShifts = filteredShifts.filter(shift => filters.siteIds!.includes(shift.siteId));
      }

      if (filters.shiftTypes) {
        filteredShifts = filteredShifts.filter(shift => filters.shiftTypes!.includes(shift.shiftType));
      }
    }

    return {
      employees: filteredEmployees,
      shifts: filteredShifts,
      sites: filteredSites
    };
  }

  // Generate report based on template
  private generateReport(
    data: { employees: Employee[]; shifts: Shift[]; sites: SiteLocation[] },
    kpis: ComprehensiveKPIMetrics | undefined,
    config: EnhancedExportConfig
  ): any {
    const template = config.template || 'KPI_SUMMARY';

    switch (template) {
      case 'KPI_SUMMARY':
        return this.generateKPISummary(data, kpis);
      case 'SHIFT_SCHEDULE':
        return this.generateShiftSchedule(data);
      case 'EMPLOYEE_PERFORMANCE':
        return this.generateEmployeePerformance(data);
      case 'COST_ANALYSIS':
        return this.generateCostAnalysis(data, kpis);
      default:
        return this.generateKPISummary(data, kpis);
    }
  }

  // Generate KPI summary report
  private generateKPISummary(
    data: { employees: Employee[]; shifts: Shift[]; sites: SiteLocation[] },
    kpis: ComprehensiveKPIMetrics | undefined
  ): any {
    const summary = {
      totalEmployees: data.employees.length,
      totalShifts: data.shifts.length,
      totalSites: data.sites.length,
      coverageRate: kpis?.coverageRate || 0,
      averageHappiness: kpis?.averageHappiness || 0,
      totalLaborCost: kpis?.totalLaborCost || 0,
      employeeUtilization: kpis?.employeeUtilization || 0
    };

    const detailed = data.shifts.map(shift => ({
      shiftDate: shift.shiftDate,
      site: data.sites.find(s => s.id === shift.siteId)?.siteName || 'Unknown',
      shiftType: shift.shiftType,
      requiredStaff: shift.requiredStaff,
      assignedStaff: shift.assignedEmployees.length,
      coverageRate: (shift.assignedEmployees.length / shift.requiredStaff) * 100
    }));

    return { summary, detailed };
  }

  // Generate shift schedule report
  private generateShiftSchedule(data: { employees: Employee[]; shifts: Shift[]; sites: SiteLocation[] }): any {
    const summary = {
      totalShifts: data.shifts.length,
      shiftsByType: this.countBy(data.shifts, 'shiftType'),
      shiftsBySite: this.countBy(data.shifts, 'siteId'),
      averageStaffPerShift: data.shifts.reduce((sum, shift) => sum + shift.assignedEmployees.length, 0) / data.shifts.length
    };

    const detailed = data.shifts.map(shift => {
      const site = data.sites.find(s => s.id === shift.siteId);
      return {
        date: shift.shiftDate,
        site: site?.siteName || 'Unknown',
        riskLevel: site?.riskLevel || 'UNKNOWN',
        shiftType: shift.shiftType,
        time: `${shift.startTime}-${shift.endTime}`,
        requiredStaff: shift.requiredStaff,
        assignedStaff: shift.assignedEmployees.length,
        assignedEmployees: shift.assignedEmployees.map(empId =>
          data.employees.find(e => e.id === empId)?.fullName || 'Unknown'
        ).join(', ')
      };
    });

    return { summary, detailed };
  }

  // Generate employee performance report
  private generateEmployeePerformance(data: { employees: Employee[]; shifts: Shift[]; sites: SiteLocation[] }): any {
    const summary = {
      totalEmployees: data.employees.length,
      activeEmployees: data.employees.filter(e => e.activeStatus).length,
      employeesByType: this.countBy(data.employees, 'employeeType'),
      averageHappiness: data.employees.reduce((sum, emp) => sum + emp.baseHappinessScore, 0) / data.employees.length
    };

    const detailed = data.employees.map(employee => {
      const assignedShifts = data.shifts.filter(shift => shift.assignedEmployees.includes(employee.id));
      return {
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        employeeType: employee.employeeType,
        role: employee.role,
        activeStatus: employee.activeStatus,
        baseHappiness: employee.baseHappinessScore,
        totalShifts: assignedShifts.length,
        certifications: employee.certifications.join(', ')
      };
    });

    return { summary, detailed };
  }

  // Generate cost analysis report
  private generateCostAnalysis(
    data: { employees: Employee[]; shifts: Shift[]; sites: SiteLocation[] },
    kpis: ComprehensiveKPIMetrics | undefined
  ): any {
    const summary = {
      totalLaborCost: kpis?.totalLaborCost || 0,
      averageCostPerHour: kpis?.averageCostPerHour || 0,
      overtimeCost: kpis?.overtimeCost || 0,
      costEfficiency: kpis?.costEfficiency || 0,
      totalHours: data.shifts.reduce((sum, shift) => {
        const duration = this.calculateShiftDuration(shift);
        return sum + (duration * shift.assignedEmployees.length);
      }, 0)
    };

    const detailed = data.shifts.map(shift => {
      const duration = this.calculateShiftDuration(shift);
      const site = data.sites.find(s => s.id === shift.siteId);
      return {
        date: shift.shiftDate,
        site: site?.siteName || 'Unknown',
        shiftType: shift.shiftType,
        duration: duration,
        assignedStaff: shift.assignedEmployees.length,
        totalHours: duration * shift.assignedEmployees.length,
        estimatedCost: duration * shift.assignedEmployees.length * 25 // $25/hour placeholder
      };
    });

    return { summary, detailed };
  }

  // Utility methods
  private arrayToCSV(array: any[], fields: string[]): string {
    if (array.length === 0) return '';

    const headers = fields.join(',');
    const rows = array.map(item =>
      fields.map(field => {
        const value = this.getNestedValue(item, field);
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );

    return [headers, ...rows].join('\n');
  }

  private objectToCSV(obj: any): string {
    const entries = Object.entries(obj);
    const headers = entries.map(([key]) => key).join(',');
    const values = entries.map(([, value]) => `"${String(value).replace(/"/g, '""')}"`).join(',');
    return `${headers}\n${values}`;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private countBy(array: any[], field: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = item[field];
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateShiftDuration(shift: Shift): number {
    const start = new Date(shift.shiftDate + 'T' + shift.startTime);
    const end = new Date(shift.shiftDate + 'T' + shift.endTime);

    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  private generateFileName(extension: string, config: EnhancedExportConfig): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const template = config.template ? `-${config.template.toLowerCase()}` : '';
    return `security-scheduling-export${template}-${timestamp}.${extension}`;
  }

  private formatKey(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  private formatValue(value: any): string {
    if (typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(2);
    }
    return String(value);
  }

  private compressData(data: string, level: 'low' | 'high'): string {
    // Placeholder compression - in real implementation would use compression algorithms
    if (level === 'high') {
      return btoa(data); // Base64 encoding as simple compression
    }
    return data;
  }

  private getDefaultDateRange(): DateRange {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Last 30 days

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  private createDownload(content: string, fileName: string, config: EnhancedExportConfig): ExportResult {
    const blob = new Blob([content], { type: this.getMimeType(config.format) });
    const url = URL.createObjectURL(blob);

    return {
      fileName,
      fileSize: blob.size,
      format: config.format,
      downloadUrl: url,
      metadata: {
        generatedAt: new Date().toISOString(),
        recordCount: content.length,
        dateRange: config.dateRange || this.getDefaultDateRange(),
        filters: config.filters || {}
      }
    };
  }

  private getMimeType(format: ExportFormat): string {
    switch (format) {
      case 'JSON': return 'application/json';
      case 'CSV': return 'text/csv';
      case 'EXCEL': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'HTML': return 'text/html';
      case 'PDF': return 'application/pdf';
      default: return 'application/octet-stream';
    }
  }
}