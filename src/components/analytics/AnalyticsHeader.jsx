import React from 'react';

const AnalyticsHeader = ({ activeTab, setActiveTab, onExport }) => {
  const tabs = [
    { key: 'all', label: 'All', icon: '◎' },
    { key: 'gst-bills', label: 'GST', icon: '⬡' },
    { key: 'quotations', label: 'Quotes', icon: '◆' },
    { key: 'dc-bills', label: 'DC', icon: '▷' },
    { key: 'slip-bills', label: 'Slips', icon: '▤' },
  ];

  return (
    <div className="bg-bg-surface rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
      {/* Decorative blurred orbs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 relative z-10">
        {/* Title */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-text-title tracking-tight">Business Analytics</h2>
              <p className="text-sm text-text-desc font-medium">Real-time insights into your business performance</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-bg-surface text-text-title shadow-sm'
                    : 'text-text-desc hover:text-text-body'
                }`}
              >
                <span className="hidden sm:inline mr-1 text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 shadow-lg shadow-slate-300/40 transition-all text-sm font-bold group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
