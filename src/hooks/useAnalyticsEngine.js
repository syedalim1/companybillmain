import { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Safely parse numeric values — DB NUMERIC fields arrive as JS strings */
export const safeNum = (val) => { const n = parseFloat(val); return isNaN(n) ? 0 : n; };

/** Safely parse dates — handles YYYY-MM-DD, ISO, truncated JS toString, empty strings */
export const safeDate = (val) => {
  if (!val) return null;
  const str = typeof val === 'string' ? val.trim() : String(val).trim();
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) { const d = new Date(str + 'T00:00:00'); return isNaN(d.getTime()) ? null : d; }
  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoMatch) { const d = new Date(isoMatch[1] + 'T00:00:00'); return isNaN(d.getTime()) ? null : d; }
  const jsMatch = str.match(/^\w{3}\s+(\w{3})\s+(\d{1,2})\s+(\d{4})/);
  if (jsMatch) {
    const m = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 }[jsMatch[1]];
    if (m !== undefined) { const d = new Date(parseInt(jsMatch[3]), m, parseInt(jsMatch[2])); return isNaN(d.getTime()) ? null : d; }
  }
  try { const c = str.replace(/\s+[A-Z]{1,2}$/, ''); const d = new Date(c); return isNaN(d.getTime()) ? null : d; } catch { return null; }
};

/** Format INR currency */
export const formatINR = (v) => `₹${Math.round(v || 0).toLocaleString('en-IN')}`;
export const formatINRCompact = (v) => {
  const n = v || 0;
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return formatINR(n);
};

const daysBetween = (a, b) => Math.floor(Math.abs(b - a) / 864e5);
const pctChange = (cur, prev) => prev > 0 ? ((cur - prev) / prev) * 100 : (cur > 0 ? 100 : 0);

// ═══════════════════════════════════════════════════════════════════════════════
// PERIOD HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getPeriodBounds(period, month, year, startDate, endDate) {
  switch (period) {
    case 'month': return { start: new Date(year, month - 1, 1), end: new Date(year, month, 0, 23, 59, 59) };
    case 'quarter': { const qs = Math.floor((month - 1) / 3) * 3; return { start: new Date(year, qs, 1), end: new Date(year, qs + 3, 0, 23, 59, 59) }; }
    case 'year': return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59) };
    case 'custom': { const s = safeDate(startDate); const e = safeDate(endDate); return s && e ? { start: s, end: e } : null; }
    default: return null;
  }
}

