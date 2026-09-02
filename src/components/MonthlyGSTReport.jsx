import React, { useState, useEffect } from 'react';
import GSTReportHeader from './gst/GSTReportHeader';
import GSTSummaryCards from './gst/GSTSummaryCards';
import GSTTaxComponentsTab from './gst/GSTTaxComponentsTab';
import GSTB2BTab from './gst/GSTB2BTab';
import GSTB2CTab from './gst/GSTB2CTab';
import GSTBuyerSummaryTab from './gst/GSTBuyerSummaryTab';
import { safeNum, safeDate } from '@/hooks/useAnalyticsEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SHELL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const normalizeState = (rawState) => {
  if (!rawState || rawState === 'N/A') return 'Tamil Nadu';
  const str = String(rawState).trim();
  if (/^tamil\s*nadu$/i.test(str)) return 'Tamil Nadu';
  if (/^karnataka$/i.test(str)) return 'Karnataka';
  if (/^kerala$/i.test(str)) return 'Kerala';
  if (/^andhra\s*pradesh$/i.test(str)) return 'Andhra Pradesh';
  if (/^telangana$/i.test(str)) return 'Telangana';
  if (/^maharashtra$/i.test(str)) return 'Maharashtra';
  if (/^delhi$/i.test(str)) return 'Delhi';
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
};

