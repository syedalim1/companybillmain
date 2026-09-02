import React from 'react';
import { formatINR } from '@/hooks/useAnalyticsEngine';

const GSTSummaryCards = ({ monthlyData }) => {
  if (!monthlyData) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Billed Sales</p>
        <p className="text-xl font-extrabold text-slate-900">{formatINR(monthlyData.totalSales)}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{monthlyData.totalInvoices} invoices</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Taxable Value</p>
        <p className="text-xl font-extrabold text-slate-900">{formatINR(monthlyData.totalTaxableValue)}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Excludes tax</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total GST Duty</p>
        <p className="text-xl font-extrabold text-indigo-600">{formatINR(monthlyData.totalGST)}</p>
        <p className="text-[10px] text-indigo-400 mt-0.5">CGST + SGST + IGST</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">B2B vs B2C Ratio</p>
        <p className="text-xl font-extrabold text-purple-600">{monthlyData.b2b.count} B2B / {monthlyData.b2c.count} B2C</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{monthlyData.b2b.count > 0 ? ((monthlyData.b2b.count / monthlyData.totalInvoices) * 100).toFixed(0) : 0}% Registered</p>
      </div>
    </div>
  );
};

export default GSTSummaryCards;
