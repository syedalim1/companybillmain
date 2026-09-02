import ExcelJS from 'exceljs';
import { safeDate, safeNum } from '@/hooks/useAnalyticsEngine';

// NOTE: switched from 'xlsx' (SheetJS community) to 'exceljs'.
// Reason: plain 'xlsx' silently drops colors/fonts/borders on write —
// that's why your old file always looked plain no matter what you set.
// exceljs actually renders fills, fonts, borders, freeze panes, autofilter.
// npm i exceljs

const BRAND = {
  headerFill: 'FF1F4E78',   // dark blue
  headerFont: 'FFFFFFFF',   // white
  accentFill: 'FF2E75B6',   // mid blue (section titles)
  accentFont: 'FFFFFFFF',
  totalFill: 'FFFFD966',    // gold (totals row)
  totalFont: 'FF1F1F1F',
  altRow: 'FFF2F6FB',       // very light blue (zebra striping)
  border: 'FFB7C6D9',
};

const money = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  const cleaned = String(v).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const thinBorder = {
  top: { style: 'thin', color: { argb: BRAND.border } },
  left: { style: 'thin', color: { argb: BRAND.border } },
  bottom: { style: 'thin', color: { argb: BRAND.border } },
  right: { style: 'thin', color: { argb: BRAND.border } },
};

/** Adds a big merged title banner at the top of a sheet */
function addBanner(ws, title, subtitleLines = [], colSpan = 8) {
  ws.mergeCells(1, 1, 1, colSpan);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14, color: { argb: BRAND.headerFont } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.headerFill } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 26;

  subtitleLines.forEach((line, i) => {
    const rowIdx = i + 2;
    ws.mergeCells(rowIdx, 1, rowIdx, colSpan);
    const c = ws.getCell(rowIdx, 1);
    c.value = line;
    c.font = { italic: true, size: 10, color: { argb: 'FF444444' } };
    c.alignment = { horizontal: 'center' };
  });

  return subtitleLines.length + 3; // next free row number
}

/** Styles a header row */
function styleHeaderRow(ws, rowNum, colCount) {
  const row = ws.getRow(rowNum);
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { bold: true, color: { argb: BRAND.accentFont } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.accentFill } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  }
  row.height = 20;
}

/** Styles a totals row */
function styleTotalRow(ws, rowNum, colCount) {
  const row = ws.getRow(rowNum);
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { bold: true, color: { argb: BRAND.totalFont } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.totalFill } };
    cell.border = thinBorder;
  }
}

/** Zebra-stripes data rows + borders + currency format on given money columns */
function styleDataRows(ws, startRow, endRow, colCount, moneyCols = []) {
  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    const isAlt = (r - startRow) % 2 === 1;
    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.altRow } };
      if (moneyCols.includes(c)) {
        cell.numFmt = '₹ #,##0.00';
        cell.alignment = { horizontal: 'right' };
      }
    }
  }
}

function autoFitColumns(ws, headers) {
  ws.columns = headers.map((h) => ({ width: Math.min(Math.max(String(h || '').length + 4, 12), 40) }));
}

