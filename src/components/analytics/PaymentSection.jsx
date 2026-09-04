import React, { useState } from 'react';
import { formatINR, safeDate } from '@/hooks/useAnalyticsEngine';

const PaymentSection = ({ analytics, onFilterChange }) => {
  if (!analytics) return null;
  const { summary, payment } = analytics;
  const { stats, aging, outstandingByCustomer, totalOutstanding } = payment;
  const total = stats.paid + stats.partial + stats.unpaid + stats.overdue;
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // Ring Chart calculations
  const size = 150;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { label: 'Paid', count: stats.paid, color: '#10b981', key: 'paid' },
    { label: 'Partial', count: stats.partial, color: '#f59e0b', key: 'partial' },
    { label: 'Unpaid', count: stats.unpaid, color: '#6366f1', key: 'unpaid' },
    { label: 'Overdue', count: stats.overdue, color: '#ef4444', key: 'overdue' },
  ].filter(s => s.count > 0);

  let accumulatedOffset = 0;
  const maxAgingAmt = Math.max(...Object.values(aging).map(b => b.amount), 1);
  const agingBuckets = [
    { key: '0-30', label: '0–30 Days', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { key: '31-60', label: '31–60 Days', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' },
    { key: '61-90', label: '61–90 Days', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700' },
    { key: '90+', label: '90+ Days', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Billed', value: formatINR(summary.totalRevenue) },
          { label: 'Collected Amount', value: formatINR(summary.totalCollected), extra: 'text-emerald-600' },
          { label: 'Outstanding Receivables', value: formatINR(summary.totalOutstanding), extra: 'text-red-600' },
          { label: 'Collection Rate', value: `${summary.collectionRate.toFixed(1)}%` },
          { label: 'DSO (Days Sales Out)', value: `${summary.dso} days` },
        ].map((m, i) => (
          <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-xl font-extrabold ${m.extra || 'text-text-title'}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment Status Ring */}
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center">
          <h4 className="text-base font-bold text-text-title mb-1 self-start">Payment Status Distribution</h4>
          <p className="text-xs text-text-desc mb-4 self-start">Click status to filter dashboard</p>
          {total === 0 ? (
            <p className="text-xs text-text-desc py-10">No invoice records</p>
          ) : (
            <>
              <div className="relative mb-4">
                <svg width={size} height={size} className="transform -rotate-90">
                  <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
                  {segments.map(seg => {
                    const pct = (seg.count / total) * 100;
                    const dash = (pct / 100) * circumference;
                    const offset = -accumulatedOffset;
                    accumulatedOffset += dash;
                    return (
                      <circle
                        key={seg.label}
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke={seg.color}
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
                  <span className="text-2xl font-extrabold text-text-title">{total}</span>
                  <span className="text-[10px] text-text-desc font-bold uppercase">Invoices</span>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-2 w-full">
                {[
                  { label: 'Paid', count: stats.paid, color: 'bg-emerald-500', key: 'paid' },
                  { label: 'Partial', count: stats.partial, color: 'bg-amber-500', key: 'partial' },
                  { label: 'Unpaid', count: stats.unpaid, color: 'bg-indigo-500', key: 'unpaid' },
                  { label: 'Overdue', count: stats.overdue, color: 'bg-red-500', key: 'overdue' },
                ].map(s => (
                  <div
                    key={s.label}
                    onClick={() => onFilterChange && onFilterChange('paymentStatus', s.key)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <div>
                      <div className="text-[10px] text-text-desc font-semibold">{s.label}</div>
                      <div className="text-sm font-bold text-text-title">{s.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Invoice Aging Analysis */}
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-text-title">Receivable Aging</h4>
              <p className="text-xs text-text-desc mt-0.5">Outstanding invoice age buckets</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-red-600">{formatINR(totalOutstanding)}</p>
              <p className="text-[10px] text-text-desc font-bold uppercase">Total Due</p>
            </div>
          </div>

          {totalOutstanding === 0 ? (
            <div className="flex flex-col items-center py-8 text-text-desc">
              <svg className="w-8 h-8 mb-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm font-medium">All invoices collected!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {agingBuckets.map(b => {
                const data = aging[b.key];
                return (
                  <div key={b.key} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                        <span className="text-xs font-semibold text-text-body">{b.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${b.bg} ${b.text}`}>{data.count} inv.</span>
                        <span className="text-xs font-bold text-text-title min-w-[70px] text-right">{formatINR(data.amount)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${maxAgingAmt > 0 ? Math.max((data.amount / maxAgingAmt) * 100, data.amount > 0 ? 6 : 0) : 0}%`, backgroundColor: b.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Outstanding by Customer — with drill-down */}
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-base font-bold text-text-title mb-1">Outstanding by Customer</h4>
          <p className="text-xs text-text-desc mb-4">Click a client to view unpaid invoices</p>
          {outstandingByCustomer.length === 0 ? (
            <p className="text-xs text-text-desc text-center py-8">No outstanding receivables</p>
          ) : (
            <div className="space-y-1">
              {outstandingByCustomer.slice(0, 8).map((c) => {
                const isExpanded = expandedCustomer === (c.id || c.name);
                const agingColors = { '0-30': 'text-emerald-700 bg-emerald-50', '31-60': 'text-amber-700 bg-amber-50', '61-90': 'text-orange-700 bg-orange-50', '90+': 'text-red-700 bg-red-50' };
                return (
                  <div key={c.id || c.name}>
                    <div
                      onClick={() => {
                        setExpandedCustomer(isExpanded ? null : (c.id || c.name));
                        if (!isExpanded && onFilterChange) onFilterChange('customerId', c.id || c.name);
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${
                        isExpanded ? 'bg-red-50 border border-red-200' : 'bg-red-50/40 hover:bg-red-50 border border-transparent'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-700 shrink-0">{(c.name || 'C').charAt(0).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-text-title truncate">{c.name}</div>
                        <div className="text-[10px] text-text-desc">{c.invoiceCount} inv. • {c.oldestDays}d oldest</div>
                      </div>
                      <div className="text-sm font-bold text-red-600 shrink-0">{formatINR(c.outstanding)}</div>
                      <svg className={`w-3.5 h-3.5 text-text-desc transition-transform shrink-0 ${isExpanded ? 'rotate-180 text-red-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Drill-down: unpaid invoice list */}
                    {isExpanded && c.unpaidInvoices && c.unpaidInvoices.length > 0 && (
                      <div className="mt-1 ml-10 mr-1 bg-white border border-red-100 rounded-xl overflow-hidden shadow-xs">
                        <div className="px-3 py-2 bg-red-50/50 border-b border-red-100">
                          <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Unpaid Invoices — {c.name}</p>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {c.unpaidInvoices.map((inv, idx) => {
                            const d = safeDate(inv.date);
                            const dateStr = d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
                            const agingClass = agingColors[inv.ageBucket] || 'text-slate-600 bg-slate-50';
                            return (
                              <div key={inv.id || idx} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50/50">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-bold text-text-title shrink-0">#{inv.invoiceNo}</span>
                                  <span className="text-text-desc shrink-0">{dateStr}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${agingClass} shrink-0`}>{inv.ageBucket} days</span>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                  <div className="font-bold text-red-600">{formatINR(inv.outstanding)}</div>
                                  {inv.paymentAmount > 0 && (
                                    <div className="text-[9px] text-text-desc">Paid: {formatINR(inv.paymentAmount)}</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="px-3 py-2 bg-slate-50/50 border-t border-slate-100 flex justify-between">
                          <span className="text-[10px] text-text-desc font-semibold">{c.unpaidInvoices.length} invoice{c.unpaidInvoices.length !== 1 ? 's' : ''}</span>
                          <span className="text-[10px] font-bold text-red-600">{formatINR(c.outstanding)} total outstanding</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;
