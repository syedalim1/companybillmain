import React from 'react';
import { formatINR, safeDate } from '@/hooks/useAnalyticsEngine';

const PaymentSection = ({ analytics }) => {
  if (!analytics) return null;
  const { summary, payment } = analytics;
  const { stats, aging, outstandingByCustomer, totalOutstanding } = payment;
  const total = stats.paid + stats.partial + stats.unpaid + stats.overdue;

  // Payment ring
  const size = 150; const sw = 20; const r = (size - sw) / 2; const circ = 2 * Math.PI * r;
  const segments = [
    { label: 'Paid', count: stats.paid, color: '#10b981' },
    { label: 'Partial', count: stats.partial, color: '#f59e0b' },
    { label: 'Unpaid', count: stats.unpaid, color: '#6366f1' },
    { label: 'Overdue', count: stats.overdue, color: '#ef4444' },
  ].filter(s => s.count > 0);
  let accOff = 0;

  const maxAgingAmt = Math.max(...Object.values(aging).map(b => b.amount), 1);
  const agingBuckets = [
    { key: '0-30', label: '0–30 Days', color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { key: '31-60', label: '31–60 Days', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' },
    { key: '61-90', label: '61–90 Days', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700' },
    { key: '90+', label: '90+ Days', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Billed', value: formatINR(summary.totalRevenue) },
          { label: 'Collected', value: formatINR(summary.totalCollected), extra: 'text-emerald-600' },
          { label: 'Outstanding', value: formatINR(summary.totalOutstanding), extra: 'text-red-600' },
          { label: 'Collection Rate', value: `${summary.collectionRate.toFixed(1)}%` },
          { label: 'Overdue Count', value: stats.overdue },
        ].map((m,i) => (
          <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-xl font-extrabold ${m.extra || 'text-text-title'}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment Status Ring */}
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center">
          <h4 className="text-base font-bold text-text-title mb-4 self-start">Payment Status</h4>
          {total === 0 ? (
            <p className="text-xs text-text-desc py-10">No invoices</p>
          ) : (
            <>
              <div className="relative mb-4">
                <svg width={size} height={size} className="transform -rotate-90">
                  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
                  {segments.map(seg => {
                    const pct = (seg.count / total) * 100;
                    const dash = (pct / 100) * circ;
                    const offset = -accOff; accOff += dash;
                    return <circle key={seg.label} cx={size/2} cy={size/2} r={r} fill="none" stroke={seg.color}
                      strokeWidth={sw} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />;
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-text-title">{total}</span>
                  <span className="text-[10px] text-text-desc font-bold uppercase">Invoices</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                {[
                  { label: 'Paid', count: stats.paid, color: 'bg-emerald-500' },
                  { label: 'Partial', count: stats.partial, color: 'bg-amber-500' },
                  { label: 'Unpaid', count: stats.unpaid, color: 'bg-indigo-500' },
                  { label: 'Overdue', count: stats.overdue, color: 'bg-red-500' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <div><div className="text-[10px] text-text-desc">{s.label}</div><div className="text-sm font-bold text-text-title">{s.count}</div></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Aging Analysis */}
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-text-title">Receivable Aging</h4>
              <p className="text-xs text-text-desc mt-0.5">Outstanding by age</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-red-600">{formatINR(totalOutstanding)}</p>
              <p className="text-[10px] text-text-desc font-bold uppercase">Total Due</p>
            </div>
          </div>
          {totalOutstanding === 0 ? (
            <div className="flex flex-col items-center py-8 text-text-desc">
              <svg className="w-8 h-8 mb-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm font-medium">All collected!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {agingBuckets.map(b => {
                const data = aging[b.key];
                return (
                  <div key={b.key} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: b.color}} />
                        <span className="text-xs font-semibold text-text-body">{b.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${b.bg} ${b.text}`}>{data.count} inv.</span>
                        <span className="text-xs font-bold text-text-title min-w-[70px] text-right">{formatINR(data.amount)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{width:`${maxAgingAmt > 0 ? Math.max((data.amount/maxAgingAmt)*100, data.amount > 0 ? 6 : 0) : 0}%`, backgroundColor: b.color}} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Outstanding by Customer */}
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-base font-bold text-text-title mb-1">Outstanding by Customer</h4>
          <p className="text-xs text-text-desc mb-4">Where money is stuck</p>
          {outstandingByCustomer.length === 0 ? (
            <p className="text-xs text-text-desc text-center py-8">No outstanding</p>
          ) : (
            <div className="space-y-2">
              {outstandingByCustomer.slice(0,8).map((c,i) => (
                <div key={c.name+c.gstin} className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50/40 hover:bg-red-50 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-700 shrink-0">{c.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-text-title truncate">{c.name}</div>
                    <div className="text-[10px] text-text-desc">{c.invoiceCount} inv. • {c.oldestDays}d oldest</div>
                  </div>
                  <div className="text-sm font-bold text-red-600 shrink-0">{formatINR(c.outstanding)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;
