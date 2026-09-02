import React from 'react';
import { formatINR } from '@/hooks/useAnalyticsEngine';

const GSTSection = ({ analytics }) => {
  if (!analytics) return null;
  const { gstBreakdown, monthlyGST = [] } = analytics;
  const { cgst, sgst, igst, total, taxable, intraCount, interCount, invoiceCount, b2b, b2c } = gstBreakdown;

  // Donut Chart calculations
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { label: 'CGST', amount: cgst, color: '#6366f1' },
    { label: 'SGST', amount: sgst, color: '#a855f7' },
    { label: 'IGST', amount: igst, color: '#06b6d4' },
  ].filter(s => s.amount > 0);

  let accumulatedOffset = 0;
  const maxMonthGST = Math.max(...(monthlyGST || []).map(m => (m.cgst || 0) + (m.sgst || 0) + (m.igst || 0)), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Taxable Value', value: formatINR(taxable) },
          { label: 'CGST Liability', value: formatINR(cgst) },
          { label: 'SGST Liability', value: formatINR(sgst) },
          { label: 'IGST Liability', value: formatINR(igst) },
          { label: 'Total GST Duty', value: formatINR(total) },
        ].map((m, i) => (
          <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-xl font-extrabold text-text-title">{m.value}</p>
          </div>
        ))}
      </div>

      {/* B2B vs B2C GST Analysis */}
      <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-text-title">B2B vs B2C GST Breakdown</h4>
            <p className="text-xs text-text-desc mt-0.5">Categorized for GSTR-1 preparation based on customer GSTIN presence</p>
          </div>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl">{invoiceCount} GST Invoices</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* B2B (with GSTIN) */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h5 className="text-sm font-bold text-indigo-950">B2B Transactions (With GSTIN)</h5>
              </div>
              <span className="text-xs font-extrabold text-indigo-700">{b2b.count} invoices</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-indigo-100/60">
              <div><p className="text-[9px] text-text-desc uppercase font-bold">Taxable</p><p className="text-sm font-bold text-text-title">{formatINR(b2b.taxable)}</p></div>
              <div><p className="text-[9px] text-text-desc uppercase font-bold">Tax Amount</p><p className="text-sm font-bold text-indigo-600">{formatINR(b2b.gst)}</p></div>
              <div><p className="text-[9px] text-text-desc uppercase font-bold">Billed Total</p><p className="text-sm font-bold text-text-title">{formatINR(b2b.grandTotal)}</p></div>
            </div>
          </div>

          {/* B2C (without GSTIN) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <h5 className="text-sm font-bold text-slate-800">B2C Retail (No GSTIN)</h5>
              </div>
              <span className="text-xs font-extrabold text-slate-700">{b2c.count} invoices</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-slate-200/60">
              <div><p className="text-[9px] text-text-desc uppercase font-bold">Taxable</p><p className="text-sm font-bold text-text-title">{formatINR(b2c.taxable)}</p></div>
              <div><p className="text-[9px] text-text-desc uppercase font-bold">Tax Amount</p><p className="text-sm font-bold text-purple-600">{formatINR(b2c.gst)}</p></div>
              <div><p className="text-[9px] text-text-desc uppercase font-bold">Billed Total</p><p className="text-sm font-bold text-text-title">{formatINR(b2c.grandTotal)}</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut Chart */}
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center">
          <h4 className="text-base font-bold text-text-title mb-1 self-start">Tax Liability Split</h4>
          <p className="text-xs text-text-desc mb-4 self-start">CGST vs SGST vs IGST</p>
          {total === 0 ? (
            <p className="text-xs text-text-desc py-10">No GST data</p>
          ) : (
            <>
              <div className="relative mb-5">
                <svg width={size} height={size} className="transform -rotate-90">
                  <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
                  {segments.map((seg) => {
                    const pct = (seg.amount / total) * 100;
                    const dash = (pct / 100) * circumference;
                    const offset = -accumulatedOffset;
                    accumulatedOffset += dash;
                    return (
                      <circle
                        key={seg.label}
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-text-desc font-bold uppercase tracking-wider">Total GST</span>
                  <span className="text-xl font-extrabold text-text-title">{formatINR(total)}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full space-y-2">
                {[
                  { label: 'CGST', amount: cgst, color: '#6366f1', pct: total > 0 ? (cgst / total) * 100 : 0 },
                  { label: 'SGST', amount: sgst, color: '#a855f7', pct: total > 0 ? (sgst / total) * 100 : 0 },
                  { label: 'IGST', amount: igst, color: '#06b6d4', pct: total > 0 ? (igst / total) * 100 : 0 },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-xs font-semibold text-text-body">{item.label}</span></div>
                    <span className="text-xs font-bold text-text-title">{formatINR(item.amount)} <span className="text-text-desc font-medium">({item.pct.toFixed(1)}%)</span></span>
                  </div>
                ))}
              </div>

              <div className="w-full mt-4 pt-3 border-t border-slate-100 flex justify-between text-[10px]">
                <span className="text-text-desc">Intra-State Invoices: <span className="font-bold text-text-title">{intraCount}</span></span>
                <span className="text-text-desc">Inter-State Invoices: <span className="font-bold text-text-title">{interCount}</span></span>
              </div>
            </>
          )}
        </div>

        {/* Monthly GST Stacked Bars */}
        <div className="lg:col-span-2 bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-base font-bold text-text-title mb-1">Monthly GST Trend</h4>
          <p className="text-xs text-text-desc mb-4">CGST + SGST + IGST liability breakdown over 12 months</p>
          <div className="flex items-end gap-1 h-44">
            {(monthlyGST || []).map((m, i) => {
              const totalM = (m.cgst || 0) + (m.sgst || 0) + (m.igst || 0);
              const hPct = maxMonthGST > 0 ? (totalM / maxMonthGST) * 100 : 0;
              const cgstPct = totalM > 0 ? (m.cgst / totalM) * hPct : 0;
              const sgstPct = totalM > 0 ? (m.sgst / totalM) * hPct : 0;
              const igstPct = totalM > 0 ? (m.igst / totalM) * hPct : 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <div className="bg-gray-900 text-white text-[10px] rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                      <div className="text-gray-400 text-[9px] uppercase mb-1">{m.month}</div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between gap-3"><span>CGST</span><span className="font-bold">{formatINR(m.cgst)}</span></div>
                        <div className="flex justify-between gap-3"><span>SGST</span><span className="font-bold">{formatINR(m.sgst)}</span></div>
                        <div className="flex justify-between gap-3"><span>IGST</span><span className="font-bold">{formatINR(m.igst)}</span></div>
                        <div className="border-t border-gray-700 pt-0.5 flex justify-between gap-3 font-bold"><span>Total</span><span>{formatINR(totalM)}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Stacked Bar */}
                  <div className="w-full px-0.5 flex flex-col items-center justify-end" style={{ height: `${Math.max(hPct, totalM > 0 ? 4 : 0)}%` }}>
                    {m.igst > 0 && <div className="w-full rounded-t-md" style={{ height: `${igstPct > 0 ? Math.max((igstPct / hPct) * 100, 2) : 0}%`, backgroundColor: '#06b6d4' }} />}
                    {m.sgst > 0 && <div className="w-full" style={{ height: `${sgstPct > 0 ? Math.max((sgstPct / hPct) * 100, 2) : 0}%`, backgroundColor: '#a855f7' }} />}
                    {m.cgst > 0 && <div className={`w-full ${m.igst === 0 && m.sgst === 0 ? 'rounded-t-md' : ''}`} style={{ height: `${cgstPct > 0 ? Math.max((cgstPct / hPct) * 100, 2) : 0}%`, backgroundColor: '#6366f1' }} />}
                  </div>
                  <span className="text-[9px] text-text-desc font-semibold mt-1">{m.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[10px]">
            <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded" style={{ backgroundColor: '#6366f1' }} /><span className="text-text-desc">CGST</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded" style={{ backgroundColor: '#a855f7' }} /><span className="text-text-desc">SGST</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded" style={{ backgroundColor: '#06b6d4' }} /><span className="text-text-desc">IGST</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSTSection;
