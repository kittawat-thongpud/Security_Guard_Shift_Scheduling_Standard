# Enhanced Export System Design - Multi-Format Support

## 1. Enhanced Export Architecture

### 1.1 Export Service Structure
```typescript
interface ExportConfig {
  format: ExportFormat;
  type: 'RAW_DATA' | 'REPORT';
  template?: ReportTemplate;
  includeCharts: boolean;
  dateRange?: DateRange;
  filters?: ExportFilters;
}

type ExportFormat = 'JSON' | 'CSV' | 'EXCEL' | 'HTML' | 'PDF';
type ReportTemplate = 'KPI_SUMMARY' | 'SHIFT_SCHEDULE' | 'EMPLOYEE_PERFORMANCE' | 'COST_ANALYSIS';
```

### 1.2 Library Dependencies
```json
{
  "dependencies": {
    "xlsx": "For Excel export",
    "jspdf": "For PDF generation",
    "html2canvas": "For HTML to PDF conversion",
    "file-saver": "For file downloads"
  }
}
```

---

## 2. Raw Data Export Service

### 2.1 Enhanced Export Service
```typescript
class EnhancedExportService {
  // Raw Data Export
  static async exportRawData(options: RawExportOptions): Promise<void> {
    const data = await this.prepareRawData(options);
    
    switch (options.format) {
      case 'JSON':
        return this.exportAsJSON(data, options.filename);
      case 'CSV':
        return this.exportAsCSV(data, options.filename);
      case 'EXCEL':
        return this.exportAsExcel(data, options.filename);
      case 'HTML':
        return this.exportAsHTML(data, options.filename);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }
  
  // Report Export
  static async exportReport(options: ReportExportOptions): Promise<void> {
    const report = await this.generateReport(options);
    
    switch (options.format) {
      case 'HTML':
        return this.exportReportAsHTML(report, options.filename);
      case 'PDF':
        return this.exportReportAsPDF(report, options.filename);
      case 'EXCEL':
        return this.exportReportAsExcel(report, options.filename);
      default:
        throw new Error(`Unsupported report format: ${options.format}`);
    }
  }
}
```

### 2.2 JSON Export Enhancement
```typescript
private static exportAsJSON(data: any, filename: string): void {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '2.0',
      source: 'Security Scheduling System',
      recordCount: this.countRecords(data)
    },
    data,
    summary: this.generateDataSummary(data)
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  this.downloadFile(blob, `${filename}.json`);
}

private static countRecords(data: any): RecordCount {
  return {
    employees: data.employees?.length || 0,
    shifts: data.shifts?.length || 0,
    sites: data.sites?.length || 0,
    tasks: data.tasks?.length || 0
  };
}
```

### 2.3 CSV Export Enhancement
```typescript
private static exportAsCSV(data: any, filename: string): void {
  const csvData = this.convertToCSV(data);
  const blob = new Blob([csvData], { 
    type: 'text/csv; charset=utf-8;' 
  });
  
  this.downloadFile(blob, `${filename}.csv`);
}

private static convertToCSV(data: any): string {
  let csv = '';
  
  // Export each data type as separate sheet (multiple CSV files)
  if (data.employees) {
    csv += 'EMPLOYEES\n';
    csv += this.arrayToCSV(data.employees);
    csv += '\n\n';
  }
  
  if (data.shifts) {
    csv += 'SHIFTS\n';
    csv += this.arrayToCSV(data.shifts);
    csv += '\n\n';
  }
  
  return csv;
}

private static arrayToCSV(array: any[]): string {
  if (!array.length) return '';
  
  const headers = Object.keys(array[0]);
  const csvRows = [
    headers.join(','), // header row
    ...array.map(row => 
      headers.map(header => 
        this.escapeCSV(row[header])
      ).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

private static escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
```

### 2.4 Excel Export Implementation
```typescript
private static async exportAsExcel(data: any, filename: string): Promise<void> {
  const XLSX = await import('xlsx');
  
  const workbook = XLSX.utils.book_new();
  
  // Create worksheets for each data type
  if (data.employees && data.employees.length > 0) {
    const wsEmployees = XLSX.utils.json_to_sheet(data.employees);
    XLSX.utils.book_append_sheet(workbook, wsEmployees, 'Employees');
  }
  
  if (data.shifts && data.shifts.length > 0) {
    const wsShifts = XLSX.utils.json_to_sheet(data.shifts);
    XLSX.utils.book_append_sheet(workbook, wsShifts, 'Shifts');
  }
  
  if (data.sites && data.sites.length > 0) {
    const wsSites = XLSX.utils.json_to_sheet(data.sites);
    XLSX.utils.book_append_sheet(workbook, wsSites, 'Sites');
  }
  
  // Add summary sheet
  const summaryData = [this.generateDataSummary(data)];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Summary');
  
  // Generate Excel file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
```

