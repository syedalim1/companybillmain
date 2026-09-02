import React, { useState } from 'react';
import { formatINR, safeDate } from '@/hooks/useAnalyticsEngine';

const GSTTaxComponentsTab = ({ monthlyData }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!monthlyData) return null;

  const displayInvoices = (monthlyData.invoiceBreakdown || []).filter(inv => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.invoiceNo.toLowerCase().includes(term) ||
      inv.buyerName.toLowerCase().includes(term) ||
      inv.buyerGSTIN.toLowerCase().includes(term)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Tax Component Cards */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 space-y-3">
        <h4 className="text-sm font-bold text-slate-900">Tax Component Breakdown</h4>
        <div className="space-y-2.5">
          <div className="flex justify-between items-center p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-indigo-950">CGST (Intra-State)</p>
              <p className="text-[10px] text-indigo-500">Central Tax Duty</p>
            </div>
            <span className="text-sm font-extrabold text-indigo-700">{formatINR(monthlyData.totalCGST)}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-purple-50/70 border border-purple-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-purple-950">SGST (Intra-State)</p>
              <p className="text-[10px] text-purple-500">State Tax Duty</p>
            </div>
            <span className="text-sm font-extrabold text-purple-700">{formatINR(monthlyData.totalSGST)}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-cyan-50/70 border border-cyan-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-cyan-950">IGST (Inter-State)</p>
              <p className="text-[10px] text-cyan-500">Integrated Tax Duty</p>
            </div>
            <span className="text-sm font-extrabold text-cyan-700">{formatINR(monthlyData.totalIGST)}</span>
          </div>
        </div>
      </div>

      {/* Searchable Invoices List */}
      <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h4 className="text-sm font-bold text-slate-900">All GST Invoices ({displayInvoices.length})</h4>
          <input
            type="text"
            placeholder="Search invoice #, buyer, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[200px]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                <th className="py-2 px-2">Inv #</th>
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Customer</th>
                <th className="py-2 px-2 text-right">Taxable</th>
                <th className="py-2 px-2 text-right">GST</th>
                <th className="py-2 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayInvoices.slice(0, 10).map((inv, i) => {
                const d = safeDate(inv.date);
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-2 font-mono font-bold text-slate-900">#{inv.invoiceNo}</td>
                    <td className="py-2 px-2 text-slate-500">{d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                    <td className="py-2 px-2">
                      <span className="font-semibold text-slate-800 truncate max-w-[140px] block">{inv.buyerName}</span>
                      {inv.buyerGSTIN !== 'N/A' && <span className="text-[9px] text-slate-400 font-mono">{inv.buyerGSTIN}</span>}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-600">{formatINR(inv.taxableValue)}</td>
                    <td className="py-2 px-2 text-right font-bold text-indigo-600">{formatINR(inv.totalGST)}</td>
                    <td className="py-2 px-2 text-right font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {displayInvoices.length > 10 && (
            <p className="text-[10px] text-slate-400 text-center mt-2">+ {displayInvoices.length - 10} more invoices in export</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GSTTaxComponentsTab;
