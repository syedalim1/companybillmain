import React from 'react';
import { formatINR } from '@/hooks/useAnalyticsEngine';

const stateColors = [
  '#6366f1', '#a855f7', '#3b82f6', '#06b6d4', '#10b981',
  '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#8b5cf6',
];

const StateRevenueChart = ({ analytics }) => {
  if (!analytics) return null;

  const { stateData, maxStateRevenue } = analytics;

  return (
    <div className="bg-bg-surface rounded-3xl p-6 shadow-lg border border-slate-100">
      <h3 className="text-lg font-bold text-text-title mb-1">Revenue by State</h3>
      <p className="text-text-desc text-sm mb-5">Geographic business distribution</p>

      {stateData.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-text-desc text-sm">No state data available</div>
      ) : (
        <div className="space-y-3">
          {stateData.map((item, index) => {
            const widthPct = maxStateRevenue > 0 ? Math.max((item.revenue / maxStateRevenue) * 100, 8) : 0;
            const color = stateColors[index % stateColors.length];

            return (
              <div key={item.state} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-xs font-semibold text-text-body truncate max-w-[140px]">{item.state}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-text-desc font-medium">{item.count} inv.</span>
                    <span className="text-sm font-bold text-text-title min-w-[80px] text-right">{formatINR(item.revenue)}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out group-hover:brightness-110"
                    style={{ width: `${widthPct}%`, backgroundColor: color }}
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

export default StateRevenueChart;