---

## 3. Report Export System

### 3.1 Report Generation Service
```typescript
interface ReportData {
  template: ReportTemplate;
  period: DateRange;
  data: any;
  charts?: string[]; // Base64 encoded chart images
  generatedAt: string;
}

class ReportService {
  static async generateReport(options: ReportOptions): Promise<ReportData> {
    const data = await this.collectReportData(options);
    const charts = options.includeCharts ? await this.generateCharts(data) : [];
    
    return {
      template: options.template,
      period: options.dateRange,
      data,
      charts,
      generatedAt: new Date().toISOString()
    };
  }
  
  private static async collectReportData(options: ReportOptions): Promise<any> {
    switch (options.template) {
      case 'KPI_SUMMARY':
        return await this.generateKPISummary(options);
      case 'SHIFT_SCHEDULE':
        return await this.generateShiftScheduleReport(options);
      case 'EMPLOYEE_PERFORMANCE':
        return await this.generateEmployeePerformanceReport(options);
      case 'COST_ANALYSIS':
        return await this.generateCostAnalysisReport(options);
      default:
        throw new Error(`Unknown report template: ${options.template}`);
    }
  }
  
  private static async generateKPISummary(options: ReportOptions): Promise<KPIReport> {
    const kpis = await KPICalculator.calculateAllKPIs(options.dateRange);
    const trends = await KPICalculator.calculateTrends(options.dateRange);
    
    return {
      summary: kpis,
      trends,
      period: options.dateRange,
      highlights: this.identifyHighlights(kpis, trends),
      recommendations: this.generateRecommendations(kpis, trends)
    };
  }
}
```

### 3.2 HTML Report Export
```typescript
private static async exportReportAsHTML(report: ReportData, filename: string): Promise<void> {
  const htmlContent = this.generateHTMLReport(report);
  const blob = new Blob([htmlContent], { 
    type: 'text/html; charset=utf-8' 
  });
  
  this.downloadFile(blob, `${filename}.html`);
}

private static generateHTMLReport(report: ReportData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Scheduling Report - ${report.template}</title>
    <style>
        ${this.getReportStyles()}
    </style>
</head>
<body>
    <div class="report-header">
        <h1>Security Scheduling System</h1>
        <h2>${this.getTemplateTitle(report.template)}</h2>
        <div class="report-meta">
            <p>Period: ${report.period.start} to ${report.period.end}</p>
            <p>Generated: ${new Date(report.generatedAt).toLocaleDateString()}</p>
        </div>
    </div>
    
    <div class="report-content">
        ${this.generateReportContent(report)}
    </div>
    
    <div class="report-footer">
        <p>Confidential - Security Scheduling System</p>
    </div>
</body>
</html>`;
}

private static generateReportContent(report: ReportData): string {
  switch (report.template) {
    case 'KPI_SUMMARY':
      return this.generateKPISummaryHTML(report);
    case 'SHIFT_SCHEDULE':
      return this.generateShiftScheduleHTML(report);
    // ... other templates
    default:
      return '<p>Report content not available.</p>';
  }
}

private static generateKPISummaryHTML(report: ReportData): string {
  const kpis = report.data.summary;
  
  return `
<div class="kpi-summary">
    <div class="kpi-grid">
        <div class="kpi-card">
            <h3>Coverage Rate</h3>
            <div class="kpi-value ${kpis.coverageRate >= 95 ? 'good' : 'warning'}">
                ${kpis.coverageRate}%
            </div>
            <div class="kpi-target">Target: ≥95%</div>
        </div>
        
        <div class="kpi-card">
            <h3>Employee Happiness</h3>
            <div class="kpi-value ${kpis.happinessIndex >= 4.0 ? 'good' : 'warning'}">
                ${kpis.happinessIndex}/5.0
            </div>
            <div class="kpi-target">Target: ≥4.0</div>
        </div>
        
        <!-- More KPI cards -->
    </div>
    
    ${report.charts ? `
    <div class="charts-section">
        <h3>Performance Trends</h3>
        <div class="charts-grid">
            ${report.charts.map(chart => 
              `<img src="${chart}" alt="Performance Chart" class="chart-image">`
            ).join('')}
        </div>
    </div>
    ` : ''}
    
    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${report.data.recommendations?.map(rec => 
              `<li>${rec}</li>`
            ).join('') || '<li>No recommendations at this time.</li>'}
        </ul>
    </div>
</div>`;
}
```

### 3.3 PDF Report Export
```typescript
private static async exportReportAsPDF(report: ReportData, filename: string): Promise<void> {
  // Generate HTML first
  const htmlContent = this.generateHTMLReport(report);
  
  // Convert HTML to PDF
  const pdf = await this.htmlToPDF(htmlContent);
  
  this.downloadFile(pdf, `${filename}.pdf`);
}

