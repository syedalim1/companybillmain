import React from 'react';

const InvoiceHeader = ({ copyType, invoiceData, mode }) => {
    const isQuotation = mode === 'quotation';
    const isDcBill = mode === 'dc-bill';
    const isSlipBill = mode === 'slip-bill';

    const getTitle = () => {
        if (isSlipBill) return 'RECEIPT';
        if (isDcBill) return 'DELIVERY CHALLAN';
        if (isQuotation) return 'QUOTATION';
        return 'TAX INVOICE';
    };

    if (isSlipBill) {
        return (
            <header className="text-black text-center px-3 py-1 ">
                 {/* Receipt Title */}
                <div className=" py-1 my-2">
                    <h2 className="font-bold text-xs uppercase">{getTitle()}</h2>
                </div>
                {/* Company Name */}
                <h1 className="font-bold text-xs uppercase">
                    {invoiceData.seller.name}
                </h1>
                
                {/* Address - Properly formatted */}
                <div className="text-xs mt-1 leading-relaxed capitalize">
                    <p>No. K-6, SIDCO, Kurichi, SIDCO Industrial Estate, Coimbatore - 641 021</p>
                </div>
                
                {/* Phone Number */}
                <p className="text-xs font-bold mt-1">
                    Ph: {invoiceData.seller.contact}
                </p>
                
               
                
                {/* Invoice Number & Date */}
                <div className="flex justify-between text-xs px-1">
                    <span>
                        <span className="font-bold">Slip No:</span> {invoiceData.invoiceDetails.invoiceNo}
                    </span>
                    <span><span className="font-bold">Date:</span> {new Date(invoiceData.invoiceDetails.date).toLocaleDateString('en-GB')}</span>
                </div>
            </header>
        );
    }

    return (
        <header className="p-1 border text-black" style={{ borderColor: 'color-mix(in srgb, var(--brand-primary) 30%, black)' }}>
            {/* TAX INVOICE/QUOTATION/DELIVERY CHALLAN Title */}
            <div className="text-center mb-2 py-0.5" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 8%, white)' }}>
                <h2 className="font-extrabold tracking-wider text-base uppercase" style={{ color: 'var(--brand-primary)' }}>{getTitle()}</h2>
            </div>
            <div className="flex justify-between items-start px-2 ">
                {/* Company Details */}
                <div className="flex-1">
                    <h1 className=" font-bold text-[16px] uppercase" style={{ color: 'var(--brand-primary)' }}>
                        {invoiceData.seller.name}
                    </h1>
                    <p className="text-[12px] max-w-sm">
                        NO.K-6, Sidco, Kurichi, <br/>Sidco Industrial Estate, Coimbatore - 641021
                    </p>
                    <p className="text-[14px] mt-2">
                        <span className="font-bold">GSTIN:</span> {invoiceData.seller.gstin}
                    </p>
                    <p className="text-[12px] mt-1">
                        <span className="font-bold">State Name:</span> Tamil Nadu, <span className="font-bold">Code:</span> 33
                    </p>
                    <p className="text-[12px] mt-1">
                        <span className="font-bold">Contact:</span> 9585745303, 6379016686
                    </p>
                    <p className="text-[12px] mt-1">
                        <span className="font-bold">E-Mail:</span> indianmaksteel1982@gmail.com
                    </p>
                </div>
                {/* Invoice/Quotation/DC Details */}
                <div className="text-right">
                    {/* DC Number for DC Bill */}
                    {isDcBill && (
                        <p className=" font-semibold text-[15px]">
                            <span className="font-bold">DC No:</span> {invoiceData.dcDetails?.dcNo || 'DC-001'}
                        </p>
                    )}
                    {/* Document Number for non-DC modes */}
                    {!isDcBill && (
                        <p className=" font-semibold text-[15px]">
                            <span className="font-bold">
                                {isQuotation ? 'Quotation No:' : (copyType === 'slip' ? 'Slip Bill No:' : 'Invoice No:')}
                            </span> {invoiceData.invoiceDetails.invoiceNo}
                        </p>
                    )}
                    <div className="text-md text-[15px]">
                        <div>
                            <div>
                                <span className="font-bold">{isDcBill ? 'DC' : (isQuotation ? 'Quotation' : 'Invoice')} Date</span>
                            </div>
                            <div>
                                {new Date(invoiceData.invoiceDetails.date).toLocaleDateString('en-GB')}
                            </div>
                        </div>

                    </div>
                    {/* Vehicle Number for DC Bill */}
                    {isDcBill && invoiceData.invoiceDetails.vehicleNo && (
                        <p className="text-[12px] mt-1">
                            <span className="font-bold">Vehicle No:</span> {invoiceData.invoiceDetails.vehicleNo}
                        </p>
                    )}

                </div>
            </div>
            {copyType !== 'quotation' && copyType !== 'dc' && (
                <div className="text-center text-xs font-bold py-0.5 border-t border-b uppercase my-1" style={{ borderColor: 'color-mix(in srgb, var(--brand-primary) 30%, black)', color: 'var(--brand-primary)' }}>
                    {copyType === 'original' ? 'ORIGINAL FOR RECIPIENT' : copyType === 'duplicate' ? 'DUPLICATE FOR TRANSPORTER' : 'TRIPLICATE FOR SUPPLIER'}
                </div>
            )}
        </header>
    );
};

export default InvoiceHeader;