function getPreviousPeriodBounds(period, month, year, startDate, endDate) {
  switch (period) {
    case 'month': { const pm = month === 1 ? 12 : month - 1; const py = month === 1 ? year - 1 : year; return { start: new Date(py, pm - 1, 1), end: new Date(py, pm, 0, 23, 59, 59), label: new Date(py, pm - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }; }
    case 'quarter': { const qs = Math.floor((month - 1) / 3) * 3 - 3; const py = qs < 0 ? year - 1 : year; const aqs = qs < 0 ? qs + 12 : qs; return { start: new Date(py, aqs, 1), end: new Date(py, aqs + 3, 0, 23, 59, 59), label: `Q${Math.floor(aqs / 3) + 1} ${py}` }; }
    case 'year': return { start: new Date(year - 1, 0, 1), end: new Date(year - 1, 11, 31, 23, 59, 59), label: `${year - 1}` };
    case 'custom': { const s = safeDate(startDate); const e = safeDate(endDate); if (s && e) { const dur = e - s; return { start: new Date(s - dur - 864e5), end: new Date(s - 864e5), label: 'Previous Period' }; } return null; }
    default: return null;
  }
}

function filterByPeriod(invoices, bounds) {
  if (!bounds) return invoices;
  return invoices.filter(inv => { const d = safeDate(inv.date); return d && d >= bounds.start && d <= bounds.end; });
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPUTE FUNCTIONS — Each maps ONLY to documented DB fields
// ═══════════════════════════════════════════════════════════════════════════════

function computeSummary(invoices) {
  const totalRevenue = invoices.reduce((s, i) => s + safeNum(i.grandTotal), 0);
  const totalSubtotal = invoices.reduce((s, i) => s + safeNum(i.subtotal), 0);
  const totalCGST = invoices.reduce((s, i) => s + safeNum(i.cgstAmount), 0);
  const totalSGST = invoices.reduce((s, i) => s + safeNum(i.sgstAmount), 0);
  const totalIGST = invoices.reduce((s, i) => s + safeNum(i.igstAmount), 0);
  const totalGST = totalCGST + totalSGST + totalIGST;

  const paidInvoices = invoices.filter(i => i.paymentStatus === 'paid');
  const partialInvoices = invoices.filter(i => i.paymentStatus === 'partial');
  const unpaidInvoices = invoices.filter(i => i.paymentStatus === 'unpaid' || !i.paymentStatus);
  const overdueInvoices = invoices.filter(i => i.paymentStatus === 'overdue');

  const totalCollected = paidInvoices.reduce((s, i) => s + safeNum(i.grandTotal), 0)
    + partialInvoices.reduce((s, i) => s + safeNum(i.paymentAmount), 0);
  const totalOutstanding = invoices.filter(i => i.paymentStatus !== 'paid')
    .reduce((s, i) => s + (safeNum(i.grandTotal) - safeNum(i.paymentAmount)), 0);

  return {
    totalRevenue, totalSubtotal, totalGST, totalCGST, totalSGST, totalIGST,
    totalCollected, totalOutstanding,
    invoiceCount: invoices.length,
    avgInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
    collectionRate: totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0,
    paymentStats: {
      paid: paidInvoices.length, partial: partialInvoices.length,
      unpaid: unpaidInvoices.length, overdue: overdueInvoices.length,
    },
    paidAmount: paidInvoices.reduce((s, i) => s + safeNum(i.grandTotal), 0),
  };
}

function buildComparison(cur, prev, prevLabel) {
  const make = (c, p) => ({ current: c, previous: p, change: c - p, pctChange: pctChange(c, p), trend: c >= p ? 'up' : 'down' });
  return {
    label: prevLabel,
    revenue: make(cur.totalRevenue, prev.totalRevenue),
    gst: make(cur.totalGST, prev.totalGST),
    collected: make(cur.totalCollected, prev.totalCollected),
    outstanding: make(cur.totalOutstanding, prev.totalOutstanding),
    invoiceCount: make(cur.invoiceCount, prev.invoiceCount),
  };
}

function computeMonthlyTrends(invoices, now) {
  const trends = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mi = invoices.filter(inv => { const id = safeDate(inv.date); return id && id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear(); });
    trends.push({
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      fullMonth: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      monthIndex: d.getMonth(), year: d.getFullYear(),
      revenue: mi.reduce((s, inv) => s + safeNum(inv.grandTotal), 0),
      collected: mi.filter(inv => inv.paymentStatus === 'paid').reduce((s, inv) => s + safeNum(inv.grandTotal), 0),
      gst: mi.reduce((s, inv) => s + safeNum(inv.cgstAmount) + safeNum(inv.sgstAmount) + safeNum(inv.igstAmount), 0),
      count: mi.length, growth: 0,
      invoices: mi,
    });
  }
  for (let i = 1; i < trends.length; i++) {
    const p = trends[i - 1].revenue;
    if (p > 0) trends[i].growth = pctChange(trends[i].revenue, p);
  }
  return trends;
}

function computeQuarterlyData(invoices, now) {
  const qCalc = (year) => [
    { label: 'Q1', months: [0,1,2] }, { label: 'Q2', months: [3,4,5] },
    { label: 'Q3', months: [6,7,8] }, { label: 'Q4', months: [9,10,11] },
  ].map(q => {
    const qi = invoices.filter(inv => { const d = safeDate(inv.date); return d && d.getFullYear() === year && q.months.includes(d.getMonth()); });
    return { label: q.label, revenue: qi.reduce((s, i) => s + safeNum(i.grandTotal), 0), count: qi.length };
  });
  const current = qCalc(now.getFullYear());
  const previous = qCalc(now.getFullYear() - 1);
  const max = Math.max(...current.map(q => q.revenue), ...previous.map(q => q.revenue), 1);
  return { current, previous, max, currentYear: now.getFullYear(), previousYear: now.getFullYear() - 1 };
}

function computeGSTBreakdown(gstInvoices) {
  const cgst = gstInvoices.reduce((s, i) => s + safeNum(i.cgstAmount), 0);
  const sgst = gstInvoices.reduce((s, i) => s + safeNum(i.sgstAmount), 0);
  const igst = gstInvoices.reduce((s, i) => s + safeNum(i.igstAmount), 0);
  const taxable = gstInvoices.reduce((s, i) => s + safeNum(i.subtotal), 0);
  return {
    cgst, sgst, igst, total: cgst + sgst + igst, taxable,
    intraCount: gstInvoices.filter(i => safeNum(i.cgstAmount) > 0).length,
    interCount: gstInvoices.filter(i => safeNum(i.igstAmount) > 0).length,
    invoiceCount: gstInvoices.length,
  };
}

function computeMonthlyGST(gstInvoices, now) {
  const result = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mi = gstInvoices.filter(inv => { const id = safeDate(inv.date); return id && id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear(); });
    result.push({
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      cgst: mi.reduce((s, inv) => s + safeNum(inv.cgstAmount), 0),
      sgst: mi.reduce((s, inv) => s + safeNum(inv.sgstAmount), 0),
      igst: mi.reduce((s, inv) => s + safeNum(inv.igstAmount), 0),
      taxable: mi.reduce((s, inv) => s + safeNum(inv.subtotal), 0),
      count: mi.length,
    });
  }
  return result;
}

