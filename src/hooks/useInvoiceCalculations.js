import { useMemo } from 'react';
import { ToWords } from 'to-words';

const toWords = new ToWords({
  localeCode: 'en-IN',
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
  }
});

export function useInvoiceCalculations(
  invoiceData,
  currentMode,
  quotationGstOption
) {
  return useMemo(() => {
    // --- Item-level calculations ---
    const itemTotal = invoiceData.items.reduce((acc, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const disc = parseFloat(item.discount) || 0;
      const itemAmount = qty * rate * (1 - disc / 100);
      return acc + itemAmount;
    }, 0);

    // --- Additional charges: use explicit named fields, not fragile index iteration ---
    const freight = parseFloat(invoiceData.additionalCharges.freight) || 0;
    const insurance = parseFloat(invoiceData.additionalCharges.insurance) || 0;
    const packing = parseFloat(invoiceData.additionalCharges.packing) || 0;
    const otherCharges = parseFloat(invoiceData.additionalCharges.other) || 0;

    // BUG FIX: Previously only freight was added to subtotal.
    // Insurance, packing, and other charges were calculated but never included.
    const additionalChargesTotal = freight + insurance + packing + otherCharges;

    const subtotal = itemTotal + additionalChargesTotal;

    // Discount is a percentage of subtotal
    const discountAmount =
      (subtotal * parseFloat(invoiceData.additionalCharges.discount || 0)) / 100;

    // Less amount is a flat deduction
    const lessAmount = parseFloat(invoiceData.additionalCharges.lessAmount) || 0;

    const taxableAmount = subtotal - discountAmount - lessAmount;

    // GST calculations based on mode and quotation GST option
    const shouldCalculateGST =
      currentMode === "gst-bill" ||
      (currentMode === "quotation" && quotationGstOption === "with-gst");

    const isCGST_SGST =
      shouldCalculateGST && invoiceData.invoiceDetails.taxType === "cgst_sgst";
    const taxRate = parseFloat(invoiceData.taxRate) || 0;
    const cgstRate = isCGST_SGST ? taxRate / 2 : 0;
    const sgstRate = isCGST_SGST ? taxRate / 2 : 0;
    const igstRate = shouldCalculateGST && !isCGST_SGST ? taxRate : 0;
    const cgstAmount = (taxableAmount * cgstRate) / 100;
    const sgstAmount = (taxableAmount * sgstRate) / 100;
    const igstAmount = (taxableAmount * igstRate) / 100;
    const taxAmount = cgstAmount + sgstAmount + igstAmount;
    const grandTotal = taxableAmount + taxAmount;

    // Centralized amount in words calculation that respects exact decimal precision
    const amountInWords = grandTotal > 0 ? toWords.convert(grandTotal) : 'Zero';

    return {
      itemTotal,
      subtotal,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      taxAmount,
      grandTotal,
      lessAmount,
      discountAmount,
      amountInWords,
    };
  }, [invoiceData, currentMode, quotationGstOption]);
}

