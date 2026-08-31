import CompanyBillHeader from "@/components/CompanyForm";
import ClientForm from "@/components/ClientForm";
import BillingShippingForm from "@/components/BillingShippingForm";
import InvoiceDetailsForm from "@/components/InvoiceDetailsForm";
import ItemsForm from "@/components/ItemsForm";
import AdditionalChargesForm from "@/components/AdditionalChargesForm";
import SavedInvoicesList from "@/components/SavedInvoicesList";

export default function InvoiceForm({
  currentMode,
  setCurrentMode,
  quotationGstOption,
  handleQuotationGstChange,
  invoiceData,
  handleInputChange,
  handleItemChange,
  addItem,
  removeItem,
  editingInvoiceId,
  setEditingInvoiceId,
  setInvoiceData,
  handleSaveInvoice,
  handleUpdateInvoice,
  handleExportToExcel,
  setShowEmailModal,
  savedInvoices,
  handleLoadInvoice,
  handleEditInvoice,
  handleOpenPaymentModal,
  handleDeleteInvoice,
  isSaving,
  resetToDefault,
  handleGeneratePDF,
  isGenerating,
}) {
  // Handle cancel editing — use centralized reset if available
  const handleCancelEditing = () => {
    if (resetToDefault) {
      resetToDefault();
    } else {
      setEditingInvoiceId(null);
    }
  };

  return (
    <div className="flex-1 text-gray-800 max-w-2xl print:hidden mx-auto lg:mx-0 space-y-6 animate-in fade-in duration-500">
      {/* Back to landing button */}
      <button
        onClick={() => setCurrentMode('landing')}
        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to Home
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className={`text-3xl font-bold tracking-tight ${currentMode === 'dc-bill' ? 'text-rose-600' : (currentMode === 'slip-bill' ? 'text-amber-600' : 'text-gray-900')}`}>
          {currentMode === 'gst-bill' ? 'GST Invoice Generator' : (currentMode === 'dc-bill' ? 'Delivery Challan Generator' : (currentMode === 'slip-bill' ? 'Slip Bill Generator' : 'Quotation Generator'))}
        </h1>
        <p className="text-gray-500 mt-2">
          {currentMode === 'gst-bill' ? 'Create professional compliant tax invoices.' : (currentMode === 'dc-bill' ? 'Create delivery challans for goods movement.' : (currentMode === 'slip-bill' ? 'Quick receipts for local business.' : 'Generate quick estimates for your clients.'))}
        </p>
      </div>

      {/* Editing Mode Indicator */}
      {editingInvoiceId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          <span className="text-amber-800 text-sm font-medium">
            Editing Invoice #{invoiceData.invoiceDetails?.invoiceNo || 'Draft'}
          </span>
        </div>
      )}

      {/* GST Option for Quotations */}
      {currentMode === 'quotation' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Tax Configuration
          </h3>
          <div className="flex gap-6">
            <label className="flex items-center cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 mr-2">
                <input
                  type="radio"
                  name="gstOption"
                  value="with-gst"
                  checked={quotationGstOption === 'with-gst'}
                  onChange={(e) => handleQuotationGstChange(e.target.value)}
                  className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-purple-600 checked:bg-purple-600 transition-all"
                />
                <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-gray-700 font-medium group-hover:text-purple-600 transition-colors">With GST</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 mr-2">
                <input
                  type="radio"
                  name="gstOption"
                  value="without-gst"
                  checked={quotationGstOption === 'without-gst'}
                  onChange={(e) => handleQuotationGstChange(e.target.value)}
                  className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-purple-600 checked:bg-purple-600 transition-all"
                />
                <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
              </div>
              <span className="text-gray-700 font-medium group-hover:text-purple-600 transition-colors">Without GST</span>
            </label>
          </div>
        </div>
      )}

      {/* Forms Stack */}
      <div className="space-y-6">
        <CompanyBillHeader invoiceData={invoiceData} handleInputChange={handleInputChange} />
        
        <ClientForm invoiceData={invoiceData} handleInputChange={handleInputChange} />

        {currentMode === 'gst-bill' && (
          <BillingShippingForm invoiceData={invoiceData} handleInputChange={handleInputChange} />
        )}

        <InvoiceDetailsForm
          invoiceData={invoiceData}
          handleInputChange={handleInputChange}
          hideBillNumber={false}
          currentMode={currentMode}
        />

        <ItemsForm
          invoiceData={invoiceData}
          handleItemChange={handleItemChange}
          addItem={addItem}
          removeItem={removeItem}
        />

        <AdditionalChargesForm
          invoiceData={invoiceData}
          handleInputChange={handleInputChange}
        />
      </div>

      {/* Actions Toolbar */}
      <div className="sticky bottom-4 z-20 bg-white/90 backdrop-blur-lg border border-gray-200 p-4 rounded-xl shadow-2xl space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all transform hover:-translate-y-0.5"
            onClick={() => window.print()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print
          </button>

          <button
            className={`flex items-center justify-center gap-2 w-full py-3.5 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 ${
              isSaving
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-purple-200'
            }`}
            onClick={editingInvoiceId ? handleUpdateInvoice : handleSaveInvoice}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                {editingInvoiceId ? 'Update' : 'Save'}
              </>
            )}
          </button>
        </div>



        {editingInvoiceId && (
          <button
            className="w-full py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-all"
            onClick={handleCancelEditing}
          >
            Cancel Editing
          </button>
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <SavedInvoicesList
          savedInvoices={savedInvoices}
          handleLoadInvoice={handleLoadInvoice}
          handleEditInvoice={handleEditInvoice}
          handleOpenPaymentModal={handleOpenPaymentModal}
          handleDeleteInvoice={handleDeleteInvoice}
          currentMode={currentMode}
        />
      </div>
    </div>
  );
}
