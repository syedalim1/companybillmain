import React, { useState, useEffect } from 'react';

// --- Advanced Chart Components ---

const RevenueTooltip = ({ value, count, growth, label }) => (
  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none">
    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl flex flex-col items-center gap-1 min-w-[100px]">
      <span className="text-gray-400 font-medium text-[10px] uppercase tracking-wider">{label}</span>
      <span className="text-lg font-bold">₹{Math.round(value || 0).toLocaleString('en-IN')}</span>
      <div className="flex items-center gap-2 text-[10px] text-gray-300 w-full justify-between pt-1 border-t border-gray-700 mt-1">
        <span>{count} inv.</span>
        {growth !== 0 && (
          <span className={growth > 0 ? "text-green-400" : "text-red-400"}>
            {growth > 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(0)}%
          </span>
        )}
      </div>
      {/* Triangle */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const ChartBar = ({ label, value, maxValue, colorStart, colorEnd, count, growth, delay }) => {
  const height = maxValue > 0 ? Math.max((value / maxValue) * 100, 4) : 0;
  
  return (
    <div className="flex flex-col items-center flex-1 group min-w-[32px] sm:min-w-[48px] h-full justify-end relative">
      {/* Vertical Hover Line (Optional aesthetic) */}
      <div className="absolute bottom-0 w-[1px] h-full bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity z-0 top-0"></div>
      
      {/* Bar Container */}
      <div className="relative w-full h-full flex items-end justify-center z-10 px-1 sm:px-2">
        <RevenueTooltip value={value} count={count} growth={growth} label={label} />
        
        {/* Animated Bar */}
        <div 
          className={`w-full rounded-t-lg bg-gradient-to-t ${colorStart} ${colorEnd} transition-all duration-700 ease-out shadow-sm group-hover:shadow-md group-hover:brightness-110 relative overflow-hidden`}
          style={{ 
            height: `${height}%`,
            transitionDelay: `${delay}ms`
          }}
        >
          {/* Glass Shine Effect */}
          <div className="absolute top-0 left-0 w-full h-1/3 bg-white opacity-20 transform -skew-y-12"></div>
        </div>
      </div>

      {/* Label */}
      <div className="mt-3 text-[10px] sm:text-xs   font-medium group-hover:text-text-title transition-colors">
        {label}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon, color = "green", trend }) => {
  const colorClasses = {
    green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-100" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
    red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" },
  };
  const c = colorClasses[color] || colorClasses.green;
  
  return (
    <div className={`bg-bg-surface   p-5 rounded-2xl shadow-sm border ${c.border}     hover:shadow-md transition-shadow relative overflow-hidden group`}>
      {/* Background Icon Watermark */}
      <div className={`absolute -right-4 -bottom-4 opacity-5 transform rotate-12 scale-150 pointer-events-none group-hover:scale-125 transition-transform duration-500`}>
        {icon}
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h4 className="text-xs font-bold   uppercase tracking-wider">{title}</h4>
        <div className={`p-2 ${c.bg} rounded-xl`}>{icon}</div>
      </div>
      <div className="relative z-10">
        <p className="text-2xl sm:text-3xl font-extrabold text-text-title tracking-tight">{value}</p>
        <div className="flex items-center gap-2 mt-2">
          {trend && (
             <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
               {trend > 0 ? '+' : ''}{trend}%
             </span>
          )}
          <span className={`text-xs ${c.text} font-medium`}>{subtitle}</span>
        </div>
      </div>
    </div>
  );
};

const AnalyticsDashboard = ({ savedInvoices }) => {
  const [analytics, setAnalytics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('all'); 

  useEffect(() => {
    calculateAnalytics();
  }, [savedInvoices, selectedPeriod, selectedMonth, selectedYear, activeTab]);

  const calculateAnalytics = () => {
    let filteredInvoices = savedInvoices;

    // Filter by period
    if (selectedPeriod !== 'all') {
        let startDate, endDate;
        switch (selectedPeriod) {
          case 'month': startDate = new Date(selectedYear, selectedMonth - 1, 1); endDate = new Date(selectedYear, selectedMonth, 0); break;
          case 'quarter': const quarterStart = Math.floor((selectedMonth - 1) / 3) * 3; startDate = new Date(selectedYear, quarterStart, 1); endDate = new Date(selectedYear, quarterStart + 3, 0); break;
          case 'year': startDate = new Date(selectedYear, 0, 1); endDate = new Date(selectedYear, 11, 31); break;
          default: startDate = new Date(2000, 0, 1); endDate = new Date();
        }
        filteredInvoices = savedInvoices.filter(invoice => { const invoiceDate = new Date(invoice.date); return invoiceDate >= startDate && invoiceDate <= endDate; });
    }

    let typeFilteredInvoices = filteredInvoices;
    if (activeTab === 'gst-bills') typeFilteredInvoices = filteredInvoices.filter(inv => inv.mode === 'gst-bill');
    else if (activeTab === 'quotations') typeFilteredInvoices = filteredInvoices.filter(inv => inv.mode === 'quotation');
    else if (activeTab === 'dc-bills') typeFilteredInvoices = filteredInvoices.filter(inv => inv.mode === 'dc-bill');
    else if (activeTab === 'slip-bills') typeFilteredInvoices = filteredInvoices.filter(inv => inv.mode === 'slip-bill');

    const gstBillsCount = filteredInvoices.filter(inv => inv.mode === 'gst-bill').length;
    const quotationsCount = filteredInvoices.filter(inv => inv.mode === 'quotation').length;
    const dcBillsCount = filteredInvoices.filter(inv => inv.mode === 'dc-bill').length;
    const slipBillsCount = filteredInvoices.filter(inv => inv.mode === 'slip-bill').length;

    // Helper for safe numeric conversion
    const safeNum = (val) => {
      const n = parseFloat(val);
      return isNaN(n) ? 0 : n;
    };

    // REVENUE FILTER: Exclude Quotations AND DC Bills from Financial Metrics strictly
    const validRevenueInvoices = typeFilteredInvoices.filter(inv => {
        // If we are on 'all' tab or 'gst-bills' tab, ONLY count gst-bill revenue
        if (activeTab === 'all' || activeTab === 'gst-bills') {
            return inv.mode === 'gst-bill';
        }
        // If we are explicitly looking at Slip Bills, count slip-bill revenue
        if (activeTab === 'slip-bills') {
            return inv.mode === 'slip-bill';
        }
        // If we are explicitly looking at Quotations, count quotation revenue
        if (activeTab === 'quotations') {
            return inv.mode === 'quotation';
        }
        return false;
    });

    // DOCUMENT COUNTS (Include Unpaid Quotes as they are documents)
    const paymentStats = {
      paid: validRevenueInvoices.filter(inv => inv.paymentStatus === 'paid').length,
      partial: validRevenueInvoices.filter(inv => inv.paymentStatus === 'partial').length,
      unpaid: validRevenueInvoices.filter(inv => inv.paymentStatus === 'unpaid' || !inv.paymentStatus).length,
      overdue: validRevenueInvoices.filter(inv => inv.paymentStatus === 'overdue').length,
    };

    const paidAmount = validRevenueInvoices
      .filter(inv => inv.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + safeNum(inv.grandTotal), 0);

    const pendingAmount = validRevenueInvoices
      .filter(inv => inv.paymentStatus !== 'paid')
      .reduce((sum, inv) => sum + safeNum(inv.grandTotal), 0);
    
    // If no filtered documents at all
    if (typeFilteredInvoices.length === 0) {
       setAnalytics({
        totalInvoices: 0, totalRevenue: 0, totalGST: 0, topProducts: [], topBuyers: [],
        monthlyTrends: [], gstBillsCount, quotationsCount, dcBillsCount, slipBillsCount, paymentStats, paidAmount, pendingAmount,
      });
      return;
    }

    // --- FINANCIAL METRICS (Using validRevenueInvoices) ---

    const totalRevenue = validRevenueInvoices.reduce((sum, inv) => sum + safeNum(inv.grandTotal), 0);
    const totalGST = validRevenueInvoices.reduce((sum, inv) =>
      sum + (safeNum(inv.cgstAmount) + safeNum(inv.sgstAmount) + safeNum(inv.igstAmount)), 0
    );

    const productSales = {};
    validRevenueInvoices.forEach(invoice => {
      (invoice.items || []).forEach(item => {
        const key = item.description || 'Other Item';
        if (!productSales[key]) productSales[key] = { name: key, totalQuantity: 0, totalRevenue: 0 };
        const qty = safeNum(item.quantity);
        const rate = safeNum(item.rate);
        const discount = safeNum(item.discount);
        const itemTotal = qty * rate * (1 - discount / 100);
        productSales[key].totalQuantity += qty;
        productSales[key].totalRevenue += itemTotal;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);

    const buyerSales = {};
    validRevenueInvoices.forEach(invoice => {
      const buyerName = invoice.buyerName || invoice.buyer?.name || 'Unknown Buyer';
      const buyerKey = invoice.buyerGstin || invoice.buyer?.gstin || buyerName;
      if (!buyerSales[buyerKey]) buyerSales[buyerKey] = { name: buyerName, gstin: invoice.buyerGstin || invoice.buyer?.gstin || '', totalInvoices: 0, totalRevenue: 0 };
      buyerSales[buyerKey].totalInvoices += 1;
      buyerSales[buyerKey].totalRevenue += safeNum(invoice.grandTotal);
    });
    const topBuyers = Object.values(buyerSales).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);

    // Enhanced Monthly Trends (Using Valid Revenue Invoices)
    const monthlyTrends = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthInvoices = validRevenueInvoices.filter(inv => {
        if (!inv.date) return false;
        const invDate = new Date(inv.date);
        if (isNaN(invDate.getTime())) return false;
        return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === date.getFullYear();
      });
      const revenue = monthInvoices.reduce((sum, inv) => sum + safeNum(inv.grandTotal), 0);
      
      monthlyTrends.push({
        month: date.toLocaleDateString('en-IN', { month: 'short' }),
        revenue,
        invoices: monthInvoices.length,
        growth: 0 
      });
    }

    // Post-process growth
    for (let i = 1; i < monthlyTrends.length; i++) {
        const prev = monthlyTrends[i-1].revenue;
        const curr = monthlyTrends[i].revenue;
        if (prev > 0) {
            monthlyTrends[i].growth = ((curr - prev) / prev) * 100;
        }
    }

    setAnalytics({
      totalInvoices: validRevenueInvoices.length, // Show valid revenue docs in metric
      totalDocuments: typeFilteredInvoices.length, // Total physical docs
      totalRevenue, totalGST, topProducts, topBuyers, monthlyTrends,
      gstBillsCount, quotationsCount, dcBillsCount, slipBillsCount, paymentStats, paidAmount, pendingAmount,
    });
  };

  const handleExportAnalytics = async () => {
    if (!analytics) return;
    const XLSX = (await import('xlsx'));
    const wb = XLSX.utils.book_new();
    const summaryData = [
      ['Business Analytics Report'],
      [`Period: ${selectedPeriod === 'all' ? 'All Time' : `${selectedPeriod} - ${selectedMonth}/${selectedYear}`}`],
      [`Type: ${activeTab === 'all' ? 'All Documents' : activeTab}`],
      [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
      [],
      ['SUMMARY'],
      ['Total Valid Invoices', analytics.totalInvoices],
      ['Total Revenue (₹)', analytics.totalRevenue.toFixed(2)],
      ['Total GST (₹)', analytics.totalGST.toFixed(2)],
      // ... same export logic
    ];
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    XLSX.writeFile(wb, `Analytics_${activeTab}.xlsx`);
  };

  if (!analytics) return <div className="flex justify-center items-center h-64 text-gray-400">Loading data...</div>;

  const maxMonthlyRevenue = Math.max(...(analytics.monthlyTrends || []).map(t => t.revenue || 0), 1);
  const activeMonthsCount = (analytics.monthlyTrends || []).filter(m => m.revenue > 0).length || 1;
  const averageRevenue = (analytics.totalRevenue || 0) / activeMonthsCount;

  // Gradient selection based on tab
  const getGradient = () => {
      if (activeTab === 'gst-bills') return { start: 'from-blue-500', end: 'to-cyan-400' };
      if (activeTab === 'quotations') return { start: 'from-purple-500', end: 'to-pink-400' };
      if (activeTab === 'dc-bills') return { start: 'from-rose-500', end: 'to-orange-400' };
      if (activeTab === 'slip-bills') return { start: 'from-amber-500', end: 'to-yellow-400' };
      return { start: 'from-indigo-600', end: 'to-blue-400' }; // Default
  };
  const gradient = getGradient();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-text-body bg-bg-base min-h-screen">
      
      {/* Premium Header */}
      <div className="bg-bg-surface   rounded-3xl p-6 shadow-sm border border-slate-100     mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-950/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
            <div>
               <h2 className="text-3xl font-extrabold text-text-title tracking-tight">Dashboard</h2>
               <p className="  font-medium">Overview of your business performance</p>
            </div>
             <div className="flex flex-wrap gap-2">
               <div className="flex bg-slate-100   p-1 rounded-xl">
                   {['all', 'gst-bills', 'quotations', 'dc-bills', 'slip-bills'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab
                                ? 'bg-bg-surface dark:bg-slate-700 text-text-title shadow-sm'
                                : '  hover:text-text-body'
                            }`}
                        >
                            {tab === 'all' ? 'All' : tab === 'gst-bills' ? 'GST' : tab === 'quotations' ? 'Quotes' : tab === 'dc-bills' ? 'DC' : 'Slips'}
                        </button>
                    ))}
               </div>
               <button onClick={handleExportAnalytics} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-black dark:hover:bg-slate-600 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 transition-all text-sm font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Export
               </button>
            </div>
         </div>
      </div>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard
          title="Total Revenue"
          value={`₹${Math.round(analytics.totalRevenue || 0).toLocaleString("en-IN")}`}
          subtitle={`Across ${analytics.totalInvoices} paid docs`}
          color="indigo"
          icon={<svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
        />
        <MetricCard
          title="GST Liability"
          value={`₹${Math.round(analytics.totalGST || 0).toLocaleString("en-IN")}`}
          subtitle="Tax collected (Valid)"
          color="purple"
          icon={<svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"></path></svg>}
        />
        <MetricCard
          title="Collections"
          value={`₹${Math.round(analytics.paidAmount || 0).toLocaleString("en-IN")}`}
          subtitle={`${analytics.paymentStats.paid} fully paid`}
          color="green"
          icon={<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
        />
        <MetricCard
          title="Outstanding"
          value={`₹${Math.round(analytics.pendingAmount || 0).toLocaleString("en-IN")}`}
          subtitle={`${analytics.paymentStats.unpaid} unpaid`}
          color="red"
          icon={<svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
        />
        <MetricCard
          title="DC Bills"
          value={analytics.dcBillsCount || 0}
          subtitle="Delivery challans"
          color="rose"
          icon={<svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>}
        />
      </div>

      {/* Advanced Chart Section */}
      <div className="bg-bg-surface   text-text-body rounded-3xl p-6 md:p-8 shadow-lg border border-slate-100     mb-8 relative">
         <div className="flex items-center justify-between mb-8">
            <div>
                <h3 className="text-xl font-bold text-text-title">Revenue Flow</h3>
                <p className="  text-sm mt-1">Monthly performance (Valid Revenue Only)</p>
            </div>
            <div className="text-right">
                <div className="text-2xl font-bold">₹{isNaN(averageRevenue) ? 0 : Math.round(averageRevenue).toLocaleString('en-IN')}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Avg. Monthly</div>
            </div>
         </div>
         
         {/* Chart Area */}
         <div className="h-64 sm:h-80 w-full relative">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full h-px bg-gray-100   border-t border-dashed"></div>
                ))}
            </div>

            {/* Average Line */}
            {averageRevenue > 0 && maxMonthlyRevenue > 0 && (
                <div 
                    className="absolute w-full border-t-2 border-dashed border-gray-300 z-0 opacity-50"
                    style={{ bottom: `${Math.min((averageRevenue / maxMonthlyRevenue) * 100, 100)}%` }}
                >
                    <div className="absolute -top-3 right-0 text-[10px] bg-gray-100 px-1 rounded text-gray-500">Avg</div>
                </div>
            )}

            {/* Bars */}
            <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-4 pl-2">
                {analytics.monthlyTrends.map((trend, index) => (
                    <ChartBar 
                        key={index}
                        label={trend.month}
                        value={trend.revenue}
                        maxValue={maxMonthlyRevenue}
                        colorStart={gradient.start}
                        colorEnd={gradient.end}
                        count={trend.invoices}
                        delay={index * 50} 
                    />
                ))}
            </div>
         </div>
      </div>

      {/* Bottom Grid: Products & Buyers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Top Products - Premium List */}
         <div className="bg-bg-surface   rounded-3xl p-6 shadow-sm border border-slate-100    ">
            <h3 className="text-lg font-bold text-text-title mb-6">Top Performing Products</h3>
            <div className="space-y-4">
               {analytics.topProducts.map((product, index) => (
                   <div key={index} className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all">
                       <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400' : 'bg-slate-200    '}`}>
                               #{index + 1}
                           </div>
                           <div>
                                <div className="font-bold text-text-title">{product.name}</div>
                                <div className="text-xs  ">{Math.round(product.totalQuantity).toLocaleString('en-IN')} units sold</div>
                           </div>
                       </div>
                       <div className="text-right">
                            <div className="font-bold text-text-title">₹{Math.round(product.totalRevenue).toLocaleString('en-IN')}</div>
                       </div>
                   </div>
               ))}
               {analytics.topProducts.length === 0 && <div className="text-center text-gray-400 py-10">No data available</div>}
            </div>
         </div>

         {/* Top Buyers - Premium List */}
         <div className="bg-bg-surface   rounded-3xl p-6 shadow-sm border border-slate-100    ">
            <h3 className="text-lg font-bold text-text-title mb-6">Top Customers</h3>
             <div className="space-y-4">
               {analytics.topBuyers.map((buyer, index) => (
                   <div key={index} className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all">
                       <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
                               {buyer.name.charAt(0)}
                           </div>
                           <div>
                                <div className="font-bold text-text-title">{buyer.name}</div>
                                <div className="text-xs  ">{buyer.totalInvoices} orders</div>
                           </div>
                       </div>
                       <div className="text-right">
                            <div className="font-bold text-text-title">₹{Math.round(buyer.totalRevenue).toLocaleString('en-IN')}</div>
                       </div>
                   </div>
               ))}
                {analytics.topBuyers.length === 0 && <div className="text-center text-gray-400 py-10">No data available</div>}
            </div>
         </div>
      </div>

    </div>
  );
};

export default AnalyticsDashboard;