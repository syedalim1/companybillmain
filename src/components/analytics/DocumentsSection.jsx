import React, { useState, useEffect } from 'react';
import { formatINR, safeDate, safeNum } from '@/hooks/useAnalyticsEngine';

const DocumentsSection = ({ analytics, filters, onFilterChange }) => {
  if (!analytics) return null;
  const [subTab, setSubTab] = useState('quotation');

  const quotationStats = analytics.quotationStats || { count: 0, totalValue: 0, withGSTCount: 0, withGSTValue: 0, withoutGSTCount: 0, withoutGSTValue: 0, avgValue: 0 };
  const dcStats = analytics.dcStats || { count: 0, pending: 0, inTransit: 0, delivered: 0, returned: 0, overdueDCsCount: 0, overdueDCs: [] };
  const slipStats = analytics.slipStats || { count: 0, totalValue: 0, avgValue: 0, paidCount: 0, unpaidCount: 0 };
  const filteredInvoices = analytics.filteredInvoices || [];

  // Automatically sync subTab if user selected a specific docType in the global FilterBar
  useEffect(() => {
    if (filters?.docType && ['quotation', 'dc-bill', 'slip-bill'].includes(filters.docType)) {
      setSubTab(filters.docType);
    }
  }, [filters?.docType]);

  const tabs = [
    { key: 'quotation', label: 'Quotations', count: quotationStats.count || 0 },
    { key: 'dc-bill', label: 'Delivery Challans', count: dcStats.count || 0 },
    { key: 'slip-bill', label: 'Slip Bills', count: slipStats.count || 0 },
  ];

  // Only show tabs that have data — keeps UI clean and avoids empty tab confusion
  const visibleTabs = tabs.filter(t => t.count > 0);

  // If global filter is set to docType, show matching records; otherwise filter by subTab
  const docs = filteredInvoices.filter(inv => {
    if (filters?.docType && filters.docType !== 'all') {
      return inv.mode === filters.docType;
    }
    return inv.mode === subTab;
  }).sort((a, b) => {
    const da = safeDate(a.createdAt) || safeDate(a.date) || new Date(0);
    const db = safeDate(b.createdAt) || safeDate(b.date) || new Date(0);
    return db.getTime() - da.getTime();
  });

  const activeSubTab = (filters?.docType && filters.docType !== 'all' && ['quotation', 'dc-bill', 'slip-bill'].includes(filters.docType)) ? filters.docType : subTab;

  // If no document types have any records, show a clean empty state
  if (visibleTabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-text-title mb-1">No Supplementary Documents</h4>
        <p className="text-xs text-text-desc max-w-xs">Quotations, Delivery Challans, and Slip Bills will appear here once created.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation — only shows tabs with data */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit flex-wrap gap-1">
        {visibleTabs.map(t => (
          <button key={t.key} onClick={() => {
            setSubTab(t.key);
            if (onFilterChange && filters?.docType !== 'all') {
              onFilterChange('docType', 'all');
            }
          }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === t.key ? 'bg-white text-text-title shadow-sm' : 'text-text-desc hover:text-text-body'
            }`}>
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-lg ${activeSubTab === t.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-text-desc'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Quotation Intelligence */}
      {activeSubTab === 'quotation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Quotations', value: quotationStats.count || 0 },
              { label: 'Total Quoted Value', value: formatINR(quotationStats.totalValue) },
              { label: 'With GST Option', value: `${quotationStats.withGSTCount || 0} (${formatINR(quotationStats.withGSTValue)})` },
              { label: 'Without GST Option', value: `${quotationStats.withoutGSTCount || 0} (${formatINR(quotationStats.withoutGSTValue)})` },
            ].map((m, i) => (
              <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-lg font-extrabold text-text-title">{m.value}</p>
              </div>
            ))}
          </div>

          {quotationStats.count > 0 && (
            <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-text-title mb-3">Quotation GST Structure Split</h4>
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100">
                {quotationStats.withGSTCount > 0 && (
                  <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(quotationStats.withGSTCount / quotationStats.count) * 100}%` }} title="With GST" />
                )}
                {quotationStats.withoutGSTCount > 0 && (
                  <div className="h-full bg-slate-300 transition-all" style={{ width: `${(quotationStats.withoutGSTCount / quotationStats.count) * 100}%` }} title="Without GST" />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-text-desc mt-2">
                <span>With GST: {quotationStats.withGSTCount} ({quotationStats.count > 0 ? ((quotationStats.withGSTCount / quotationStats.count) * 100).toFixed(0) : 0}%)</span>
                <span>Without GST: {quotationStats.withoutGSTCount} ({quotationStats.count > 0 ? ((quotationStats.withoutGSTCount / quotationStats.count) * 100).toFixed(0) : 0}%)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delivery Challan Intelligence */}
      {activeSubTab === 'dc-bill' && (
        <div className="space-y-4">
          {/* Overdue DC Alert Banner */}
          {(dcStats.overdueDCsCount || 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">🚚</span>
                <div>
                  <h5 className="text-xs font-bold text-amber-900">Overdue Delivery Challans Alert</h5>
                  <p className="text-[11px] text-amber-700">{dcStats.overdueDCsCount} delivery challan(s) have been pending for &gt;14 days without return/delivery confirmation</p>
                </div>
              </div>
              <span className="text-xs font-extrabold bg-amber-200 text-amber-900 px-3 py-1 rounded-xl">{dcStats.overdueDCsCount} Overdue</span>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total DCs', value: dcStats.count || 0 },
              { label: 'Pending Return', value: dcStats.pending || 0 },
              { label: 'In Transit', value: dcStats.inTransit || 0 },
              { label: 'Delivered', value: dcStats.delivered || 0 },
              { label: 'Returned', value: dcStats.returned || 0 },
            ].map((m, i) => (
              <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-xl font-extrabold text-text-title">{m.value}</p>
              </div>
            ))}
          </div>

          {dcStats.count > 0 && (
            <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-text-title mb-3">Delivery Status Proportions</h4>
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100">
                {[
                  { count: dcStats.pending || 0, color: '#6366f1', label: 'Pending' },
                  { count: dcStats.inTransit || 0, color: '#f59e0b', label: 'In Transit' },
                  { count: dcStats.delivered || 0, color: '#10b981', label: 'Delivered' },
                  { count: dcStats.returned || 0, color: '#ef4444', label: 'Returned' },
                ].map(s => s.count > 0 && (
                  <div key={s.label} className="h-full transition-all" style={{ width: `${(s.count / dcStats.count) * 100}%`, backgroundColor: s.color }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-[10px] text-text-desc mt-2">
                {[
                  { label: 'Pending', count: dcStats.pending || 0, color: '#6366f1' },
                  { label: 'In Transit', count: dcStats.inTransit || 0, color: '#f59e0b' },
                  { label: 'Delivered', count: dcStats.delivered || 0, color: '#10b981' },
                  { label: 'Returned', count: dcStats.returned || 0, color: '#ef4444' },
                ].map(s => (
                  <span key={s.label} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />{s.label}: {s.count}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slip Bill Intelligence */}
      {activeSubTab === 'slip-bill' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Slips', value: slipStats.count || 0 },
              { label: 'Total Value', value: formatINR(slipStats.totalValue) },
              { label: 'Average Slip Value', value: formatINR(slipStats.avgValue) },
              { label: 'Paid / Unpaid', value: `${slipStats.paidCount || 0} / ${slipStats.unpaidCount || 0}` },
            ].map((m, i) => (
              <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-lg font-extrabold text-text-title">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Records List */}
      <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
        <h4 className="text-sm font-bold text-text-title mb-3">
          {tabs.find(t => t.key === activeSubTab)?.label} Records ({docs.length})
        </h4>
        {docs.length === 0 ? (
          <p className="text-xs text-text-desc text-center py-8">No documents found matching current filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-text-desc uppercase">Doc No.</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-text-desc uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-text-desc uppercase">Customer</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-text-desc uppercase">Amount</th>
                  <th className="px-3 py-2 text-center text-[10px] font-bold text-text-desc uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {docs.slice(0, 25).map((inv, i) => {
                  const d = safeDate(inv.date);
                  const docNo = inv.mode === 'dc-bill' ? (inv.dcNo || inv.invoiceNo) : (inv.invoiceNo || inv.quotationNo || inv.id || i + 1);
                  const status = inv.mode === 'dc-bill' ? (inv.dcStatus || 'pending') : (inv.paymentStatus || 'unpaid');
                  const statusColors = {
                    paid: 'bg-emerald-100 text-emerald-700',
                    partial: 'bg-amber-100 text-amber-700',
                    unpaid: 'bg-slate-100 text-slate-600',
                    overdue: 'bg-red-100 text-red-700',
                    pending: 'bg-indigo-100 text-indigo-700',
                    'in-transit': 'bg-amber-100 text-amber-700',
                    delivered: 'bg-emerald-100 text-emerald-700',
                    returned: 'bg-red-100 text-red-700',
                  };
                  return (
                    <tr key={inv.id || i} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 font-bold text-text-title">#{docNo}</td>
                      <td className="px-3 py-2.5 text-text-desc">{d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</td>
                      <td className="px-3 py-2.5 text-text-body truncate max-w-[200px]">{inv.buyerName || inv.buyer?.name || '—'}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-text-title">{formatINR(safeNum(inv.grandTotal))}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold capitalize ${statusColors[status] || 'bg-slate-100 text-slate-600'}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {docs.length > 25 && <p className="text-[10px] text-text-desc text-center mt-3">Showing first 25 of {docs.length} records</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsSection;
