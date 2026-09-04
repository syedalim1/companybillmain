import { useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS — Safe parsing, timezone-aware date math, text normalization
// ═══════════════════════════════════════════════════════════════════════════════

/** Safely parse numeric values from DB strings/numbers */
export const safeNum = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

/** Timezone-safe UTC Date parser to avoid local midnight boundary shifts */
export const safeDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  const str = typeof val === 'string' ? val.trim() : String(val).trim();
  if (!str) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return isNaN(date.getTime()) ? null : date;
  }

  // ISO string YYYY-MM-DDTHH:mm:ss
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoMatch) {
    const date = new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 12, 0, 0));
    return isNaN(date.getTime()) ? null : date;
  }

  // Legacy JS Date toString format e.g. "Wed Oct 15 2025 00:00:00 GMT+0530..."
  const jsMatch = str.match(/^\w{3}\s+(\w{3})\s+(\d{1,2})\s+(\d{4})/);
  if (jsMatch) {
    const monthMap = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    const m = monthMap[jsMatch[1]];
    if (m !== undefined) {
      const date = new Date(Date.UTC(parseInt(jsMatch[3]), m, parseInt(jsMatch[2]), 12, 0, 0));
      return isNaN(date.getTime()) ? null : date;
    }
  }

  try {
    const cleanStr = str.replace(/\s+[A-Z]{1,2}$/, '');
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return null;
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
  } catch {
    return null;
  }
};

/** Normalize string for safe case-insensitive matching */
export const normalizeText = (str) => (str || '').trim().toLowerCase();

/** Format INR currency */
export const formatINR = (v) => `₹${Math.round(v || 0).toLocaleString('en-IN')}`;
export const formatINRCompact = (v) => {
  const n = v || 0;
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return formatINR(n);
};

/** Format Unit Quantities safely (e.g. { 'kg': 100, 'pcs': 50 } -> "100 kg, 50 pcs") */
export const formatUnitQty = (unitMap) => {
  if (!unitMap || Object.keys(unitMap).length === 0) return '0 units';
  return Object.entries(unitMap)
    .filter(([_, qty]) => qty > 0)
    .map(([unit, qty]) => `${Math.round(qty * 100) / 100} ${unit || 'units'}`)
    .join(', ') || '0 units';
};

const daysBetween = (a, b) => Math.floor(Math.abs(b.getTime() - a.getTime()) / 864e5);

const pctChange = (cur, prev) => {
  if (prev <= 0) return cur > 0 ? 100 : 0;
  const raw = ((cur - prev) / prev) * 100;
  // Smooth out extreme growth spikes when baseline is small (< ₹10,000)
  if (prev < 10000 && raw > 300) return 300;
  return raw;
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERIOD BOUNDS COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════════

function getPeriodBounds(period, month, year, startDate, endDate) {
  switch (period) {
    case 'month': {
      const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
      return {
        start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)),
        end: new Date(Date.UTC(year, month, 0, 23, 59, 59)),
        days: totalDays,
      };
    }
    case 'quarter': {
      const qStart = Math.floor((month - 1) / 3) * 3;
      return {
        start: new Date(Date.UTC(year, qStart, 1, 0, 0, 0)),
        end: new Date(Date.UTC(year, qStart + 3, 0, 23, 59, 59)),
        days: 90,
      };
    }
    case 'year':
      return {
        start: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
        end: new Date(Date.UTC(year, 11, 31, 23, 59, 59)),
        days: 365,
      };
    case 'custom': {
      const s = safeDate(startDate);
      const e = safeDate(endDate);
      if (s && e) {
        return { start: s, end: e, days: Math.max(1, daysBetween(s, e)) };
      }
      return null;
    }
    default:
      return null;
  }
}

