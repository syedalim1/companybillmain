import React from 'react';
import InvoiceContent from './invoice/InvoiceContent';

const InvoicePreview = ({ invoiceData, subtotal, cgstAmount, sgstAmount, igstAmount, grandTotal, lessAmount, discountAmount, amountInWords, mode, gstOption }) => {
    const isQuotation = mode === 'quotation';
    const isDcBill = mode === 'dc-bill';
    const isSlipBill = mode === 'slip-bill';

    return (
        <div id="invoice-preview" className="  print:p-0">
             {(isQuotation || isDcBill) ? (
                <div>
                    <InvoiceContent copyType={isDcBill ? "dc" : "quotation"} invoiceData={invoiceData} subtotal={subtotal} cgstAmount={cgstAmount} sgstAmount={sgstAmount} igstAmount={igstAmount} grandTotal={grandTotal} lessAmount={lessAmount} discountAmount={discountAmount} amountInWords={amountInWords} mode={mode} gstOption={gstOption} />
                </div>
             ) : isSlipBill ? (
                <div className="flex flex-row gap-8 justify-between print:gap-12">
                     <InvoiceContent copyType="slip" invoiceData={invoiceData} subtotal={subtotal} cgstAmount={cgstAmount} sgstAmount={sgstAmount} igstAmount={igstAmount} grandTotal={grandTotal} lessAmount={lessAmount} discountAmount={discountAmount} amountInWords={amountInWords} mode={mode} gstOption={gstOption} />
                     <InvoiceContent copyType="slip" invoiceData={invoiceData} subtotal={subtotal} cgstAmount={cgstAmount} sgstAmount={sgstAmount} igstAmount={igstAmount} grandTotal={grandTotal} lessAmount={lessAmount} discountAmount={discountAmount} amountInWords={amountInWords} mode={mode} gstOption={gstOption} />
                </div>
             ) : (
                <>
                    {/* Original Copy - Page 1 */}
                    <div className="print:page-break-after-always">
                        <InvoiceContent copyType="original" invoiceData={invoiceData} subtotal={subtotal} cgstAmount={cgstAmount} sgstAmount={sgstAmount} igstAmount={igstAmount} grandTotal={grandTotal} lessAmount={lessAmount} discountAmount={discountAmount} amountInWords={amountInWords} mode={mode} gstOption={gstOption} />
                    </div>

                    {/* Duplicate Copy - Page 2 (Transporter) */}
                    <div className="print:page-break-after-always print:pt-10">
                        <InvoiceContent copyType="duplicate" invoiceData={invoiceData} subtotal={subtotal} cgstAmount={cgstAmount} sgstAmount={sgstAmount} igstAmount={igstAmount} grandTotal={grandTotal} lessAmount={lessAmount} discountAmount={discountAmount} amountInWords={amountInWords} mode={mode} gstOption={gstOption} />
                    </div>

                    {/* Triplicate Copy - Page 3 (Supplier) */}
                    <div className='print:pt-10'>
                        <InvoiceContent copyType="triplicate" invoiceData={invoiceData} subtotal={subtotal} cgstAmount={cgstAmount} sgstAmount={sgstAmount} igstAmount={igstAmount} grandTotal={grandTotal} lessAmount={lessAmount} discountAmount={discountAmount} amountInWords={amountInWords} mode={mode} gstOption={gstOption} />
                    </div>
                </>
             )}
        </div>
    );
};

export default InvoicePreview;
