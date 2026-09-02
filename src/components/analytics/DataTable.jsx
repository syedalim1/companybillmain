import React, { useState } from 'react';
import { formatINR, safeDate } from '@/hooks/useAnalyticsEngine';

const DataTable = ({ columns, data, title, subtitle, onRowClick, emptyMessage = 'No data available', maxRows = 20 }) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  let sorted = [...(data || [])];
  if (sortKey) {
    sorted.sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      const na = typeof av === 'number' ? av : parseFloat(av) || 0;
      const nb = typeof bv === 'number' ? bv : parseFloat(bv) || 0;
      if (!isNaN(na) && !isNaN(nb)) return sortDir === 'asc' ? na - nb : nb - na;
      return sortDir === 'asc' ? String(av || '').localeCompare(String(bv || '')) : String(bv || '').localeCompare(String(av || ''));
    });
  }

  const totalPages = Math.ceil(sorted.length / maxRows);
  const paged = sorted.slice(page * maxRows, (page + 1) * maxRows);

  return (
    <div className="bg-bg-surface rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {(title || subtitle) && (
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            {title && <h4 className="text-base font-bold text-text-title">{title}</h4>}
            {subtitle && <p className="text-xs text-text-desc mt-0.5">{subtitle}</p>}
          </div>
          <span className="text-xs text-text-desc font-medium">{sorted.length} records</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-b border-slate-100">
              {columns.map(col => (
                <th key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-4 py-2.5 text-left text-[10px] font-bold text-text-desc uppercase tracking-wider whitespace-nowrap ${col.sortable !== false ? 'cursor-pointer hover:text-text-title' : ''} ${col.align === 'right' ? 'text-right' : ''}`}>
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && <span className="text-indigo-500">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-text-desc text-sm">{emptyMessage}</td></tr>
            ) : paged.map((row, i) => (
              <tr key={row.id || i}
                onClick={() => onRowClick && onRowClick(row)}
                className={`border-b border-slate-50 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-indigo-50/40' : 'hover:bg-slate-50/60'}`}>
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 whitespace-nowrap ${col.align === 'right' ? 'text-right' : ''}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-slate-100">
          <span className="text-xs text-text-desc">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 text-text-body disabled:opacity-40 hover:bg-slate-200 transition-colors">Prev</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 text-text-body disabled:opacity-40 hover:bg-slate-200 transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