function getPreviousPeriodBounds(period, month, year, startDate, endDate) {
  switch (period) {
    case 'month': {
      const pm = month === 1 ? 12 : month - 1;
      const py = month === 1 ? year - 1 : year;
      return {
        start: new Date(Date.UTC(py, pm - 1, 1, 0, 0, 0)),
        end: new Date(Date.UTC(py, pm, 0, 23, 59, 59)),
        label: new Date(Date.UTC(py, pm - 1, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      };
    }
    case 'quarter': {
      const qStart = Math.floor((month - 1) / 3) * 3 - 3;
      const py = qStart < 0 ? year - 1 : year;
      const actualQStart = qStart < 0 ? qStart + 12 : qStart;
      return {
        start: new Date(Date.UTC(py, actualQStart, 1, 0, 0, 0)),
        end: new Date(Date.UTC(py, actualQStart + 3, 0, 23, 59, 59)),
        label: `Q${Math.floor(actualQStart / 3) + 1} ${py}`,
      };
    }
    case 'year':
      return {
        start: new Date(Date.UTC(year - 1, 0, 1, 0, 0, 0)),
        end: new Date(Date.UTC(year - 1, 11, 31, 23, 59, 59)),
        label: `${year - 1}`,
      };
    case 'custom': {
      const s = safeDate(startDate);
      const e = safeDate(endDate);
      if (s && e) {
        const duration = e.getTime() - s.getTime();
        return {
          start: new Date(s.getTime() - duration - 864e5),
          end: new Date(s.getTime() - 864e5),
          label: 'Previous Period',
        };
      }
      return null;
    }
    default:
      return null;
  }
}

function filterByPeriod(invoices, bounds) {
  if (!bounds) return invoices;
  return invoices.filter(inv => {
    const d = safeDate(inv.date);
    return d && d >= bounds.start && d <= bounds.end;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPUTE MODULES — Read-only derivations from DB records
// ═══════════════════════════════════════════════════════════════════════════════

function computeSummary(invoices, periodDays = 30) {
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

  // TRUE payment calculation: use paymentAmount when available, fall back to grandTotal
  // This ensures "Collected" reflects actual receipts, not just invoice values for paid status
  const totalCollected =
    paidInvoices.reduce((s, i) => s + (safeNum(i.paymentAmount) > 0 ? safeNum(i.paymentAmount) : safeNum(i.grandTotal)), 0)
    + partialInvoices.reduce((s, i) => s + safeNum(i.paymentAmount), 0);
  const totalOutstanding = invoices.filter(i => i.paymentStatus !== 'paid')
    .reduce((s, i) => s + Math.max(0, safeNum(i.grandTotal) - safeNum(i.paymentAmount)), 0);

  const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;

  // DSO (Days Sales Outstanding) = (Total Receivables / Total Sales) * Days in Period
  const dso = totalRevenue > 0 ? Math.round((totalOutstanding / totalRevenue) * periodDays) : 0;

  return {
    totalRevenue, totalSubtotal, totalGST, totalCGST, totalSGST, totalIGST,
    totalCollected, totalOutstanding,
    invoiceCount: invoices.length,
    avgInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
    collectionRate, dso,
    paymentStats: {
      paid: paidInvoices.length, partial: partialInvoices.length,
      unpaid: unpaidInvoices.length, overdue: overdueInvoices.length,
    },
    paidAmount: paidInvoices.reduce((s, i) => s + (safeNum(i.paymentAmount) > 0 ? safeNum(i.paymentAmount) : safeNum(i.grandTotal)), 0),
  };
}

function computeRunRate(invoices, now, targetMonth, targetYear) {
  const currentMonth = (targetMonth !== undefined && targetMonth !== null) ? targetMonth - 1 : now.getUTCMonth();
  const currentYear = targetYear || now.getUTCFullYear();
  const isCurrentMonth = (currentMonth === now.getUTCMonth() && currentYear === now.getUTCFullYear());
  const currentDay = isCurrentMonth ? Math.max(1, now.getUTCDate()) : new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
  const totalDaysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();

  const mtdInvoices = invoices.filter(inv => {
    const d = safeDate(inv.date);
    return d && d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
  });

  const mtdRevenue = mtdInvoices.reduce((s, i) => s + safeNum(i.grandTotal), 0);
  const dailyAverage = currentDay > 0 ? mtdRevenue / currentDay : 0;
  const projectedMonthEnd = dailyAverage * totalDaysInMonth;

  return {
    mtdRevenue,
    currentDay,
    totalDaysInMonth,
    dailyAverage,
    projectedMonthEnd,
    progressPct: Math.round((currentDay / totalDaysInMonth) * 100),
    isCurrentMonth,
  };
}

function computeMonthlyTrends(invoices, now) {
  // Filter out future-dated invoices — they corrupt current-month charts and run-rate forecasts
  const validInvoices = invoices.filter(inv => {
    const d = safeDate(inv.date);
    return d && d <= now;
  });

  const trends = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1, 12, 0, 0));
    const mi = validInvoices.filter(inv => {
      const id = safeDate(inv.date);
      return id && id.getUTCMonth() === d.getUTCMonth() && id.getUTCFullYear() === d.getUTCFullYear();
    });
    const revenue = mi.reduce((s, inv) => s + safeNum(inv.grandTotal), 0);
    // True collected amount per month
    const collected = mi.reduce((s, inv) => {
      if (inv.paymentStatus === 'paid') return s + (safeNum(inv.paymentAmount) > 0 ? safeNum(inv.paymentAmount) : safeNum(inv.grandTotal));
      if (inv.paymentStatus === 'partial') return s + safeNum(inv.paymentAmount);
      return s;
    }, 0);
    const gst = mi.reduce((s, inv) => s + safeNum(inv.cgstAmount) + safeNum(inv.sgstAmount) + safeNum(inv.igstAmount), 0);
    trends.push({
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      fullMonth: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      monthIndex: d.getUTCMonth(),
      year: d.getUTCFullYear(),
      revenue, collected, gst,
      count: mi.length, growth: 0, movingAvg3M: 0,
      invoices: mi,
    });
  }

  // MoM Growth & 3-Month Moving Average
  for (let i = 0; i < trends.length; i++) {
    if (i > 0) {
      trends[i].growth = pctChange(trends[i].revenue, trends[i - 1].revenue);
    }
    const slice = trends.slice(Math.max(0, i - 2), i + 1);
    trends[i].movingAvg3M = slice.reduce((s, t) => s + t.revenue, 0) / slice.length;
  }
  return trends;
}

function computeMonthlyGST(gstInvoices, now) {
  const trends = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1, 12, 0, 0));
    const mi = gstInvoices.filter(inv => {
      const id = safeDate(inv.date);
      return id && id.getUTCMonth() === d.getUTCMonth() && id.getUTCFullYear() === d.getUTCFullYear();
    });
    const cgst = mi.reduce((s, inv) => s + safeNum(inv.cgstAmount), 0);
    const sgst = mi.reduce((s, inv) => s + safeNum(inv.sgstAmount), 0);
    const igst = mi.reduce((s, inv) => s + safeNum(inv.igstAmount), 0);
    const taxable = mi.reduce((s, inv) => s + safeNum(inv.subtotal), 0);
    trends.push({
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      cgst, sgst, igst, taxable,
      count: mi.length,
    });
  }
  return trends;
}

