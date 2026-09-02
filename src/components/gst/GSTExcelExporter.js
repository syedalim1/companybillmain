import ExcelJS from 'exceljs';
import { safeDate } from '@/hooks/useAnalyticsEngine';

const BRAND = {
  bannerTopBg: 'FF0F2027',    // Midnight Dark Blue
  bannerMidBg: 'FF1F3A52',    // Royal Navy Blue
  bannerTitleBg: 'FF2C3E50',  // Slate Blue
  bannerSubBg: 'FF34495E',    // Dark Metallic Blue

  titleText: 'FFFFD166',      // Bright Golden Accent
  whiteText: 'FFFFFFFF',      // White
  subText: 'FFD0E1F9',        // Ice Blue text
  mutedText: 'FFB0C4DE',      // Soft Sky Grey

  sectionHeaderFill: 'FF1E3C72', // Royal Indigo
  tableHeaderFill: 'FF2A5298',  // Sapphire Blue
  totalFill: 'FFFFD166',        // Vibrant Warm Gold
  totalFont: 'FF1A1A1A',        // Dark Charcoal
  altRowFill: 'FFF4F8FC',       // Soft Ice Blue Zebra Stripe
  border: 'FFB7C6D9',
  goldBorder: 'FFD4AF37',
};

const money = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  const cleaned = String(v).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const formatInvoiceNo = (val) => {
  if (val === null || val === undefined || val === '') return 'N/A';
  const str = String(val).trim();
  const num = Number(str);
  if (!isNaN(num) && Number.isInteger(num)) {
    return num;
  }
  return str;
};

const normalizeStateName = (str) => {
  if (!str || str === 'N/A') return 'Tamil Nadu';
  const clean = str.toString().trim();
  if (/^tamil\s*nadu$/i.test(clean)) return 'Tamil Nadu';
  if (/^karnataka$/i.test(clean)) return 'Karnataka';
  if (/^kerala$/i.test(clean)) return 'Kerala';
  if (/^andhra\s*pradesh$/i.test(clean)) return 'Andhra Pradesh';
  if (/^telangana$/i.test(clean)) return 'Telangana';
  if (/^maharashtra$/i.test(clean)) return 'Maharashtra';
  if (/^delhi$/i.test(clean)) return 'Delhi';
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
};

const thinBorder = {
  top: { style: 'thin', color: { argb: BRAND.border } },
  left: { style: 'thin', color: { argb: BRAND.border } },
  bottom: { style: 'thin', color: { argb: BRAND.border } },
  right: { style: 'thin', color: { argb: BRAND.border } },
};

/** Adds a professional multi-row Company Header Banner at the top of a worksheet */
function addCompanyHeaderBanner(ws, sheetTitle, companyInfo = {}, periodTitle = '', colSpan = 8) {
  const companyName = companyInfo.name || 'INDIAN MAKE STEEL INDUSTRIES';
  const companyAddress = companyInfo.address || 'NO.K-6, Sidco Industrial Estate, Kurichi, Coimbatore - 641021';
  const companyGSTIN = companyInfo.gstin || '33AAECI9325R1Z3';
  const companyState = companyInfo.state || 'Tamil Nadu';
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // Row 1: Company Name (Large Gold Accent Typography)
  ws.mergeCells(1, 1, 1, colSpan);
  const r1 = ws.getCell(1, 1);
  r1.value = companyName.toUpperCase();
  r1.font = { bold: true, size: 15, color: { argb: BRAND.titleText } };
  r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.bannerTopBg } };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 30;

  // Row 2: Company Address, GSTIN & State
  ws.mergeCells(2, 1, 2, colSpan);
  const r2 = ws.getCell(2, 1);
  r2.value = `${companyAddress}  |  GSTIN: ${companyGSTIN}  |  State: ${companyState}`;
  r2.font = { italic: true, size: 9.5, color: { argb: BRAND.subText } };
  r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.bannerMidBg } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 18;

  // Row 3: Sheet / Report Title Banner
  ws.mergeCells(3, 1, 3, colSpan);
  const r3 = ws.getCell(3, 1);
  r3.value = sheetTitle;
  r3.font = { bold: true, size: 11.5, color: { argb: BRAND.whiteText } };
  r3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.bannerTitleBg } };
  r3.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(3).height = 24;

  // Row 4: Period & Generation Audit Stamp
  ws.mergeCells(4, 1, 4, colSpan);
  const r4 = ws.getCell(4, 1);
  r4.value = `Taxation Period: ${periodTitle}  |  Generated: ${generatedDate}  |  Source: Verified System Audit Data`;
  r4.font = { italic: true, size: 9, color: { argb: BRAND.mutedText } };
  r4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.bannerSubBg } };
  r4.alignment = { horizontal: 'center', vertical: 'middle' };
  r4.border = { bottom: { style: 'medium', color: { argb: BRAND.goldBorder } } };
  ws.getRow(4).height = 18;

  ws.getRow(5).height = 10; // Spacing row

  return 6; // Next free row number
}

