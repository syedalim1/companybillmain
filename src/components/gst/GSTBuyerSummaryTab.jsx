import React from 'react';
import { formatINR } from '@/hooks/useAnalyticsEngine';

const GSTBuyerSummaryTab = ({ buyerBreakdown }) => {
  if (!buyerBreakdown) return null;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900">Buyer-Wise GST Compilation</h4>
        <p className="text-xs text-slate-500 mt-0.5">Aggregated tax obligations per customer entity</p>
      </div>

      {buyerBreakdown.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">No buyer transactions recorded</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                <th className="py-2 px-2">Customer Name</th>
                <th className="py-2 px-2">GSTIN</th>
                <th className="py-2 px-2 text-center">Invoices</th>
                <th className="py-2 px-2 text-right">Taxable Value</th>
                <th className="py-2 px-2 text-right">CGST</th>
                <th className="py-2 px-2 text-right">SGST</th>
                <th className="py-2 px-2 text-right">IGST</th>
                <th className="py-2 px-2 text-right">Total GST</th>
                <th className="py-2 px-2 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {buyerBreakdown.map((b, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2 px-2 font-semibold text-slate-800">{b.name}</td>
                  <td className="py-2 px-2 font-mono text-indigo-700 font-semibold">{b.gstin}</td>
                  <td className="py-2 px-2 text-center font-bold">{b.totalInvoices}</td>
                  <td className="py-2 px-2 text-right">{formatINR(b.totalTaxableValue)}</td>
                  <td className="py-2 px-2 text-right text-indigo-600">{formatINR(b.totalCGST)}</td>
                  <td className="py-2 px-2 text-right text-purple-600">{formatINR(b.totalSGST)}</td>
                  <td className="py-2 px-2 text-right text-cyan-600">{formatINR(b.totalIGST)}</td>
                  <td className="py-2 px-2 text-right font-bold text-indigo-700">{formatINR(b.totalGST)}</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">{formatINR(b.totalSales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GSTBuyerSummaryTab;