function computeQuarterlyData(invoices, now, targetYear) {
  const yr = targetYear || now.getUTCFullYear();
  const qCalc = (year) => [
    { label: 'Q1', months: [0, 1, 2] }, { label: 'Q2', months: [3, 4, 5] },
    { label: 'Q3', months: [6, 7, 8] }, { label: 'Q4', months: [9, 10, 11] },
  ].map(q => {
    const qi = invoices.filter(inv => {
      const d = safeDate(inv.date);
      return d && d.getUTCFullYear() === year && q.months.includes(d.getUTCMonth());
    });
    return { label: q.label, revenue: qi.reduce((s, i) => s + safeNum(i.grandTotal), 0), count: qi.length };
  });
  const current = qCalc(yr);
  const previous = qCalc(yr - 1);
  const max = Math.max(...current.map(q => q.revenue), ...previous.map(q => q.revenue), 1);
  return { current, previous, max, currentYear: yr, previousYear: yr - 1 };
}

function computeGSTBreakdown(gstInvoices) {
  const cgst = gstInvoices.reduce((s, i) => s + safeNum(i.cgstAmount), 0);
  const sgst = gstInvoices.reduce((s, i) => s + safeNum(i.sgstAmount), 0);
  const igst = gstInvoices.reduce((s, i) => s + safeNum(i.igstAmount), 0);
  const taxable = gstInvoices.reduce((s, i) => s + safeNum(i.subtotal), 0);

  // B2B (with GSTIN) vs B2C (without GSTIN)
  // FIX: Previous code had operator precedence bug: !(gstin.length > 3) incorrectly evaluated
  // Correct: a B2B invoice has a GSTIN string longer than 3 characters
  const hasGstin = (inv) => (inv.buyerGstin || inv.buyer?.gstin || '').trim().length > 3;
  const b2bInvoices = gstInvoices.filter(i => hasGstin(i));
  const b2cInvoices = gstInvoices.filter(i => !hasGstin(i));

  const b2b = {
    count: b2bInvoices.length,
    taxable: b2bInvoices.reduce((s, i) => s + safeNum(i.subtotal), 0),
    gst: b2bInvoices.reduce((s, i) => s + safeNum(i.cgstAmount) + safeNum(i.sgstAmount) + safeNum(i.igstAmount), 0),
    grandTotal: b2bInvoices.reduce((s, i) => s + safeNum(i.grandTotal), 0),
  };
  const b2c = {
    count: b2cInvoices.length,
    taxable: b2cInvoices.reduce((s, i) => s + safeNum(i.subtotal), 0),
    gst: b2cInvoices.reduce((s, i) => s + safeNum(i.cgstAmount) + safeNum(i.sgstAmount) + safeNum(i.igstAmount), 0),
    grandTotal: b2cInvoices.reduce((s, i) => s + safeNum(i.grandTotal), 0),
  };

  return {
    cgst, sgst, igst, total: cgst + sgst + igst, taxable,
    intraCount: gstInvoices.filter(i => safeNum(i.cgstAmount) > 0).length,
    interCount: gstInvoices.filter(i => safeNum(i.igstAmount) > 0).length,
    invoiceCount: gstInvoices.length,
    b2b, b2c,
  };
}

