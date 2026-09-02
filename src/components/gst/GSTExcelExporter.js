import * as XLSX from 'xlsx';
import { safeDate } from '@/hooks/useAnalyticsEngine';

/** Auto-fit column widths helper for SheetJS */
const fitColumnWidths = (data) => {
  if (!data || data.length === 0) return [];
  const colWidths = [];
  data.forEach(row => {
    row.forEach((cell, colIdx) => {
      const valStr = cell !== null && cell !== undefined ? String(cell) : '';
      const len = Math.max(valStr.length, 10);
      colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, len + 3);
    });
  });
  return colWidths.map(w => ({ wch: Math.min(w, 50) }));
};

export const exportProfessionalGSTExcel = ({ monthlyData, selectedMonth, selectedYear, monthLabel }) => {
  if (!monthlyData || monthlyData.totalInvoices === 0) {
    alert('No GST records available to export for this period.');
    return;
  }

  const wb = XLSX.utils.book_new();
  const periodTitle = `${monthLabel || selectedMonth} ${selectedYear}`;
  const generatedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 1: EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  const summaryAOA = [
    ['========================================================================================'],
    ['                         MONTHLY GSTR-1 TAX COMPLIANCE REPORT                           '],
    ['========================================================================================'],
    [`Taxation Period : ${periodTitle}`],
    [`Report Date     : ${generatedDate}`],
    [`Status          : Verified Read-Only Audit Data`],
    [],
    ['----------------------------------------------------------------------------------------'],
    ['1. FINANCIAL & TAXATION KPI SUMMARY'],
    ['----------------------------------------------------------------------------------------'],
    ['Metric Description', 'Count / Value'],
    ['Total Sales Billed (Grand Total)', monthlyData.totalSales],
    ['Net Taxable Value (Subtotal)', monthlyData.totalTaxableValue],
    ['Total CGST Liability', monthlyData.totalCGST],
    ['Total SGST Liability', monthlyData.totalSGST],
    ['Total IGST Liability', monthlyData.totalIGST],
    ['Total GST Duty Payable', monthlyData.totalGST],
    ['Total GST Invoices Issued', monthlyData.totalInvoices],
    [],
    ['----------------------------------------------------------------------------------------'],
    ['2. GSTR-1 TAX CLASSIFICATION (B2B vs B2C)'],
    ['----------------------------------------------------------------------------------------'],
    ['Classification Category', 'Invoices', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total GST (₹)', 'Billed Value (₹)'],
    ['B2B (Registered with GSTIN)', monthlyData.b2b.count, monthlyData.b2b.taxable, monthlyData.b2b.cgst, monthlyData.b2b.sgst, monthlyData.b2b.igst, monthlyData.b2b.total, monthlyData.b2b.grandTotal],
    ['B2C (Retail / Unregistered)', monthlyData.b2c.count, monthlyData.b2c.taxable, monthlyData.b2c.cgst, monthlyData.b2c.sgst, monthlyData.b2c.igst, monthlyData.b2c.total, monthlyData.b2c.grandTotal],
    ['TOTAL TAX COMPLIANCE', monthlyData.totalInvoices, monthlyData.totalTaxableValue, monthlyData.totalCGST, monthlyData.totalSGST, monthlyData.totalIGST, monthlyData.totalGST, monthlyData.totalSales],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAOA);
  wsSummary['!cols'] = fitColumnWidths(summaryAOA);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 2: B2B REGISTERED INVOICES (GSTR-1 Table 4A)
  // ═══════════════════════════════════════════════════════════════════════════
  const b2bHeaders = ['S.No', 'Invoice No', 'Date', 'Customer GSTIN', 'Customer Name', 'Place of Supply', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total GST (₹)', 'Grand Total (₹)'];
  const b2bRows = (monthlyData.b2b.invoices || []).map((inv, i) => {
    const d = safeDate(inv.date);
    return [
      i + 1,
      inv.invoiceNo,
      d ? d.toLocaleDateString('en-IN') : '',
      inv.buyerGSTIN,
      inv.buyerName,
      inv.placeOfSupply,
      inv.taxableValue,
      inv.cgstAmount,
      inv.sgstAmount,
      inv.igstAmount,
      inv.totalGST,
      inv.grandTotal,
    ];
  });
  const b2bAOA = [
    ['GSTR-1 TABLE 4A: B2B REGISTERED TAX INVOICES'],
    [`Period: ${periodTitle}`],
    [],
    b2bHeaders,
    ...b2bRows,
    [],
    ['TOTAL B2B', '', '', '', '', '', monthlyData.b2b.taxable, monthlyData.b2b.cgst, monthlyData.b2b.sgst, monthlyData.b2b.igst, monthlyData.b2b.total, monthlyData.b2b.grandTotal],
  ];
  const wsB2B = XLSX.utils.aoa_to_sheet(b2bAOA);
  wsB2B['!cols'] = fitColumnWidths(b2bAOA);
  XLSX.utils.book_append_sheet(wb, wsB2B, 'GSTR-1 B2B');

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 3: B2C RETAIL INVOICES (GSTR-1 Table 7)
  // ═══════════════════════════════════════════════════════════════════════════
  const b2cHeaders = ['S.No', 'Invoice No', 'Date', 'Customer Name', 'Place of Supply', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total GST (₹)', 'Grand Total (₹)'];
  const b2cRows = (monthlyData.b2c.invoices || []).map((inv, i) => {
    const d = safeDate(inv.date);
    return [
      i + 1,
      inv.invoiceNo,
      d ? d.toLocaleDateString('en-IN') : '',
      inv.buyerName,
      inv.placeOfSupply,
      inv.taxableValue,
      inv.cgstAmount,
      inv.sgstAmount,
      inv.igstAmount,
      inv.totalGST,
      inv.grandTotal,
    ];
  });
  const b2cAOA = [
    ['GSTR-1 TABLE 7: B2C RETAIL / UNREGISTERED INVOICES'],
    [`Period: ${periodTitle}`],
    [],
    b2cHeaders,
    ...b2cRows,
    [],
    ['TOTAL B2C', '', '', '', '', monthlyData.b2c.taxable, monthlyData.b2c.cgst, monthlyData.b2c.sgst, monthlyData.b2c.igst, monthlyData.b2c.total, monthlyData.b2c.grandTotal],
  ];
  const wsB2C = XLSX.utils.aoa_to_sheet(b2cAOA);
  wsB2C['!cols'] = fitColumnWidths(b2cAOA);
  XLSX.utils.book_append_sheet(wb, wsB2C, 'GSTR-1 B2C');

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 4: HSN / SAC TAX SUMMARY (GSTR-1 Table 12)
  // ═══════════════════════════════════════════════════════════════════════════
  const hsnHeaders = ['S.No', 'HSN/SAC Code', 'Type', 'Description', 'Total Quantity', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)'];
  const hsnRows = (monthlyData.hsnBreakdown || []).map((h, i) => [
    i + 1,
    h.code,
    h.type,
    h.description,
    h.unitFormatted,
    h.taxableValue,
    h.cgst,
    h.sgst,
    h.igst,
    h.totalTax,
  ]);
  const hsnAOA = [
    ['GSTR-1 TABLE 12: HSN / SAC TAX SUMMARY'],
    [`Period: ${periodTitle}`],
    [],
    hsnHeaders,
    ...hsnRows,
  ];
  const wsHSN = XLSX.utils.aoa_to_sheet(hsnAOA);
  wsHSN['!cols'] = fitColumnWidths(hsnAOA);
  XLSX.utils.book_append_sheet(wb, wsHSN, 'HSN SAC Summary');

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 5: BUYER SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  const buyerHeaders = ['S.No', 'Customer Name', 'GSTIN', 'State', 'Invoices Issued', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)', 'Billed Value (₹)'];
  const buyerRows = (monthlyData.buyerBreakdown || []).map((b, i) => [
    i + 1,
    b.name,
    b.gstin,
    b.state,
    b.totalInvoices,
    b.totalTaxableValue,
    b.totalCGST,
    b.totalSGST,
    b.totalIGST,
    b.totalGST,
    b.totalSales,
  ]);
  const buyerAOA = [
    ['BUYER-WISE GST SUMMARY'],
    [`Period: ${periodTitle}`],
    [],
    buyerHeaders,
    ...buyerRows,
  ];
  const wsBuyers = XLSX.utils.aoa_to_sheet(buyerAOA);
  wsBuyers['!cols'] = fitColumnWidths(buyerAOA);
  XLSX.utils.book_append_sheet(wb, wsBuyers, 'Buyer Summary');

  // Write Workbook
  XLSX.writeFile(wb, `GSTR1_Professional_Report_${selectedMonth}_${selectedYear}.xlsx`);
};

export const exportGSTCSV = ({ monthlyData, selectedMonth, selectedYear }) => {
  if (!monthlyData || monthlyData.totalInvoices === 0) return;
  const headers = ['Invoice No', 'Date', 'Type', 'Customer Name', 'GSTIN', 'Place of Supply', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total GST', 'Grand Total'];
  const rows = monthlyData.invoiceBreakdown.map(inv => {
    const d = safeDate(inv.date);
    return [
      `"${inv.invoiceNo}"`,
      `"${d ? d.toLocaleDateString('en-IN') : ''}"`,
      `"${inv.isB2B ? 'B2B' : 'B2C'}"`,
      `"${inv.buyerName.replace(/"/g, '""')}"`,
      `"${inv.buyerGSTIN}"`,
      `"${inv.placeOfSupply.replace(/"/g, '""')}"`,
      inv.taxableValue.toFixed(2),
      inv.cgstAmount.toFixed(2),
      inv.sgstAmount.toFixed(2),
      inv.igstAmount.toFixed(2),
      inv.totalGST.toFixed(2),
      inv.grandTotal.toFixed(2),
    ].join(',');
  });
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `GSTR1_${selectedMonth}_${selectedYear}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
