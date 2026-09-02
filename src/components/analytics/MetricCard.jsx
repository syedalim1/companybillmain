import React from 'react';

const MetricCard = ({ title, value, subtitle, icon, color = 'indigo', trend, sparkData }) => {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', gradient: 'from-indigo-500 to-indigo-600', spark: '#6366f1' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', gradient: 'from-purple-500 to-purple-600', spark: '#a855f7' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', gradient: 'from-emerald-500 to-emerald-600', spark: '#10b981' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', gradient: 'from-red-500 to-red-600', spark: '#ef4444' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', gradient: 'from-blue-500 to-blue-600', spark: '#3b82f6' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', gradient: 'from-amber-500 to-amber-600', spark: '#f59e0b' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', gradient: 'from-rose-500 to-rose-600', spark: '#f43f5e' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', gradient: 'from-cyan-500 to-cyan-600', spark: '#06b6d4' },
  };
  const c = colorMap[color] || colorMap.indigo;

  // Mini sparkline SVG
  const renderSparkline = () => {
    if (!sparkData || sparkData.length < 2) return null;
    const max = Math.max(...sparkData, 1);
    const width = 80;
    const height = 28;
    const points = sparkData.map((val, i) => {
      const x = (i / (sparkData.length - 1)) * width;
      const y = height - (val / max) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="opacity-40 group-hover:opacity-70 transition-opacity">
        <polyline
          points={points}
          fill="none"
          stroke={c.spark}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className={`bg-bg-surface p-5 rounded-2xl shadow-sm border ${c.border} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group`}>
      {/* Background watermark icon */}
      <div className="absolute -right-3 -bottom-3 opacity-[0.04] transform rotate-12 scale-[2] pointer-events-none group-hover:scale-[1.8] transition-transform duration-500">
        {icon}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <h4 className="text-[11px] font-bold text-text-desc uppercase tracking-widest">{title}</h4>
        <div className={`p-2 ${c.bg} rounded-xl`}>{icon}</div>
      </div>

      {/* Value */}
      <div className="relative z-10">
        <p className="text-2xl sm:text-3xl font-extrabold text-text-title tracking-tight leading-none">{value}</p>
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-2">
            {trend !== undefined && trend !== null && (
              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                trend > 0 ? 'bg-emerald-100 text-emerald-700' : trend < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            <span className={`text-xs ${c.text} font-medium`}>{subtitle}</span>
          </div>
          {renderSparkline()}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