function computeCustomerAnalysis(invoices, now) {
  // NAME-FIRST grouping: always use normalized customer name as primary key.
  // This consolidates e.g. "ALMOND INTERIOR" even when GSTINs differ across invoices.
  const map = new Map();

  invoices.forEach(inv => {
    const rawName = inv.buyerName || inv.buyer?.name || 'Unknown Buyer';
    const rawGstin = (inv.buyerGstin || inv.buyer?.gstin || '').trim();
    // Primary key = normalized name (fixes 26→41 customer count discrepancy)
    const normKey = `name:${normalizeText(rawName)}`;

    if (!map.has(normKey)) {
      map.set(normKey, {
        id: normKey,
        name: rawName.trim(),
        gstin: rawGstin,         // First GSTIN seen — may be updated below
        gstins: new Set(),       // Collect all unique GSTINs for this name
        state: inv.buyerState || inv.buyer?.state || '',
        invoiceCount: 0,
        totalRevenue: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        lastOrderDate: null,
        invoices: [],
      });
    }

    const c = map.get(normKey);
    // Track all GSTINs encountered for this customer name
    if (rawGstin && rawGstin.length > 3) c.gstins.add(rawGstin.toUpperCase());
    // Prefer a non-empty GSTIN as the canonical one
    if (!c.gstin && rawGstin) c.gstin = rawGstin;

    c.invoiceCount++;
    const gt = safeNum(inv.grandTotal);
    c.totalRevenue += gt;

    // True payment calc: use paymentAmount when available
    if (inv.paymentStatus === 'paid') {
      const paid = safeNum(inv.paymentAmount) > 0 ? safeNum(inv.paymentAmount) : gt;
      c.totalPaid += paid;
    } else {
      const pd = safeNum(inv.paymentAmount);
      c.totalPaid += pd;
      c.totalOutstanding += Math.max(0, gt - pd);
    }

    const d = safeDate(inv.date);
    if (d && (!c.lastOrderDate || d > c.lastOrderDate)) {
      c.lastOrderDate = d;
    }
    c.invoices.push(inv);
  });

  const all = [...map.values()].map(c => ({
    ...c,
    // missingGstin = customer has invoices but none had a valid GSTIN (likely B2B data gap)
    missingGstin: c.gstins.size === 0,
    gstin: c.gstin || '',
    allGstins: [...c.gstins],
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRev = all.reduce((s, c) => s + c.totalRevenue, 0);

  all.forEach(c => {
    c.contribution = totalRev > 0 ? (c.totalRevenue / totalRev) * 100 : 0;
    // Always compute a real number — never leave as 999 for display
    c.daysSinceLastOrder = c.lastOrderDate ? daysBetween(c.lastOrderDate, now) : 9999;
    delete c.gstins; // Clean up the Set before returning
  });

  const dormant = all.filter(c => c.totalRevenue >= 5000 && c.daysSinceLastOrder > 60);

  return {
    all,
    top: all.slice(0, 10),
    highOutstanding: all.filter(c => c.totalOutstanding > 0).sort((a, b) => b.totalOutstanding - a.totalOutstanding).slice(0, 10),
    dormant,
    totalCustomers: all.length,
  };
}

function computeProductAnalysis(invoices) {
  const map = new Map();

  invoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const rawDesc = item.description || 'Unspecified Item';
      const normKey = normalizeText(rawDesc);

      if (!map.has(normKey)) {
        map.set(normKey, {
          id: normKey,
          name: rawDesc.trim(),
          hsn: item.hsn || '',
          sac: item.sac || '',
          unitMap: {},
          totalRevenue: 0,
          customerSet: new Set(),
          invoiceCount: 0,
        });
      }

      const p = map.get(normKey);
      const qty = safeNum(item.quantity);
      const rate = safeNum(item.rate);
      const disc = safeNum(item.discount);
      const unit = (item.unit || 'units').trim().toLowerCase();

      p.unitMap[unit] = (p.unitMap[unit] || 0) + qty;
      p.totalRevenue += qty * rate * (1 - disc / 100);
      p.customerSet.add(inv.buyerName || inv.buyer?.name || 'Unknown');
      p.invoiceCount++;
    });
  });

  const all = [...map.values()].map(p => ({
    ...p,
    customerCount: p.customerSet.size,
    unitFormatted: formatUnitQty(p.unitMap),
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRev = all.reduce((s, p) => s + p.totalRevenue, 0);
  all.forEach(p => {
    p.contribution = totalRev > 0 ? (p.totalRevenue / totalRev) * 100 : 0;
    delete p.customerSet;
  });

  return {
    all,
    top: all.slice(0, 10),
    weak: all.length > 3 ? all.slice(-Math.min(5, Math.floor(all.length / 2))).reverse() : [],
    totalProducts: all.length,
  };
}

function computeHSNAnalysis(invoices) {
  const map = new Map();

  invoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const code = (item.hsn || item.sac || 'Unclassified').trim();
      const type = item.hsn ? 'HSN' : item.sac ? 'SAC' : '—';
      const normKey = `${type}:${code}`;

      if (!map.has(normKey)) {
        map.set(normKey, { code, type, revenue: 0, unitMap: {}, count: 0 });
      }

      const h = map.get(normKey);
      const qty = safeNum(item.quantity);
      const rate = safeNum(item.rate);
      const disc = safeNum(item.discount);
      const unit = (item.unit || 'units').trim().toLowerCase();

      h.revenue += qty * rate * (1 - disc / 100);
      h.unitMap[unit] = (h.unitMap[unit] || 0) + qty;
      h.count++;
    });
  });

  return [...map.values()].map(h => ({
    ...h,
    unitFormatted: formatUnitQty(h.unitMap),
  })).sort((a, b) => b.revenue - a.revenue);
}

