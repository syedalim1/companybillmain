"use client"
import { useState, useEffect } from "react";
import InvoicePreview from "@/components/InvoicePreview";
import LandingPage from "@/components/LandingPage";
import MonthlyGSTReport from "@/components/MonthlyGSTReport";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import CustomerManager from "@/components/CustomerManager";
import EmailInvoiceModal from "@/components/EmailInvoiceModal";
import PaymentStatusModal from "@/components/PaymentStatusModal";
import InvoiceForm from "@/components/InvoiceForm";
import LoginScreen from "@/components/LoginScreen";
import { useInvoiceState } from "@/hooks/useInvoiceState";
import { useInvoiceAPI } from "@/hooks/useInvoiceAPI";
import { useInvoiceCalculations } from "@/hooks/useInvoiceCalculations";


export default function Home() {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        setAuthenticated(!!data.authenticated);
      } catch (err) {
        setAuthenticated(false);
      }
    }
    checkAuth();
  }, []);
  const state = useInvoiceState();
  const {
    currentMode,
    setCurrentMode,
    quotationGstOption,
    setQuotationGstOption,
    nextId,
    setNextId,
    isGenerating,
    setIsGenerating,
    isSaving,
    setIsSaving,
    savedInvoices,
    setSavedInvoices,
    editingInvoiceId,
    setEditingInvoiceId,
    nextInvoiceNo,
    setNextInvoiceNo,
    nextQuotationNo,
    setNextQuotationNo,
    nextDcNo,
    setNextDcNo,
    nextSlipNo,
    setNextSlipNo,
    showEmailModal,
    setShowEmailModal,
    showPaymentModal,
    setShowPaymentModal,
    selectedInvoiceForPayment,
    setSelectedInvoiceForPayment,
    invoiceData,
    setInvoiceData,
    handleSelectGenerator,
    handleQuotationGstChange,
    handleInputChange,
    handleItemChange,
    addItem,
    removeItem,
    resetToDefault,
  } = state;

  // Calculations — single source of truth
  const calculations = useInvoiceCalculations(invoiceData, currentMode, quotationGstOption);

  // API operations — pass calculation results to avoid duplicate calculations
  const api = useInvoiceAPI(
    invoiceData,
    currentMode,
    quotationGstOption,
    editingInvoiceId,
    setEditingInvoiceId,
    setSavedInvoices,
    setNextInvoiceNo,
    setNextQuotationNo,
    setNextDcNo,
    setNextSlipNo,
    setCurrentMode,
    setQuotationGstOption,
    setInvoiceData,
    setShowPaymentModal,
    setSelectedInvoiceForPayment,
    setIsSaving,
    calculations, // Pass calculation results directly
    resetToDefault // Bug 8: Pass reset function for form reset after save/update
  );

  const {
    fetchSavedInvoices,
    handleSaveInvoice,
    handleLoadInvoice,
    handleEditInvoice,
    handlePaymentUpdate,
    handleOpenPaymentModal,
    handleUpdateInvoice,
    handleDeleteInvoice,
  } = api;

  // Export to Excel (dynamically imported for performance)
  const handleExportToExcel = async () => {
    const XLSX = (await import('xlsx'));
    const { subtotal, cgstAmount, sgstAmount, igstAmount, grandTotal, amountInWords } = calculations;

    const data = [
      [currentMode === 'dc-bill' ? 'Delivery Challan Details' : (currentMode === 'slip-bill' ? 'Slip Bill Details' : (currentMode === 'quotation' ? 'Quotation Details' : 'Invoice Details'))],
      ['Document No', currentMode === 'dc-bill' ? invoiceData.dcDetails.dcNo : invoiceData.invoiceDetails.invoiceNo],
      ['Date', invoiceData.invoiceDetails.date],
      ['Due Date', invoiceData.invoiceDetails.dueDate],
      ['PO Number', invoiceData.invoiceDetails.poNumber],
      ['Reference', invoiceData.invoiceDetails.reference],
      ['Place of Supply', invoiceData.invoiceDetails.placeOfSupply],
      ['Tax Type', invoiceData.invoiceDetails.taxType],
      ['GST Rate', invoiceData.taxRate],
      ['Notes', invoiceData.invoiceDetails.notes],
      [],

      // Seller Details
      ['Seller Details'],
      ['Name', invoiceData.seller.name],
      ['Address', invoiceData.seller.address],
      ['GSTIN', invoiceData.seller.gstin],
      ['State', invoiceData.seller.state],
      ['State Code', invoiceData.seller.stateCode],
      ['Contact', invoiceData.seller.contact],
      ['Email', invoiceData.seller.email],
      ['Bank Name', invoiceData.seller.bankName],
      ['Account No', invoiceData.seller.accNo],
      ['Branch', invoiceData.seller.branch],
      ['IFSC', invoiceData.seller.ifsc],
      [],

      // Buyer Details
      ['Buyer Details'],
      ['Name', invoiceData.buyer.name],
      ['Address', invoiceData.buyer.address],
      ['GSTIN', invoiceData.buyer.gstin],
      ['State', invoiceData.buyer.state],
      ['State Code', invoiceData.buyer.stateCode],
      ['Contact', invoiceData.buyer.contact],
      [],

      // Items
      ['Items'],
      ['Description', 'HSN', 'SAC', 'Quantity', 'Rate', 'Discount (%)', 'Amount'],
      ...invoiceData.items.map(item => [
        item.description,
        item.hsn,
        item.sac,
        item.quantity,
        item.rate,
        item.discount,
        (item.quantity * item.rate * (1 - item.discount / 100)).toFixed(2)
      ]),
      [],

      // Additional Charges
      ['Additional Charges'],
      ['Freight', invoiceData.additionalCharges.freight],
      ['Insurance', invoiceData.additionalCharges.insurance],
      ['Packing', invoiceData.additionalCharges.packing],
      ['Other', invoiceData.additionalCharges.other],
      ['Discount (%)', invoiceData.additionalCharges.discount],
      [],

      // Totals
      ['Totals'],
      ['Subtotal', subtotal.toFixed(2)],
      ['CGST', cgstAmount.toFixed(2)],
      ['SGST', sgstAmount.toFixed(2)],
      ['IGST', igstAmount.toFixed(2)],
      ['Grand Total', grandTotal.toFixed(2)],
      ['Amount in Words', amountInWords],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    const sheetName = currentMode === 'dc-bill' ? 'Delivery Challan' : (currentMode === 'quotation' ? 'Quotation' : (currentMode === 'slip-bill' ? 'Slip Bill' : 'Invoice'));
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    const docNo = currentMode === 'dc-bill' ? (invoiceData.dcDetails?.dcNo || 'NoNumber') : (invoiceData.invoiceDetails?.invoiceNo || 'NoNumber');
    XLSX.writeFile(wb, `${sheetName}_${docNo}.xlsx`.replace(' ', '_'));
  };


// --- PDF GENERATION FUNCTION ---
const handleGeneratePDF = async () => {

  const element = document.getElementById('invoice-preview');
  if (!element) {
      console.error("Preview element not found!");
      alert("Could not generate PDF. Preview element is missing.");
      return;
  }

  setIsGenerating(true); // Disable button while generating

  try {
    const html2pdf = (await import('html2pdf.js')).default;


    const docNo = currentMode === 'dc-bill' ? (invoiceData.dcDetails?.dcNo || 'NoNumber') : (invoiceData.invoiceDetails?.invoiceNo || 'NoNumber');
    const docPrefix = currentMode === 'dc-bill' ? 'DC' : (currentMode === 'quotation' ? 'Quotation' : (currentMode === 'slip-bill' ? 'Slip_Bill' : 'Invoice'));

    const options = {
      margin: [0.2, 0.2, 0.2, 0.2], // top, left, bottom, right margins in inches
      filename: `${docPrefix}_${docNo}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 1.2, // Further reduced scale for better compatibility
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          return element.classList.contains('print:hidden');
        },
        onclone: (clonedDoc) => {
          // Propagate active theme configuration to the cloned context
          const activeTheme = document.documentElement.getAttribute('data-theme') || 'default';
          const isDark = document.documentElement.classList.contains('dark');
          const clonedHtml = clonedDoc.documentElement;
          clonedHtml.setAttribute('data-theme', activeTheme);
          if (isDark) {
            clonedHtml.classList.add('dark');
          } else {
            clonedHtml.classList.remove('dark');
          }

          // Remove problematic CSS that html2canvas can't handle
          const styles = clonedDoc.querySelectorAll('style');
          styles.forEach(style => {
            if (style.textContent.includes('lab(') || style.textContent.includes('oklab(')) {
              style.remove();
            }
          });
        }
      },
      jsPDF: {
        unit: 'in',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy']
      }
    };

    await html2pdf().from(element).set(options).save();
    setIsGenerating(false);
  } catch (err) {
    console.error('PDF generation error:', err);
    alert('An error occurred while generating the PDF.');
    setIsGenerating(false);
  }
};

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090b11]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen onLoginSuccess={() => setAuthenticated(true)} />;
  }

  const { subtotal, cgstAmount, sgstAmount, igstAmount, grandTotal, lessAmount, discountAmount, amountInWords } = calculations;

  // Show landing page
  if (currentMode === 'landing') {
    return <LandingPage onSelectGenerator={handleSelectGenerator} setAuthenticated={setAuthenticated} savedInvoices={savedInvoices} />;
  }

  // Show GST Monthly Report interface
  if (currentMode === 'gst-monthly-report') {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto py-8 bg-bg-base min-h-screen p-6">
        <div className="flex-1 max-w-4xl print:hidden mx-auto">
          <button
            onClick={() => setCurrentMode('landing')}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Home
          </button>

          <h1 className="text-3xl font-bold text-center mb-6 text-purple-600">
            GST Monthly Report Generator
          </h1>

          <MonthlyGSTReport savedInvoices={savedInvoices} invoiceData={invoiceData} />
        </div>
      </div>
    );
  }

  // Show Customer Manager interface
  if (currentMode === 'customers') {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto py-8 bg-bg-base min-h-screen p-6">
        <div className="flex-1 max-w-7xl print:hidden mx-auto">
          <button
            onClick={() => setCurrentMode('landing')}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Home
          </button>

          <CustomerManager />
        </div>
      </div>
    );
  }



  // Show Analytics Dashboard interface
  if (currentMode === 'analytics') {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto py-8 bg-bg-base min-h-screen p-6">
        <div className="flex-1 max-w-7xl print:hidden mx-auto">
          <button
            onClick={() => setCurrentMode('landing')}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Home
          </button>

          <AnalyticsDashboard savedInvoices={savedInvoices} />
        </div>
      </div>
    );
  }

  // Show GST Bill or Quotation interface
  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto py-8 bg-bg-base min-h-screen p-6">
      <InvoiceForm
        currentMode={currentMode}
        setCurrentMode={setCurrentMode}
        quotationGstOption={quotationGstOption}
        handleQuotationGstChange={handleQuotationGstChange}
        invoiceData={invoiceData}
        setInvoiceData={setInvoiceData}
        handleInputChange={handleInputChange}
        handleItemChange={handleItemChange}
        addItem={addItem}
        removeItem={removeItem}
        editingInvoiceId={editingInvoiceId}
        setEditingInvoiceId={setEditingInvoiceId}
        handleSaveInvoice={handleSaveInvoice}
        handleUpdateInvoice={handleUpdateInvoice}
        handleExportToExcel={handleExportToExcel}
        setShowEmailModal={setShowEmailModal}
        savedInvoices={savedInvoices}
        handleLoadInvoice={handleLoadInvoice}
        handleEditInvoice={handleEditInvoice}
        handleOpenPaymentModal={handleOpenPaymentModal}
        handleDeleteInvoice={handleDeleteInvoice}
        isSaving={isSaving}
        resetToDefault={resetToDefault}
        handleGeneratePDF={handleGeneratePDF}
        isGenerating={isGenerating}
      />

      <InvoicePreview
        invoiceData={invoiceData}
        subtotal={subtotal}
        cgstAmount={cgstAmount}
        sgstAmount={sgstAmount}
        igstAmount={igstAmount}
        grandTotal={grandTotal}
        lessAmount={lessAmount}
        discountAmount={discountAmount}
        amountInWords={amountInWords}
        mode={currentMode}
        gstOption={quotationGstOption}
      />

      {/* Email Invoice Modal */}
      <EmailInvoiceModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        invoiceData={invoiceData}
        onSend={(result) => {
          console.log('Email sent:', result);
          // You can add additional logic here, like showing a success message
        }}
      />

      {/* Payment Status Modal */}
      <PaymentStatusModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={selectedInvoiceForPayment}
        onUpdate={handlePaymentUpdate}
      />
    </div>
  );
}
