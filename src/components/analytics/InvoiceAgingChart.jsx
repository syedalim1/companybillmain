import React from 'react';
import { formatINR } from '@/hooks/useAnalyticsEngine';

const InvoiceAgingChart = ({ analytics }) => {
  if (!analytics) return null;

  const { agingBuckets, maxAgingAmount } = analytics;

  const buckets = [
    { key: '0-30', label: '0–30 Days', color: '#10b981', bgColor: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-700' },
    { key: '31-60', label: '31–60 Days', color: '#f59e0b', bgColor: 'bg-amber-500', lightBg: 'bg-amber-50', textColor: 'text-amber-700' },
    { key: '61-90', label: '61–90 Days', color: '#f97316', bgColor: 'bg-orange-500', lightBg: 'bg-orange-50', textColor: 'text-orange-700' },
    { key: '90+', label: '90+ Days', color: '#ef4444', bgColor: 'bg-red-500', lightBg: 'bg-red-50', textColor: 'text-red-700' },
  ];

  const totalOutstanding = Object.values(agingBuckets).reduce((sum, b) => sum + b.amount, 0);
  const totalCount = Object.values(agingBuckets).reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="bg-bg-surface rounded-3xl p-6 shadow-lg border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-text-title">Receivable Aging</h3>
          <p className="text-text-desc text-sm">Outstanding invoice analysis</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-red-600">{formatINR(totalOutstanding)}</div>
          <div className="text-[10px] text-text-desc font-bold uppercase tracking-wider">{totalCount} Outstanding</div>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-text-desc">
          <svg className="w-8 h-8 mb-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">All invoices collected!</span>
        </div>
      ) : (
        <div className="space-y-3.5">
          {buckets.map(bucket => {
            const data = agingBuckets[bucket.key];
            const widthPct = maxAgingAmount > 0 ? Math.max((data.amount / maxAgingAmount) * 100, data.amount > 0 ? 8 : 0) : 0;

            return (
              <div key={bucket.key} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${bucket.bgColor}`} />
                    <span className="text-xs font-semibold text-text-body">{bucket.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${bucket.lightBg} ${bucket.textColor}`}>
                      {data.count} inv.
                    </span>
                    <span className="text-sm font-bold text-text-title min-w-[80px] text-right">{formatINR(data.amount)}</span>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out group-hover:brightness-110`}
                    style={{ width: `${widthPct}%`, backgroundColor: bucket.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvoiceAgingChart;