function computePaymentAnalysis(invoices, now) {
  const stats = { paid: 0, partial: 0, unpaid: 0, overdue: 0 };
  invoices.forEach(inv => {
    const s = inv.paymentStatus || 'unpaid';
    if (stats[s] !== undefined) stats[s]++;
    else stats.unpaid++;
  });

  const aging = {
    '0-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '61-90': { count: 0, amount: 0 },
    '90+': { count: 0, amount: 0 },
  };

  const unpaid = invoices.filter(i => i.paymentStatus !== 'paid');
  unpaid.forEach(inv => {
    const d = safeDate(inv.date);
    if (!d) return;
    // Aging strictly from invoice date to today
    const age = daysBetween(d, now);
    const outstanding = Math.max(0, safeNum(inv.grandTotal) - safeNum(inv.paymentAmount));
    if (outstanding <= 0) return;
    const bucket = age <= 30 ? '0-30' : age <= 60 ? '31-60' : age <= 90 ? '61-90' : '90+';
    aging[bucket].count++;
    aging[bucket].amount += outstanding;
  });

  // Outstanding by Customer — name-first grouping consistent with computeCustomerAnalysis
  const custMap = new Map();
  unpaid.forEach(inv => {
    const rawName = inv.buyerName || inv.buyer?.name || 'Unknown';
    const rawGstin = (inv.buyerGstin || inv.buyer?.gstin || '').trim();
    // Name-first key (consistent with customer analysis grouping)
    const normKey = `name:${normalizeText(rawName)}`;

    if (!custMap.has(normKey)) {
      custMap.set(normKey, {
        id: normKey,
        name: rawName.trim(),
        gstin: rawGstin,
        outstanding: 0,
        invoiceCount: 0,
        oldestDays: 0,
        unpaidInvoices: [], // Detailed list for drill-down
      });
    }

    const c = custMap.get(normKey);
    const outstanding = Math.max(0, safeNum(inv.grandTotal) - safeNum(inv.paymentAmount));
    if (outstanding <= 0) return;
    c.outstanding += outstanding;
    c.invoiceCount++;
    const d = safeDate(inv.date);
    const ageDays = d ? daysBetween(d, now) : 0;
    if (d) c.oldestDays = Math.max(c.oldestDays, ageDays);

    // Collect invoice detail for drill-down panel
    c.unpaidInvoices.push({
      id: inv.id,
      invoiceNo: inv.invoiceNo || inv.quotationNo || inv.id,
      date: inv.date,
      grandTotal: safeNum(inv.grandTotal),
      paymentAmount: safeNum(inv.paymentAmount),
      outstanding,
      ageDays,
      ageBucket: ageDays <= 30 ? '0-30' : ageDays <= 60 ? '31-60' : ageDays <= 90 ? '61-90' : '90+',
      paymentStatus: inv.paymentStatus || 'unpaid',
    });
  });

  const outstandingByCustomer = [...custMap.values()]
    .filter(c => c.outstanding > 0)
    .map(c => ({ ...c, unpaidInvoices: c.unpaidInvoices.sort((a, b) => b.ageDays - a.ageDays) }))
    .sort((a, b) => b.outstanding - a.outstanding);

  const totalOutstanding = Object.values(aging).reduce((s, b) => s + b.amount, 0);

  return {
    stats,
    aging,
    outstandingByCustomer,
    totalOutstanding,
    overdueInvoices: invoices.filter(i => i.paymentStatus === 'overdue'),
  };
}

