import React, { useState } from 'react';

const FilterBar = ({ filters, setFilters, analytics }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const resetFilters = () => setFilters({
    period: 'all', month: new Date().getUTCMonth() + 1, year: new Date().getUTCFullYear(),
    startDate: null, endDate: null, docType: 'all', customerId: null,
    productName: null, state: null, paymentStatus: null, compareMode: false,
  });

  const hasActiveFilters = filters.period !== 'all' || filters.docType !== 'all' ||
    filters.customerId || filters.productName || filters.state || filters.paymentStatus || filters.startDate;

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm">
      {/* Primary filter row */}
      <div className="p-4 flex flex-wrap items-center gap-3">
        {/* Period presets */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl">
          {[
            { key: 'all', label: 'All Time' },
            { key: 'month', label: 'Month' },
            { key: 'quarter', label: 'Quarter' },
            { key: 'year', label: 'Year' },
            { key: 'custom', label: 'Custom' },
          ].map(p => (
            <button key={p.key} onClick={() => update('period', p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filters.period === p.key ? 'bg-white text-text-title shadow-sm' : 'text-text-desc hover:text-text-body'
              }`}>{p.label}</button>
          ))}
        </div>

        {/* Month/Year selectors for Month/Quarter presets */}
        {(filters.period === 'month' || filters.period === 'quarter') && (
          <select value={filters.month} onChange={e => update('month', parseInt(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        )}
        {filters.period !== 'all' && filters.period !== 'custom' && (
          <select value={filters.year} onChange={e => update('year', parseInt(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300">
            {(analytics?.availableYears || [new Date().getUTCFullYear()]).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {/* Custom Date Range Inputs */}
        {filters.period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={e => update('startDate', e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <span className="text-xs text-text-desc font-bold">to</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={e => update('endDate', e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        )}

        {/* Document type */}
        <select value={filters.docType} onChange={e => update('docType', e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="all">All Documents</option>
          <option value="gst-bill">GST Invoices</option>
          <option value="quotation">Quotations</option>
          <option value="dc-bill">Delivery Challans</option>
          <option value="slip-bill">Slip Bills</option>
        </select>

        {/* Compare toggle */}
        {filters.period !== 'all' && (
          <button onClick={() => update('compareMode', !filters.compareMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filters.compareMode
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-text-desc hover:text-text-body'
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            Compare
          </button>
        )}

        {/* Advanced toggle */}
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            showAdvanced || hasActiveFilters
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-slate-50 border-slate-200 text-text-desc hover:text-text-body'
          }`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filters{hasActiveFilters ? ' ●' : ''}
        </button>

        {/* Reset */}
        {hasActiveFilters && (
          <button onClick={resetFilters} className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all">
            Reset All
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 flex flex-wrap gap-3">
          {/* Customer Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-desc uppercase tracking-wider">Customer</label>
            <select value={filters.customerId || ''} onChange={e => update('customerId', e.target.value || null)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[160px]">
              <option value="">All Customers</option>
              {(analytics?.availableCustomers || []).map(c => (
                <option key={c.id || c.name} value={c.id || c.name}>
                  {c.name}{c.gstin ? ` (${c.gstin.slice(-6)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-desc uppercase tracking-wider">Product</label>
            <select value={filters.productName || ''} onChange={e => update('productName', e.target.value || null)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[160px]">
              <option value="">All Products</option>
              {(analytics?.availableProducts || []).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-desc uppercase tracking-wider">State</label>
            <select value={filters.state || ''} onChange={e => update('state', e.target.value || null)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[140px]">
              <option value="">All States</option>
              {(analytics?.availableStates || []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-desc uppercase tracking-wider">Payment Status</label>
            <select value={filters.paymentStatus || ''} onChange={e => update('paymentStatus', e.target.value || null)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[120px]">
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
