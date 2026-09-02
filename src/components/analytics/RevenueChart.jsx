import React from 'react';
import { formatINR } from '@/hooks/useAnalyticsEngine';

const RevenueTooltip = ({ value, count, growth, label }) => (
  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none">
    <div className="bg-gray-900 text-white text-xs rounded-xl py-2.5 px-3.5 shadow-2xl flex flex-col items-center gap-1 min-w-[120px]">
      <span className="text-gray-400 font-medium text-[10px] uppercase tracking-wider">{label}</span>
      <span className="text-lg font-bold">{formatINR(value)}</span>
      <div className="flex items-center gap-2 text-[10px] text-gray-300 w-full justify-between pt-1 border-t border-gray-700 mt-1">
        <span>{count} inv.</span>
        {growth !== 0 && (
          <span className={growth > 0 ? 'text-emerald-400' : 'text-red-400'}>
            {growth > 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(0)}%
          </span>
        )}
      </div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
    </div>
  </div>
);

const ChartBar = ({ label, value, maxValue, colorStart, colorEnd, count, growth, delay }) => {
  const height = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 6 : 0) : 0;

  return (
    <div className="flex flex-col items-center flex-1 group min-w-[28px] sm:min-w-[48px] h-full justify-end relative">
      {/* Vertical hover line */}
      <div className="absolute bottom-0 w-px h-full bg-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity z-0 top-0" />

      <div className="relative w-full h-full flex items-end justify-center z-10 px-0.5 sm:px-1.5">
        <RevenueTooltip value={value} count={count} growth={growth} label={label} />
        <div
          className={`w-full rounded-t-lg bg-gradient-to-t ${colorStart} ${colorEnd} transition-all duration-700 ease-out shadow-sm group-hover:shadow-lg group-hover:brightness-110 relative overflow-hidden`}
          style={{ height: `${height}%`, transitionDelay: `${delay}ms` }}
        >
          {/* Glass shine */}
          <div className="absolute top-0 left-0 w-full h-1/3 bg-white opacity-20 transform -skew-y-12" />
        </div>
      </div>

      <div className="mt-2.5 text-[10px] sm:text-xs text-text-desc font-semibold group-hover:text-text-title transition-colors">
        {label}
      </div>
    </div>
  );
};

const RevenueChart = ({ analytics, activeTab }) => {
  if (!analytics) return null;

  const { monthlyTrends, maxMonthlyRevenue, averageMonthlyRevenue } = analytics;

  const getGradient = () => {
    if (activeTab === 'gst-bills') return { start: 'from-blue-500', end: 'to-cyan-400' };
    if (activeTab === 'quotations') return { start: 'from-purple-500', end: 'to-pink-400' };
    if (activeTab === 'dc-bills') return { start: 'from-rose-500', end: 'to-orange-400' };
    if (activeTab === 'slip-bills') return { start: 'from-amber-500', end: 'to-yellow-400' };
    return { start: 'from-indigo-600', end: 'to-blue-400' };
  };
  const gradient = getGradient();

  // Y-axis labels
  const yAxisSteps = 4;
  const yLabels = [];
  for (let i = yAxisSteps; i >= 0; i--) {
    yLabels.push(Math.round((maxMonthlyRevenue / yAxisSteps) * i));
  }

  return (
    <div className="bg-bg-surface rounded-3xl p-6 md:p-8 shadow-lg border border-slate-100 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-text-title">Revenue Flow</h3>
          <p className="text-text-desc text-sm mt-0.5">Monthly performance · Last 12 months</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-text-title">
            {formatINR(isNaN(averageMonthlyRevenue) ? 0 : averageMonthlyRevenue)}
          </div>
          <div className="text-[10px] text-text-desc font-bold uppercase tracking-widest">Avg. Monthly</div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex gap-0">
        {/* Y-axis */}
        <div className="hidden sm:flex flex-col justify-between pr-3 py-1" style={{ height: '280px' }}>
          {yLabels.map((label, i) => (
            <span key={i} className="text-[10px] text-text-desc font-medium text-right w-16 leading-none">
              {label > 1000 ? `₹${(label / 1000).toFixed(0)}K` : `₹${label}`}
            </span>
          ))}
        </div>

        {/* Bars area */}
        <div className="flex-1 relative" style={{ height: '280px' }}>
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-px bg-slate-100 border-t border-dashed border-slate-100" />
            ))}
          </div>

          {/* Average line */}
          {averageMonthlyRevenue > 0 && maxMonthlyRevenue > 0 && (
            <div
              className="absolute w-full border-t-2 border-dashed border-indigo-200 z-0"
              style={{ bottom: `${Math.min((averageMonthlyRevenue / maxMonthlyRevenue) * 100, 100)}%` }}
            >
              <div className="absolute -top-3 right-0 text-[9px] bg-indigo-50 px-1.5 py-0.5 rounded-md text-indigo-500 font-bold">AVG</div>
            </div>
          )}

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-between gap-1 sm:gap-2">
            {(monthlyTrends || []).map((trend, index) => (
              <ChartBar
                key={index}
                label={trend.month}
                value={trend.revenue}
                maxValue={maxMonthlyRevenue}
                colorStart={gradient.start}
                colorEnd={gradient.end}
                count={trend.invoices}
                growth={trend.growth}
                delay={index * 40}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;