function computeCustomerAnalysis(invoices) {
  const map = {};
  invoices.forEach(inv => {
    const name = inv.buyerName || inv.buyer?.name || 'Unknown';
    const gstin = inv.buyerGstin || inv.buyer?.gstin || '';
    const key = gstin || name;
    if (!map[key]) map[key] = { name, gstin, state: inv.buyerState || inv.buyer?.state || '', invoiceCount: 0, totalRevenue: 0, totalPaid: 0, totalOutstanding: 0, invoices: [] };
    map[key].invoiceCount++;
    map[key].totalRevenue += safeNum(inv.grandTotal);
    if (inv.paymentStatus === 'paid') map[key].totalPaid += safeNum(inv.grandTotal);
    else map[key].totalOutstanding += safeNum(inv.grandTotal) - safeNum(inv.paymentAmount);
    if (inv.paymentStatus === 'partial') map[key].totalPaid += safeNum(inv.paymentAmount);
    map[key].invoices.push(inv);
  });
  const all = Object.values(map).sort((a, b) => b.totalRevenue - a.totalRevenue);
  const totalRev = all.reduce((s, c) => s + c.totalRevenue, 0);
  all.forEach(c => { c.contribution = totalRev > 0 ? (c.totalRevenue / totalRev) * 100 : 0; });
  return {
    all, top: all.slice(0, 10),
    highOutstanding: all.filter(c => c.totalOutstanding > 0).sort((a, b) => b.totalOutstanding - a.totalOutstanding).slice(0, 10),
    totalCustomers: all.length,
  };
}

function computeProductAnalysis(invoices) {
  const map = {};
  invoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const key = item.description || 'Unspecified Item';
      if (!map[key]) map[key] = { name: key, hsn: item.hsn || '', sac: item.sac || '', unit: item.unit || '', totalQty: 0, totalRevenue: 0, customerSet: new Set(), invoiceCount: 0 };
      const qty = safeNum(item.quantity); const rate = safeNum(item.rate); const disc = safeNum(item.discount);
      map[key].totalQty += qty;
      map[key].totalRevenue += qty * rate * (1 - disc / 100);
      map[key].customerSet.add(inv.buyerName || inv.buyer?.name || 'Unknown');
      map[key].invoiceCount++;
    });
  });
  const all = Object.values(map).map(p => ({ ...p, customerCount: p.customerSet.size })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  const totalRev = all.reduce((s, p) => s + p.totalRevenue, 0);
  all.forEach(p => { p.contribution = totalRev > 0 ? (p.totalRevenue / totalRev) * 100 : 0; delete p.customerSet; });
  return {
    all, top: all.slice(0, 10),
    weak: all.length > 3 ? all.slice(-Math.min(5, Math.floor(all.length / 2))).reverse() : [],
    totalProducts: all.length,
  };
}

