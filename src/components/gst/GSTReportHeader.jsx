import React from 'react';
import { exportProfessionalGSTExcel, exportGSTCSV, exportGSTJSON } from './GSTExcelExporter';

const CalendarIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const GSTReportHeader = ({ selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, months, years, monthlyData }) => {
  const monthLabel = months.find(m => m.value === selectedMonth)?.label || '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
        {/* Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Month</label>
            <div className="relative min-w-[140px]">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none cursor-pointer"
              >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-slate-400">
                <CalendarIcon />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-[100px] cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <button
            onClick={handlePrint}
            disabled={!monthlyData || monthlyData.totalInvoices === 0}
            className="px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            🖨️ Print Report
          </button>
          <button
            onClick={() => exportGSTJSON({ monthlyData, selectedMonth, selectedYear, monthLabel })}
            disabled={!monthlyData || monthlyData.totalInvoices === 0}
            className="px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {'{ }'} JSON
          </button>
          <button
            onClick={() => exportGSTCSV({ monthlyData, selectedMonth, selectedYear, monthLabel })}
            disabled={!monthlyData || monthlyData.totalInvoices === 0}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <DownloadIcon /> CSV Export
          </button>
          <button
            onClick={() => exportProfessionalGSTExcel({ monthlyData, selectedMonth, selectedYear, monthLabel })}
            disabled={!monthlyData || monthlyData.totalInvoices === 0}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-xs hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-200/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <DownloadIcon /> Professional Excel Workbook (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
};

export default GSTReportHeader;
