import React, { useState } from 'react';
import { formatINR, safeDate, safeNum } from '@/hooks/useAnalyticsEngine';
import DataTable from './DataTable';

const ReportsSection = ({ analytics, filters, savedInvoices }) => {
  if (!analytics) return null;
  const [exportFormat, setExportFormat] = useState('csv');

  const { filteredInvoices } = analytics;

  // Build export data respecting current filters
  const buildExportData = () => {
    return filteredInvoices.map(inv => ({
      'Document No': inv.mode === 'dc-bill' ? inv.dcNo : inv.invoiceNo,
      'Date': (() => { const d = safeDate(inv.date); return d ? d.toLocaleDateString('en-IN') : ''; })(),
      'Type': { 'gst-bill': 'GST Invoice', quotation: 'Quotation', 'dc-bill': 'Delivery Challan', 'slip-bill': 'Slip Bill' }[inv.mode] || inv.mode,
      'Customer': inv.buyerName || inv.buyer?.name || '',
      'GSTIN': inv.buyerGstin || inv.buyer?.gstin || '',
      'State': inv.buyerState || inv.buyer?.state || '',
      'Subtotal': safeNum(inv.subtotal).toFixed(2),
      'CGST': safeNum(inv.cgstAmount).toFixed(2),
      'SGST': safeNum(inv.sgstAmount).toFixed(2),
      'IGST': safeNum(inv.igstAmount).toFixed(2),
      'Grand Total': safeNum(inv.grandTotal).toFixed(2),
      'Payment Status': inv.paymentStatus || 'unpaid',
      'Payment Amount': safeNum(inv.paymentAmount).toFixed(2),
    }));
  };

  const handleExport = () => {
    const data = buildExportData();
    if (data.length === 0) { alert('No data to export with current filters.'); return; }

    if (exportFormat === 'csv') {
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      downloadFile(csv, `analytics_export_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
    } else {
      downloadFile(JSON.stringify(data, null, 2), `analytics_export_${new Date().toISOString().slice(0,10)}.json`, 'application/json');
    }
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Active filter summary
  const activeFilters = [];
  if (filters.period !== 'all') activeFilters.push(`Period: ${analytics.currentPeriodLabel}`);
  if (filters.docType !== 'all') activeFilters.push(`Type: ${{ 'gst-bill':'GST Invoice', quotation:'Quotation', 'dc-bill':'DC', 'slip-bill':'Slip Bill' }[filters.docType]}`);
  if (filters.customerId) activeFilters.push(`Customer: ${filters.customerId}`);
  if (filters.productName) activeFilters.push(`Product: ${filters.productName}`);
  if (filters.state) activeFilters.push(`State: ${filters.state}`);
  if (filters.paymentStatus) activeFilters.push(`Payment: ${filters.paymentStatus}`);

  // Table columns
  const columns = [
    { key: 'invoiceNo', label: 'Doc No.', render: (v, row) => <span className="font-bold text-text-title">#{row.mode === 'dc-bill' ? row.dcNo : row.invoiceNo}</span> },
    { key: 'date', label: 'Date', render: (v) => { const d = safeDate(v); return <span className="text-text-desc">{d ? d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : '—'}</span>; } },
    { key: 'mode', label: 'Type', render: (v) => {
      const c = { 'gst-bill':'bg-indigo-100 text-indigo-700', quotation:'bg-purple-100 text-purple-700', 'dc-bill':'bg-rose-100 text-rose-700', 'slip-bill':'bg-amber-100 text-amber-700' }[v] || 'bg-slate-100';
      const l = { 'gst-bill':'GST', quotation:'Quote', 'dc-bill':'DC', 'slip-bill':'Slip' }[v] || v;
      return <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${c}`}>{l}</span>;
    }},
    { key: 'buyerName', label: 'Customer', render: (v, row) => <span className="text-text-body truncate max-w-[180px] block">{v || row.buyer?.name || '—'}</span> },
    { key: 'subtotal', label: 'Subtotal', align: 'right', render: v => <span className="font-medium text-text-body">{formatINR(safeNum(v))}</span> },
    { key: 'grandTotal', label: 'Total', align: 'right', render: v => <span className="font-bold text-text-title">{formatINR(safeNum(v))}</span> },
    { key: 'paymentStatus', label: 'Status', render: v => {
      const s = v || 'unpaid';
      const c = { paid:'bg-emerald-100 text-emerald-700', partial:'bg-amber-100 text-amber-700', unpaid:'bg-slate-100 text-slate-600', overdue:'bg-red-100 text-red-700' }[s] || 'bg-slate-100';
      return <span className={`text-[9px] px-2 py-0.5 rounded-lg font-bold capitalize ${c}`}>{s}</span>;
    }},
  ];

  return (
    <div className="space-y-6">
      {/* Export Panel */}
      <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-text-title">Export Center</h4>
            <p className="text-xs text-text-desc mt-0.5">{filteredInvoices.length} records with current filters</p>
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {activeFilters.map((f,i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold">{f}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select value={exportFormat} onChange={e => setExportFormat(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 shadow-lg shadow-slate-300/40 transition-all text-xs font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export {filteredInvoices.length} Records
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        title="All Records"
        subtitle={`Filtered: ${analytics.currentPeriodLabel}${filters.docType !== 'all' ? ` • ${filters.docType}` : ''}`}
        maxRows={25}
      />
    </div>
  );
};

export default ReportsSection;
