import React from 'react';
import { formatINR } from '@/hooks/useAnalyticsEngine';

const GSTBreakdownPanel = ({ analytics }) => {
  if (!analytics) return null;

  const { gstBreakdown } = analytics;
  const { cgst, sgst, igst, total } = gstBreakdown;

  // Calculate percentages for donut segments
  const cgstPct = total > 0 ? (cgst / total) * 100 : 0;
  const sgstPct = total > 0 ? (sgst / total) * 100 : 0;
  const igstPct = total > 0 ? (igst / total) * 100 : 0;

  // SVG donut chart params
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const cgstDash = (cgstPct / 100) * circumference;
  const sgstDash = (sgstPct / 100) * circumference;
  const igstDash = (igstPct / 100) * circumference;

  const cgstOffset = 0;
  const sgstOffset = -(cgstDash);
  const igstOffset = -(cgstDash + sgstDash);

  const segments = [
    { label: 'CGST', amount: cgst, pct: cgstPct, color: '#6366f1', dash: cgstDash, offset: cgstOffset },
    { label: 'SGST', amount: sgst, pct: sgstPct, color: '#a855f7', dash: sgstDash, offset: sgstOffset },
    { label: 'IGST', amount: igst, pct: igstPct, color: '#06b6d4', dash: igstDash, offset: igstOffset },
  ].filter(s => s.amount > 0);

  return (
    <div className="bg-bg-surface rounded-3xl p-6 shadow-lg border border-slate-100 flex flex-col items-center">
      <h3 className="text-lg font-bold text-text-title mb-1 self-start">GST Breakdown</h3>
      <p className="text-text-desc text-sm mb-5 self-start">Tax split analysis</p>

      {total === 0 ? (
        <div className="flex items-center justify-center h-40 text-text-desc text-sm">No GST data</div>
      ) : (
        <>
          {/* Donut Chart */}
          <div className="relative mb-6">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background ring */}
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth}
              />
              {/* Segments */}
              {segments.map((seg, i) => (
                <circle
                  key={seg.label}
                  cx={size / 2} cy={size / 2} r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
                  strokeDashoffset={seg.offset}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-text-desc font-bold uppercase tracking-wider">Total</span>
              <span className="text-lg font-extrabold text-text-title">{formatINR(total)}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="w-full space-y-3">
            {[
              { label: 'CGST', amount: cgst, pct: cgstPct, color: '#6366f1', count: gstBreakdown.intraStateCount },
              { label: 'SGST', amount: sgst, pct: sgstPct, color: '#a855f7', count: gstBreakdown.intraStateCount },
              { label: 'IGST', amount: igst, pct: igstPct, color: '#06b6d4', count: gstBreakdown.interStateCount },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-semibold text-text-body">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-text-title">{formatINR(item.amount)}</span>
                  <span className="text-[10px] text-text-desc ml-2">({item.pct.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Intra/Inter state indicator */}
          <div className="w-full mt-4 pt-4 border-t border-slate-100 flex justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-text-desc font-medium">Intra-State: <span className="text-text-title font-bold">{gstBreakdown.intraStateCount}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span className="text-text-desc font-medium">Inter-State: <span className="text-text-title font-bold">{gstBreakdown.interStateCount}</span></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GSTBreakdownPanel;
