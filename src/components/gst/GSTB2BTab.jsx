import React from 'react';
import { formatINR, safeDate } from '@/hooks/useAnalyticsEngine';

const GSTB2BTab = ({ b2bData }) => {
  if (!b2bData) return null;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-bold text-slate-900">B2B Registered Tax Invoices (GSTR-1 Table 4A)</h4>
          <p className="text-xs text-slate-500 mt-0.5">Invoices with valid buyer GSTIN numbers for Input Tax Credit (ITC)</p>
        </div>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl">{b2bData.count} Records</span>
      </div>

      {b2bData.count === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">No B2B registered customer invoices recorded in this period</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                <th className="py-2 px-2">Inv #</th>
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">GSTIN</th>
                <th className="py-2 px-2">Customer</th>
                <th className="py-2 px-2">Place of Supply</th>
                <th className="py-2 px-2 text-right">Taxable</th>
                <th className="py-2 px-2 text-right">CGST</th>
                <th className="py-2 px-2 text-right">SGST</th>
                <th className="py-2 px-2 text-right">IGST</th>
                <th className="py-2 px-2 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {b2bData.invoices.map((inv, i) => {
                const d = safeDate(inv.date);
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-2 font-mono font-bold text-slate-900">#{inv.invoiceNo}</td>
                    <td className="py-2 px-2 text-slate-500">{d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                    <td className="py-2 px-2 font-mono font-semibold text-indigo-700">
                      <span className="bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">{inv.buyerGSTIN}</span>
                    </td>
                    <td className="py-2 px-2 font-semibold text-slate-800">{inv.buyerName}</td>
                    <td className="py-2 px-2 text-slate-500">{inv.placeOfSupply}</td>
                    <td className="py-2 px-2 text-right">{formatINR(inv.taxableValue)}</td>
                    <td className="py-2 px-2 text-right text-indigo-600">{formatINR(inv.cgstAmount)}</td>
                    <td className="py-2 px-2 text-right text-purple-600">{formatINR(inv.sgstAmount)}</td>
                    <td className="py-2 px-2 text-right text-cyan-600">{formatINR(inv.igstAmount)}</td>
                    <td className="py-2 px-2 text-right font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GSTB2BTab;
