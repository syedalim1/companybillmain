import React, { useState } from 'react';
import { formatINR, safeDate, safeNum } from '@/hooks/useAnalyticsEngine';

const DocumentsSection = ({ analytics }) => {
  if (!analytics) return null;
  const [subTab, setSubTab] = useState('quotation');
  const { quotationStats, dcStats, slipStats, filteredInvoices } = analytics;

  const tabs = [
    { key: 'quotation', label: 'Quotations', count: quotationStats.count, color: 'indigo' },
    { key: 'dc-bill', label: 'Delivery Challans', count: dcStats.count, color: 'rose' },
    { key: 'slip-bill', label: 'Slip Bills', count: slipStats.count, color: 'amber' },
  ];

  // Get documents for active sub-tab
  const docs = filteredInvoices.filter(inv => inv.mode === subTab)
    .sort((a, b) => {
      const da = safeDate(a.createdAt) || safeDate(a.date) || new Date(0);
      const db = safeDate(b.createdAt) || safeDate(b.date) || new Date(0);
      return db - da;
    });

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              subTab === t.key ? 'bg-white text-text-title shadow-sm' : 'text-text-desc hover:text-text-body'
            }`}>
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-lg ${subTab === t.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-text-desc'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Quotation View */}
      {subTab === 'quotation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Quotations', value: quotationStats.count },
              { label: 'Total Value', value: formatINR(quotationStats.totalValue) },
              { label: 'With GST', value: `${quotationStats.withGSTCount} (${formatINR(quotationStats.withGSTValue)})` },
              { label: 'Without GST', value: `${quotationStats.withoutGSTCount} (${formatINR(quotationStats.withoutGSTValue)})` },
            ].map((m,i) => (
              <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-lg font-extrabold text-text-title">{m.value}</p>
              </div>
            ))}
          </div>
          {/* GST Option Split */}
          {quotationStats.count > 0 && (
            <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-text-title mb-3">GST Option Split</h4>
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100">
                {quotationStats.withGSTCount > 0 && (
                  <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(quotationStats.withGSTCount/quotationStats.count)*100}%` }} title="With GST" />
                )}
                {quotationStats.withoutGSTCount > 0 && (
                  <div className="h-full bg-slate-300 transition-all" style={{ width: `${(quotationStats.withoutGSTCount/quotationStats.count)*100}%` }} title="Without GST" />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-text-desc mt-2">
                <span>With GST: {quotationStats.withGSTCount} ({quotationStats.count > 0 ? ((quotationStats.withGSTCount/quotationStats.count)*100).toFixed(0) : 0}%)</span>
                <span>Without GST: {quotationStats.withoutGSTCount} ({quotationStats.count > 0 ? ((quotationStats.withoutGSTCount/quotationStats.count)*100).toFixed(0) : 0}%)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DC View */}
      {subTab === 'dc-bill' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total DCs', value: dcStats.count },
              { label: 'Pending', value: dcStats.pending },
              { label: 'In Transit', value: dcStats.inTransit },
              { label: 'Delivered', value: dcStats.delivered },
              { label: 'Returned', value: dcStats.returned },
            ].map((m,i) => (
              <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-xl font-extrabold text-text-title">{m.value}</p>
              </div>
            ))}
          </div>
          {/* Status distribution bar */}
          {dcStats.count > 0 && (
            <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-text-title mb-3">Delivery Status</h4>
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100">
                {[
                  { count: dcStats.pending, color: '#6366f1', label: 'Pending' },
                  { count: dcStats.inTransit, color: '#f59e0b', label: 'In Transit' },
                  { count: dcStats.delivered, color: '#10b981', label: 'Delivered' },
                  { count: dcStats.returned, color: '#ef4444', label: 'Returned' },
                ].map(s => s.count > 0 && (
                  <div key={s.label} className="h-full transition-all" style={{ width: `${(s.count/dcStats.count)*100}%`, backgroundColor: s.color }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-[10px] text-text-desc mt-2">
                {[
                  { label: 'Pending', count: dcStats.pending, color: '#6366f1' },
                  { label: 'In Transit', count: dcStats.inTransit, color: '#f59e0b' },
                  { label: 'Delivered', count: dcStats.delivered, color: '#10b981' },
                  { label: 'Returned', count: dcStats.returned, color: '#ef4444' },
                ].map(s => (
                  <span key={s.label} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}} />{s.label}: {s.count}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slip Bill View */}
      {subTab === 'slip-bill' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Slips', value: slipStats.count },
              { label: 'Total Value', value: formatINR(slipStats.totalValue) },
              { label: 'Average Value', value: formatINR(slipStats.avgValue) },
              { label: 'Paid / Unpaid', value: `${slipStats.paidCount} / ${slipStats.unpaidCount}` },
            ].map((m,i) => (
              <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
                <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-lg font-extrabold text-text-title">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
        <h4 className="text-sm font-bold text-text-title mb-3">{tabs.find(t=>t.key===subTab)?.label} ({docs.length})</h4>
        {docs.length === 0 ? (
          <p className="text-xs text-text-desc text-center py-8">No documents found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-text-desc uppercase">No.</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-text-desc uppercase">Date</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-text-desc uppercase">Customer</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-text-desc uppercase">Amount</th>
                  <th className="px-3 py-2 text-center text-[10px] font-bold text-text-desc uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {docs.slice(0, 20).map((inv, i) => {
                  const d = safeDate(inv.date);
                  const docNo = inv.mode === 'dc-bill' ? inv.dcNo : inv.invoiceNo;
                  const status = inv.mode === 'dc-bill' ? (inv.dcStatus || 'pending') : (inv.paymentStatus || 'unpaid');
                  const statusColors = { paid: 'bg-emerald-100 text-emerald-700', partial: 'bg-amber-100 text-amber-700', unpaid: 'bg-slate-100 text-slate-600', overdue: 'bg-red-100 text-red-700', pending: 'bg-indigo-100 text-indigo-700', 'in-transit': 'bg-amber-100 text-amber-700', delivered: 'bg-emerald-100 text-emerald-700', returned: 'bg-red-100 text-red-700' };
                  return (
                    <tr key={inv.id || i} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 font-bold text-text-title">#{docNo}</td>
                      <td className="px-3 py-2.5 text-text-desc">{d ? d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : '—'}</td>
                      <td className="px-3 py-2.5 text-text-body truncate max-w-[200px]">{inv.buyerName || inv.buyer?.name || '—'}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-text-title">{formatINR(safeNum(inv.grandTotal))}</td>
                      <td className="px-3 py-2.5 text-center"><span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold capitalize ${statusColors[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {docs.length > 20 && <p className="text-[10px] text-text-desc text-center mt-3">Showing first 20 of {docs.length}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsSection;
