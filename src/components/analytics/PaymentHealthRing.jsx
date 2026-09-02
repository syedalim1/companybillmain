import React from 'react';

const PaymentHealthRing = ({ analytics }) => {
  if (!analytics) return null;

  const { paymentStats, totalInvoices } = analytics;
  const total = paymentStats.paid + paymentStats.partial + paymentStats.unpaid + paymentStats.overdue;

  const segments = [
    { label: 'Paid', count: paymentStats.paid, color: '#10b981', bgColor: 'bg-emerald-500' },
    { label: 'Partial', count: paymentStats.partial, color: '#f59e0b', bgColor: 'bg-amber-500' },
    { label: 'Unpaid', count: paymentStats.unpaid, color: '#6366f1', bgColor: 'bg-indigo-500' },
    { label: 'Overdue', count: paymentStats.overdue, color: '#ef4444', bgColor: 'bg-red-500' },
  ];

  // SVG ring params
  const size = 140;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  return (
    <div className="bg-bg-surface rounded-3xl p-6 shadow-lg border border-slate-100">
      <h3 className="text-lg font-bold text-text-title mb-1">Payment Health</h3>
      <p className="text-text-desc text-sm mb-5">Status distribution</p>

      {total === 0 ? (
        <div className="flex items-center justify-center h-40 text-text-desc text-sm">No payment data</div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Ring Chart */}
          <div className="relative mb-5">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth}
              />
              {segments.map((seg) => {
                const pct = total > 0 ? (seg.count / total) * 100 : 0;
                const dash = (pct / 100) * circumference;
                const offset = -accumulatedOffset;
                accumulatedOffset += dash;

                if (seg.count === 0) return null;
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
            {/* Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-text-title">{total}</span>
              <span className="text-[10px] text-text-desc font-bold uppercase tracking-wider">Total</span>
            </div>
          </div>

          {/* Legend grid */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {segments.map(seg => {
              const pct = total > 0 ? ((seg.count / total) * 100).toFixed(0) : 0;
              return (
                <div key={seg.label} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full ${seg.bgColor}`} />
                  <div className="flex flex-col">
                    <span className="text-xs text-text-desc font-medium">{seg.label}</span>
                    <span className="text-sm font-bold text-text-title">{seg.count} <span className="text-[10px] text-text-desc">({pct}%)</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHealthRing;
