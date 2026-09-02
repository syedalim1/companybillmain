import React from 'react';
import { formatINR } from '@/hooks/useAnalyticsEngine';

const SalesSection = ({ analytics }) => {
  if (!analytics) return null;
  const { monthlyTrends, quarterlyData, stateData, summary } = analytics;
  const maxRev = Math.max(...monthlyTrends.map(m => m.revenue), 1);
  const activeMonths = monthlyTrends.filter(m => m.revenue > 0).length || 1;
  const avgMonthly = summary.totalRevenue / activeMonths;
  const maxState = stateData.length > 0 ? stateData[0].revenue : 1;

  const stateColors = ['#6366f1','#a855f7','#3b82f6','#06b6d4','#10b981','#f59e0b','#f97316','#ef4444','#ec4899','#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Billed', value: formatINR(summary.totalRevenue), sub: `${summary.invoiceCount} invoices` },
          { label: 'Taxable Value', value: formatINR(summary.totalSubtotal), sub: 'Before tax' },
          { label: 'Avg Monthly', value: formatINR(avgMonthly), sub: `${activeMonths} active months` },
          { label: 'Avg Invoice', value: formatINR(summary.avgInvoiceValue), sub: 'Per document' },
        ].map((m, i) => (
          <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-xl font-extrabold text-text-title">{m.value}</p>
            <p className="text-[11px] text-text-desc mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart (full) */}
      <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h4 className="text-base font-bold text-text-title">Monthly Revenue</h4>
            <p className="text-xs text-text-desc mt-0.5">Last 12 months performance</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold text-text-title">{formatINR(avgMonthly)}</p>
            <p className="text-[10px] text-text-desc font-bold uppercase tracking-wider">Avg Monthly</p>
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-52">
          {monthlyTrends.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-[10px] rounded-lg py-2 px-3 whitespace-nowrap shadow-xl text-center">
                  <div className="text-gray-400 text-[9px] uppercase">{m.fullMonth}</div>
                  <div className="font-bold text-sm mt-0.5">{formatINR(m.revenue)}</div>
                  <div className="text-gray-400 mt-0.5">{m.count} invoices</div>
                  {m.growth !== 0 && (
                    <div className={`mt-0.5 ${m.growth > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.growth > 0 ? '↑' : '↓'} {Math.abs(m.growth).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
              {/* Bar */}
              <div className="w-full px-0.5">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all duration-500 relative overflow-hidden"
                  style={{ height: `${maxRev > 0 ? Math.max((m.revenue / maxRev) * 100, m.revenue > 0 ? 4 : 0) : 0}%` }}>
                  <div className="absolute top-0 left-0 w-full h-1/3 bg-white opacity-15 -skew-y-12" />
                </div>
              </div>
              {/* Growth indicator */}
              {m.growth !== 0 && (
                <div className={`text-[8px] font-bold mt-0.5 ${m.growth > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {m.growth > 0 ? '↑' : '↓'}{Math.abs(m.growth).toFixed(0)}%
                </div>
              )}
              <span className="text-[9px] text-text-desc font-semibold mt-0.5 group-hover:text-text-title">{m.month}</span>
            </div>
          ))}
        </div>
        {/* Average line indicator */}
        {avgMonthly > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[10px] text-text-desc">
            <div className="w-6 border-t-2 border-dashed border-indigo-300" />
            <span>Average: {formatINR(avgMonthly)}</span>
          </div>
        )}
      </div>

      {/* Quarterly + State-wise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quarterly Comparison */}
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-base font-bold text-text-title mb-1">Quarterly Comparison</h4>
          <p className="text-xs text-text-desc mb-4">{quarterlyData.currentYear} vs {quarterlyData.previousYear}</p>
          <div className="space-y-4">
            {quarterlyData.current.map((q, i) => {
              const prev = quarterlyData.previous[i];
              const maxQ = quarterlyData.max;
              const growth = prev.revenue > 0 ? ((q.revenue - prev.revenue) / prev.revenue * 100) : (q.revenue > 0 ? 100 : 0);
              return (
                <div key={q.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-text-title">{q.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-title">{formatINR(q.revenue)}</span>
                      {growth !== 0 && (
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${growth > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {growth > 0 ? '↑' : '↓'}{Math.abs(growth).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 h-3">
                    <div className="flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${maxQ > 0 ? (q.revenue / maxQ) * 100 : 0}%` }} />
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-200 transition-all duration-500" style={{ width: `${maxQ > 0 ? (prev.revenue / maxQ) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] text-text-desc mt-0.5">
                    <span>{quarterlyData.currentYear}: {q.count} inv.</span>
                    <span>{quarterlyData.previousYear}: {formatINR(prev.revenue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 text-[10px]">
            <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded bg-indigo-500" /><span className="text-text-desc">{quarterlyData.currentYear}</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded bg-indigo-200" /><span className="text-text-desc">{quarterlyData.previousYear}</span></div>
          </div>
        </div>

        {/* State-wise Revenue */}
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-base font-bold text-text-title mb-1">Revenue by State</h4>
          <p className="text-xs text-text-desc mb-4">Geographic distribution</p>
          {stateData.length === 0 ? (
            <p className="text-xs text-text-desc text-center py-8">No state data</p>
          ) : (
            <div className="space-y-3">
              {stateData.slice(0, 8).map((s, i) => (
                <div key={s.state} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: stateColors[i % stateColors.length] }} />
                      <span className="text-xs font-semibold text-text-body truncate max-w-[140px]">{s.state}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-desc">{s.count} inv.</span>
                      <span className="text-xs font-bold text-text-title">{formatINR(s.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                      style={{ width: `${maxState > 0 ? (s.revenue / maxState) * 100 : 0}%`, backgroundColor: stateColors[i % stateColors.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesSection;