const MonthlyGSTReport = ({ savedInvoices = [] }) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getUTCMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getUTCFullYear());
  const [activeTab, setActiveTab] = useState('summary');
  const [monthlyData, setMonthlyData] = useState(null);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getUTCFullYear() - i);

  useEffect(() => {
    calculateMonthlyGST();
  }, [selectedMonth, selectedYear, savedInvoices]);

  const calculateMonthlyGST = () => {
    if (!savedInvoices || !Array.isArray(savedInvoices)) {
      setMonthlyData(null);
      return;
    }

    const targetMonth = Number(selectedMonth);
    const targetYear = Number(selectedYear);

    const gstInvoices = savedInvoices.filter(invoice => {
      if (!invoice) return false;
      // Support both flat invoice.mode and nested invoice.invoiceDetails.mode
      const mode = (invoice.mode || invoice.invoiceDetails?.mode || 'gst-bill').toString().toLowerCase();
      if (mode !== 'gst-bill') return false;

      const rawDate = invoice.date || invoice.invoiceDetails?.date;
      const d = safeDate(rawDate);
      if (!d) return false;

      // Timezone-safe month & year comparison (check both UTC and Local date)
      const matchesUTC = (d.getUTCMonth() + 1) === targetMonth && d.getUTCFullYear() === targetYear;
      const matchesLocal = (d.getMonth() + 1) === targetMonth && d.getFullYear() === targetYear;
      return matchesUTC || matchesLocal;
    });

    if (gstInvoices.length === 0) {
      setMonthlyData({
        totalInvoices: 0,
        totalSales: 0,
        totalTaxableValue: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0,
        totalGST: 0,
        b2b: { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, grandTotal: 0, invoices: [] },
        b2c: { count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, grandTotal: 0, invoices: [] },
        buyerBreakdown: [],
        invoiceBreakdown: [],
      });
      return;
    }

    let totalSales = 0;
    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    const invoiceBreakdown = [];
    const buyerMap = new Map();

    const b2bInvoices = [];
    const b2cInvoices = [];

    gstInvoices.forEach(invoice => {
      // Support both flat invoice properties and nested invoice.totals / invoice.invoiceDetails
      const subtotal = safeNum(invoice.subtotal ?? invoice.totals?.subtotal ?? invoice.totals?.taxableAmount);
      const cgst = safeNum(invoice.cgstAmount ?? invoice.totals?.cgstAmount ?? invoice.totals?.cgst ?? invoice.cgst);
      const sgst = safeNum(invoice.sgstAmount ?? invoice.totals?.sgstAmount ?? invoice.totals?.sgst ?? invoice.sgst);
      const igst = safeNum(invoice.igstAmount ?? invoice.totals?.igstAmount ?? invoice.totals?.igst ?? invoice.igst);
      const totalGST = cgst + sgst + igst;
      const grandTotal = safeNum(invoice.grandTotal ?? invoice.totals?.grandTotal ?? invoice.totals?.total ?? (subtotal + totalGST));

      totalSales += grandTotal;
      totalTaxableValue += subtotal;
      totalCGST += cgst;
      totalSGST += sgst;
      totalIGST += igst;

      const roundOff = invoice.roundOff !== undefined 
        ? safeNum(invoice.roundOff) 
        : (invoice.totals?.roundOff !== undefined ? safeNum(invoice.totals.roundOff) : (grandTotal - (subtotal + totalGST)));

      const buyerName = (invoice.buyerName || invoice.buyer?.name || 'Unknown Buyer').toString().trim();
      const buyerGSTIN = (invoice.buyerGstin || invoice.buyerGSTIN || invoice.buyer?.gstin || invoice.buyer?.gstNo || '').toString().trim();
      const isB2B = buyerGSTIN.length > 3;

      const rawDate = invoice.date || invoice.invoiceDetails?.date;
      const invoiceNo = invoice.invoiceNo || invoice.invoiceDetails?.invoiceNo || 'N/A';
      const rawState = invoice.placeOfSupply || invoice.invoiceDetails?.placeOfSupply || invoice.buyerState || invoice.buyer?.state || 'Tamil Nadu';
      const placeOfSupply = normalizeState(rawState);
      const buyerState = normalizeState(invoice.buyerState || invoice.buyer?.state || rawState);

      const invRecord = {
        id: invoice.id || invoice._id || Math.random().toString(),
        invoiceNo,
        date: rawDate,
        buyerName,
        buyerGSTIN: buyerGSTIN || 'N/A',
        buyerAddress: (invoice.buyer?.address || invoice.buyerAddress || 'N/A').toString().trim(),
        buyerState,
        buyerStateCode: (invoice.buyerStateCode || invoice.buyer?.stateCode || 'N/A').toString().trim(),
        placeOfSupply,
        taxableValue: subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        totalGST,
        roundOff,
        grandTotal,
        isB2B,
        rawInvoice: invoice,
      };

      invoiceBreakdown.push(invRecord);
      if (isB2B) b2bInvoices.push(invRecord);
      else b2cInvoices.push(invRecord);

      // Buyer aggregation
      const buyerKey = buyerGSTIN ? `gstin:${buyerGSTIN.toUpperCase()}` : `name:${buyerName.toLowerCase()}`;
      if (!buyerMap.has(buyerKey)) {
        buyerMap.set(buyerKey, {
          name: buyerName,
          gstin: buyerGSTIN || 'N/A',
          state: (invoice.buyerState || invoice.buyer?.state || 'N/A').toString().trim(),
          stateCode: (invoice.buyerStateCode || invoice.buyer?.stateCode || 'N/A').toString().trim(),
          totalInvoices: 0,
          totalSales: 0,
          totalTaxableValue: 0,
          totalCGST: 0,
          totalSGST: 0,
          totalIGST: 0,
          totalGST: 0,
        });
      }
      const b = buyerMap.get(buyerKey);
      b.totalInvoices += 1;
      b.totalSales += grandTotal;
      b.totalTaxableValue += subtotal;
      b.totalCGST += cgst;
      b.totalSGST += sgst;
      b.totalIGST += igst;
      b.totalGST += totalGST;
    });

      // Sort invoices chronologically (Date Ascending, then Invoice Number Ascending)
      const sortInvoicesChronologically = (invList) => {
        return [...invList].sort((a, b) => {
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

      const sortedB2B = sortInvoicesChronologically(b2bInvoices);
      const sortedB2C = sortInvoicesChronologically(b2cInvoices);
      const sortedAll = sortInvoicesChronologically(invoiceBreakdown);

      // Extract seller company profile details for official reporting
      const firstInv = gstInvoices[0]?.rawInvoice || gstInvoices[0] || {};
      const companyInfo = {
        name: (firstInv.sellerName || firstInv.seller?.name || 'INDIAN MAKE STEEL INDUSTRIES').toString().trim(),
        address: (firstInv.sellerAddress || firstInv.seller?.address || 'NO.K-6, Sidco Industrial Estate, Kurichi, Coimbatore - 641021').toString().trim(),
        gstin: (firstInv.sellerGstin || firstInv.seller?.gstin || '33AAECI9325R1Z3').toString().trim(),
        contact: (firstInv.sellerContact || firstInv.seller?.contact || '').toString().trim(),
        email: (firstInv.sellerEmail || firstInv.seller?.email || '').toString().trim(),
        state: (firstInv.sellerState || firstInv.seller?.state || 'Tamil Nadu').toString().trim(),
      };

      setMonthlyData({
        companyInfo,
        totalInvoices: gstInvoices.length,
        totalSales,
        totalTaxableValue,
        totalCGST,
        totalSGST,
        totalIGST,
        totalGST: totalCGST + totalSGST + totalIGST,
        b2b: {
          count: sortedB2B.length,
          taxable: sortedB2B.reduce((s, i) => s + i.taxableValue, 0),
          cgst: sortedB2B.reduce((s, i) => s + i.cgstAmount, 0),
          sgst: sortedB2B.reduce((s, i) => s + i.sgstAmount, 0),
          igst: sortedB2B.reduce((s, i) => s + i.igstAmount, 0),
          total: sortedB2B.reduce((s, i) => s + i.totalGST, 0),
          grandTotal: sortedB2B.reduce((s, i) => s + i.grandTotal, 0),
          invoices: sortedB2B,
        },
        b2c: {
          count: sortedB2C.length,
          taxable: sortedB2C.reduce((s, i) => s + i.taxableValue, 0),
          cgst: sortedB2C.reduce((s, i) => s + i.cgstAmount, 0),
          sgst: sortedB2C.reduce((s, i) => s + i.sgstAmount, 0),
          igst: sortedB2C.reduce((s, i) => s + i.igstAmount, 0),
          total: sortedB2C.reduce((s, i) => s + i.totalGST, 0),
          grandTotal: sortedB2C.reduce((s, i) => s + i.grandTotal, 0),
          invoices: sortedB2C,
        },
        buyerBreakdown: [...buyerMap.values()].sort((a, b) => b.totalSales - a.totalSales),
        invoiceBreakdown: sortedAll,
      });
  };

  const monthLabel = months.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-slate-800 bg-slate-50/50 min-h-screen">
      {/* Header Banner */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">GSTR-1 Tax Compliance & Filing Center</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Audit tax obligations, GSTR-1 tables (B2B, B2C), and export professional multi-sheet Excel workbooks.</p>
      </div>

      {/* Controls & Exporters */}
      <GSTReportHeader
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        months={months}
        years={years}
        monthlyData={monthlyData}
      />

      {/* Main Content */}
      {!monthlyData || monthlyData.totalInvoices === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
            📑
          </div>
          <h3 className="text-lg font-bold text-slate-900">No GST Bills Recorded</h3>
          <p className="text-xs text-slate-500 mt-1">There are no GST invoices recorded for {monthLabel} {selectedYear}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <GSTSummaryCards monthlyData={monthlyData} />

          {/* Sub-Tab Navigation */}
          <div className="flex bg-slate-200/60 p-1 rounded-2xl w-fit flex-wrap gap-1">
            {[
              { key: 'summary', label: 'Tax Components' },
              { key: 'b2b', label: `B2B Registered (${monthlyData.b2b.count})` },
              { key: 'b2c', label: `B2C Retail (${monthlyData.b2c.count})` },
              { key: 'buyers', label: `Buyer Summary (${monthlyData.buyerBreakdown.length})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Active Tab View */}
          {activeTab === 'summary' && <GSTTaxComponentsTab monthlyData={monthlyData} />}
          {activeTab === 'b2b' && <GSTB2BTab b2bData={monthlyData.b2b} />}
          {activeTab === 'b2c' && <GSTB2CTab b2cData={monthlyData.b2c} />}
          {activeTab === 'buyers' && <GSTBuyerSummaryTab buyerBreakdown={monthlyData.buyerBreakdown} />}
        </div>
      )}
    </div>
  );
};

export default MonthlyGSTReport;