function computeHSNAnalysis(invoices) {
  const map = {};
  invoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const code = item.hsn || item.sac || 'Unclassified';
      const type = item.hsn ? 'HSN' : item.sac ? 'SAC' : '—';
      if (!map[code]) map[code] = { code, type, revenue: 0, qty: 0, count: 0 };
      const qty = safeNum(item.quantity); const rate = safeNum(item.rate); const disc = safeNum(item.discount);
      map[code].revenue += qty * rate * (1 - disc / 100);
      map[code].qty += qty;
      map[code].count++;
    });
  });
  return Object.values(map).sort((a, b) => b.revenue - a.revenue);
}

function computePaymentAnalysis(invoices, now) {
  const stats = { paid: 0, partial: 0, unpaid: 0, overdue: 0 };
  invoices.forEach(inv => { const s = inv.paymentStatus || 'unpaid'; if (stats[s] !== undefined) stats[s]++; else stats.unpaid++; });

  const aging = { '0-30': { count: 0, amount: 0 }, '31-60': { count: 0, amount: 0 }, '61-90': { count: 0, amount: 0 }, '90+': { count: 0, amount: 0 } };
  const unpaid = invoices.filter(i => i.paymentStatus !== 'paid');
  unpaid.forEach(inv => {
    const d = safeDate(inv.date); if (!d) return;
    const age = daysBetween(d, now);
    const outstanding = safeNum(inv.grandTotal) - safeNum(inv.paymentAmount);
    if (outstanding <= 0) return;
    const bucket = age <= 30 ? '0-30' : age <= 60 ? '31-60' : age <= 90 ? '61-90' : '90+';
    aging[bucket].count++;
    aging[bucket].amount += outstanding;
  });

  // Outstanding by customer
  const custMap = {};
  unpaid.forEach(inv => {
    const name = inv.buyerName || inv.buyer?.name || 'Unknown';
    const key = inv.buyerGstin || inv.buyer?.gstin || name;
    if (!custMap[key]) custMap[key] = { name, gstin: inv.buyerGstin || inv.buyer?.gstin || '', outstanding: 0, invoiceCount: 0, oldestDays: 0 };
    const outstanding = safeNum(inv.grandTotal) - safeNum(inv.paymentAmount);
    if (outstanding <= 0) return;
    custMap[key].outstanding += outstanding;
    custMap[key].invoiceCount++;
    const d = safeDate(inv.date);
    if (d) custMap[key].oldestDays = Math.max(custMap[key].oldestDays, daysBetween(d, now));
  });
  const outstandingByCustomer = Object.values(custMap).filter(c => c.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding);

  const totalOutstanding = Object.values(aging).reduce((s, b) => s + b.amount, 0);

  return { stats, aging, outstandingByCustomer, totalOutstanding, overdueInvoices: invoices.filter(i => i.paymentStatus === 'overdue') };
}

function computeStateAnalysis(invoices) {
  const map = {};
  invoices.forEach(inv => {
    const st = inv.buyerState || inv.buyer?.state || 'Unknown';
    if (!map[st]) map[st] = { state: st, revenue: 0, count: 0, gst: 0 };
    map[st].revenue += safeNum(inv.grandTotal);
    map[st].gst += safeNum(inv.cgstAmount) + safeNum(inv.sgstAmount) + safeNum(inv.igstAmount);
    map[st].count++;
  });
  return Object.values(map).sort((a, b) => b.revenue - a.revenue);
}

