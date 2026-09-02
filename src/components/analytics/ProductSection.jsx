import React, { useState } from 'react';
import { formatINR, safeDate, safeNum } from '@/hooks/useAnalyticsEngine';

const ProductSection = ({ analytics }) => {
  if (!analytics) return null;
  const { products, hsnData, revenueInvoices } = analytics;
  const [drillProduct, setDrillProduct] = useState(null);

  // Drill-down data for selected product
  const drillData = drillProduct ? (() => {
    const p = drillProduct;
    // Find all invoices containing this product
    const relatedInvs = (revenueInvoices || []).filter(inv =>
      (inv.items || []).some(it => it.description === p.name)
    );
    // Customer breakdown
    const custMap = {};
    relatedInvs.forEach(inv => {
      const name = inv.buyerName || inv.buyer?.name || 'Unknown';
      const key = inv.buyerGstin || inv.buyer?.gstin || name;
      if (!custMap[key]) custMap[key] = { name, qty: 0, revenue: 0 };
      (inv.items || []).filter(it => it.description === p.name).forEach(it => {
        const q = safeNum(it.quantity); const r = safeNum(it.rate); const d = safeNum(it.discount);
        custMap[key].qty += q; custMap[key].revenue += q * r * (1 - d / 100);
      });
    });
    const customers = Object.values(custMap).sort((a,b) => b.revenue - a.revenue);
    // Monthly
    const monthMap = {};
    relatedInvs.forEach(inv => {
      const d = safeDate(inv.date); if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthMap[key]) monthMap[key] = { month: d.toLocaleDateString('en-IN',{month:'short',year:'2-digit'}), qty: 0, revenue: 0 };
      (inv.items || []).filter(it => it.description === p.name).forEach(it => {
        const q = safeNum(it.quantity); const r = safeNum(it.rate); const disc = safeNum(it.discount);
        monthMap[key].qty += q; monthMap[key].revenue += q * r * (1 - disc / 100);
      });
    });
    return { customers, monthly: Object.values(monthMap) };
  })() : null;

  const maxProdRev = products.top[0]?.totalRevenue || 1;
  const maxHSNRev = hsnData.length > 0 ? hsnData[0].revenue : 1;

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Products', value: products.totalProducts },
          { label: 'Top Product Revenue', value: products.top[0] ? formatINR(products.top[0].totalRevenue) : '—' },
          { label: 'Top Contribution', value: products.top[0] ? `${products.top[0].contribution.toFixed(1)}%` : '—' },
          { label: 'HSN/SAC Codes', value: hsnData.length },
        ].map((m,i) => (
          <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-xl font-extrabold text-text-title">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Top Products */}
      <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
        <h4 className="text-base font-bold text-text-title mb-1">Top Performing Products</h4>
        <p className="text-xs text-text-desc mb-4">Click to drill down — matched by line item description (no direct product FK)</p>
        <div className="space-y-2">
          {products.top.map((p, i) => {
            const isSelected = drillProduct?.name === p.name;
            return (
              <div key={p.name}>
                <div onClick={() => setDrillProduct(isSelected ? null : p)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50 hover:bg-slate-100 border border-transparent'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-text-desc'}`}>#{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-title truncate">{p.name}</span>
                      {p.hsn && <span className="text-[9px] bg-slate-200 text-text-desc px-1 py-0.5 rounded font-mono shrink-0">HSN:{p.hsn}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{width:`${(p.totalRevenue/maxProdRev)*100}%`}} />
                      </div>
                      <span className="text-[10px] text-text-desc font-bold shrink-0">{p.contribution.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-text-title">{formatINR(p.totalRevenue)}</div>
                    <div className="text-[10px] text-text-desc">{Math.round(p.totalQty)} {p.unit || 'units'}</div>
                  </div>
                  <svg className={`w-4 h-4 text-text-desc transition-transform shrink-0 ${isSelected ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {isSelected && drillData && (
                  <div className="mt-2 ml-11 p-4 bg-white border border-indigo-100 rounded-xl space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Revenue</p><p className="text-lg font-extrabold text-text-title">{formatINR(p.totalRevenue)}</p></div>
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Quantity Sold</p><p className="text-lg font-extrabold text-indigo-600">{Math.round(p.totalQty)}</p></div>
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Customers</p><p className="text-lg font-extrabold text-purple-600">{p.customerCount}</p></div>
                    </div>
                    {drillData.customers.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-text-title mb-2">Customers Who Purchased</h5>
                        {drillData.customers.slice(0,5).map(c => (
                          <div key={c.name} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-50 last:border-0">
                            <span className="text-text-body truncate max-w-[200px]">{c.name}</span>
                            <span className="font-bold text-text-title">{formatINR(c.revenue)} <span className="text-text-desc font-normal">({Math.round(c.qty)} units)</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {products.top.length === 0 && <p className="text-xs text-text-desc text-center py-8">No product data</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weak Products */}
        {products.weak.length > 0 && (
          <div className="bg-bg-surface rounded-2xl border border-amber-100 shadow-sm p-5">
            <h4 className="text-base font-bold text-text-title mb-1">Low Performing Products</h4>
            <p className="text-xs text-text-desc mb-4">Lowest revenue products with sales activity</p>
            <div className="space-y-2">
              {products.weak.map(p => (
                <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-text-title truncate">{p.name}</div>
                    <div className="text-[10px] text-text-desc">{Math.round(p.totalQty)} {p.unit||'units'} • {p.customerCount} customers</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-amber-700">{formatINR(p.totalRevenue)}</div>
                    <div className="text-[10px] text-text-desc">{p.contribution.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HSN/SAC Analysis */}
        <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="text-base font-bold text-text-title mb-1">HSN/SAC Classification</h4>
          <p className="text-xs text-text-desc mb-4">Revenue by tax classification code</p>
          {hsnData.length === 0 ? (
            <p className="text-xs text-text-desc text-center py-8">No HSN/SAC data</p>
          ) : (
            <div className="space-y-2.5">
              {hsnData.slice(0,8).map((h,i) => (
                <div key={h.code} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-text-desc font-mono font-bold">{h.type}</span>
                      <span className="text-xs font-semibold text-text-body">{h.code}</span>
                    </div>
                    <span className="text-xs font-bold text-text-title">{formatINR(h.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full transition-all duration-500" style={{width:`${(h.revenue/maxHSNRev)*100}%`}} />
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

export default ProductSection;