function computeStateAnalysis(invoices) {
  const map = new Map();
  invoices.forEach(inv => {
    const st = (inv.buyerState || inv.buyer?.state || 'Unknown').trim();
    const normKey = normalizeText(st);

    if (!map.has(normKey)) {
      map.set(normKey, { state: st, revenue: 0, count: 0, gst: 0 });
    }

    const s = map.get(normKey);
    s.revenue += safeNum(inv.grandTotal);
    s.gst += safeNum(inv.cgstAmount) + safeNum(inv.sgstAmount) + safeNum(inv.igstAmount);
    s.count++;
  });
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
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

function computeDCStats(dcs, now) {
  const pending = dcs.filter(d => !d.dcStatus || d.dcStatus === 'pending');
  const overdueDCs = pending.filter(d => {
    const dt = safeDate(d.date);
    return dt && daysBetween(dt, now) > 14;
  });

  return {
    count: dcs.length,
    pending: pending.length,
    inTransit: dcs.filter(d => d.dcStatus === 'in-transit').length,
    delivered: dcs.filter(d => d.dcStatus === 'delivered').length,
    returned: dcs.filter(d => d.dcStatus === 'returned').length,
    overdueDCsCount: overdueDCs.length,
    overdueDCs,
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
    return db.getTime() - da.getTime();
  }).slice(0, 15).map(inv => ({
    id: inv.id,
    documentNo: inv.mode === 'dc-bill' ? (inv.dcNo || inv.invoiceNo) : (inv.invoiceNo || inv.quotationNo || inv.id),
    mode: inv.mode,
    buyerName: inv.buyerName || inv.buyer?.name || 'Unknown',
    grandTotal: safeNum(inv.grandTotal),
    paymentStatus: inv.paymentStatus || 'unpaid',
    date: inv.date,
    createdAt: inv.createdAt,
    rawInvoice: inv,
  }));
}

/**
 * Compute data quality issues — future-dated invoices & B2B customers missing GSTINs.
 * Used to display advisory banners in the Overview section.
 */
function computeDataQuality(invoices, now) {
  const futureDatedInvoices = invoices.filter(inv => {
    const d = safeDate(inv.date);
    return d && d > now;
  });

  // B2B = gst-bill invoices where no GSTIN is present (data entry gap)
  const gstBillInvoices = invoices.filter(i => i.mode === 'gst-bill');
  const missingGstinMap = new Map();
  gstBillInvoices.forEach(inv => {
    const rawName = inv.buyerName || inv.buyer?.name || '';
    const rawGstin = (inv.buyerGstin || inv.buyer?.gstin || '').trim();
    if (!rawName) return;
    const normKey = normalizeText(rawName);
    if (!missingGstinMap.has(normKey)) {
      missingGstinMap.set(normKey, { name: rawName.trim(), hasGstin: false });
    }
    if (rawGstin && rawGstin.length > 3) {
      missingGstinMap.get(normKey).hasGstin = true;
    }
  });
  const missingGstinCustomers = [...missingGstinMap.values()].filter(c => !c.hasGstin);

  return {
    futureDatedCount: futureDatedInvoices.length,
    futureDatedInvoices,
    missingGstinCustomers,
    missingGstinCount: missingGstinCustomers.length,
  };
}

