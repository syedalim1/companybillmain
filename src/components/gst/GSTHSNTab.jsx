import React from 'react';
import { formatINR } from '@/hooks/useAnalyticsEngine';

const GSTHSNTab = ({ hsnBreakdown }) => {
  if (!hsnBreakdown) return null;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900">HSN / SAC Tax Summary (GSTR-1 Table 12)</h4>
        <p className="text-xs text-slate-500 mt-0.5">Commodity-wise tax duty allocation and unit-formatted volume tracking</p>
      </div>

      {hsnBreakdown.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">No HSN/SAC classifications recorded</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                <th className="py-2 px-2">HSN/SAC Code</th>
                <th className="py-2 px-2">Type</th>
                <th className="py-2 px-2">Description</th>
                <th className="py-2 px-2 text-right">Quantity</th>
                <th className="py-2 px-2 text-right">Taxable Value</th>
                <th className="py-2 px-2 text-right">CGST</th>
                <th className="py-2 px-2 text-right">SGST</th>
                <th className="py-2 px-2 text-right">IGST</th>
                <th className="py-2 px-2 text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {hsnBreakdown.map((h, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2 px-2 font-mono font-bold text-purple-700">
                    <span className="bg-purple-50 px-1.5 py-0.5 rounded">{h.code}</span>
                  </td>
                  <td className="py-2 px-2 text-[10px] font-bold text-slate-400">{h.type}</td>
                  <td className="py-2 px-2 text-slate-700 truncate max-w-[180px]">{h.description}</td>
                  <td className="py-2 px-2 text-right font-semibold text-slate-600">{h.unitFormatted}</td>
                  <td className="py-2 px-2 text-right font-medium">{formatINR(h.taxableValue)}</td>
                  <td className="py-2 px-2 text-right text-indigo-600">{formatINR(h.cgst)}</td>
                  <td className="py-2 px-2 text-right text-purple-600">{formatINR(h.sgst)}</td>
                  <td className="py-2 px-2 text-right text-cyan-600">{formatINR(h.igst)}</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">{formatINR(h.totalTax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GSTHSNTab;
