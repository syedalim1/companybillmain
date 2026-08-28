import React from 'react';
import InvoiceHeader from './InvoiceHeader';
import InvoiceMain from './InvoiceMain';
import InvoiceFooter from './InvoiceFooter';
import DCBillTemplate from './DCBillTemplate';

const InvoiceContent = ({ copyType, invoiceData, subtotal, cgstAmount, sgstAmount, igstAmount, grandTotal, amountInWords, mode, gstOption }) => {
    const isSlipBill = mode === 'slip-bill';
    const isDcBill = mode === 'dc-bill';

    if (isDcBill) {
        return (
            <DCBillTemplate 
                copyType={copyType} 
                invoiceData={invoiceData} 
                subtotal={subtotal} 
                cgstAmount={cgstAmount} 
                sgstAmount={sgstAmount} 
                igstAmount={igstAmount} 
                grandTotal={grandTotal} 
                mode={mode} 
            />
        );
    }
    
    return (
        <div className={`bg-white text-black shadow-2xl print:shadow-none font-sans ${isSlipBill ? 'slip-bill-container' : ''}`}
             style={isSlipBill ? { width: '130mm'} : {}}>
            <div className="flex flex-col">
                <InvoiceHeader copyType={copyType} invoiceData={invoiceData} mode={mode} />
                <InvoiceMain copyType={copyType} invoiceData={invoiceData} subtotal={subtotal} cgstAmount={cgstAmount} sgstAmount={sgstAmount} igstAmount={igstAmount} grandTotal={grandTotal} amountInWords={amountInWords} mode={mode} gstOption={gstOption} />
                <InvoiceFooter invoiceData={invoiceData} subtotal={subtotal} cgstAmount={cgstAmount} sgstAmount={sgstAmount} igstAmount={igstAmount} grandTotal={grandTotal} mode={mode} gstOption={gstOption} />
            </div>
        </div>
    );
};

export default InvoiceContent;
