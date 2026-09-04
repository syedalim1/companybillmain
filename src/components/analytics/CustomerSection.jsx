import React, { useState, useMemo } from 'react';
import { formatINR, safeDate, safeNum } from '@/hooks/useAnalyticsEngine';

const CustomerSection = ({ analytics, onFilterChange }) => {
  if (!analytics) return null;

  const customers = analytics?.customers || {
    all: [],
    top: [],
    highOutstanding: [],
    dormant: [],
    totalCustomers: 0
  };

  const topCustomers = customers.top || [];
  const dormantCustomers = customers.dormant || [];
  const highOutstandingCustomers = customers.highOutstanding || [];
  const allCustomers = customers.all || [];

  const [drillCustomer, setDrillCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewLimit, setViewLimit] = useState(10);

  // Filtered customer list based on search and limit
  const displayedCustomers = useMemo(() => {
    let list = allCustomers;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(term) ||
        (c.gstin || '').toLowerCase().includes(term) ||
        (c.state || '').toLowerCase().includes(term)
      );
    }
    if (viewLimit !== 'all') {
      list = list.slice(0, Number(viewLimit));
    }
    return list;
  }, [allCustomers, searchTerm, viewLimit]);

  // Drill-down data for selected customer
  const drillData = drillCustomer ? (() => {
    const c = drillCustomer;
    const invs = c.invoices || [];

    // Products purchased with unit maps
    const prodMap = new Map();
    invs.forEach(inv => (inv.items || []).forEach(it => {
      const k = (it.description || 'Unspecified').trim();
      const normK = k.toLowerCase();
      if (!prodMap.has(normK)) {
        prodMap.set(normK, { name: k, unitMap: {}, revenue: 0 });
      }
      const p = prodMap.get(normK);
      const q = safeNum(it.quantity);
      const r = safeNum(it.rate);
      const disc = safeNum(it.discount);
      const unit = (it.unit || 'units').trim().toLowerCase();

      p.unitMap[unit] = (p.unitMap[unit] || 0) + (q || 1);
      const itemRev = safeNum(it.amount) || (q * r * (1 - disc / 100));
      p.revenue += itemRev;
    }));

    const products = [...prodMap.values()].sort((a, b) => b.revenue - a.revenue);
    const totalInvoices = invs.length;
    const avgOrderValue = totalInvoices > 0 ? (c.totalRevenue || 0) / totalInvoices : 0;
    return { products, invoices: invs, avgOrderValue };
  })() : null;

  const topRev = topCustomers[0]?.totalRevenue || 1;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Customers', value: customers.totalCustomers || allCustomers.length || 0 },
          { label: 'Top Client Revenue', value: topCustomers[0] ? formatINR(topCustomers[0].totalRevenue) : '—' },
          { label: 'Top Concentration', value: topCustomers[0] ? `${(topCustomers[0].contribution || 0).toFixed(1)}%` : '—' },
          { label: 'Dormant (>60d)', value: dormantCustomers.length },
        ].map((m, i) => (
          <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4 shadow-xs">
            <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-xl font-extrabold text-text-title">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Dormant Top Customers Alert Panel */}
      {dormantCustomers.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚡</span>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Dormant Top Client Watchlist</h4>
              <p className="text-xs text-amber-700">Historical top clients with no purchases in the last 60+ days</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dormantCustomers.slice(0, 6).map(c => {
              const inactiveText = c.daysSinceLastOrder >= 9999 ? '999+ days' : `${c.daysSinceLastOrder}d inactive`;
              return (
                <div
                  key={c.id || c.name}
                  onClick={() => onFilterChange && onFilterChange('customerId', c.id || c.name)}
                  className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs hover:border-amber-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-text-title truncate max-w-[150px]">{c.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">{inactiveText}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-text-desc">
                    <span>Historical Sales: <span className="font-bold text-text-title">{formatINR(c.totalRevenue)}</span></span>
                    <span>{c.invoiceCount} {c.invoiceCount === 1 ? 'invoice' : 'invoices'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customers Table / List */}
      <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-base font-bold text-text-title">Customer Intelligence</h4>
            <p className="text-xs text-text-desc mt-0.5">Click a customer row to view drill-down details & purchasing history</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search name, GSTIN..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300 w-44 sm:w-56"
              />
              <svg className="w-3.5 h-3.5 text-text-desc absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-text-desc hover:text-text-title text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Limit Selector */}
            <select
              value={viewLimit}
              onChange={e => setViewLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-text-body focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value={10}>Top 10</option>
              <option value={25}>Top 25</option>
              <option value="all">All ({allCustomers.length})</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {displayedCustomers.map((c, i) => {
            const isSelected = drillCustomer && (drillCustomer.id ? drillCustomer.id === c.id : drillCustomer.name === c.name);
            const contribution = (c.contribution || 0).toFixed(1);
            return (
              <div key={c.id || c.name}>
                <div
                  onClick={() => setDrillCustomer(isSelected ? null : c)}
                  className={`flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected ? 'bg-indigo-50/80 border border-indigo-200 shadow-2xs' : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700' : i < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-text-desc'
                  }`}>
                    #{i + 1}
                  </div>

                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-title truncate">{c.name || 'Unnamed Client'}</span>
                      {c.gstin && <span className="text-[9px] text-text-desc font-mono px-1.5 py-0.5 bg-slate-200/60 rounded shrink-0">{c.gstin}</span>}
                      {c.state && <span className="text-[9px] text-text-desc font-medium shrink-0">({c.state})</span>}
                      {/* Missing GSTIN warning — GST invoice filed without customer GSTIN */}
                      {c.missingGstin && (
                        <span
                          title="This customer has GST invoices but no GSTIN on file. This may affect GSTR-1 B2B filing."
                          className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800 shrink-0 cursor-help"
                        >
                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          No GSTIN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((c.totalRevenue || 0) / topRev) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-text-desc font-bold shrink-0">{contribution}%</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-text-title">{formatINR(c.totalRevenue)}</div>
                    <div className="text-[10px] text-text-desc">{c.invoiceCount} {c.invoiceCount === 1 ? 'inv.' : 'invs.'}</div>
                  </div>

                  {c.totalOutstanding > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-red-100 text-red-700 shrink-0">{formatINR(c.totalOutstanding)} due</span>
                  )}

                  <svg className={`w-4 h-4 text-text-desc transition-transform shrink-0 ${isSelected ? 'rotate-180 text-indigo-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Drill-down panel */}
                {isSelected && drillData && (
                  <div className="mt-2 ml-2 sm:ml-11 p-4 bg-white border border-indigo-100 rounded-xl space-y-4 shadow-xs">
                    <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-100">
                      <div>
                        <h5 className="text-xs font-bold text-text-title">Customer Profile: {c.name}</h5>
                        {c.gstin && <p className="text-[10px] text-text-desc font-mono">GSTIN: {c.gstin}</p>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFilterChange && onFilterChange('customerId', c.id || c.name);
                        }}
                        className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/50"
                      >
                        Filter Dashboard to this Client
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-slate-50/50 p-3 rounded-xl">
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Total Billed</p><p className="text-base sm:text-lg font-extrabold text-text-title">{formatINR(c.totalRevenue)}</p></div>
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Paid Amount</p><p className="text-base sm:text-lg font-extrabold text-emerald-600">{formatINR(c.totalPaid)}</p></div>
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Outstanding</p><p className="text-base sm:text-lg font-extrabold text-red-600">{formatINR(c.totalOutstanding)}</p></div>
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Avg Order Value</p><p className="text-base sm:text-lg font-extrabold text-indigo-600">{formatINR(drillData.avgOrderValue)}</p></div>
                    </div>

                    {drillData.products.length > 0 && (
                      <div>
                        <h6 className="text-[11px] font-bold text-text-title mb-2">Top Products Purchased</h6>
                        <div className="space-y-1">
                          {drillData.products.slice(0, 5).map(p => (
                            <div key={p.name} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-50 last:border-0">
                              <span className="text-text-body truncate max-w-[220px] font-medium">{p.name}</span>
                              <span className="font-bold text-text-title">
                                {formatINR(p.revenue)} <span className="text-text-desc font-normal text-[10px]">({Object.entries(p.unitMap).map(([u, q]) => `${Math.round(q)} ${u}`).join(', ')})</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {displayedCustomers.length === 0 && (
            <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs font-semibold text-text-desc">No customer records match your filter criteria.</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                >
                  Clear search filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* High Outstanding Customers */}
      {highOutstandingCustomers.length > 0 && (
        <div className="bg-bg-surface rounded-2xl border border-red-100 shadow-xs p-5">
          <h4 className="text-base font-bold text-text-title mb-1">High Outstanding Accounts</h4>
          <p className="text-xs text-text-desc mb-4">Accounts requiring immediate payment collection action</p>
          <div className="space-y-2">
            {highOutstandingCustomers.map(c => {
              const isSelected = drillCustomer && (drillCustomer.id ? drillCustomer.id === c.id : drillCustomer.name === c.name);
              return (
                <div
                  key={c.id || c.name}
                  onClick={() => setDrillCustomer(isSelected ? null : c)}
                  className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-700 shrink-0">
                      {(c.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-title">{c.name}</div>
                      <div className="text-[10px] text-text-desc">{c.invoiceCount} {c.invoiceCount === 1 ? 'invoice' : 'invoices'} • {c.state || '—'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">{formatINR(c.totalOutstanding)}</div>
                    <div className="text-[10px] text-text-desc">of {formatINR(c.totalRevenue)} billed</div>
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

export default CustomerSection;