function computeDocumentMix(invoices) {
  const counts = { 'gst-bill': 0, quotation: 0, 'dc-bill': 0, 'slip-bill': 0 };
  invoices.forEach(inv => { if (counts[inv.mode] !== undefined) counts[inv.mode]++; });
  const total = invoices.length;
  return {
    types: [
      { key: 'gst-bill', label: 'GST Invoices', count: counts['gst-bill'], pct: total > 0 ? (counts['gst-bill'] / total) * 100 : 0, color: '#6366f1' },
      { key: 'quotation', label: 'Quotations', count: counts.quotation, pct: total > 0 ? (counts.quotation / total) * 100 : 0, color: '#a855f7' },
      { key: 'dc-bill', label: 'Delivery Challans', count: counts['dc-bill'], pct: total > 0 ? (counts['dc-bill'] / total) * 100 : 0, color: '#f43f5e' },
      { key: 'slip-bill', label: 'Slip Bills', count: counts['slip-bill'], pct: total > 0 ? (counts['slip-bill'] / total) * 100 : 0, color: '#f59e0b' },
    ],
    total,
  };
}

function computeQuotationStats(quotes) {
  const withGST = quotes.filter(q => q.quotationGstOption === 'with-gst');
  const withoutGST = quotes.filter(q => q.quotationGstOption === 'without-gst');
  return {
    count: quotes.length,
    totalValue: quotes.reduce((s, q) => s + safeNum(q.grandTotal), 0),
    withGSTCount: withGST.length,
    withGSTValue: withGST.reduce((s, q) => s + safeNum(q.grandTotal), 0),
    withoutGSTCount: withoutGST.length,
    withoutGSTValue: withoutGST.reduce((s, q) => s + safeNum(q.grandTotal), 0),
    avgValue: quotes.length > 0 ? quotes.reduce((s, q) => s + safeNum(q.grandTotal), 0) / quotes.length : 0,
  };
}

function computeDCStats(dcs) {
  return {
    count: dcs.length,
    pending: dcs.filter(d => !d.dcStatus || d.dcStatus === 'pending').length,
    inTransit: dcs.filter(d => d.dcStatus === 'in-transit').length,
    delivered: dcs.filter(d => d.dcStatus === 'delivered').length,
    returned: dcs.filter(d => d.dcStatus === 'returned').length,
  };
}

function computeSlipStats(slips) {
  return {
    count: slips.length,
    totalValue: slips.reduce((s, i) => s + safeNum(i.grandTotal), 0),
    avgValue: slips.length > 0 ? slips.reduce((s, i) => s + safeNum(i.grandTotal), 0) / slips.length : 0,
    paidCount: slips.filter(s => s.paymentStatus === 'paid').length,
    unpaidCount: slips.filter(s => s.paymentStatus !== 'paid').length,
  };
}