private static async htmlToPDF(htmlContent: string): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const html2canvas = await import('html2canvas');
  
  // Create a temporary container for HTML rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  
  try {
    const canvas = await html2canvas.default(container);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add new pages if content is too long
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}
```

### 3.4 Excel Report Export
```typescript
private static async exportReportAsExcel(report: ReportData, filename: string): Promise<void> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  
  switch (report.template) {
    case 'KPI_SUMMARY':
      await this.generateKPIExcelReport(workbook, report);
      break;
    case 'SHIFT_SCHEDULE':
      await this.generateShiftExcelReport(workbook, report);
      break;
    // ... other templates
  }
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

private static async generateKPIExcelReport(workbook: any, report: ReportData): Promise<void> {
  // Summary sheet
  const summaryData = [
    ['KPI Summary Report'],
    ['Period:', `${report.period.start} to ${report.period.end}`],
    ['Generated:', new Date(report.generatedAt).toLocaleDateString()],
    [],
    ['KPI', 'Value', 'Target', 'Status']
  ];
  
  const kpis = report.data.summary;
  Object.entries(kpis).forEach(([kpi, value]) => {
    const target = this.getKPITarget(kpi);
    const status = this.getKPIStatus(kpi, value);
    summaryData.push([kpi, value, target, status]);
  });
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'KPI Summary');
  
  // Trends sheet
  if (report.data.trends) {
    const trendsData = this.formatTrendsForExcel(report.data.trends);
    const wsTrends = XLSX.utils.json_to_sheet(trendsData);
    XLSX.utils.book_append_sheet(workbook, wsTrends, 'Trends');
  }
}
```

---

## 4. Enhanced UI Components

### 4.1 Advanced Export Modal
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 Advanced Export                               [×]               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Export Type: ● Raw Data   ○ Report                                 │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                      Raw Data Export                           │ │
│ │ Format: ● JSON   ○ CSV   ○ Excel   ○ HTML                      │ │
│ │                                                                 │ │
│ │ Data Types:                                                     │ │
│ │ ☑ Employees        ☑ Shift Patterns     ☑ All Data             │ │
│ │ ☑ Sites            ☑ Configuration                              │ │
│ │ ☑ Shifts           ☑ Tasks                                      │ │
│ │                                                                 │ │
│ │ Date Range: [2024-11-01] to [2024-11-30]                       │ │
│ │                                                                 │ │
│ │           [Export Raw Data]                                     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                      Report Export                             │ │
│ │ Template: [KPI Summary ▾]                                      │ │
│ │   ● KPI Summary        ○ Shift Schedule                        │ │
│ │   ○ Employee Performance ○ Cost Analysis                       │ │
│ │                                                                 │ │
│ │ Format: ● PDF   ○ HTML   ○ Excel                               │ │
│ │                                                                 │ │
│ │ Options: ☑ Include Charts    ☑ Include Recommendations         │ │
│ │          ☑ Executive Summary ☑ Detailed Analysis               │ │
│ │                                                                 │ │
│ │ Period: [Last 30 days ▾]                                       │ │
│ │   ● Last 30 days    ○ Last quarter    ○ Custom range           │ │
│ │                                                                 │ │
│ │           [Generate Report]                                     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Export Progress Component
```
┌─────────────────────────────────────────────────────────────────────┐
│ ⏳ Generating Report...                             [×]               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Preparing KPI Summary Report...                                     │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ███████████████████████████████████████████████████████  85%   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ✓ Collecting shift data                                             │
│ ✓ Calculating KPIs                                                  │
│ ⏳ Generating charts                                                │
│ ◯ Formatting report                                                 │
│ ◯ Creating PDF                                                      │
│                                                                     │
│ Estimated time remaining: 15 seconds                                │
│                                                                     │
│                       [Cancel Export]                               │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 Export History Component
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📋 Export History                                   [Clear History]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌───────┬────────────┬────────────┬──────────┬─────────┬───────────┐ │
│ │ Date  │ Type       │ Format     │ Period   │ Size    │ Actions   │ │
│ ├───────┼────────────┼────────────┼──────────┼─────────┼───────────┤ │
│ │11/28  │ KPI Report │ PDF        │ Nov 2024 │ 2.1 MB  │ [Download]│ │
│ │14:30  │            │            │          │         │ [Delete]  │ │
│ ├───────┼────────────┼────────────┼──────────┼─────────┼───────────┤ │
│ │11/27  │ Raw Data   │ Excel      │ Nov 2024 │ 1.8 MB  │ [Download]│ │
│ │09:15  │            │            │          │         │ [Delete]  │ │
│ ├───────┼────────────┼────────────┼──────────┼─────────┼───────────┤ │
│ │11/25  │ Shift Sched│ HTML       │ 11/25-12/│ 890 KB  │ [Download]│ │
│ │16:45  │ -ule       │            │ 01       │         │ [Delete]  │ │
│ └───────┴────────────┴────────────┴──────────┴─────────┴───────────┘ │
│                                                                     │
│ Total exports: 12 • Total storage: 24.5 MB                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Details