/** Styles a section title header row */
function styleSectionHeader(ws, rowNum, titleText, colSpan = 8) {
  ws.mergeCells(rowNum, 1, rowNum, colSpan);
  const cell = ws.getCell(rowNum, 1);
  cell.value = titleText;
  cell.font = { bold: true, size: 11, color: { argb: BRAND.whiteText } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.sectionHeaderFill } };
  cell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(rowNum).height = 24;
}

/** Styles a table column header row */
function styleHeaderRow(ws, rowNum, colCount) {
  const row = ws.getRow(rowNum);
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { bold: true, size: 10, color: { argb: BRAND.whiteText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.tableHeaderFill } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  }
  row.height = 22;
}

/** Styles a financial totals row with accounting double-line bottom border */
function styleTotalRow(ws, rowNum, colCount) {
  const row = ws.getRow(rowNum);
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { bold: true, size: 10.5, color: { argb: BRAND.totalFont } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.totalFill } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF856404' } },
      bottom: { style: 'double', color: { argb: 'FF856404' } },
      left: { style: 'thin', color: { argb: BRAND.border } },
      right: { style: 'thin', color: { argb: BRAND.border } },
    };
  }
  row.height = 22;
}

/** Zebra-stripes data rows + borders + currency format on given money columns */
function styleDataRows(ws, startRow, endRow, colCount, moneyCols = []) {
  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    const isAlt = (r - startRow) % 2 === 1;
    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder;
      if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.altRowFill } };
      if (moneyCols.includes(c)) {
        cell.numFmt = '₹ #,##0.00';
        cell.alignment = { horizontal: 'right' };
      }
    }
  }
}

