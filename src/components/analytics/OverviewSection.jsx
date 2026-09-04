import React, { useState } from 'react';
import MetricCard from './MetricCard';
import InsightCard, { ComparisonRow } from './InsightCard';
import { formatINR, safeDate } from '@/hooks/useAnalyticsEngine';

const OverviewSection = ({ analytics, onFilterChange }) => {
  if (!analytics) return null;
  const { summary, runRate, comparison, monthlyTrends, documentMix, recentActivity, insights, dataQuality } = analytics;
  const [dismissFuture, setDismissFuture] = useState(false);
  const [dismissGstin, setDismissGstin] = useState(false);

  const revSpark = monthlyTrends.map(m => m.revenue);
  const colSpark = monthlyTrends.map(m => m.collected);
  const maxRev = Math.max(...monthlyTrends.map(m => m.revenue), 1);

  // Compute MoM trend: compare last 2 completed months in trends (skip current in-progress month)
  const now = new Date();
  const completedTrends = monthlyTrends.filter(m => {
    // A month is "completed" if it's not the current ongoing month
    const isCurrentMonth = m.monthIndex === now.getUTCMonth() && m.year === now.getUTCFullYear();
    return !isCurrentMonth && m.revenue > 0;
  });
  const momGrowth = completedTrends.length >= 2
    ? ((completedTrends[completedTrends.length - 1].revenue - completedTrends[completedTrends.length - 2].revenue)
        / Math.max(1, completedTrends[completedTrends.length - 2].revenue)) * 100
    : null;

  return (
    <div className="space-y-6">
      {/* Data Quality Alerts — dismissable banners */}
      {dataQuality?.futureDatedCount > 0 && !dismissFuture && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-base">⚠️</span>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {dataQuality.futureDatedCount} invoice{dataQuality.futureDatedCount !== 1 ? 's' : ''} ha{dataQuality.futureDatedCount !== 1 ? 've' : 's'} future dates and {dataQuality.futureDatedCount !== 1 ? 'are' : 'is'} excluded from Revenue Flow charts.
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5">Check invoices: {dataQuality.futureDatedInvoices.slice(0, 3).map(i => i.invoiceNo || i.id).join(', ')}{dataQuality.futureDatedCount > 3 ? ` +${dataQuality.futureDatedCount - 3} more` : ''}</p>
            </div>
          </div>
          <button onClick={() => setDismissFuture(true)} className="text-amber-600 hover:text-amber-900 text-xs font-bold shrink-0 px-2">✕</button>
        </div>
      )}

      {dataQuality?.missingGstinCount > 0 && !dismissGstin && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-200 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-base">ℹ️</span>
            <div>
              <p className="text-xs font-bold text-blue-900">
                {dataQuality.missingGstinCount} GST invoice customer{dataQuality.missingGstinCount !== 1 ? 's' : ''} missing GSTIN — may affect GSTR-1 B2B filing.
              </p>
              <p className="text-[10px] text-blue-700 mt-0.5">Customers: {dataQuality.missingGstinCustomers.slice(0, 3).map(c => c.name).join(', ')}{dataQuality.missingGstinCount > 3 ? ` +${dataQuality.missingGstinCount - 3} more` : ''}</p>
            </div>
          </div>
          <button onClick={() => setDismissGstin(true)} className="text-blue-600 hover:text-blue-900 text-xs font-bold shrink-0 px-2">✕</button>
        </div>
      )}

      {/* Top Insights & Alerts */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.slice(0, 3).map((insight, i) => <InsightCard key={i} insight={insight} />)}
        </div>
      )}

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Revenue with MoM badge */}
        <div className="relative">
          <MetricCard
            title="Total Revenue"
            value={formatINR(summary.totalRevenue)}
            subtitle={`${summary.invoiceCount} invoices`}
            color="indigo"
            sparkData={revSpark}
            trend={comparison?.revenue?.pctChange}
            icon={<svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          {momGrowth !== null && (
            <div className={`absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] font-extrabold ${
              momGrowth >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              <span>{momGrowth >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(momGrowth).toFixed(1)}%</span>
              <span className="font-normal text-[8px] ml-0.5">MoM</span>
            </div>
          )}
        </div>
        <MetricCard
          title="GST Liability"
          value={formatINR(analytics.gstBreakdown.total)}
          subtitle="Tax liability"
          color="purple"
          icon={<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>}
        />
        <MetricCard
          title="Collections"
          value={formatINR(summary.totalCollected)}
          subtitle={`${summary.paymentStats.paid} paid`}
          color="green"
          sparkData={colSpark}
          icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard
          title="Outstanding"
          value={formatINR(summary.totalOutstanding)}
          subtitle={`${summary.paymentStats.unpaid + summary.paymentStats.overdue} pending`}
          color="red"
          icon={<svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard
          title="DSO (Days Sales)"
          value={`${summary.dso} days`}
          subtitle="Collection speed"
          color={summary.dso <= 45 ? 'blue' : 'amber'}
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <MetricCard
          title="Collection Rate"
          value={`${summary.collectionRate.toFixed(1)}%`}
          subtitle="Efficiency"
          color={summary.collectionRate >= 75 ? 'green' : summary.collectionRate >= 50 ? 'amber' : 'red'}
          icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />
      </div>

      {/* Month-End Run Rate & Forecast */}
      {runRate && runRate.mtdRevenue > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Pace Forecast</span>
                <span className="text-xs text-slate-400">Day {runRate.currentDay} of {runRate.totalDaysInMonth} ({runRate.progressPct}% elapsed)</span>
              </div>
              <h4 className="text-lg font-bold">Month-End Sales Projection</h4>
              <p className="text-xs text-slate-300 mt-0.5">Based on current MTD run-rate of <span className="font-bold text-white">{formatINR(runRate.dailyAverage)}</span>/day</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-slate-400 font-semibold uppercase">MTD Billed</p>
                <p className="text-xl font-extrabold text-indigo-300">{formatINR(runRate.mtdRevenue)}</p>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-right">
                <p className="text-xs text-slate-400 font-semibold uppercase">Projected Month-End</p>
                <p className="text-2xl font-extrabold text-emerald-400">{formatINR(runRate.projectedMonthEnd)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Period Comparison */}
      {comparison && (
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            <h4 className="text-sm font-bold text-text-title">vs {comparison.label}</h4>
            <div className="flex gap-4 ml-auto text-[10px] text-text-desc font-medium">
              <span>Current</span><span>Previous</span><span>Change</span>
            </div>
          </div>
          <ComparisonRow label="Revenue" {...comparison.revenue} formatter={formatINR} />
          <ComparisonRow label="GST" {...comparison.gst} formatter={formatINR} />
          <ComparisonRow label="Collected" {...comparison.collected} formatter={formatINR} />
          <ComparisonRow label="Outstanding" {...comparison.outstanding} formatter={formatINR} />
          <ComparisonRow label="Invoices" {...comparison.invoiceCount} formatter={v => v} />
        </div>
      )}

      {/* Revenue Mini-Chart + Document Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend mini-chart */}
        <div className="lg:col-span-2 bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-text-title">Revenue Trend (12 Months)</h4>
            <span className="text-[10px] text-text-desc font-medium">Click a bar to filter by month</span>
          </div>
          <div className="flex items-end gap-1 h-36">
            {monthlyTrends.map((m, i) => (
              <div
                key={i}
                onClick={() => onFilterChange && onFilterChange('month', m.monthIndex + 1)}
                className="flex-1 flex flex-col items-center group relative cursor-pointer"
              >
                <div className="w-full flex items-end justify-center h-28">
                  <div
                    className="w-full max-w-[32px] rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500 hover:brightness-110"
                    style={{ height: `${maxRev > 0 ? Math.max((m.revenue / maxRev) * 100, m.revenue > 0 ? 6 : 0) : 0}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      <div className="bg-gray-900 text-white text-[10px] rounded-lg py-1.5 px-2 whitespace-nowrap shadow-xl text-center">
                        <div className="font-bold">{formatINR(m.revenue)}</div>
                        <div className="text-gray-400">{m.count} inv. {m.growth !== 0 ? `(${m.growth > 0 ? '+' : ''}${m.growth.toFixed(0)}%)` : ''}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-[9px] text-text-desc font-medium mt-1 group-hover:text-indigo-600 font-semibold">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Document Mix */}
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-sm font-bold text-text-title mb-1">Document Mix</h4>
          <p className="text-xs text-text-desc mb-4">{documentMix.total} total documents</p>
          {documentMix.total === 0 ? (
            <p className="text-xs text-text-desc text-center py-6">No documents</p>
          ) : (
            <>
              <div className="h-3 w-full rounded-full overflow-hidden flex mb-4 bg-slate-100">
                {documentMix.types.map(t => t.count > 0 && (
                  <div key={t.key} className="h-full transition-all duration-500" style={{ width: `${t.pct}%`, backgroundColor: t.color }} />
                ))}
              </div>
              <div className="space-y-2">
                {documentMix.types.map(t => (
                  <div
                    key={t.key}
                    onClick={() => onFilterChange && onFilterChange('docType', t.key)}
                    className="flex items-center justify-between text-xs cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: t.color }} />
                      <span className="font-medium text-text-body">{t.label}</span>
                    </div>
                    <span className="font-bold text-text-title">{t.count} <span className="text-text-desc font-medium">({t.pct.toFixed(0)}%)</span></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-sm font-bold text-text-title mb-4">Recent Documents</h4>
          <div className="space-y-2">
            {recentActivity.slice(0, 8).map((a, i) => {
              const modeLabel = { 'gst-bill': 'GST', quotation: 'Quote', 'dc-bill': 'DC', 'slip-bill': 'Slip' }[a.mode] || a.mode;
              const modeColor = { 'gst-bill': 'bg-indigo-100 text-indigo-700', quotation: 'bg-purple-100 text-purple-700', 'dc-bill': 'bg-rose-100 text-rose-700', 'slip-bill': 'bg-amber-100 text-amber-700' }[a.mode] || 'bg-slate-100 text-slate-700';
              const statusColor = { paid: 'text-emerald-600', partial: 'text-amber-600', unpaid: 'text-slate-500', overdue: 'text-red-600' }[a.paymentStatus] || 'text-slate-500';
              const d = safeDate(a.date);
              return (
                <div key={a.id || i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${modeColor} shrink-0`}>{modeLabel}</span>
                    <span className="text-xs font-bold text-text-title shrink-0">#{a.documentNo}</span>
                    <span className="text-xs text-text-desc truncate">{a.buyerName}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-bold capitalize ${statusColor}`}>{a.paymentStatus}</span>
                    <span className="text-sm font-bold text-text-title">{formatINR(a.grandTotal)}</span>
                    <span className="text-[10px] text-text-desc">{d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
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

export default OverviewSection;
