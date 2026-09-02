import React, { useState, useEffect } from 'react';
import GSTReportHeader from './gst/GSTReportHeader';
import GSTSummaryCards from './gst/GSTSummaryCards';
import GSTTaxComponentsTab from './gst/GSTTaxComponentsTab';
import GSTB2BTab from './gst/GSTB2BTab';
import GSTB2CTab from './gst/GSTB2CTab';
import GSTHSNTab from './gst/GSTHSNTab';
import GSTBuyerSummaryTab from './gst/GSTBuyerSummaryTab';
import { safeNum, safeDate, formatUnitQty } from '@/hooks/useAnalyticsEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SHELL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

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

    const gstInvoices = savedInvoices.filter(invoice => {
      if (invoice.mode !== 'gst-bill') return false;
      const d = safeDate(invoice.date);
      return d && (d.getUTCMonth() + 1) === selectedMonth && d.getUTCFullYear() === selectedYear;
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
        hsnBreakdown: [],
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
    const hsnMap = new Map();

    const b2bInvoices = [];
    const b2cInvoices = [];

    gstInvoices.forEach(invoice => {
      const grandTotal = safeNum(invoice.grandTotal);
      const subtotal = safeNum(invoice.subtotal);
      const cgst = safeNum(invoice.cgstAmount);
      const sgst = safeNum(invoice.sgstAmount);
      const igst = safeNum(invoice.igstAmount);
      const totalGST = cgst + sgst + igst;

      totalSales += grandTotal;
      totalTaxableValue += subtotal;
      totalCGST += cgst;
      totalSGST += sgst;
      totalIGST += igst;

      const roundOff = invoice.roundOff !== undefined ? safeNum(invoice.roundOff) : (grandTotal - (subtotal + totalGST));

      const buyerName = invoice.buyerName || invoice.buyer?.name || 'Unknown Buyer';
      const buyerGSTIN = (invoice.buyerGstin || invoice.buyer?.gstin || '').trim();
      const isB2B = buyerGSTIN.length > 3;

      const invRecord = {
        id: invoice.id,
        invoiceNo: invoice.invoiceNo || 'N/A',
        date: invoice.date,
        buyerName,
        buyerGSTIN: buyerGSTIN || 'N/A',
        buyerAddress: invoice.buyer?.address || 'N/A',
        buyerState: invoice.buyerState || invoice.buyer?.state || 'N/A',
        buyerStateCode: invoice.buyerStateCode || invoice.buyer?.stateCode || 'N/A',
        placeOfSupply: invoice.placeOfSupply || invoice.buyerState || invoice.buyer?.state || 'N/A',
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
          state: invoice.buyerState || invoice.buyer?.state || 'N/A',
          stateCode: invoice.buyerStateCode || invoice.buyer?.stateCode || 'N/A',
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

      // HSN aggregation
      (invoice.items || []).forEach(item => {
        const code = (item.hsn || item.sac || 'Unclassified').trim();
        const type = item.hsn ? 'HSN' : item.sac ? 'SAC' : '—';
        const hsnKey = `${type}:${code}`;

        const qty = safeNum(item.quantity);
        const rate = safeNum(item.rate);
        const disc = safeNum(item.discount);
        const unit = (item.unit || 'units').trim().toLowerCase();
        const lineTaxable = qty * rate * (1 - disc / 100);

        if (!hsnMap.has(hsnKey)) {
          hsnMap.set(hsnKey, {
            code,
            type,
            description: item.description || 'N/A',
            unitMap: {},
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: 0,
          });
        }
        const h = hsnMap.get(hsnKey);
        h.unitMap[unit] = (h.unitMap[unit] || 0) + qty;
        h.taxableValue += lineTaxable;

        if (subtotal > 0) {
          const ratio = lineTaxable / subtotal;
          const lineCGST = cgst * ratio;
          const lineSGST = sgst * ratio;
          const lineIGST = igst * ratio;
          h.cgst += lineCGST;
          h.sgst += lineSGST;
          h.igst += lineIGST;
          h.totalTax += (lineCGST + lineSGST + lineIGST);
        }
      });
    });

    setMonthlyData({
      totalInvoices: gstInvoices.length,
      totalSales,
      totalTaxableValue,
      totalCGST,
      totalSGST,
      totalIGST,
      totalGST: totalCGST + totalSGST + totalIGST,
      b2b: {
        count: b2bInvoices.length,
        taxable: b2bInvoices.reduce((s, i) => s + i.taxableValue, 0),
        cgst: b2bInvoices.reduce((s, i) => s + i.cgstAmount, 0),
        sgst: b2bInvoices.reduce((s, i) => s + i.sgstAmount, 0),
        igst: b2bInvoices.reduce((s, i) => s + i.igstAmount, 0),
        total: b2bInvoices.reduce((s, i) => s + i.totalGST, 0),
        grandTotal: b2bInvoices.reduce((s, i) => s + i.grandTotal, 0),
        invoices: b2bInvoices,
      },
      b2c: {
        count: b2cInvoices.length,
        taxable: b2cInvoices.reduce((s, i) => s + i.taxableValue, 0),
        cgst: b2cInvoices.reduce((s, i) => s + i.cgstAmount, 0),
        sgst: b2cInvoices.reduce((s, i) => s + i.sgstAmount, 0),
        igst: b2cInvoices.reduce((s, i) => s + i.igstAmount, 0),
        total: b2cInvoices.reduce((s, i) => s + i.totalGST, 0),
        grandTotal: b2cInvoices.reduce((s, i) => s + i.grandTotal, 0),
        invoices: b2cInvoices,
      },
      hsnBreakdown: [...hsnMap.values()].map(h => ({
        ...h,
        unitFormatted: formatUnitQty(h.unitMap),
      })).sort((a, b) => b.taxableValue - a.taxableValue),
      buyerBreakdown: [...buyerMap.values()].sort((a, b) => b.totalSales - a.totalSales),
      invoiceBreakdown,
    });
  };

  const monthLabel = months.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-slate-800 bg-slate-50/50 min-h-screen">
      {/* Header Banner */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">GSTR-1 Tax Compliance & Filing Center</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Audit tax obligations, GSTR-1 tables (B2B, B2C, HSN/SAC), and export professional multi-sheet Excel workbooks.</p>
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
              { key: 'hsn', label: `HSN/SAC Summary (${monthlyData.hsnBreakdown.length})` },
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
          {activeTab === 'hsn' && <GSTHSNTab hsnBreakdown={monthlyData.hsnBreakdown} />}
          {activeTab === 'buyers' && <GSTBuyerSummaryTab buyerBreakdown={monthlyData.buyerBreakdown} />}
        </div>
      )}
    </div>
  );
};

export default MonthlyGSTReport;