### 5.1 Enhanced Storage Service for Export History
```typescript
class ExportHistoryService {
  private static readonly HISTORY_KEY = 'export_history';
  private static readonly MAX_HISTORY_ITEMS = 50;
  
  static addToHistory(exportItem: ExportHistoryItem): void {
    const history = this.getHistory();
    history.unshift({
      ...exportItem,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    });
    
    // Keep only recent items
    if (history.length > this.MAX_HISTORY_ITEMS) {
      history.splice(this.MAX_HISTORY_ITEMS);
    }
    
    StorageService.save(this.HISTORY_KEY, history);
  }
  
  static getHistory(): ExportHistoryItem[] {
    return StorageService.load<ExportHistoryItem[]>(this.HISTORY_KEY) || [];
  }
  
  static clearHistory(): void {
    StorageService.save(this.HISTORY_KEY, []);
  }
  
  private static generateId(): string {
    return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 5.2 Chart Generation for Reports
```typescript
class ChartExportService {
  static async generateChartBase64(
    chartComponent: React.ReactElement, 
    width: number = 800, 
    height: number = 400
  ): Promise<string> {
    // Render chart component to canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Use html2canvas or similar to render React component to canvas
    const container = document.createElement('div');
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    
    // Render the chart component (this would need a React renderer)
    // For simplicity, we'll assume we can render to canvas
    
    document.body.appendChild(container);
    
    try {
      // This is a simplified version - actual implementation would use
      // a library that can render React components to canvas
      const html2canvas = await import('html2canvas');
      const canvasResult = await html2canvas.default(container);
      return canvasResult.toDataURL('image/png');
    } finally {
      document.body.removeChild(container);
    }
  }
}
```

### 5.3 File Size Optimization
```typescript
class ExportOptimizationService {
  static optimizeDataForExport(data: any, format: ExportFormat): any {
    switch (format) {
      case 'JSON':
        return this.optimizeJSON(data);
      case 'CSV':
        return this.optimizeCSV(data);
      case 'EXCEL':
        return this.optimizeExcel(data);
      default:
        return data;
    }
  }
  
  private static optimizeJSON(data: any): any {
    // Remove unnecessary metadata for smaller file size
    const optimized = { ...data };
    delete optimized.internalMetadata;
    delete optimized.cache;
    return optimized;
  }
  
  static async compressData(data: any): Promise<Blob> {
    // Use compression API if available
    if ('CompressionStream' in window) {
      const stream = new Blob([JSON.stringify(data)]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      return new Blob([await new Response(compressedStream).arrayBuffer()]);
    } else {
      // Fallback to non-compressed
      return new Blob([JSON.stringify(data)]);
    }
  }
}
```

---

## 6. Error Handling and Validation

### 6.1 Export Error Handling
```typescript
class ExportErrorHandler {
  static handleExportError(error: Error, options: ExportConfig): void {
    console.error('Export failed:', error);
    
    const errorMessage = this.getErrorMessage(error, options);
    this.showErrorToast(errorMessage);
    
    // Log error for debugging
    this.logExportError(error, options);
  }
  
  private static getErrorMessage(error: Error, options: ExportConfig): string {
    if (error.message.includes('size')) {
      return 'Export data too large. Try reducing the date range or data selection.';
    } else if (error.message.includes('memory')) {
      return 'Insufficient memory for export. Try exporting smaller datasets.';
    } else {
      return `Export failed: ${error.message}`;
    }
  }
  
  private static logExportError(error: Error, options: ExportConfig): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      options,
      error: {
        message: error.message,
        stack: error.stack
      }
    };
    
    // Save to localStorage for debugging
    const errors = StorageService.load<ExportError[]>('export_errors') || [];
    errors.push(errorLog);
    StorageService.save('export_errors', errors.slice(-10)); // Keep last 10 errors
  }
}
```

This enhanced export system provides comprehensive multi-format support for both raw data and formatted reports, with robust error handling, progress tracking, and optimization for large datasets.