function computeRecentActivity(invoices) {
  return [...invoices].sort((a, b) => {
    const da = safeDate(a.createdAt) || safeDate(a.date) || new Date(0);
    const db = safeDate(b.createdAt) || safeDate(b.date) || new Date(0);
    return db - da;
  }).slice(0, 15).map(inv => ({
    id: inv.id, documentNo: inv.mode === 'dc-bill' ? inv.dcNo : inv.invoiceNo,
    mode: inv.mode, buyerName: inv.buyerName || inv.buyer?.name || 'Unknown',
    grandTotal: safeNum(inv.grandTotal), paymentStatus: inv.paymentStatus || 'unpaid',
    date: inv.date, createdAt: inv.createdAt,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS INSIGHTS — Data-derived only, never fabricated
// ═══════════════════════════════════════════════════════════════════════════════

function generateInsights(summary, customers, payment, trends, gstBreakdown) {
  const insights = [];

  // Overdue invoices
  if (summary.paymentStats.overdue > 0)
    insights.push({ type: 'critical', title: 'Overdue Invoices', description: `${summary.paymentStats.overdue} invoices are past their payment terms`, metric: formatINR(payment.overdueInvoices.reduce((s, i) => s + safeNum(i.grandTotal), 0)), area: 'Payments' });

  // High outstanding over 90 days
  const aged90 = payment.aging['90+'];
  if (aged90.count > 0)
    insights.push({ type: 'warning', title: 'Aged Receivables (90+ Days)', description: `${aged90.count} invoices outstanding for over 90 days`, metric: formatINR(aged90.amount), area: 'Payments' });

  // Low collection efficiency
  if (summary.collectionRate < 60 && summary.invoiceCount > 0)
    insights.push({ type: 'warning', title: 'Low Collection Efficiency', description: `Collection rate is ${summary.collectionRate.toFixed(1)}% — below healthy threshold`, metric: `${summary.collectionRate.toFixed(1)}%`, area: 'Payments' });

  // Customer concentration risk
  if (customers.top.length > 0 && customers.top[0].contribution > 40)
    insights.push({ type: 'info', title: 'Revenue Concentration', description: `${customers.top[0].name} contributes ${customers.top[0].contribution.toFixed(1)}% of total revenue`, metric: formatINR(customers.top[0].totalRevenue), area: 'Customers' });

  // Declining sales trend (last 3 active months)
  const activeMonths = trends.filter(t => t.revenue > 0);
  if (activeMonths.length >= 3) {
    const last3 = activeMonths.slice(-3);
    if (last3[2].revenue < last3[1].revenue && last3[1].revenue < last3[0].revenue)
      insights.push({ type: 'warning', title: 'Declining Sales Trend', description: `Revenue has declined for 3 consecutive active months`, metric: `${last3[2].growth.toFixed(0)}%`, area: 'Revenue' });
  }

  // Strong recent month
  if (activeMonths.length > 0) {
    const last = activeMonths[activeMonths.length - 1];
    if (last.growth > 25)
      insights.push({ type: 'success', title: 'Strong Growth', description: `${last.fullMonth || last.month} showed ${last.growth.toFixed(0)}% revenue growth`, metric: formatINR(last.revenue), area: 'Revenue' });
  }

  // High outstanding customer
  if (customers.highOutstanding.length > 0) {
    const top = customers.highOutstanding[0];
    if (top.totalOutstanding > 0 && summary.totalOutstanding > 0 && (top.totalOutstanding / summary.totalOutstanding) > 0.25)
      insights.push({ type: 'warning', title: 'Outstanding Concentration', description: `${top.name} holds ${((top.totalOutstanding / summary.totalOutstanding) * 100).toFixed(0)}% of total outstanding`, metric: formatINR(top.totalOutstanding), area: 'Payments' });
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useAnalyticsEngine(savedInvoices, filters = {}) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!savedInvoices) return;
    const result = computeAll(savedInvoices, filters);
    setAnalytics(result);
  }, [savedInvoices, filters.period, filters.month, filters.year, filters.startDate, filters.endDate,
      filters.docType, filters.customerId, filters.productName, filters.state, filters.paymentStatus, filters.compareMode]);

  return analytics;
}

function computeAll(allInvoices, filters) {
  const now = new Date();
  const { period = 'all', month = now.getMonth() + 1, year = now.getFullYear(),
    startDate = null, endDate = null, docType = 'all', customerId = null,
    productName = null, state = null, paymentStatus = null, compareMode = false } = filters;

  // ── Filter options (from ALL invoices, unfiltered) ──
  const custSet = new Map(); const prodSet = new Set(); const stSet = new Set(); const yrSet = new Set();
  allInvoices.forEach(inv => {
    const n = inv.buyerName || inv.buyer?.name; const g = inv.buyerGstin || inv.buyer?.gstin;
    if (n) custSet.set(g || n, { name: n, gstin: g || '' });
    const s = inv.buyerState || inv.buyer?.state; if (s) stSet.add(s);
    const d = safeDate(inv.date); if (d) yrSet.add(d.getFullYear());
    (inv.items || []).forEach(item => { if (item.description) prodSet.add(item.description); });
  });

  // ── Period filter ──
  const bounds = period !== 'all' ? getPeriodBounds(period, month, year, startDate, endDate) : null;
  let periodFiltered = bounds ? filterByPeriod(allInvoices, bounds) : allInvoices;
  let currentPeriodLabel = 'All Time';
  if (bounds) {
    if (period === 'month') currentPeriodLabel = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    else if (period === 'quarter') currentPeriodLabel = `Q${Math.floor((month - 1) / 3) + 1} ${year}`;
    else if (period === 'year') currentPeriodLabel = `${year}`;
    else if (period === 'custom') currentPeriodLabel = `${bounds.start.toLocaleDateString('en-IN')} – ${bounds.end.toLocaleDateString('en-IN')}`;
  }

  // ── Additional filters ──
  const applyEntityFilters = (invs) => {
    let r = invs;
    if (docType !== 'all') r = r.filter(i => i.mode === docType);
    if (customerId) r = r.filter(i => { const k = i.buyerGstin || i.buyer?.gstin || i.buyerName || i.buyer?.name; return k === customerId || (i.buyerName || i.buyer?.name) === customerId; });
    if (productName) r = r.filter(i => (i.items || []).some(it => it.description === productName));
    if (state) r = r.filter(i => (i.buyerState || i.buyer?.state) === state);
    if (paymentStatus) r = r.filter(i => (i.paymentStatus || 'unpaid') === paymentStatus);
    return r;
  };
  const filtered = applyEntityFilters(periodFiltered);

  // ── Revenue invoices (gst-bill + slip-bill only) ──
  const revenueInvoices = filtered.filter(i => i.mode === 'gst-bill' || i.mode === 'slip-bill');
  // GST invoices (always gst-bill from period-filtered, plus entity filters)
  const gstFiltered = applyEntityFilters(periodFiltered.filter(i => i.mode === 'gst-bill'));

  // ── Summary ──
  const summary = computeSummary(revenueInvoices);

  // ── Comparison ──
  let comparison = null;
  if (compareMode && period !== 'all') {
    const prevBounds = getPreviousPeriodBounds(period, month, year, startDate, endDate);
    if (prevBounds) {
      const prevFiltered = applyEntityFilters(filterByPeriod(allInvoices, prevBounds));
      const prevRevenue = prevFiltered.filter(i => i.mode === 'gst-bill' || i.mode === 'slip-bill');
      comparison = buildComparison(summary, computeSummary(prevRevenue), prevBounds.label);
    }
  }

  return {
    filteredInvoices: filtered, revenueInvoices, currentPeriodLabel,
    summary, comparison,
    monthlyTrends: computeMonthlyTrends(revenueInvoices, now),
    quarterlyData: computeQuarterlyData(revenueInvoices, now),
    gstBreakdown: computeGSTBreakdown(gstFiltered),
    monthlyGST: computeMonthlyGST(gstFiltered, now),
    customers: computeCustomerAnalysis(revenueInvoices),
    products: computeProductAnalysis(revenueInvoices),
    hsnData: computeHSNAnalysis(revenueInvoices),
    payment: computePaymentAnalysis(revenueInvoices, now),
    stateData: computeStateAnalysis(revenueInvoices),
    documentMix: computeDocumentMix(periodFiltered),
    quotationStats: computeQuotationStats(periodFiltered.filter(i => i.mode === 'quotation')),
    dcStats: computeDCStats(periodFiltered.filter(i => i.mode === 'dc-bill')),
    slipStats: computeSlipStats(periodFiltered.filter(i => i.mode === 'slip-bill')),
    recentActivity: computeRecentActivity(filtered),
    insights: generateInsights(summary, computeCustomerAnalysis(revenueInvoices), computePaymentAnalysis(revenueInvoices, now), computeMonthlyTrends(revenueInvoices, now), computeGSTBreakdown(gstFiltered)),
    availableCustomers: [...custSet.values()].sort((a, b) => a.name.localeCompare(b.name)),
    availableProducts: [...prodSet].sort(),
    availableStates: [...stSet].sort(),
    availableYears: [...yrSet].sort((a, b) => b - a),
  };
}

export default useAnalyticsEngine;
