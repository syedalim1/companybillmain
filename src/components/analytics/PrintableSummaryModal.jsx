import React from 'react';
import { formatINR, safeDate, safeNum } from '@/hooks/useAnalyticsEngine';

const PrintableSummaryModal = ({ isOpen, onClose, analytics }) => {
  if (!isOpen || !analytics) return null;

  const { summary, runRate, gstBreakdown, customers, products, payment, currentPeriodLabel } = analytics;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl relative border border-slate-100 print:shadow-none print:border-none print:max-w-full">
        {/* Modal Controls (Hidden during print) */}
        <div className="flex justify-between items-center pb-6 mb-6 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              📄
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-title">Executive Management Summary Report</h3>
              <p className="text-xs text-text-desc">Formatted for print & Board export • Period: {currentPeriodLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="space-y-6 text-slate-900">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Executive Business Performance Summary</h1>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">Management Control Report • {currentPeriodLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800">Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p className="text-[10px] text-slate-500">Confidential Business Audit</p>
            </div>
          </div>

          {/* Key Financial Indicators Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">1. Executive KPIs</h4>
            <div className="grid grid-cols-4 gap-4 border border-slate-200 p-4 rounded-xl">
              <div><p className="text-[10px] text-slate-500 uppercase font-bold">Total Sales Billed</p><p className="text-lg font-black text-slate-900">{formatINR(summary.totalRevenue)}</p></div>
              <div><p className="text-[10px] text-slate-500 uppercase font-bold">Total Collected</p><p className="text-lg font-black text-emerald-700">{formatINR(summary.totalCollected)}</p></div>
              <div><p className="text-[10px] text-slate-500 uppercase font-bold">Total Outstanding</p><p className="text-lg font-black text-red-700">{formatINR(summary.totalOutstanding)}</p></div>
              <div><p className="text-[10px] text-slate-500 uppercase font-bold">GST Liability</p><p className="text-lg font-black text-indigo-700">{formatINR(gstBreakdown.total)}</p></div>
            </div>
          </div>

          {/* Performance Ratios */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-slate-200 p-3 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Collection Efficiency</p>
              <p className="text-xl font-black text-slate-900">{summary.collectionRate.toFixed(1)}%</p>
            </div>
            <div className="border border-slate-200 p-3 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Days Sales Outstanding (DSO)</p>
              <p className="text-xl font-black text-slate-900">{summary.dso} Days</p>
            </div>
            <div className="border border-slate-200 p-3 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Projected Month-End Pace</p>
              <p className="text-xl font-black text-slate-900">{formatINR(runRate.projectedMonthEnd)}</p>
            </div>
          </div>

          {/* Top 5 Customers & Top 5 Products */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">2. Top 5 Clients by Revenue</h4>
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-2 text-left text-[10px] font-bold">Client Name</th>
                    <th className="p-2 text-right text-[10px] font-bold">Revenue</th>
                    <th className="p-2 text-right text-[10px] font-bold">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.top.slice(0, 5).map(c => (
                    <tr key={c.id || c.name} className="border-b border-slate-100">
                      <td className="p-2 font-bold">{c.name}</td>
                      <td className="p-2 text-right">{formatINR(c.totalRevenue)}</td>
                      <td className="p-2 text-right font-bold">{c.contribution.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">3. Top 5 Products by Revenue</h4>
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-2 text-left text-[10px] font-bold">Product</th>
                    <th className="p-2 text-right text-[10px] font-bold">Revenue</th>
                    <th className="p-2 text-right text-[10px] font-bold">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {products.top.slice(0, 5).map(p => (
                    <tr key={p.id || p.name} className="border-b border-slate-100">
                      <td className="p-2 font-bold truncate max-w-[140px]">{p.name}</td>
                      <td className="p-2 text-right">{formatINR(p.totalRevenue)}</td>
                      <td className="p-2 text-right font-semibold">{p.unitFormatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aging Receivables Summary */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">4. Receivables Aging & Risk Exposure</h4>
            <div className="grid grid-cols-4 gap-3 text-center border border-slate-200 p-3 rounded-xl">
              <div><p className="text-[10px] text-slate-500 font-bold">0–30 Days</p><p className="text-sm font-black text-emerald-700">{formatINR(payment.aging['0-30'].amount)}</p></div>
              <div><p className="text-[10px] text-slate-500 font-bold">31–60 Days</p><p className="text-sm font-black text-amber-700">{formatINR(payment.aging['31-60'].amount)}</p></div>
              <div><p className="text-[10px] text-slate-500 font-bold">61–90 Days</p><p className="text-sm font-black text-orange-700">{formatINR(payment.aging['61-90'].amount)}</p></div>
              <div><p className="text-[10px] text-slate-500 font-bold">90+ Days (High Risk)</p><p className="text-sm font-black text-red-700">{formatINR(payment.aging['90+'].amount)}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableSummaryModal;
