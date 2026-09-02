import React from 'react';
import MetricCard from './MetricCard';
import { formatINR } from '@/hooks/useAnalyticsEngine';

const MetricsGrid = ({ analytics }) => {
  if (!analytics) return null;

  // Build sparkline data from monthly trends
  const revenueSparkData = (analytics.monthlyTrends || []).map(m => m.revenue);
  const gstSparkData = (analytics.monthlyTrends || []).map(m => m.gst);
  const invoiceCountSpark = (analytics.monthlyTrends || []).map(m => m.invoices);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <MetricCard
        title="Total Revenue"
        value={formatINR(analytics.totalRevenue)}
        subtitle={`${analytics.totalInvoices} invoices`}
        color="indigo"
        trend={analytics.yoyGrowth || null}
        sparkData={revenueSparkData}
        icon={
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <MetricCard
        title="GST Liability"
        value={formatINR(analytics.totalGST)}
        subtitle="Tax collected"
        color="purple"
        sparkData={gstSparkData}
        icon={
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
          </svg>
        }
      />
      <MetricCard
        title="Collections"
        value={formatINR(analytics.totalCollected)}
        subtitle={`${analytics.paymentStats.paid} fully paid`}
        color="green"
        icon={
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <MetricCard
        title="Outstanding"
        value={formatINR(analytics.pendingAmount)}
        subtitle={`${analytics.paymentStats.unpaid + analytics.paymentStats.overdue} pending`}
        color="red"
        icon={
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <MetricCard
        title="Avg Invoice"
        value={formatINR(analytics.avgInvoiceValue)}
        subtitle="Per document"
        color="blue"
        sparkData={invoiceCountSpark}
        icon={
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        }
      />
      <MetricCard
        title="Collection Rate"
        value={`${analytics.collectionEfficiency.toFixed(1)}%`}
        subtitle="Efficiency score"
        color={analytics.collectionEfficiency >= 75 ? 'green' : analytics.collectionEfficiency >= 50 ? 'amber' : 'red'}
        icon={
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
    </div>
  );
};

export default MetricsGrid;
