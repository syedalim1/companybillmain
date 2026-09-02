import React from 'react';

const DocumentMixPanel = ({ analytics }) => {
  if (!analytics) return null;

  const { documentMix, totalDocumentsAll } = analytics;

  const icons = {
    'GST Bills': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
      </svg>
    ),
    'Quotations': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
      </svg>
    ),
    'DC Bills': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    'Slip Bills': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  };

  return (
    <div className="bg-bg-surface rounded-3xl p-6 shadow-lg border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-text-title">Document Mix</h3>
          <p className="text-text-desc text-sm">Type distribution</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-text-title">{totalDocumentsAll}</span>
          <div className="text-[10px] text-text-desc font-bold uppercase tracking-wider">Total Docs</div>
        </div>
      </div>

      {totalDocumentsAll === 0 ? (
        <div className="flex items-center justify-center h-32 text-text-desc text-sm">No documents found</div>
      ) : (
        <>
          {/* Stacked Bar */}
          <div className="h-5 w-full rounded-full overflow-hidden flex mb-5 bg-slate-100">
            {documentMix.map(item => (
              item.count > 0 && (
                <div
                  key={item.label}
                  className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  title={`${item.label}: ${item.count} (${item.percentage.toFixed(1)}%)`}
                />
              )
            ))}
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-2 gap-3">
            {documentMix.map(item => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  {icons[item.label]}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-text-desc font-medium truncate">{item.label}</div>
                  <div className="text-sm font-bold text-text-title">
                    {item.count}
                    <span className="text-[10px] text-text-desc ml-1">({item.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentMixPanel;