/** Dynamic Auto-fit columns based on maximum content length in each column */
function autoFitColumns(ws, headers = []) {
  ws.columns.forEach((column, colIdx) => {
    let maxContentLen = 0;

    column.eachCell({ includeEmpty: false }, (cell) => {
      if (cell.row <= 4) return; // Ignore top company header banner rows
      if (cell.isMerged && cell.address !== cell.master.address) return;

      let str = '';
      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === 'object' && cell.value.result !== undefined) {
          str = String(cell.value.result);
        } else {
          str = String(cell.value);
        }
      }

      if (typeof cell.value === 'number' && cell.numFmt) {
        if (cell.numFmt.includes('₹')) {
          str = `₹ ${cell.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        } else {
          str = cell.value.toLocaleString('en-IN');
        }
      }

      if (str.length > maxContentLen) {
        maxContentLen = str.length;
      }
    });

    const headerText = headers[colIdx] ? String(headers[colIdx]) : '';
    const finalLen = Math.max(maxContentLen, headerText.length);

    // Padding +6 chars for filter dropdown arrows & clean padding
    column.width = Math.min(Math.max(finalLen + 6, 13), 55);
  });
}

export const exportProfessionalGSTExcel = async ({ monthlyData, selectedMonth, selectedYear, monthLabel }) => {
  if (!monthlyData || monthlyData.totalInvoices === 0) {
    alert('No GST records available to export for this period.');
    return;
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = monthlyData.companyInfo?.name || 'Indian Make Steel Industries';
  wb.created = new Date();

  const companyInfo = monthlyData.companyInfo || {};
  const periodTitle = `${monthLabel || selectedMonth} ${selectedYear}`;

  // Sort invoices chronologically (Date Ascending, then Invoice Number Ascending)
  const sortInvoices = (list = []) => {
    return [...list].sort((a, b) => {
      const dA = safeDate(a.date)?.getTime() || 0;
      const dB = safeDate(b.date)?.getTime() || 0;
      if (dA !== dB) return dA - dB;

      const numA = Number(String(a.invoiceNo || '').replace(/\D/g, ''));
      const numB = Number(String(b.invoiceNo || '').replace(/\D/g, ''));
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      return String(a.invoiceNo || '').localeCompare(String(b.invoiceNo || ''));
    });
  };

  // ═══════════════════════════ SHEET 1: EXECUTIVE SUMMARY ═══════════════════════════
  const wsSummary = wb.addWorksheet('Executive Summary');
  let r = addCompanyHeaderBanner(
    wsSummary,
    'MONTHLY GSTR-1 TAX COMPLIANCE EXECUTIVE SUMMARY',
    companyInfo,
    periodTitle,
    8
  );

  // KPI section
  styleSectionHeader(wsSummary, r, ' 1. FINANCIAL & TAXATION OBLIGATION KPI SUMMARY', 8);
  r += 1;

  const kpiHeaderRow = r;
  wsSummary.getRow(r).values = ['Metric Description', 'Count / Amount'];
  styleHeaderRow(wsSummary, r, 2);
  r += 1;

  const kpiCurrencyRows = [
    ['Total Gross Sales Billed (Grand Total)', money(monthlyData.totalSales)],
    ['Net Taxable Turnover (Subtotal)', money(monthlyData.totalTaxableValue)],
    ['Total CGST Tax Duty', money(monthlyData.totalCGST)],
    ['Total SGST Tax Duty', money(monthlyData.totalSGST)],
    ['Total IGST Tax Duty', money(monthlyData.totalIGST)],
    ['Total GST Duty Payable', money(monthlyData.totalGST)],
  ];
  const kpiStart = r;
  kpiCurrencyRows.forEach((row) => { wsSummary.getRow(r).values = row; r += 1; });
  styleDataRows(wsSummary, kpiStart, r - 1, 2, [2]);

  // Invoice Count row (formatted as integer without Rupee sign)
  wsSummary.getRow(r).values = ['Total Tax Invoices Issued', Number(monthlyData.totalInvoices)];
  wsSummary.getCell(r, 1).border = thinBorder;
  wsSummary.getCell(r, 2).border = thinBorder;
  wsSummary.getCell(r, 2).numFmt = '#,##0';
  wsSummary.getCell(r, 2).alignment = { horizontal: 'right' };
  wsSummary.getCell(r, 2).font = { bold: true };
  r += 2;

  // B2B vs B2C classification
  styleSectionHeader(wsSummary, r, ' 2. GSTR-1 COMPLIANCE CLASSIFICATION (B2B vs B2C)', 8);
  r += 1;

  const classHeaders = ['Classification Category', 'Invoices', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total GST (₹)', 'Billed Value (₹)'];
  wsSummary.getRow(r).values = classHeaders;
  styleHeaderRow(wsSummary, r, 8);
  r += 1;
  const classStart = r;
  wsSummary.getRow(r).values = ['B2B (Registered Buyers with GSTIN)', money(monthlyData.b2b?.count), money(monthlyData.b2b?.taxable), money(monthlyData.b2b?.cgst), money(monthlyData.b2b?.sgst), money(monthlyData.b2b?.igst), money(monthlyData.b2b?.total), money(monthlyData.b2b?.grandTotal)];
  wsSummary.getCell(r, 2).numFmt = '#,##0';
  r += 1;
  wsSummary.getRow(r).values = ['B2C (Retail / Unregistered Buyers)', money(monthlyData.b2c?.count), money(monthlyData.b2c?.taxable), money(monthlyData.b2c?.cgst), money(monthlyData.b2c?.sgst), money(monthlyData.b2c?.igst), money(monthlyData.b2c?.total), money(monthlyData.b2c?.grandTotal)];
  wsSummary.getCell(r, 2).numFmt = '#,##0';
  styleDataRows(wsSummary, classStart, r, 8, [3, 4, 5, 6, 7, 8]);
  r += 1;
  wsSummary.getRow(r).values = ['TOTAL TAX COMPLIANCE OBLIGATION', money(monthlyData.totalInvoices), money(monthlyData.totalTaxableValue), money(monthlyData.totalCGST), money(monthlyData.totalSGST), money(monthlyData.totalIGST), money(monthlyData.totalGST), money(monthlyData.totalSales)];
  styleTotalRow(wsSummary, r, 8);
  wsSummary.getCell(r, 2).numFmt = '#,##0';
  [3, 4, 5, 6, 7, 8].forEach((c) => { wsSummary.getRow(r).getCell(c).numFmt = '₹ #,##0.00'; });
  r += 2;

  autoFitColumns(wsSummary, classHeaders);
  wsSummary.views = [{ state: 'frozen', ySplit: kpiHeaderRow }];

  // ═══════════════════════════ SHEET 2: GSTR-1 B2B ═══════════════════════════
  const wsB2B = wb.addWorksheet('GSTR-1 B2B');
  let rb = addCompanyHeaderBanner(
    wsB2B,
    'GSTR-1 TABLE 4A: B2B REGISTERED TAX INVOICES (WITH VALID GSTIN)',
    companyInfo,
    periodTitle,
    12
  );

  const b2bHeaders = ['S.No', 'Invoice No', 'Date', 'Customer GSTIN', 'Customer Name', 'Place of Supply', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total GST (₹)', 'Grand Total (₹)'];
  wsB2B.getRow(rb).values = b2bHeaders;
  styleHeaderRow(wsB2B, rb, 12);
  const b2bHeaderRow = rb;
  rb += 1;
  const b2bDataStart = rb;

  const b2bSorted = sortInvoices(monthlyData.b2b?.invoices || []);
  b2bSorted.forEach((inv, i) => {
    const d = safeDate(inv.date);
    const invNo = formatInvoiceNo(inv.invoiceNo);
    const pos = normalizeStateName(inv.placeOfSupply);
    wsB2B.getRow(rb).values = [i + 1, invNo, d ? d.toLocaleDateString('en-IN') : (inv.date || ''), inv.buyerGSTIN || 'N/A', inv.buyerName || 'N/A', pos, money(inv.taxableValue), money(inv.cgstAmount), money(inv.sgstAmount), money(inv.igstAmount), money(inv.totalGST), money(inv.grandTotal)];
    rb += 1;
  });
  if (b2bSorted.length > 0) {
    styleDataRows(wsB2B, b2bDataStart, rb - 1, 12, [7, 8, 9, 10, 11, 12]);
  }
  
  // Total Row with merged label cell (Columns 1-6)
  wsB2B.mergeCells(rb, 1, rb, 6);
  const totalB2BCell = wsB2B.getCell(rb, 1);
  totalB2BCell.value = 'TOTAL B2B DUTY OBLIGATION';
  totalB2BCell.alignment = { horizontal: 'right', vertical: 'middle' };
  
  const b2bTotalValues = [
    money(monthlyData.b2b?.taxable), money(monthlyData.b2b?.cgst), money(monthlyData.b2b?.sgst), money(monthlyData.b2b?.igst), money(monthlyData.b2b?.total), money(monthlyData.b2b?.grandTotal)
  ];
  b2bTotalValues.forEach((val, idx) => {
    wsB2B.getCell(rb, 7 + idx).value = val;
  });
  styleTotalRow(wsB2B, rb, 12);
  [7, 8, 9, 10, 11, 12].forEach((c) => { wsB2B.getRow(rb).getCell(c).numFmt = '₹ #,##0.00'; });

  autoFitColumns(wsB2B, b2bHeaders);
  wsB2B.autoFilter = { from: { row: b2bHeaderRow, column: 1 }, to: { row: b2bHeaderRow, column: 12 } };
  wsB2B.views = [{ state: 'frozen', ySplit: b2bHeaderRow }];

  // ═══════════════════════════ SHEET 3: GSTR-1 B2C ═══════════════════════════
  const wsB2C = wb.addWorksheet('GSTR-1 B2C');
  let rc = addCompanyHeaderBanner(
    wsB2C,
    'GSTR-1 TABLE 7: B2C RETAIL & UNREGISTERED INVOICES',
    companyInfo,
    periodTitle,
    11
  );

  const b2cHeaders = ['S.No', 'Invoice No', 'Date', 'Customer Name', 'Place of Supply', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total GST (₹)', 'Grand Total (₹)'];
  wsB2C.getRow(rc).values = b2cHeaders;
  styleHeaderRow(wsB2C, rc, 11);
  const b2cHeaderRow = rc;
  rc += 1;
  const b2cDataStart = rc;

  const b2cSorted = sortInvoices(monthlyData.b2c?.invoices || []);
  b2cSorted.forEach((inv, i) => {
    const d = safeDate(inv.date);
    const invNo = formatInvoiceNo(inv.invoiceNo);
    const pos = normalizeStateName(inv.placeOfSupply);
    wsB2C.getRow(rc).values = [i + 1, invNo, d ? d.toLocaleDateString('en-IN') : (inv.date || ''), inv.buyerName || 'N/A', pos, money(inv.taxableValue), money(inv.cgstAmount), money(inv.sgstAmount), money(inv.igstAmount), money(inv.totalGST), money(inv.grandTotal)];
    rc += 1;
  });
  if (b2cSorted.length > 0) {
    styleDataRows(wsB2C, b2cDataStart, rc - 1, 11, [6, 7, 8, 9, 10, 11]);
  }

  // Total Row with merged label cell (Columns 1-5)
  wsB2C.mergeCells(rc, 1, rc, 5);
  const totalB2CCell = wsB2C.getCell(rc, 1);
  totalB2CCell.value = 'TOTAL B2C DUTY OBLIGATION';
  totalB2CCell.alignment = { horizontal: 'right', vertical: 'middle' };

  const b2cTotalValues = [
    money(monthlyData.b2c?.taxable), money(monthlyData.b2c?.cgst), money(monthlyData.b2c?.sgst), money(monthlyData.b2c?.igst), money(monthlyData.b2c?.total), money(monthlyData.b2c?.grandTotal)
  ];
  b2cTotalValues.forEach((val, idx) => {
    wsB2C.getCell(rc, 6 + idx).value = val;
  });
  styleTotalRow(wsB2C, rc, 11);
  [6, 7, 8, 9, 10, 11].forEach((c) => { wsB2C.getRow(rc).getCell(c).numFmt = '₹ #,##0.00'; });

  autoFitColumns(wsB2C, b2cHeaders);
  wsB2C.autoFilter = { from: { row: b2cHeaderRow, column: 1 }, to: { row: b2cHeaderRow, column: 11 } };
  wsB2C.views = [{ state: 'frozen', ySplit: b2cHeaderRow }];

  // ═══════════════════════════ SHEET 4: BUYER SUMMARY ═══════════════════════════
  const wsBuyers = wb.addWorksheet('Buyer Summary');
  let ru = addCompanyHeaderBanner(
    wsBuyers,
    'CUSTOMER-WISE AGGREGATED GST BREAKDOWN',
    companyInfo,
    periodTitle,
    11
  );

  const buyerHeaders = ['S.No', 'Customer Name', 'GSTIN', 'State', 'Invoices Issued', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)', 'Grand Billed Total (₹)'];
  wsBuyers.getRow(ru).values = buyerHeaders;
  styleHeaderRow(wsBuyers, ru, 11);
  const buyerHeaderRow = ru;
  ru += 1;
  const buyerDataStart = ru;
  (monthlyData.buyerBreakdown || []).forEach((b, i) => {
    const st = normalizeStateName(b.state);
    wsBuyers.getRow(ru).values = [i + 1, b.name || 'N/A', b.gstin || 'N/A', st, Number(b.totalInvoices || 0), money(b.totalTaxableValue), money(b.totalCGST), money(b.totalSGST), money(b.totalIGST), money(b.totalGST), money(b.totalSales)];
    wsBuyers.getCell(ru, 5).numFmt = '#,##0';
    ru += 1;
  });
  if ((monthlyData.buyerBreakdown || []).length > 0) {
    styleDataRows(wsBuyers, buyerDataStart, ru - 1, 11, [6, 7, 8, 9, 10, 11]);
  }
  autoFitColumns(wsBuyers, buyerHeaders);
  wsBuyers.autoFilter = { from: { row: buyerHeaderRow, column: 1 }, to: { row: buyerHeaderRow, column: 11 } };
  wsBuyers.views = [{ state: 'frozen', ySplit: buyerHeaderRow }];

  // ═══════════════════════════ SHEET 5: STATE-WISE TAX ═══════════════════════════
  const stateMap = new Map();
  (monthlyData.invoiceBreakdown || []).forEach((inv) => {
    const st = normalizeStateName(inv.placeOfSupply);
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
  let rs = addCompanyHeaderBanner(
    wsState,
    'STATE-WISE (PLACE OF SUPPLY) GST BREAKDOWN',
    companyInfo,
    periodTitle,
    9
  );

  const stateHeaders = ['S.No', 'State Name', 'Invoices', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'IGST (₹)', 'Total Tax (₹)', 'Billed Total (₹)'];
  wsState.getRow(rs).values = stateHeaders;
  styleHeaderRow(wsState, rs, 9);
  const stateHeaderRow = rs;
  rs += 1;
  const stateDataStart = rs;
  stateRows.forEach((s, i) => {
    wsState.getRow(rs).values = [i + 1, s.state, Number(s.count || 0), money(s.taxable), money(s.cgst), money(s.sgst), money(s.igst), money(s.totalGST), money(s.grandTotal)];
    wsState.getCell(rs, 3).numFmt = '#,##0';
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
      `"${normalizeStateName(inv.placeOfSupply).replace(/"/g, '""')}"`,
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