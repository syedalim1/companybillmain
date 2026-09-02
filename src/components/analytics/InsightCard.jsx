import React from 'react';

const InsightCard = ({ insight }) => {
  const typeStyles = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: '🔴', label: 'text-red-700', badge: 'bg-red-100 text-red-800' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '🟡', label: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '🟢', label: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔵', label: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  };
  const s = typeStyles[insight.type] || typeStyles.info;

  return (
    <div className={`${s.bg} ${s.border} border rounded-xl p-4 flex items-start gap-3 hover:shadow-sm transition-shadow`}>
      <span className="text-lg mt-0.5 shrink-0">{s.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm font-bold ${s.label}`}>{insight.title}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${s.badge}`}>{insight.area}</span>
        </div>
        <p className="text-xs text-text-body leading-relaxed">{insight.description}</p>
        {insight.metric && <p className={`text-sm font-extrabold ${s.label} mt-1`}>{insight.metric}</p>}
      </div>
    </div>
  );
};

export const ComparisonRow = ({ label, current, previous, change, pctChange, trend, formatter = v => v }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs font-medium text-text-desc">{label}</span>
    <div className="flex items-center gap-4">
      <span className="text-sm font-bold text-text-title">{formatter(current)}</span>
      <span className="text-xs text-text-desc">{formatter(previous)}</span>
      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${
        pctChange > 0 ? 'bg-emerald-100 text-emerald-700' : pctChange < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
      }`}>
        {pctChange > 0 ? '↑' : pctChange < 0 ? '↓' : '—'} {Math.abs(pctChange).toFixed(1)}%
      </span>
    </div>
  </div>
);

export default InsightCard;
