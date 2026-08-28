import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// DEFAULT INVOICE DATA — Single source of truth for initial/reset state
// ============================================================================
const DEFAULT_SELLER = {
  name: 'INDIAN MAKE STEEL INDUSTRIES',
  address: '',
  gstin: '33FAXPM0581G1ZC',
  state: 'Tamil Nadu',
  stateCode: 33,
  contact: '9585745303, 8300904920',
  email: 'indianmaksteel1982@gmail.com',
  bankName: 'Indian Overseas Bank',
  accNo: '356502000000347',
  branch: 'Podanur',
  ifsc: 'IOBA0003565',
  logo: null,
};

function getDefaultInvoiceData(invoiceNo = '1') {
  return {
    seller: { ...DEFAULT_SELLER },
    buyer: {
      name: '',
      address: '',
      destination: '',
      contact: '',
      gstin: '',
      state: '',
      stateCode: null,
    },
    billing: {
      name: '',
      address: '',
      gstin: '',
      state: '',
      stateCode: null,
    },
    shipping: {
      name: '',
      address: '',
      gstin: '',
      state: '',
      stateCode: null,
    },
    dcDetails: {
      dcNo: '',
      dcStatus: 'pending',
      receiverName: '',
    },
    invoiceDetails: {
      invoiceNo: invoiceNo,
      date: new Date().toISOString().split('T')[0],
      taxType: 'cgst_sgst',
      dueDate: '',
      poNumber: '',
      reference: '',
      placeOfSupply: 'Tamilnadu',
      reverseCharge: false,
      ewayBillNo: '',
      vehicleNo: '',
      transporterName: '',
      driverName: '',
      driverMobile: '',
      transporterId: '',
      distance: '',
      modeOfTransport: '',
      terms: '',
      paymentTerms: '',
      notes: '',
    },
    items: [
      {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        description: "MS Table \u2013 Metal Furniture (for Job Work)",
        hsn: '9403',
        sac: '',
        quantity: 8,
        unit: 'Nos',
        rate: 1900.00,
        discount: 0,
      },
    ],
    additionalCharges: {
      freight: 0,
      insurance: 0,
      packing: 0,
      other: 0,
      discount: 0,
      lessAmount: 0,
      lessDescription: '',
    },
    taxRate: 18,
  };
}

// ============================================================================
// DEEP CLONE utility — ensures complete isolation
// ============================================================================
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ============================================================================
// HOOK
// ============================================================================
export function useInvoiceState() {
  const [currentMode, setCurrentMode] = useState('landing'); // 'landing', 'gst-bill', 'quotation', 'dc-bill', 'gst-monthly-report', 'analytics'
  const [quotationGstOption, setQuotationGstOption] = useState('with-gst'); // 'with-gst', 'without-gst'
  const [nextId, setNextId] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false); // State to track PDF generation
  const [isSaving, setIsSaving] = useState(false); // Prevent double-save
  const [savedInvoices, setSavedInvoices] = useState([]); // State to store saved invoices
  const [editingInvoiceId, setEditingInvoiceId] = useState(null); // State to track editing invoice
  const [nextInvoiceNo, setNextInvoiceNo] = useState('1'); // Next GST invoice number
  const [nextQuotationNo, setNextQuotationNo] = useState('1'); // Next Quotation number
  const [nextDcNo, setNextDcNo] = useState('1'); // Next DC bill number
  const [nextSlipNo, setNextSlipNo] = useState('1'); // Next Slip bill number
  const [showEmailModal, setShowEmailModal] = useState(false); // State for email modal
  const [showPaymentModal, setShowPaymentModal] = useState(false); // State for payment modal
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null); // Selected invoice for payment update

  // --- State to hold all invoice data ---
  const [invoiceData, setInvoiceData] = useState(getDefaultInvoiceData());

  // Handle generator selection
  const handleSelectGenerator = (generatorType) => {
    setCurrentMode(generatorType);
  };

  // Handle quotation GST option change
  const handleQuotationGstChange = (gstOption) => {
    setQuotationGstOption(gstOption);
  };

  // Auto-set tax type based on state codes (only for GST bill)
  useEffect(() => {
    if (currentMode === 'gst-bill' && invoiceData.seller.stateCode && invoiceData.buyer.stateCode) {
      if (invoiceData.seller.stateCode === invoiceData.buyer.stateCode) {
        setInvoiceData(prev => ({ ...prev, invoiceDetails: { ...prev.invoiceDetails, taxType: 'cgst_sgst' } }));
      } else {
        setInvoiceData(prev => ({ ...prev, invoiceDetails: { ...prev.invoiceDetails, taxType: 'igst' } }));
      }
    }
  }, [currentMode, invoiceData.seller.stateCode, invoiceData.buyer.stateCode]);

  // Reset editing mode when going back to landing page
  useEffect(() => {
    if (currentMode === 'landing') {
      setEditingInvoiceId(null);
    }
  }, [currentMode]);

  // Update invoice/DC/Slip number when mode changes or next numbers update
  // Auto-update invoice number when entering a new creation mode
  useEffect(() => {
    if (!editingInvoiceId) {
      if (currentMode === 'gst-bill') {
        setInvoiceData(prev => ({ ...prev, invoiceDetails: { ...prev.invoiceDetails, invoiceNo: nextInvoiceNo } }));
      } else if (currentMode === 'quotation') {
        setInvoiceData(prev => ({ ...prev, invoiceDetails: { ...prev.invoiceDetails, invoiceNo: nextQuotationNo } }));
      } else if (currentMode === 'dc-bill') {
        setInvoiceData(prev => ({ ...prev, dcDetails: { ...prev.dcDetails, dcNo: `DC-${nextDcNo}` } }));
      } else if (currentMode === 'slip-bill') {
        setInvoiceData(prev => ({ ...prev, invoiceDetails: { ...prev.invoiceDetails, invoiceNo: nextSlipNo } }));
      }
    }
  }, [currentMode, nextInvoiceNo, nextQuotationNo, nextDcNo, nextSlipNo, editingInvoiceId]);

  // --- IMMUTABLE input change handler ---
  // Bug 2 fix: Handle top-level fields (e.g., taxRate) where field is empty
  const handleInputChange = useCallback((section, field, value) => {
    setInvoiceData(prev => {
      // If field is empty, treat as a top-level property assignment (e.g., taxRate)
      if (field === '' || field === undefined || field === null) {
        return { ...prev, [section]: value };
      }
      return {
        ...prev,
        [section]: { ...prev[section], [field]: value },
      };
    });
  }, []);

  // --- FIXED: Deep-clone items to prevent mutation across invoices ---
  const handleItemChange = useCallback((index, field, value) => {
    setInvoiceData(prev => {
      const newItems = prev.items.map((item, i) => {
        if (i === index) {
          // Create a new item object (not a reference) with the changed field
          return { ...item, [field]: value };
        }
        return { ...item }; // Clone each item to prevent shared references
      });
      return { ...prev, items: newItems };
    });
  }, []);

  const addItem = useCallback(() => {
    setInvoiceData(prev => {
      // Use unique string IDs to prevent React key collisions
      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        description: '',
        hsn: '',
        sac: '',
        quantity: 1,
        unit: 'Nos',
        rate: 0,
        discount: 0,
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
  }, []);

  const removeItem = useCallback((itemId) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
  }, []);

  // --- Centralized reset function ---
  const resetToDefault = useCallback(() => {
    setEditingInvoiceId(null);
    setInvoiceData(getDefaultInvoiceData(nextInvoiceNo));
  }, [nextInvoiceNo]);

  return {
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
    getDefaultInvoiceData,
    deepClone,
  };
}
