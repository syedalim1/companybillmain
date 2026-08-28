import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

export default function SavedInvoicesList({
  savedInvoices,
  handleLoadInvoice,
  handleEditInvoice,
  handleOpenPaymentModal,
  handleDeleteInvoice,
  currentMode, // Filter by current mode
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine section title dynamically
  const title = useMemo(() => {
    switch (currentMode) {
      case 'gst-bill':
        return 'Saved Invoices';
      case 'dc-bill':
        return 'Saved Delivery Challans';
      case 'slip-bill':
        return 'Saved Slip Bills';
      default:
        return 'Saved Quotations';
    }
  }, [currentMode]);

  // Filter invoices based on current mode
  const filteredByMode = useMemo(() => {
    return savedInvoices.filter(invoice => invoice.mode === currentMode);
  }, [savedInvoices, currentMode]);

  // Apply search filter
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return filteredByMode;

    const query = searchQuery.toLowerCase().trim();
    return filteredByMode.filter(invoice => {
      // Search in snapshot data first, fall back to relation data
      const buyerName = (invoice.buyerName || invoice.buyer?.name || '').toLowerCase();
      const invoiceNo = (invoice.invoiceNo || '').toLowerCase();
      const dcNo = (invoice.dcNo || '').toLowerCase();
      const grandTotal = (invoice.grandTotal || 0).toString();
      const date = (invoice.date || '').toLowerCase();

      return (
        buyerName.includes(query) ||
        invoiceNo.includes(query) ||
        dcNo.includes(query) ||
        grandTotal.includes(query) ||
        date.includes(query)
      );
    });
  }, [filteredByMode, searchQuery]);

  // Limit to last 5 invoices unless search mode is active or query is entered
  const displayedInvoices = useMemo(() => {
    if (showSearch || searchQuery.trim()) {
      return filteredInvoices;
    }
    return filteredByMode.slice(0, 5);
  }, [filteredByMode, filteredInvoices, showSearch, searchQuery]);

  // Get buyer name from snapshot fields with fallback to relation
  const getBuyerName = (invoice) => {
    return invoice.buyerName || invoice.buyer?.name || 'No Buyer';
  };

  const handleExportList = () => {
    if (filteredByMode.length === 0) {
      alert("No data to export");
      return;
    }
    
    // Export what the user currently sees (or the whole mode list if no search)
    const dataToExport = searchQuery.trim() ? filteredInvoices : filteredByMode;
    
    const exportData = dataToExport.map(inv => ({
      'Date': inv.date ? new Date(inv.date).toLocaleDateString('en-GB') : '',
      'Document No': currentMode === 'dc-bill' ? inv.dcNo : inv.invoiceNo,
      'Customer Name': getBuyerName(inv),
      'Customer GSTIN': inv.buyerGstin || inv.buyer?.gstin || '',
      'Status': currentMode === 'dc-bill' ? inv.dcStatus : inv.paymentStatus,
      'Taxable Amount': inv.subtotal || 0,
      'Total Tax': (inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0),
      'Grand Total': inv.grandTotal || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Documents");
    
    const prefix = currentMode === 'gst-bill' ? 'GST_Invoices' : currentMode === 'quotation' ? 'Quotations' : currentMode === 'dc-bill' ? 'Delivery_Challans' : 'Slip_Bills';
    XLSX.writeFile(workbook, `${prefix}_List.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Header with Collapse and Search controls */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 group text-left focus:outline-none cursor-pointer"
        >
          <svg
            className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-lg font-bold text-gray-900 group-hover:text-brand-primary transition-colors">
            {title}
            <span className="ml-2 text-xs font-normal text-slate-400">
              ({filteredByMode.length})
            </span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          {isOpen && filteredByMode.length > 0 && (
            <>
              <button
                onClick={handleExportList}
                className="p-2 rounded-xl transition-all duration-200 flex items-center justify-center border cursor-pointer bg-white border-slate-200 text-slate-600 hover:text-green-600 hover:border-green-600 hover:shadow-sm"
                title="Export List to Excel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              </button>

              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) setSearchQuery(''); // Reset search on close
                }}
                className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center border cursor-pointer ${
                  showSearch
                    ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-sm shadow-brand-primary/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-brand-primary hover:border-brand-primary hover:shadow-sm'
                }`}
                title={showSearch ? "Close Search" : "Search Invoices"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapsible content section */}
      {isOpen && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Search Bar */}
          {showSearch && filteredByMode.length > 0 && (
            <div className="relative animate-in fade-in zoom-in-95 duration-200">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
              <input
                type="text"
                placeholder="Search by name, invoice no, amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-text-title focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all placeholder:text-text-desc/60"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-text-title dark:hover:text-text-title transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Results count */}
          {searchQuery && filteredByMode.length > 0 && (
            <p className="text-xs text-text-desc px-1">
              {filteredInvoices.length} of {filteredByMode.length} results
            </p>
          )}

          {/* Empty State */}
          {filteredByMode.length === 0 && (
            <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-8 text-center border border-slate-100">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <p className="text-slate-500 text-sm">
                No {currentMode === 'gst-bill' ? 'invoices' : currentMode === 'dc-bill' ? 'delivery challans' : currentMode === 'slip-bill' ? 'slip bills' : 'quotations'} saved yet.
              </p>
            </div>
          )}

          {/* No search results */}
          {filteredByMode.length > 0 && filteredInvoices.length === 0 && searchQuery && (
            <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-6 text-center border border-slate-100">
              <p className="text-slate-500 text-sm">No matching records found for &quot;{searchQuery}&quot;</p>
            </div>
          )}

          {/* Invoice List — Responsive card layout */}
          {displayedInvoices.map((invoice) => (
            <div 
              key={invoice.id} 
              className="bg-bg-surface rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow group"
            >
              {/* Top Row: Invoice info + Badge */}
              <div className="flex items-start justify-between gap-3">
                {/* Invoice Info - Clickable */}
                <button
                  className="flex-1 text-left min-w-0 cursor-pointer"
                  onClick={() => handleLoadInvoice(invoice)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      currentMode === 'gst-bill' ? 'bg-blue-50 text-blue-600 dark:text-blue-400' : 
                      currentMode === 'dc-bill' ? 'bg-rose-50 text-rose-600 dark:text-rose-400' : 
                      currentMode === 'slip-bill' ? 'bg-amber-50 text-amber-600 dark:text-amber-400' :
                      'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                    }`}>
                      {currentMode === 'dc-bill' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-text-title truncate">
                        {currentMode === 'gst-bill' ? 'INV' : currentMode === 'dc-bill' ? invoice.dcNo || 'DC' : currentMode === 'slip-bill' ? 'SLIP' : 'QTN'}-{currentMode === 'dc-bill' ? '' : (invoice.invoiceNo || 'Draft')}
                      </div>
                      <div className="text-xs text-text-desc truncate">
                        {getBuyerName(invoice)}
                      </div>
                      <div className="text-xs text-text-desc flex items-center gap-2 mt-0.5">
                        <span>{new Date(invoice.date).toLocaleDateString('en-GB')}</span>
                        <span>•</span>
                        <span className="font-medium text-text-title">₹{(invoice.grandTotal || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Payment Status Badge / DC Status Badge */}
                <div className={`flex-shrink-0 flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  currentMode === 'dc-bill' ? (
                    invoice.dcStatus === 'delivered' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                    invoice.dcStatus === 'in-transit' ? 'bg-blue-100 text-blue-700 dark:text-blue-400' :
                    invoice.dcStatus === 'returned' ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' :
                    'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
                  ) : (
                    invoice.paymentStatus === 'paid' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                    invoice.paymentStatus === 'partial' ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400' :
                    invoice.paymentStatus === 'overdue' ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' :
                    'bg-slate-100/80 text-slate-600 dark:text-slate-300'
                  )
                }`}>
                  {currentMode === 'dc-bill' ? (
                    invoice.dcStatus === 'delivered' ? '✓ Delivered' :
                    invoice.dcStatus === 'in-transit' ? '→ Transit' :
                    invoice.dcStatus === 'returned' ? '↺ Returned' : '○ Pending'
                  ) : (
                    invoice.paymentStatus === 'paid' ? '✓ Paid' :
                    invoice.paymentStatus === 'partial' ? 'Partial' :
                    invoice.paymentStatus === 'overdue' ? 'Overdue' : 'Unpaid'
                  )}
                </div>
              </div>

              {/* Bottom Row: Actions */}
              <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-slate-100">
                <button
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors cursor-pointer"
                  onClick={() => handleEditInvoice(invoice)}
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    invoice.paymentStatus === 'paid' ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30' :
                    invoice.paymentStatus === 'partial' ? 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-950/30' :
                    'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => handleOpenPaymentModal(invoice)}
                  title="Payment Status"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </button>
                <button
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                  onClick={() => handleDeleteInvoice(invoice.id)}
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Show banner if search is inactive and there are more than 5 bills */}
          {!showSearch && filteredByMode.length > 5 && (
            <div className="flex items-center justify-between p-3.5 bg-slate-50/70 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs animate-in fade-in duration-300">
              <span className="text-slate-500">
                Showing the 5 most recent bills.
              </span>
              <button
                onClick={() => setShowSearch(true)}
                className="font-semibold text-brand-primary hover:text-brand-primary-hover hover:underline transition-colors focus:outline-none cursor-pointer"
              >
                Search & View All {filteredByMode.length} Bills
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}