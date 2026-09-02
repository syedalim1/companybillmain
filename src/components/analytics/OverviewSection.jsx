import React from 'react';
import MetricCard from './MetricCard';
import InsightCard, { ComparisonRow } from './InsightCard';
import { formatINR, safeDate } from '@/hooks/useAnalyticsEngine';

const OverviewSection = ({ analytics }) => {
  if (!analytics) return null;
  const { summary, comparison, monthlyTrends, payment, insights, documentMix, recentActivity } = analytics;

  // Sparkline data
  const revSpark = monthlyTrends.map(m => m.revenue);
  const colSpark = monthlyTrends.map(m => m.collected);
  const maxRev = Math.max(...monthlyTrends.map(m => m.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Insights Banner */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.slice(0, 3).map((insight, i) => <InsightCard key={i} insight={insight} />)}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard title="Total Revenue" value={formatINR(summary.totalRevenue)} subtitle={`${summary.invoiceCount} invoices`}
          color="indigo" sparkData={revSpark} trend={comparison?.revenue?.pctChange}
          icon={<svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <MetricCard title="GST Liability" value={formatINR(analytics.gstBreakdown.total)} subtitle="Tax collected"
          color="purple"
          icon={<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>} />
        <MetricCard title="Collected" value={formatINR(summary.totalCollected)} subtitle={`${summary.paymentStats.paid} paid`}
          color="green" sparkData={colSpark}
          icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <MetricCard title="Outstanding" value={formatINR(summary.totalOutstanding)}
          subtitle={`${summary.paymentStats.unpaid + summary.paymentStats.overdue} pending`} color="red"
          icon={<svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <MetricCard title="Avg Invoice" value={formatINR(summary.avgInvoiceValue)} subtitle="Per document" color="blue"
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>} />
        <MetricCard title="Collection Rate" value={`${summary.collectionRate.toFixed(1)}%`} subtitle="Efficiency"
          color={summary.collectionRate >= 75 ? 'green' : summary.collectionRate >= 50 ? 'amber' : 'red'}
          icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
      </div>

      {/* Period Comparison (if active) */}
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
        {/* Revenue trend */}
        <div className="lg:col-span-2 bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-sm font-bold text-text-title mb-4">Revenue Trend (12 Months)</h4>
          <div className="flex items-end gap-1 h-36">
            {monthlyTrends.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div className="w-full flex items-end justify-center h-28">
                  <div className="w-full max-w-[32px] rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500 hover:brightness-110"
                    style={{ height: `${maxRev > 0 ? Math.max((m.revenue / maxRev) * 100, m.revenue > 0 ? 6 : 0) : 0}%` }}>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      <div className="bg-gray-900 text-white text-[10px] rounded-lg py-1.5 px-2 whitespace-nowrap shadow-xl">
                        <div className="font-bold">{formatINR(m.revenue)}</div>
                        <div className="text-gray-400">{m.count} inv. {m.growth !== 0 ? `(${m.growth > 0 ? '+' : ''}${m.growth.toFixed(0)}%)` : ''}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-[9px] text-text-desc font-medium mt-1">{m.month}</span>
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
                  <div key={t.key} className="flex items-center justify-between text-xs">
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
          <h4 className="text-sm font-bold text-text-title mb-4">Recent Activity</h4>
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
