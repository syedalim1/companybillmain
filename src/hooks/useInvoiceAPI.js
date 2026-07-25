import { useEffect, useCallback } from 'react';

/**
 * Deep clone utility to ensure complete data isolation between invoices.
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function useInvoiceAPI(
  invoiceData,
  currentMode,
  quotationGstOption,
  editingInvoiceId,
  setEditingInvoiceId,
  setSavedInvoices,
  setNextInvoiceNo,
  setNextDcNo,
  setNextSlipNo,
  setCurrentMode,
  setQuotationGstOption,
  setInvoiceData,
  setShowPaymentModal,
  setSelectedInvoiceForPayment,
  setIsSaving,
  calculationResults, // { subtotal, cgstAmount, sgstAmount, igstAmount, grandTotal }
  resetToDefault // Bug 8: Accept resetToDefault to reset form after save/update
) {
  // ==========================================================================
  // FETCH — Load all saved invoices from the database
  // ==========================================================================
  const fetchSavedInvoices = useCallback(async () => {
    try {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        setSavedInvoices(data.invoices || []);
        // Server is the SINGLE SOURCE OF TRUTH for next numbers
        setNextInvoiceNo(data.nextInvoiceNo?.toString() || '1');
        if (setNextDcNo) {
          setNextDcNo(data.nextDcNo?.toString() || '1');
        }
        if (setNextSlipNo) {
          setNextSlipNo(data.nextSlipNo?.toString() || '1');
        }
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  }, [setSavedInvoices, setNextInvoiceNo, setNextDcNo, setNextSlipNo]);

  // Load saved invoices on component mount
  useEffect(() => {
    fetchSavedInvoices();
  }, [fetchSavedInvoices]);

  // ==========================================================================
  // SAVE — Create a new invoice
  // ==========================================================================
  const handleSaveInvoice = useCallback(async () => {
    if (!calculationResults) {
      alert('Calculation error. Please try again.');
      return;
    }

    // Prevent double-save
    if (setIsSaving) setIsSaving(true);

    try {
      const { subtotal, cgstAmount, sgstAmount, igstAmount, grandTotal } = calculationResults;

      // Deep clone to prevent any reference issues
      const invoiceToSave = deepClone({
        ...invoiceData,
        mode: currentMode,
        quotationGstOption: quotationGstOption,
        subtotal,
        cgstAmount,
        sgstAmount,
        igstAmount,
        grandTotal,
      });

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceToSave),
      });

      if (response.ok) {
        const result = await response.json();
        const docType =
          currentMode === 'dc-bill'
            ? 'DC Bill'
            : currentMode === 'quotation'
            ? 'Quotation'
            : currentMode === 'slip-bill'
            ? 'Slip Bill'
            : 'Invoice';
        alert(`${docType} saved successfully!`);

        // Re-fetch from server — server is the single source of truth for next numbers
        await fetchSavedInvoices();

        // Reset the form to defaults with next invoice number
        // so the user sees a clean form after saving
        if (resetToDefault) resetToDefault();
      } else {
        const errorData = await response.json().catch(() => ({}));
        // On duplicate number error (409), re-fetch to get latest numbers
        // so the user gets a fresh valid number instead of being stuck
        if (response.status === 409) {
          await fetchSavedInvoices();
          if (resetToDefault) resetToDefault();
          alert(errorData.error || 'Invoice number already exists. Form has been refreshed with a new number. Please try saving again.');
        } else {
          throw new Error(errorData.error || 'Failed to save invoice');
        }
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert(error.message || 'Failed to save invoice. Please try again.');
    } finally {
      if (setIsSaving) setIsSaving(false);
    }
  }, [invoiceData, currentMode, quotationGstOption, calculationResults, fetchSavedInvoices, setIsSaving, resetToDefault]);

  // ==========================================================================
  // LOAD — Load an invoice for viewing (does NOT enable edit mode)
  // ==========================================================================
  const handleLoadInvoice = useCallback((invoice) => {
    // DEEP CLONE everything to prevent shared references
    const clonedInvoice = deepClone(invoice);

    // Build seller data from snapshot fields (fall back to relation data for backward compatibility)
    const sellerData = {
      name: clonedInvoice.sellerName || clonedInvoice.seller?.name || '',
      address: clonedInvoice.sellerAddress || clonedInvoice.seller?.address || '',
      gstin: clonedInvoice.sellerGstin || clonedInvoice.seller?.gstin || '',
      state: clonedInvoice.sellerState || clonedInvoice.seller?.state || '',
      stateCode: clonedInvoice.sellerStateCode || clonedInvoice.seller?.stateCode || null,
      contact: clonedInvoice.sellerContact || clonedInvoice.seller?.contact || '',
      email: clonedInvoice.sellerEmail || clonedInvoice.seller?.email || '',
      bankName: clonedInvoice.sellerBankName || clonedInvoice.seller?.bankName || '',
      accNo: clonedInvoice.sellerAccNo || clonedInvoice.seller?.accNo || '',
      branch: clonedInvoice.sellerBranch || clonedInvoice.seller?.branch || '',
      ifsc: clonedInvoice.sellerIfsc || clonedInvoice.seller?.ifsc || '',
      logo: clonedInvoice.sellerLogo || clonedInvoice.seller?.logo || null,
    };

    // Build buyer data from snapshot fields (fall back to relation data for backward compatibility)
    const buyerData = {
      name: clonedInvoice.buyerName || clonedInvoice.buyer?.name || '',
      address: clonedInvoice.buyerAddress || clonedInvoice.buyer?.address || '',
      destination: clonedInvoice.buyerDestination || clonedInvoice.buyer?.destination || '',
      contact: clonedInvoice.buyerContact || clonedInvoice.buyer?.contact || '',
      gstin: clonedInvoice.buyerGstin || clonedInvoice.buyer?.gstin || '',
      state: clonedInvoice.buyerState || clonedInvoice.buyer?.state || '',
      stateCode: clonedInvoice.buyerStateCode || clonedInvoice.buyer?.stateCode || null,
      buyerNumber: clonedInvoice.buyerNumber || clonedInvoice.buyer?.buyerNumber || '',
      email: clonedInvoice.buyerEmail || clonedInvoice.buyer?.email || '',
    };

    const loadedInvoice = {
      seller: sellerData,
      buyer: buyerData,
      billing: {
        name: clonedInvoice.billingName || '',
        address: clonedInvoice.billingAddress || '',
        gstin: clonedInvoice.billingGstin || '',
        state: clonedInvoice.billingState || '',
        stateCode: clonedInvoice.billingStateCode || null,
      },
      shipping: {
        name: clonedInvoice.shippingName || '',
        address: clonedInvoice.shippingAddress || '',
        gstin: clonedInvoice.shippingGstin || '',
        state: clonedInvoice.shippingState || '',
        stateCode: clonedInvoice.shippingStateCode || null,
      },
      invoiceDetails: {
        invoiceNo: clonedInvoice.invoiceNo || '',
        date: clonedInvoice.date ? clonedInvoice.date.split('T')[0] : '',
        taxType: clonedInvoice.taxType || 'cgst_sgst',
        dueDate: clonedInvoice.dueDate ? clonedInvoice.dueDate.split('T')[0] : '',
        poNumber: clonedInvoice.poNumber || '',
        reference: clonedInvoice.reference || '',
        placeOfSupply: clonedInvoice.placeOfSupply || '',
        reverseCharge: clonedInvoice.reverseCharge || false,
        ewayBillNo: clonedInvoice.ewayBillNo || '',
        vehicleNo: clonedInvoice.vehicleNo || '',
        transporterName: clonedInvoice.transporterName || '',
        driverName: clonedInvoice.driverName || '',
        driverMobile: clonedInvoice.driverMobile || '',
        transporterId: clonedInvoice.transporterId || '',
        distance: clonedInvoice.distance || '',
        modeOfTransport: clonedInvoice.modeOfTransport || '',
        terms: clonedInvoice.terms || '',
        paymentTerms: clonedInvoice.paymentTerms || '',
        notes: clonedInvoice.notes || '',
      },
      // Deep clone items — each item is a new object with guaranteed unique ID
      items: (clonedInvoice.items || []).map((item, idx) => ({
        id: item.id || `item_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 9)}`,
        description: item.description || '',
        hsn: item.hsn || '',
        sac: item.sac || '',
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || 'Nos',
        rate: parseFloat(item.rate) || 0,
        discount: parseFloat(item.discount) || 0,
      })),
      additionalCharges: {
        freight: clonedInvoice.additionalCharges?.freight || 0,
        insurance: clonedInvoice.additionalCharges?.insurance || 0,
        packing: clonedInvoice.additionalCharges?.packing || 0,
        other: clonedInvoice.additionalCharges?.other || 0,
        discount: clonedInvoice.additionalCharges?.discount || 0,
        lessAmount: clonedInvoice.additionalCharges?.lessAmount || 0,
        lessDescription: clonedInvoice.additionalCharges?.lessDescription || '',
      },
      dcDetails: {
        dcNo: clonedInvoice.dcNo || '',
        dcStatus: clonedInvoice.dcStatus || 'pending',
        receiverName: clonedInvoice.receiverName || '',
      },
      taxRate: parseFloat(clonedInvoice.taxRate) || 18,
    };

    setInvoiceData(loadedInvoice);
    setCurrentMode(clonedInvoice.mode || 'gst-bill');
    setQuotationGstOption(clonedInvoice.quotationGstOption || 'with-gst');
    // IMPORTANT: Clear editingInvoiceId so loading a view doesn't put us in edit mode
    setEditingInvoiceId(null);
    alert('Invoice loaded successfully!');
  }, [setInvoiceData, setCurrentMode, setQuotationGstOption, setEditingInvoiceId]);

  // ==========================================================================
  // EDIT — Load an invoice for editing (enables edit mode)
  // ==========================================================================
  const handleEditInvoice = useCallback((invoice) => {
    // IMPORTANT: Set editing ID FIRST, before loading data
    // This ensures the useEffect guard in useInvoiceState prevents invoice number overwrite
    setEditingInvoiceId(invoice.id);

    // Then load the data (uses deep clone internally)
    // We inline the load logic here to avoid the alert and ensure correct order
    const clonedInvoice = deepClone(invoice);

    const sellerData = {
      name: clonedInvoice.sellerName || clonedInvoice.seller?.name || '',
      address: clonedInvoice.sellerAddress || clonedInvoice.seller?.address || '',
      gstin: clonedInvoice.sellerGstin || clonedInvoice.seller?.gstin || '',
      state: clonedInvoice.sellerState || clonedInvoice.seller?.state || '',
      stateCode: clonedInvoice.sellerStateCode || clonedInvoice.seller?.stateCode || null,
      contact: clonedInvoice.sellerContact || clonedInvoice.seller?.contact || '',
      email: clonedInvoice.sellerEmail || clonedInvoice.seller?.email || '',
      bankName: clonedInvoice.sellerBankName || clonedInvoice.seller?.bankName || '',
      accNo: clonedInvoice.sellerAccNo || clonedInvoice.seller?.accNo || '',
      branch: clonedInvoice.sellerBranch || clonedInvoice.seller?.branch || '',
      ifsc: clonedInvoice.sellerIfsc || clonedInvoice.seller?.ifsc || '',
      logo: clonedInvoice.sellerLogo || clonedInvoice.seller?.logo || null,
    };

    const buyerData = {
      name: clonedInvoice.buyerName || clonedInvoice.buyer?.name || '',
      address: clonedInvoice.buyerAddress || clonedInvoice.buyer?.address || '',
      destination: clonedInvoice.buyerDestination || clonedInvoice.buyer?.destination || '',
      contact: clonedInvoice.buyerContact || clonedInvoice.buyer?.contact || '',
      gstin: clonedInvoice.buyerGstin || clonedInvoice.buyer?.gstin || '',
      state: clonedInvoice.buyerState || clonedInvoice.buyer?.state || '',
      stateCode: clonedInvoice.buyerStateCode || clonedInvoice.buyer?.stateCode || null,
      buyerNumber: clonedInvoice.buyerNumber || clonedInvoice.buyer?.buyerNumber || '',
      email: clonedInvoice.buyerEmail || clonedInvoice.buyer?.email || '',
    };

    const loadedInvoice = {
      seller: sellerData,
      buyer: buyerData,
      billing: {
        name: clonedInvoice.billingName || '',
        address: clonedInvoice.billingAddress || '',
        gstin: clonedInvoice.billingGstin || '',
        state: clonedInvoice.billingState || '',
        stateCode: clonedInvoice.billingStateCode || null,
      },
      shipping: {
        name: clonedInvoice.shippingName || '',
        address: clonedInvoice.shippingAddress || '',
        gstin: clonedInvoice.shippingGstin || '',
        state: clonedInvoice.shippingState || '',
        stateCode: clonedInvoice.shippingStateCode || null,
      },
      invoiceDetails: {
        invoiceNo: clonedInvoice.invoiceNo || '',
        date: clonedInvoice.date ? clonedInvoice.date.split('T')[0] : '',
        taxType: clonedInvoice.taxType || 'cgst_sgst',
        dueDate: clonedInvoice.dueDate ? clonedInvoice.dueDate.split('T')[0] : '',
        poNumber: clonedInvoice.poNumber || '',
        reference: clonedInvoice.reference || '',
        placeOfSupply: clonedInvoice.placeOfSupply || '',
        reverseCharge: clonedInvoice.reverseCharge || false,
        ewayBillNo: clonedInvoice.ewayBillNo || '',
        vehicleNo: clonedInvoice.vehicleNo || '',
        transporterName: clonedInvoice.transporterName || '',
        driverName: clonedInvoice.driverName || '',
        driverMobile: clonedInvoice.driverMobile || '',
        transporterId: clonedInvoice.transporterId || '',
        distance: clonedInvoice.distance || '',
        modeOfTransport: clonedInvoice.modeOfTransport || '',
        terms: clonedInvoice.terms || '',
        paymentTerms: clonedInvoice.paymentTerms || '',
        notes: clonedInvoice.notes || '',
      },
      items: (clonedInvoice.items || []).map((item, idx) => ({
        id: item.id || `item_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 9)}`,
        description: item.description || '',
        hsn: item.hsn || '',
        sac: item.sac || '',
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || 'Nos',
        rate: parseFloat(item.rate) || 0,
        discount: parseFloat(item.discount) || 0,
      })),
      additionalCharges: {
        freight: clonedInvoice.additionalCharges?.freight || 0,
        insurance: clonedInvoice.additionalCharges?.insurance || 0,
        packing: clonedInvoice.additionalCharges?.packing || 0,
        other: clonedInvoice.additionalCharges?.other || 0,
        discount: clonedInvoice.additionalCharges?.discount || 0,
        lessAmount: clonedInvoice.additionalCharges?.lessAmount || 0,
        lessDescription: clonedInvoice.additionalCharges?.lessDescription || '',
      },
      dcDetails: {
        dcNo: clonedInvoice.dcNo || '',
        dcStatus: clonedInvoice.dcStatus || 'pending',
        receiverName: clonedInvoice.receiverName || '',
      },
      taxRate: parseFloat(clonedInvoice.taxRate) || 18,
    };

    setInvoiceData(loadedInvoice);
    setCurrentMode(clonedInvoice.mode || 'gst-bill');
    setQuotationGstOption(clonedInvoice.quotationGstOption || 'with-gst');
  }, [setEditingInvoiceId, setInvoiceData, setCurrentMode, setQuotationGstOption]);

  // ==========================================================================
  // UPDATE — Save changes to an existing invoice
  // ==========================================================================
  const handleUpdateInvoice = useCallback(async () => {
    if (!editingInvoiceId) {
      alert('No invoice selected for update.');
      return;
    }

    if (!calculationResults) {
      alert('Calculation error. Please try again.');
      return;
    }

    // Prevent double-save
    if (setIsSaving) setIsSaving(true);

    try {
      const { subtotal, cgstAmount, sgstAmount, igstAmount, grandTotal } = calculationResults;

      // Deep clone to prevent reference issues
      const invoiceToUpdate = deepClone({
        ...invoiceData,
        mode: currentMode,
        quotationGstOption: quotationGstOption,
        subtotal,
        cgstAmount,
        sgstAmount,
        igstAmount,
        grandTotal,
      });

      const response = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingInvoiceId, ...invoiceToUpdate }),
      });

      if (response.ok) {
        alert('Invoice updated successfully!');
        // Re-fetch from server
        await fetchSavedInvoices();

        // Bug 3 fix: Reset form to defaults after update
        // This also clears editingInvoiceId internally
        if (resetToDefault) {
          resetToDefault();
        } else {
          setEditingInvoiceId(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert(error.message || 'Failed to update invoice. Please try again.');
    } finally {
      if (setIsSaving) setIsSaving(false);
    }
  }, [editingInvoiceId, invoiceData, currentMode, quotationGstOption, calculationResults, setEditingInvoiceId, fetchSavedInvoices, setIsSaving, resetToDefault]);

  // ==========================================================================
  // DELETE — Delete an invoice with optimistic update
  // ==========================================================================
  const handleDeleteInvoice = useCallback(async (invoiceId) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    // If the deleted invoice is currently being edited, clear the editing state
    // BEFORE optimistic removal to prevent re-saving deleted data
    const wasEditing = editingInvoiceId === invoiceId;
    if (wasEditing) {
      setEditingInvoiceId(null);
    }

    // Optimistic removal from local state
    setSavedInvoices(prev => prev.filter(inv => inv.id !== invoiceId));

    try {
      const response = await fetch(`/api/invoices?id=${invoiceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        alert('Invoice deleted successfully!');
        // Update next numbers from server response
        if (result.nextInvoiceNo) setNextInvoiceNo(result.nextInvoiceNo.toString());
        if (result.nextDcNo && setNextDcNo) setNextDcNo(result.nextDcNo.toString());
        if (result.nextSlipNo && setNextSlipNo) setNextSlipNo(result.nextSlipNo.toString());
        // Re-fetch to ensure consistency
        await fetchSavedInvoices();
        // Reset form if the deleted invoice was being edited
        if (wasEditing && resetToDefault) {
          resetToDefault();
        }
      } else {
        // Rollback optimistic update on failure
        if (wasEditing) {
          // Restore editing state if delete failed
          setEditingInvoiceId(invoiceId);
        }
        await fetchSavedInvoices();
        throw new Error('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
      // Rollback: re-fetch from server
      await fetchSavedInvoices();
    }
  }, [editingInvoiceId, setEditingInvoiceId, setSavedInvoices, setNextInvoiceNo, setNextDcNo, setNextSlipNo, fetchSavedInvoices, resetToDefault]);

  // ==========================================================================
  // PAYMENT — Handle payment status updates
  // ==========================================================================
  // Bug 4 fix: Re-fetch from server after payment update to stay in sync
  const handlePaymentUpdate = useCallback(async (updatedInvoice) => {
    // Optimistic local update first for instant UI feedback
    setSavedInvoices(prev =>
      prev.map(inv => (inv.id === updatedInvoice.id ? deepClone(updatedInvoice) : inv))
    );
    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
    // Then re-fetch from server to ensure full data consistency
    await fetchSavedInvoices();
  }, [setSavedInvoices, setShowPaymentModal, setSelectedInvoiceForPayment, fetchSavedInvoices]);

  const handleOpenPaymentModal = useCallback((invoice) => {
    setSelectedInvoiceForPayment(deepClone(invoice));
    setShowPaymentModal(true);
  }, [setSelectedInvoiceForPayment, setShowPaymentModal]);

  return {
    fetchSavedInvoices,
    handleSaveInvoice,
    handleLoadInvoice,
    handleEditInvoice,
    handlePaymentUpdate,
    handleOpenPaymentModal,
    handleUpdateInvoice,
    handleDeleteInvoice,
  };
}