export const exportProfessionalGSTExcel = async ({ monthlyData, selectedMonth, selectedYear, monthLabel }) => {
  if (!monthlyData || monthlyData.totalInvoices === 0) {
    alert('No GST records available to export for this period.');
    return;
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Indian Make Steel Industries';
  wb.created = new Date();

  const periodTitle = `${monthLabel || selectedMonth} ${selectedYear}`;
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // ═══════════════════════════ SHEET 1: EXECUTIVE SUMMARY ═══════════════════════════
  const wsSummary = wb.addWorksheet('Executive Summary', { views: [{ state: 'frozen', ySplit: 0 }] });
  let r = addBanner(
    wsSummary,
    'MONTHLY GSTR-1 TAX COMPLIANCE EXECUTIVE REPORT',
    [`Taxation Period: ${periodTitle}`, `Generated: ${generatedDate}  |  Source: Official Verified Billing System Data`],
    8
  );

  // KPI section
  wsSummary.getCell(r, 1).value = '1. FINANCIAL & TAXATION OBLIGATION KPI SUMMARY';
  wsSummary.mergeCells(r, 1, r, 8);
  wsSummary.getCell(r, 1).font = { bold: true, size: 12, color: { argb: BRAND.headerFont } };
  wsSummary.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.headerFill } };
  r += 1;

  const kpiHeaderRow = r;
  wsSummary.getRow(r).values = ['Metric Description', 'Count / Amount (₹)'];
  styleHeaderRow(wsSummary, r, 2);
  r += 1;

  const kpis = [
    ['Total Gross Sales Billed (Grand Total)', money(monthlyData.totalSales)],
    ['Net Taxable Turnover (Subtotal)', money(monthlyData.totalTaxableValue)],
    ['Total CGST Tax Duty', money(monthlyData.totalCGST)],
    ['Total SGST Tax Duty', money(monthlyData.totalSGST)],
    ['Total IGST Tax Duty', money(monthlyData.totalIGST)],
    ['Total GST Duty Payable', money(monthlyData.totalGST)],
    ['Total Tax Invoices Issued', money(monthlyData.totalInvoices)],
  ];
  const kpiStart = r;
  kpis.forEach((row) => { wsSummary.getRow(r).values = row; r += 1; });
  styleDataRows(wsSummary, kpiStart, r - 1, 2, [2]);
  r += 1;

  // B2B vs B2C classification
  wsSummary.getCell(r, 1).value = '2. GSTR-1 COMPLIANCE CLASSIFICATION (B2B vs B2C)';
  wsSummary.mergeCells(r, 1, r, 8);
  wsSummary.getCell(r, 1).font = { bold: true, size: 12, color: { argb: BRAND.headerFont } };
  wsSummary.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.headerFill } };
  r += 1;

  const classHeaders = ['Classification Category', 'Invoices', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total GST (₹)', 'Billed Value (₹)'];
  wsSummary.getRow(r).values = classHeaders;
  styleHeaderRow(wsSummary, r, 8);
  r += 1;
  const classStart = r;
  wsSummary.getRow(r).values = ['B2B (Registered Buyers with GSTIN)', money(monthlyData.b2b?.count), money(monthlyData.b2b?.taxable), money(monthlyData.b2b?.cgst), money(monthlyData.b2b?.sgst), money(monthlyData.b2b?.igst), money(monthlyData.b2b?.total), money(monthlyData.b2b?.grandTotal)];
  r += 1;
  wsSummary.getRow(r).values = ['B2C (Retail / Unregistered Buyers)', money(monthlyData.b2c?.count), money(monthlyData.b2c?.taxable), money(monthlyData.b2c?.cgst), money(monthlyData.b2c?.sgst), money(monthlyData.b2c?.igst), money(monthlyData.b2c?.total), money(monthlyData.b2c?.grandTotal)];
  styleDataRows(wsSummary, classStart, r, 8, [3, 4, 5, 6, 7, 8]);
  r += 1;
  wsSummary.getRow(r).values = ['TOTAL TAX COMPLIANCE OBLIGATION', money(monthlyData.totalInvoices), money(monthlyData.totalTaxableValue), money(monthlyData.totalCGST), money(monthlyData.totalSGST), money(monthlyData.totalIGST), money(monthlyData.totalGST), money(monthlyData.totalSales)];
  styleTotalRow(wsSummary, r, 8);
  [3, 4, 5, 6, 7, 8].forEach((c) => { wsSummary.getRow(r).getCell(c).numFmt = '₹ #,##0.00'; });
  r += 2;

  // HSN highlights
  wsSummary.getCell(r, 1).value = '3. HSN / SAC CLASSIFICATION HIGHLIGHTS (Top 10)';
  wsSummary.mergeCells(r, 1, r, 6);
  wsSummary.getCell(r, 1).font = { bold: true, size: 12, color: { argb: BRAND.headerFont } };
  wsSummary.getCell(r, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.headerFill } };
  r += 1;
  const hsnHiHeaders = ['HSN/SAC Code', 'Type', 'Description', 'Volume', 'Taxable Turnover (₹)', 'Total Tax (₹)'];
  wsSummary.getRow(r).values = hsnHiHeaders;
  styleHeaderRow(wsSummary, r, 6);
  r += 1;
  const hsnHiStart = r;
  (monthlyData.hsnBreakdown || []).slice(0, 10).forEach((h) => {
    wsSummary.getRow(r).values = [h.code, h.type, h.description, h.unitFormatted, money(h.taxableValue), money(h.totalTax)];
    r += 1;
  });
  if ((monthlyData.hsnBreakdown || []).length > 0) {
    styleDataRows(wsSummary, hsnHiStart, r - 1, 6, [5, 6]);
  }

  autoFitColumns(wsSummary, classHeaders);
  wsSummary.views = [{ state: 'frozen', ySplit: kpiHeaderRow }];

  // ═══════════════════════════ SHEET 2: GSTR-1 B2B ═══════════════════════════
  const wsB2B = wb.addWorksheet('GSTR-1 B2B');
  let rb = addBanner(wsB2B, 'GSTR-1 TABLE 4A: B2B REGISTERED TAX INVOICES (WITH VALID GSTIN)', [`Period: ${periodTitle}  |  Total B2B Invoices: ${monthlyData.b2b?.count || 0}`], 12);
  const b2bHeaders = ['S.No', 'Invoice No', 'Date', 'Customer GSTIN', 'Customer Name', 'Place of Supply', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total GST (₹)', 'Grand Total (₹)'];
  wsB2B.getRow(rb).values = b2bHeaders;
  styleHeaderRow(wsB2B, rb, 12);
  const b2bHeaderRow = rb;
  rb += 1;
  const b2bDataStart = rb;
  (monthlyData.b2b?.invoices || []).forEach((inv, i) => {
    const d = safeDate(inv.date);
    wsB2B.getRow(rb).values = [i + 1, inv.invoiceNo || 'N/A', d ? d.toLocaleDateString('en-IN') : (inv.date || ''), inv.buyerGSTIN || 'N/A', inv.buyerName || 'N/A', inv.placeOfSupply || 'N/A', money(inv.taxableValue), money(inv.cgstAmount), money(inv.sgstAmount), money(inv.igstAmount), money(inv.totalGST), money(inv.grandTotal)];
    rb += 1;
  });
  if ((monthlyData.b2b?.invoices || []).length > 0) {
    styleDataRows(wsB2B, b2bDataStart, rb - 1, 12, [7, 8, 9, 10, 11, 12]);
  }
  wsB2B.getRow(rb).values = ['TOTAL B2B DUTY', '', '', '', '', '', money(monthlyData.b2b?.taxable), money(monthlyData.b2b?.cgst), money(monthlyData.b2b?.sgst), money(monthlyData.b2b?.igst), money(monthlyData.b2b?.total), money(monthlyData.b2b?.grandTotal)];
  styleTotalRow(wsB2B, rb, 12);
  [7, 8, 9, 10, 11, 12].forEach((c) => { wsB2B.getRow(rb).getCell(c).numFmt = '₹ #,##0.00'; });
  autoFitColumns(wsB2B, b2bHeaders);
  wsB2B.autoFilter = { from: { row: b2bHeaderRow, column: 1 }, to: { row: b2bHeaderRow, column: 12 } };
  wsB2B.views = [{ state: 'frozen', ySplit: b2bHeaderRow }];

  // ═══════════════════════════ SHEET 3: GSTR-1 B2C ═══════════════════════════
  const wsB2C = wb.addWorksheet('GSTR-1 B2C');
  let rc = addBanner(wsB2C, 'GSTR-1 TABLE 7: B2C RETAIL & UNREGISTERED INVOICES', [`Period: ${periodTitle}  |  Total B2C Invoices: ${monthlyData.b2c?.count || 0}`], 11);
  const b2cHeaders = ['S.No', 'Invoice No', 'Date', 'Customer Name', 'Place of Supply', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total GST (₹)', 'Grand Total (₹)'];
  wsB2C.getRow(rc).values = b2cHeaders;
  styleHeaderRow(wsB2C, rc, 11);
  const b2cHeaderRow = rc;
  rc += 1;
  const b2cDataStart = rc;
  (monthlyData.b2c?.invoices || []).forEach((inv, i) => {
    const d = safeDate(inv.date);
    wsB2C.getRow(rc).values = [i + 1, inv.invoiceNo || 'N/A', d ? d.toLocaleDateString('en-IN') : (inv.date || ''), inv.buyerName || 'N/A', inv.placeOfSupply || 'N/A', money(inv.taxableValue), money(inv.cgstAmount), money(inv.sgstAmount), money(inv.igstAmount), money(inv.totalGST), money(inv.grandTotal)];
    rc += 1;
  });
  if ((monthlyData.b2c?.invoices || []).length > 0) {
    styleDataRows(wsB2C, b2cDataStart, rc - 1, 11, [6, 7, 8, 9, 10, 11]);
  }
  wsB2C.getRow(rc).values = ['TOTAL B2C DUTY', '', '', '', '', money(monthlyData.b2c?.taxable), money(monthlyData.b2c?.cgst), money(monthlyData.b2c?.sgst), money(monthlyData.b2c?.igst), money(monthlyData.b2c?.total), money(monthlyData.b2c?.grandTotal)];
  styleTotalRow(wsB2C, rc, 11);
  [6, 7, 8, 9, 10, 11].forEach((c) => { wsB2C.getRow(rc).getCell(c).numFmt = '₹ #,##0.00'; });
  autoFitColumns(wsB2C, b2cHeaders);
  wsB2C.autoFilter = { from: { row: b2cHeaderRow, column: 1 }, to: { row: b2cHeaderRow, column: 11 } };
  wsB2C.views = [{ state: 'frozen', ySplit: b2cHeaderRow }];

  // ═══════════════════════════ SHEET 4: HSN / SAC SUMMARY ═══════════════════════════
  const wsHSN = wb.addWorksheet('HSN SAC Summary');
  let rh = addBanner(wsHSN, 'GSTR-1 TABLE 12: HSN / SAC SUMMARY & QUANTITY AGGREGATION', [`Period: ${periodTitle}  |  Total Unique HSN Codes: ${(monthlyData.hsnBreakdown || []).length}`], 10);
  const hsnHeaders = ['S.No', 'HSN/SAC Code', 'Type', 'Description', 'Total Quantity', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)'];
  wsHSN.getRow(rh).values = hsnHeaders;
  styleHeaderRow(wsHSN, rh, 10);
  const hsnHeaderRow = rh;
  rh += 1;
  const hsnDataStart = rh;
  (monthlyData.hsnBreakdown || []).forEach((h, i) => {
    wsHSN.getRow(rh).values = [i + 1, h.code || 'Unclassified', h.type || '—', h.description || 'N/A', h.unitFormatted || '0 units', money(h.taxableValue), money(h.cgst), money(h.sgst), money(h.igst), money(h.totalTax)];
    rh += 1;
  });
  if ((monthlyData.hsnBreakdown || []).length > 0) {
    styleDataRows(wsHSN, hsnDataStart, rh - 1, 10, [6, 7, 8, 9, 10]);
  }
  const hsnTotals = (monthlyData.hsnBreakdown || []).reduce((acc, h) => ({
    taxable: acc.taxable + money(h.taxableValue),
    cgst: acc.cgst + money(h.cgst),
    sgst: acc.sgst + money(h.sgst),
    igst: acc.igst + money(h.igst),
    totalTax: acc.totalTax + money(h.totalTax),
  }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 });

  wsHSN.getRow(rh).values = ['TOTAL HSN ALLOCATION', '', '', '', '', money(hsnTotals.taxable), money(hsnTotals.cgst), money(hsnTotals.sgst), money(hsnTotals.igst), money(hsnTotals.totalTax)];
  styleTotalRow(wsHSN, rh, 10);
  [6, 7, 8, 9, 10].forEach((c) => { wsHSN.getRow(rh).getCell(c).numFmt = '₹ #,##0.00'; });
  autoFitColumns(wsHSN, hsnHeaders);
  wsHSN.autoFilter = { from: { row: hsnHeaderRow, column: 1 }, to: { row: hsnHeaderRow, column: 10 } };
  wsHSN.views = [{ state: 'frozen', ySplit: hsnHeaderRow }];

  // ═══════════════════════════ SHEET 5: BUYER SUMMARY ═══════════════════════════
  const wsBuyers = wb.addWorksheet('Buyer Summary');
  let ru = addBanner(wsBuyers, 'CUSTOMER-WISE AGGREGATED GST BREAKDOWN', [`Period: ${periodTitle}  |  Total Unique Clients: ${(monthlyData.buyerBreakdown || []).length}`], 11);
  const buyerHeaders = ['S.No', 'Customer Name', 'GSTIN', 'State', 'Invoices Issued', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)', 'Grand Billed Total (₹)'];
  wsBuyers.getRow(ru).values = buyerHeaders;
  styleHeaderRow(wsBuyers, ru, 11);
  const buyerHeaderRow = ru;
  ru += 1;
  const buyerDataStart = ru;
  (monthlyData.buyerBreakdown || []).forEach((b, i) => {
    wsBuyers.getRow(ru).values = [i + 1, b.name || 'N/A', b.gstin || 'N/A', b.state || 'N/A', money(b.totalInvoices), money(b.totalTaxableValue), money(b.totalCGST), money(b.totalSGST), money(b.totalIGST), money(b.totalGST), money(b.totalSales)];
    ru += 1;
  });
  if ((monthlyData.buyerBreakdown || []).length > 0) {
    styleDataRows(wsBuyers, buyerDataStart, ru - 1, 11, [6, 7, 8, 9, 10, 11]);
  }
  autoFitColumns(wsBuyers, buyerHeaders);
  wsBuyers.autoFilter = { from: { row: buyerHeaderRow, column: 1 }, to: { row: buyerHeaderRow, column: 11 } };
  wsBuyers.views = [{ state: 'frozen', ySplit: buyerHeaderRow }];

  // ═══════════════════════════ SHEET 6: STATE-WISE TAX ═══════════════════════════
  const stateMap = new Map();
  (monthlyData.invoiceBreakdown || []).forEach((inv) => {
    const st = (inv.placeOfSupply || 'Unknown State').toString().trim();
    if (!stateMap.has(st)) stateMap.set(st, { state: st, count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalGST: 0, grandTotal: 0 });
    const s = stateMap.get(st);
    s.count++;
    s.taxable += money(inv.taxableValue);
    s.cgst += money(inv.cgstAmount);
    s.sgst += money(inv.sgstAmount);
    s.igst += money(inv.igstAmount);
    s.totalGST += money(inv.totalGST);
    s.grandTotal += money(inv.grandTotal);
  });
  const stateRows = [...stateMap.values()].sort((a, b) => b.grandTotal - a.grandTotal);

  const wsState = wb.addWorksheet('State Tax Summary');
  let rs = addBanner(wsState, 'STATE-WISE (PLACE OF SUPPLY) GST BREAKDOWN', [`Period: ${periodTitle}`], 9);
  const stateHeaders = ['S.No', 'State Name', 'Invoices', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)', 'Billed Total (₹)'];
  wsState.getRow(rs).values = stateHeaders;
  styleHeaderRow(wsState, rs, 9);
  const stateHeaderRow = rs;
  rs += 1;
  const stateDataStart = rs;
  stateRows.forEach((s, i) => {
    wsState.getRow(rs).values = [i + 1, s.state, s.count, money(s.taxable), money(s.cgst), money(s.sgst), money(s.igst), money(s.totalGST), money(s.grandTotal)];
    rs += 1;
  });
  if (stateRows.length > 0) {
    styleDataRows(wsState, stateDataStart, rs - 1, 9, [4, 5, 6, 7, 8, 9]);
  }
  autoFitColumns(wsState, stateHeaders);
  wsState.autoFilter = { from: { row: stateHeaderRow, column: 1 }, to: { row: stateHeaderRow, column: 9 } };
  wsState.views = [{ state: 'frozen', ySplit: stateHeaderRow }];

  // Write & trigger browser download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GSTR1_Professional_Report_${selectedMonth}_${selectedYear}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportGSTCSV = ({ monthlyData, selectedMonth, selectedYear }) => {
  if (!monthlyData || monthlyData.totalInvoices === 0) return;
  const headers = ['Invoice No', 'Date', 'Type', 'Customer Name', 'GSTIN', 'Place of Supply', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total GST', 'Grand Total'];
  const rows = (monthlyData.invoiceBreakdown || []).map((inv) => {
    const d = safeDate(inv.date);
    const dateStr = d ? d.toLocaleDateString('en-IN') : (inv.date || '');
    return [
      `"${(inv.invoiceNo || '').toString().replace(/"/g, '""')}"`,
      `"${(dateStr || '').toString().replace(/"/g, '""')}"`,
      `"${inv.isB2B ? 'B2B' : 'B2C'}"`,
      `"${(inv.buyerName || '').toString().replace(/"/g, '""')}"`,
      `"${(inv.buyerGSTIN || '').toString().replace(/"/g, '""')}"`,
      `"${(inv.placeOfSupply || '').toString().replace(/"/g, '""')}"`,
      money(inv.taxableValue).toFixed(2),
      money(inv.cgstAmount).toFixed(2),
      money(inv.sgstAmount).toFixed(2),
      money(inv.igstAmount).toFixed(2),
      money(inv.totalGST).toFixed(2),
      money(inv.grandTotal).toFixed(2),
    ].join(',');
  });
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `GSTR1_${selectedMonth}_${selectedYear}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportGSTJSON = ({ monthlyData, selectedMonth, selectedYear }) => {
  if (!monthlyData || monthlyData.totalInvoices === 0) return;
  const jsonContent = JSON.stringify(monthlyData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `GSTR1_${selectedMonth}_${selectedYear}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
};