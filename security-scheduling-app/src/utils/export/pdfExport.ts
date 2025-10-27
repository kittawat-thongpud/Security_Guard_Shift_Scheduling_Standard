import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Shift, Employee, Budget, CostAnalysis, EmployeeWorkload } from '../../types';

export const generatePDFReport = async (
  shifts: Shift[],
  employees: Employee[],
  _budgets: Budget[],
  costAnalysis: CostAnalysis,
  employeeWorkloads: EmployeeWorkload[],
  period: { start: string; end: string }
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Add header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Security Guard Scheduling Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Period: ${period.start} to ${period.end}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Add summary section
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Summary', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const summaryData = [
    `Total Cost: ฿${costAnalysis.totalCost.toLocaleString()}`,
    `Total Hours: ${costAnalysis.totalHours.toFixed(1)}`,
    `Regular Hours: ${costAnalysis.regularHours.toFixed(1)}`,
    `Overtime Hours: ${costAnalysis.overtimeHours.toFixed(1)}`,
    `Regular Cost: ฿${costAnalysis.regularCost.toLocaleString()}`,
    `Overtime Cost: ฿${costAnalysis.overtimeCost.toLocaleString()}`,
    `Budget Utilization: ${costAnalysis.budgetUtilization.toFixed(1)}%`,
  ];

  summaryData.forEach(line => {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(line, margin, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Add employee workload section
  if (yPosition > pageHeight - margin - 50) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Employee Workload Analysis', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  // Table headers
  const tableHeaders = ['Employee', 'Total Hours', 'OT Hours', 'Consecutive Days', 'Happiness Score'];
  const colWidths = [60, 30, 25, 35, 30];
  let xPosition = margin;

  // Draw table headers
  tableHeaders.forEach((header, index) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(header, xPosition, yPosition);
    xPosition += colWidths[index];
  });

  yPosition += 6;
  xPosition = margin;

  // Draw horizontal line
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;

  // Add employee data
  employeeWorkloads.forEach(workload => {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;

      // Redraw headers on new page
      xPosition = margin;
      tableHeaders.forEach((header, index) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 6;
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;
    }

    const employee = employees.find(e => e.id === workload.employeeId);
    const rowData = [
      employee?.name || 'Unknown',
      workload.totalHours.toFixed(1),
      workload.overtimeHours.toFixed(1),
      workload.consecutiveDays.toString(),
      workload.happinessScore.toFixed(1),
    ];

    xPosition = margin;
    rowData.forEach((data, index) => {
      pdf.setFont('helvetica', 'normal');
      pdf.text(data, xPosition, yPosition);
      xPosition += colWidths[index];
    });

    yPosition += 6;
  });

  yPosition += 10;

  // Add shift details section
  if (yPosition > pageHeight - margin - 50) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Shift Details', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc, shift) => {
    if (!acc[shift.date]) {
      acc[shift.date] = [];
    }
    acc[shift.date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  // Add shifts by date
  Object.entries(shiftsByDate).forEach(([date, dateShifts]) => {
    if (yPosition > pageHeight - margin - 20) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text(`Date: ${date}`, margin, yPosition);
    yPosition += 6;

    dateShifts.forEach(shift => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      const employee = employees.find(e => e.id === shift.employeeId);
      const shiftText = `${employee?.name || 'Unknown'} - ${shift.type} (${shift.startTime}-${shift.endTime})${shift.isOvertime ? ' [OT]' : ''}`;

      pdf.setFont('helvetica', 'normal');
      pdf.text(`  • ${shiftText}`, margin + 5, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
  });

  // Add footer
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  pdf.save(`security-scheduling-report-${period.start}-to-${period.end}.pdf`);
};

export const exportElementAsPDF = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for PDF export');
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = imgWidth / imgHeight;

  let width = pageWidth;
  let height = width / ratio;

  if (height > pageHeight) {
    height = pageHeight;
    width = height * ratio;
  }

  pdf.addImage(imgData, 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
  pdf.save(filename);
};