import React, { useState } from 'react';
import { formatINR, safeDate, safeNum } from '@/hooks/useAnalyticsEngine';

const CustomerSection = ({ analytics, onFilterChange }) => {
  if (!analytics) return null;
  const { customers } = analytics;
  const [drillCustomer, setDrillCustomer] = useState(null);

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

      p.unitMap[unit] = (p.unitMap[unit] || 0) + q;
      p.revenue += q * r * (1 - disc / 100);
    }));

    const products = [...prodMap.values()].sort((a, b) => b.revenue - a.revenue);
    return { products, invoices: invs };
  })() : null;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Customers', value: customers.totalCustomers },
          { label: 'Top Client Revenue', value: customers.top[0] ? formatINR(customers.top[0].totalRevenue) : '—' },
          { label: 'Top Concentration', value: customers.top[0] ? `${customers.top[0].contribution.toFixed(1)}%` : '—' },
          { label: 'Dormant (>60d)', value: customers.dormant.length },
        ].map((m, i) => (
          <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-xl font-extrabold text-text-title">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Dormant Top Customers Alert Panel */}
      {customers.dormant.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚡</span>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Dormant Top Client Watchlist</h4>
              <p className="text-xs text-amber-700">Historical top clients with no purchases in the last 60+ days</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customers.dormant.slice(0, 6).map(c => (
              <div
                key={c.id || c.name}
                onClick={() => onFilterChange && onFilterChange('customerId', c.id || c.name)}
                className="bg-white p-3 rounded-xl border border-amber-100 shadow-2xs hover:border-amber-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-text-title truncate">{c.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">{c.daysSinceLastOrder}d inactive</span>
                </div>
                <div className="flex justify-between text-[10px] text-text-desc">
                  <span>Historical Sales: <span className="font-bold text-text-title">{formatINR(c.totalRevenue)}</span></span>
                  <span>{c.invoiceCount} invoices</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Customers Table */}
      <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-text-title">Top Customers by Revenue</h4>
            <p className="text-xs text-text-desc mt-0.5">Click a customer row to view drill-down details</p>
          </div>
          <span className="text-xs text-text-desc font-medium">{customers.all.length} registered customers</span>
        </div>

        <div className="space-y-2">
          {customers.top.map((c, i) => {
            const maxRev = customers.top[0]?.totalRevenue || 1;
            const isSelected = drillCustomer?.id === c.id;
            return (
              <div key={c.id || c.name}>
                <div
                  onClick={() => setDrillCustomer(isSelected ? null : c)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700' : i < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-text-desc'
                  }`}>
                    #{i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-title truncate">{c.name}</span>
                      {c.gstin && <span className="text-[9px] text-text-desc font-mono shrink-0">{c.gstin}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(c.totalRevenue / maxRev) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-text-desc font-bold shrink-0">{c.contribution.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-text-title">{formatINR(c.totalRevenue)}</div>
                    <div className="text-[10px] text-text-desc">{c.invoiceCount} inv.</div>
                  </div>

                  {c.totalOutstanding > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-red-100 text-red-700 shrink-0">{formatINR(c.totalOutstanding)} due</span>
                  )}

                  <svg className={`w-4 h-4 text-text-desc transition-transform shrink-0 ${isSelected ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Drill-down panel */}
                {isSelected && drillData && (
                  <div className="mt-2 ml-11 p-4 bg-white border border-indigo-100 rounded-xl space-y-4 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <h5 className="text-xs font-bold text-text-title">Customer Profile: {c.name}</h5>
                      <button
                        onClick={() => onFilterChange && onFilterChange('customerId', c.id || c.name)}
                        className="text-[10px] font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
                      >
                        Filter Dashboard to this Client
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Revenue</p><p className="text-lg font-extrabold text-text-title">{formatINR(c.totalRevenue)}</p></div>
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Paid</p><p className="text-lg font-extrabold text-emerald-600">{formatINR(c.totalPaid)}</p></div>
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Outstanding</p><p className="text-lg font-extrabold text-red-600">{formatINR(c.totalOutstanding)}</p></div>
                    </div>

                    {drillData.products.length > 0 && (
                      <div>
                        <h6 className="text-[11px] font-bold text-text-title mb-2">Products Purchased</h6>
                        <div className="space-y-1">
                          {drillData.products.slice(0, 5).map(p => (
                            <div key={p.name} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-50 last:border-0">
                              <span className="text-text-body truncate max-w-[200px]">{p.name}</span>
                              <span className="font-bold text-text-title">
                                {formatINR(p.revenue)} <span className="text-text-desc font-normal">({Object.entries(p.unitMap).map(([u, q]) => `${Math.round(q)} ${u}`).join(', ')})</span>
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
          {customers.top.length === 0 && <p className="text-xs text-text-desc text-center py-8">No customer records</p>}
        </div>
      </div>

      {/* High Outstanding Customers */}
      {customers.highOutstanding.length > 0 && (
        <div className="bg-bg-surface rounded-2xl border border-red-100 shadow-sm p-5">
          <h4 className="text-base font-bold text-text-title mb-1">High Outstanding Customers</h4>
          <p className="text-xs text-text-desc mb-4">Accounts requiring immediate collection action</p>
          <div className="space-y-2">
            {customers.highOutstanding.map(c => (
              <div key={c.id || c.name} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 hover:bg-red-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-700">{c.name.charAt(0)}</div>
                  <div>
                    <div className="text-sm font-bold text-text-title">{c.name}</div>
                    <div className="text-[10px] text-text-desc">{c.invoiceCount} invoices • {c.state || '—'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-600">{formatINR(c.totalOutstanding)}</div>
                  <div className="text-[10px] text-text-desc">of {formatINR(c.totalRevenue)} billed</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSection;
