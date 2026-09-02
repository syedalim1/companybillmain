import React, { useState } from 'react';
import { formatINR, safeDate, safeNum } from '@/hooks/useAnalyticsEngine';
import DataTable from './DataTable';

const CustomerSection = ({ analytics }) => {
  if (!analytics) return null;
  const { customers, payment } = analytics;
  const [drillCustomer, setDrillCustomer] = useState(null);

  // Drill-down data for selected customer
  const drillData = drillCustomer ? (() => {
    const c = drillCustomer;
    const invs = c.invoices || [];
    // Monthly breakdown
    const monthMap = {};
    invs.forEach(inv => {
      const d = safeDate(inv.date);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthMap[key]) monthMap[key] = { month: d.toLocaleDateString('en-IN',{month:'short',year:'2-digit'}), revenue: 0, count: 0 };
      monthMap[key].revenue += safeNum(inv.grandTotal);
      monthMap[key].count++;
    });
    const monthly = Object.values(monthMap).sort((a,b) => a.month.localeCompare(b.month));
    // Products purchased
    const prodMap = {};
    invs.forEach(inv => (inv.items||[]).forEach(it => {
      const k = it.description || 'Unspecified';
      if (!prodMap[k]) prodMap[k] = { name: k, qty: 0, revenue: 0 };
      const q = safeNum(it.quantity); const r = safeNum(it.rate); const disc = safeNum(it.discount);
      prodMap[k].qty += q; prodMap[k].revenue += q * r * (1 - disc/100);
    }));
    const products = Object.values(prodMap).sort((a,b) => b.revenue - a.revenue);
    return { monthly, products, invoices: invs };
  })() : null;

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Customers', value: customers.totalCustomers },
          { label: 'Top Customer Revenue', value: customers.top[0] ? formatINR(customers.top[0].totalRevenue) : '—' },
          { label: 'Top Contribution', value: customers.top[0] ? `${customers.top[0].contribution.toFixed(1)}%` : '—' },
          { label: 'With Outstanding', value: customers.highOutstanding.length },
        ].map((m,i) => (
          <div key={i} className="bg-bg-surface rounded-2xl border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-text-desc uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-xl font-extrabold text-text-title">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Top Customers Table */}
      <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm p-5">
        <h4 className="text-base font-bold text-text-title mb-1">Top Customers by Revenue</h4>
        <p className="text-xs text-text-desc mb-4">Click a customer to drill down</p>
        <div className="space-y-2">
          {customers.top.map((c, i) => {
            const maxRev = customers.top[0]?.totalRevenue || 1;
            const isSelected = drillCustomer?.name === c.name;
            return (
              <div key={c.name + c.gstin}>
                <div onClick={() => setDrillCustomer(isSelected ? null : c)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50 hover:bg-slate-100 border border-transparent'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-text-desc'}`}>
                    #{i+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-title truncate">{c.name}</span>
                      {c.gstin && <span className="text-[9px] text-text-desc font-mono shrink-0">{c.gstin.slice(-6)}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(c.totalRevenue/maxRev)*100}%` }} />
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
                  <div className="mt-2 ml-11 p-4 bg-white border border-indigo-100 rounded-xl space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Revenue</p><p className="text-lg font-extrabold text-text-title">{formatINR(c.totalRevenue)}</p></div>
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Paid</p><p className="text-lg font-extrabold text-emerald-600">{formatINR(c.totalPaid)}</p></div>
                      <div><p className="text-[10px] text-text-desc font-bold uppercase">Outstanding</p><p className="text-lg font-extrabold text-red-600">{formatINR(c.totalOutstanding)}</p></div>
                    </div>
                    {drillData.products.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-text-title mb-2">Products Purchased</h5>
                        {drillData.products.slice(0,5).map(p => (
                          <div key={p.name} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-50 last:border-0">
                            <span className="text-text-body truncate max-w-[200px]">{p.name}</span>
                            <span className="font-bold text-text-title">{formatINR(p.revenue)} <span className="text-text-desc font-normal">({Math.round(p.qty)} units)</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                    {drillData.invoices.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-text-title mb-2">Recent Invoices</h5>
                        {drillData.invoices.slice(0,5).map(inv => {
                          const d = safeDate(inv.date);
                          const statusCol = { paid: 'text-emerald-600', partial: 'text-amber-600', unpaid: 'text-slate-500', overdue: 'text-red-600' }[inv.paymentStatus] || 'text-slate-500';
                          return (
                            <div key={inv.id} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-50 last:border-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-text-title">#{inv.invoiceNo}</span>
                                <span className="text-text-desc">{d ? d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : '—'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold capitalize ${statusCol}`}>{inv.paymentStatus || 'unpaid'}</span>
                                <span className="font-bold text-text-title">{formatINR(safeNum(inv.grandTotal))}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {customers.top.length === 0 && <p className="text-xs text-text-desc text-center py-8">No customer data</p>}
        </div>
      </div>

      {/* High Outstanding Customers */}
      {customers.highOutstanding.length > 0 && (
        <div className="bg-bg-surface rounded-2xl border border-red-100 shadow-sm p-5">
          <h4 className="text-base font-bold text-text-title mb-1">Customers with Outstanding</h4>
          <p className="text-xs text-text-desc mb-4">Sorted by outstanding amount</p>
          <div className="space-y-2">
            {customers.highOutstanding.map(c => (
              <div key={c.name+c.gstin} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 hover:bg-red-50 transition-colors">
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
