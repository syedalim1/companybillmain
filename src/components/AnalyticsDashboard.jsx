import React, { useState } from 'react';
import { useAnalyticsEngine } from '@/hooks/useAnalyticsEngine';
import FilterBar from './analytics/FilterBar';
import OverviewSection from './analytics/OverviewSection';
import SalesSection from './analytics/SalesSection';
import CustomerSection from './analytics/CustomerSection';
import ProductSection from './analytics/ProductSection';
import GSTSection from './analytics/GSTSection';
import PaymentSection from './analytics/PaymentSection';
import DocumentsSection from './analytics/DocumentsSection';
import ReportsSection from './analytics/ReportsSection';

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
  )},
  { key: 'revenue', label: 'Revenue', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  )},
  { key: 'customers', label: 'Customers', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  )},
  { key: 'products', label: 'Products', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  )},
  { key: 'gst', label: 'GST', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
  )},
  { key: 'payments', label: 'Payments', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  )},
  { key: 'documents', label: 'Documents', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  )},
  { key: 'reports', label: 'Reports & Export', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
  )},
];

const AnalyticsDashboard = ({ savedInvoices }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [filters, setFilters] = useState({
    period: 'all',
    month: new Date().getUTCMonth() + 1,
    year: new Date().getUTCFullYear(),
    startDate: null,
    endDate: null,
    docType: 'all',
    customerId: null,
    productName: null,
    state: null,
    paymentStatus: null,
    compareMode: false,
  });

  const analytics = useAnalyticsEngine(savedInvoices, filters);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-text-desc">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          <span className="font-medium">Loading business analytics...</span>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <OverviewSection analytics={analytics} onFilterChange={handleFilterChange} />;
      case 'revenue': return <SalesSection analytics={analytics} onFilterChange={handleFilterChange} />;
      case 'customers': return <CustomerSection analytics={analytics} onFilterChange={handleFilterChange} />;
      case 'products': return <ProductSection analytics={analytics} onFilterChange={handleFilterChange} />;
      case 'gst': return <GSTSection analytics={analytics} onFilterChange={handleFilterChange} />;
      case 'payments': return <PaymentSection analytics={analytics} onFilterChange={handleFilterChange} />;
      case 'documents': return <DocumentsSection analytics={analytics} filters={filters} onFilterChange={handleFilterChange} />;
      case 'reports': return <ReportsSection analytics={analytics} filters={filters} savedInvoices={savedInvoices} />;
      default: return <OverviewSection analytics={analytics} onFilterChange={handleFilterChange} />;
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* HEADER */}
      <div className="bg-bg-surface rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-25 transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-15 transform -translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-text-title tracking-tight">Business Intelligence Center</h2>
              <p className="text-xs text-text-desc font-medium mt-0.5">
                {analytics.currentPeriodLabel} • {analytics.filteredInvoices.length} active documents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <FilterBar filters={filters} setFilters={setFilters} analytics={analytics} />

      {/* SECTION NAVIGATION */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit min-w-full lg:min-w-0">
          {SECTIONS.map(section => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                activeSection === section.key
                  ? 'bg-white text-text-title shadow-sm'
                  : 'text-text-desc hover:text-text-body'
              }`}
            >
              <span className={activeSection === section.key ? 'text-indigo-600' : ''}>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* ACTIVE SECTION CONTENT */}
      <div className="min-h-[400px]">
        {renderSection()}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;