function generateInsights(summary, customers, payment, trends, gstBreakdown, dcStats, runRate) {
  const insights = [];

  if (summary.paymentStats.overdue > 0) {
    insights.push({
      type: 'critical',
      title: 'Overdue Payments Alert',
      description: `${summary.paymentStats.overdue} invoice(s) are past payment terms requiring immediate follow-up`,
      metric: formatINR(payment.overdueInvoices.reduce((s, i) => s + safeNum(i.grandTotal), 0)),
      area: 'Payments',
    });
  }

  const aged90 = payment.aging['90+'];
  if (aged90.count > 0) {
    insights.push({
      type: 'warning',
      title: 'High Risk Receivables (90+ Days)',
      description: `${aged90.count} invoice(s) outstanding for over 90 days`,
      metric: formatINR(aged90.amount),
      area: 'Payments',
    });
  }

  if (dcStats.overdueDCsCount > 0) {
    insights.push({
      type: 'warning',
      title: 'Pending Delivery Challans',
      description: `${dcStats.overdueDCsCount} delivery challan(s) unreturned or pending for over 14 days`,
      metric: `${dcStats.overdueDCsCount} DCs`,
      area: 'Logistics',
    });
  }

  if (customers.dormant.length > 0) {
    const topDormant = customers.dormant[0];
    insights.push({
      type: 'warning',
      title: 'Dormant Top Client Alert',
      description: `${topDormant.name} (₹${(topDormant.totalRevenue/1000).toFixed(1)}K historical sales) has no purchases in >60 days`,
      metric: `${topDormant.daysSinceLastOrder} days inactive`,
      area: 'Customers',
    });
  }

  if (runRate.mtdRevenue > 0) {
    insights.push({
      type: 'info',
      title: 'Month-End Sales Pace',
      description: `Current pace of ${formatINR(runRate.dailyAverage)}/day projects month-end revenue at ${formatINR(runRate.projectedMonthEnd)}`,
      metric: formatINR(runRate.projectedMonthEnd),
      area: 'Revenue',
    });
  }

  if (customers.top.length > 0 && customers.top[0].contribution > 35) {
    insights.push({
      type: 'info',
      title: 'Revenue Concentration Risk',
      description: `${customers.top[0].name} contributes ${customers.top[0].contribution.toFixed(1)}% of overall sales`,
      metric: `${customers.top[0].contribution.toFixed(1)}%`,
      area: 'Customers',
    });
  }

  if (summary.collectionRate < 60 && summary.invoiceCount > 0) {
    insights.push({
      type: 'warning',
      title: 'Low Collection Efficiency',
      description: `Collection rate is ${summary.collectionRate.toFixed(1)}% — DSO is ${summary.dso} days`,
      metric: `${summary.collectionRate.toFixed(1)}% Rate`,
      area: 'Payments',
    });
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK WITH MEMOIZATION & CONTEXT-AWARE ROUTING
// ═══════════════════════════════════════════════════════════════════════════════

export function useAnalyticsEngine(savedInvoices, filters = {}) {
  const {
    period = 'all',
    month = new Date().getUTCMonth() + 1,
    year = new Date().getUTCFullYear(),
    startDate = null,
    endDate = null,
    docType = 'all',
    customerId = null,
    productName = null,
    state = null,
    paymentStatus = null,
    compareMode = false,
  } = filters;

  return useMemo(() => {
    if (!savedInvoices || !Array.isArray(savedInvoices)) return null;

    const now = new Date();

    // ── Build Filter Options from ALL records ──
    const custMap = new Map();
    const prodSet = new Set();
    const stSet = new Set();
    const yrSet = new Set();

    savedInvoices.forEach(inv => {
      const n = inv.buyerName || inv.buyer?.name;
      const g = inv.buyerGstin || inv.buyer?.gstin;
      if (n) {
        const normKey = g ? `gstin:${g.trim().toUpperCase()}` : `name:${normalizeText(n)}`;
        if (!custMap.has(normKey)) {
          custMap.set(normKey, { id: normKey, name: n.trim(), gstin: (g || '').trim() });
        }
      }
      const s = inv.buyerState || inv.buyer?.state;
      if (s && s.trim()) stSet.add(s.trim());
      const d = safeDate(inv.date);
      if (d) yrSet.add(d.getUTCFullYear());
      (inv.items || []).forEach(item => {
        if (item.description && item.description.trim()) prodSet.add(item.description.trim());
      });
    });

    // ── Period Filter ──
    const bounds = period !== 'all' ? getPeriodBounds(period, month, year, startDate, endDate) : null;
    const periodFiltered = bounds ? filterByPeriod(savedInvoices, bounds) : savedInvoices;

    let currentPeriodLabel = 'All Time';
    if (bounds) {
      if (period === 'month') currentPeriodLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      else if (period === 'quarter') currentPeriodLabel = `Q${Math.floor((month - 1) / 3) + 1} ${year}`;
      else if (period === 'year') currentPeriodLabel = `${year}`;
      else if (period === 'custom') currentPeriodLabel = `${bounds.start.toLocaleDateString('en-IN')} – ${bounds.end.toLocaleDateString('en-IN')}`;
    }

    // Helper: Apply entity filters (customer, product, state, payment status) WITHOUT docType filter
    const applyEntityFiltersNoDocType = (invs) => {
      let r = invs;
      if (customerId) {
        const normFilter = normalizeText(customerId).replace(/^gstin:|^name:/, '');
        r = r.filter(i => {
          const rawName = i.buyerName || i.buyer?.name || '';
          const rawGstin = i.buyerGstin || i.buyer?.gstin || '';
          const normKey = rawGstin ? `gstin:${rawGstin.trim().toUpperCase()}` : `name:${normalizeText(rawName)}`;
          return (
            normKey === customerId ||
            normalizeText(rawGstin) === normFilter ||
            normalizeText(rawName) === normFilter ||
            rawGstin === customerId ||
            rawName === customerId
          );
        });
      }
      if (productName) {
        const normP = normalizeText(productName);
        r = r.filter(i => (i.items || []).some(it => normalizeText(it.description) === normP));
      }
      if (state) {
        const normS = normalizeText(state);
        r = r.filter(i => normalizeText(i.buyerState || i.buyer?.state) === normS);
      }
      if (paymentStatus) {
        r = r.filter(i => (i.paymentStatus || 'unpaid') === paymentStatus);
      }
      return r;
    };

    // Full Entity Filters (includes docType filter if set)
    const applyEntityFilters = (invs) => {
      let r = applyEntityFiltersNoDocType(invs);
      if (docType !== 'all') {
        r = r.filter(i => i.mode === docType);
      }
      return r;
    };

    const filtered = applyEntityFilters(periodFiltered);

    // ── CONTEXT-AWARE REVENUE ROUTING (Fixes DocType Collision) ──
    let revenueInvoices;
    if (docType === 'quotation') {
      revenueInvoices = filtered.filter(i => i.mode === 'quotation');
    } else if (docType === 'dc-bill') {
      revenueInvoices = filtered.filter(i => i.mode === 'dc-bill');
    } else if (docType === 'slip-bill') {
      revenueInvoices = filtered.filter(i => i.mode === 'slip-bill');
    } else if (docType === 'gst-bill') {
      revenueInvoices = filtered.filter(i => i.mode === 'gst-bill');
    } else {
      revenueInvoices = filtered.filter(i => i.mode === 'gst-bill' || i.mode === 'slip-bill');
    }

    const gstFiltered = applyEntityFiltersNoDocType(periodFiltered.filter(i => i.mode === 'gst-bill'));

    // Summary & Run-rate
    const summary = computeSummary(revenueInvoices, bounds ? bounds.days : 30);
    const runRate = computeRunRate(revenueInvoices, now, period === 'month' ? month : null, year);

    // Period Comparison
    let comparison = null;
    if (compareMode && period !== 'all') {
      const prevBounds = getPreviousPeriodBounds(period, month, year, startDate, endDate);
      if (prevBounds) {
        const prevFiltered = applyEntityFilters(filterByPeriod(savedInvoices, prevBounds));
        let prevRevenue;
        if (docType === 'quotation') prevRevenue = prevFiltered.filter(i => i.mode === 'quotation');
        else if (docType === 'dc-bill') prevRevenue = prevFiltered.filter(i => i.mode === 'dc-bill');
        else if (docType === 'slip-bill') prevRevenue = prevFiltered.filter(i => i.mode === 'slip-bill');
        else if (docType === 'gst-bill') prevRevenue = prevFiltered.filter(i => i.mode === 'gst-bill');
        else prevRevenue = prevFiltered.filter(i => i.mode === 'gst-bill' || i.mode === 'slip-bill');

        const prevSummary = computeSummary(prevRevenue, prevBounds.days || 30);
        comparison = {
          label: prevBounds.label,
          revenue: { current: summary.totalRevenue, previous: prevSummary.totalRevenue, change: summary.totalRevenue - prevSummary.totalRevenue, pctChange: pctChange(summary.totalRevenue, prevSummary.totalRevenue) },
          gst: { current: summary.totalGST, previous: prevSummary.totalGST, change: summary.totalGST - prevSummary.totalGST, pctChange: pctChange(summary.totalGST, prevSummary.totalGST) },
          collected: { current: summary.totalCollected, previous: prevSummary.totalCollected, change: summary.totalCollected - prevSummary.totalCollected, pctChange: pctChange(summary.totalCollected, prevSummary.totalCollected) },
          outstanding: { current: summary.totalOutstanding, previous: prevSummary.totalOutstanding, change: summary.totalOutstanding - prevSummary.totalOutstanding, pctChange: pctChange(summary.totalOutstanding, prevSummary.totalOutstanding) },
          invoiceCount: { current: summary.invoiceCount, previous: prevSummary.invoiceCount, change: summary.invoiceCount - prevSummary.invoiceCount, pctChange: pctChange(summary.invoiceCount, prevSummary.invoiceCount) },
        };
      }
    }

    const customerAnalysis = computeCustomerAnalysis(revenueInvoices, now);
    const productAnalysis = computeProductAnalysis(revenueInvoices);
    const paymentAnalysis = computePaymentAnalysis(revenueInvoices, now);
    const gstBreakdown = computeGSTBreakdown(gstFiltered);
    const monthlyGST = computeMonthlyGST(gstFiltered, now);
    const dataQuality = computeDataQuality(savedInvoices, now); // Use ALL invoices for data quality scan

    // Documents Section stats: compute stats from periodFiltered with entity filters applied, ignoring docType filter
    const docFilteredBase = applyEntityFiltersNoDocType(periodFiltered);
    const quotationStats = computeQuotationStats(docFilteredBase.filter(i => i.mode === 'quotation'));
    const dcStats = computeDCStats(docFilteredBase.filter(i => i.mode === 'dc-bill'), now);
    const slipStats = computeSlipStats(docFilteredBase.filter(i => i.mode === 'slip-bill'));

    const monthlyTrends = computeMonthlyTrends(revenueInvoices, now);

    return {
      filteredInvoices: filtered,
      revenueInvoices,
      currentPeriodLabel,
      summary,
      runRate,
      comparison,
      monthlyTrends,
      monthlyGST,
      quarterlyData: computeQuarterlyData(revenueInvoices, now, year),
      gstBreakdown,
      customers: customerAnalysis,
      products: productAnalysis,
      hsnData: computeHSNAnalysis(revenueInvoices),
      payment: paymentAnalysis,
      stateData: computeStateAnalysis(revenueInvoices),
      documentMix: computeDocumentMix(periodFiltered),
      quotationStats,
      dcStats,
      slipStats,
      recentActivity: computeRecentActivity(filtered),
      dataQuality,
      insights: generateInsights(summary, customerAnalysis, paymentAnalysis, monthlyTrends, gstBreakdown, dcStats, runRate),
      availableCustomers: [...custMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
      availableProducts: [...prodSet].sort(),
      availableStates: [...stSet].sort(),
      availableYears: [...yrSet].sort((a, b) => b - a),
    };
  }, [savedInvoices, period, month, year, startDate, endDate, docType, customerId, productName, state, paymentStatus, compareMode]);
}

export default useAnalyticsEngine;
