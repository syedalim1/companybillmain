import React from 'react';

const InvoiceDetailsForm = ({ invoiceData, handleInputChange, hideBillNumber = false, currentMode = 'gst-bill' }) => {
  const isDcBill = currentMode === 'dc-bill';
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-shadow hover:shadow-md">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
        <svg className={`w-4 h-4 ${isDcBill ? 'text-rose-600' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        {isDcBill ? 'DC Details' : (hideBillNumber ? 'Quotation Details' : 'Invoice Details')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* DC Number field for DC Bill mode */}
        {isDcBill && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">DC Number</label>
            <input
                type="text"
                value={invoiceData.dcDetails?.dcNo || ''}
                onChange={(e) => handleInputChange('dcDetails', 'dcNo', e.target.value)}
                placeholder="DC-001"
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all appearance-none"
            />
          </div>
        )}
        {/* Invoice/Quotation Number field for non-DC modes */}
        {!hideBillNumber && !isDcBill && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">
              {currentMode === 'quotation' ? 'Quotation No' : (currentMode === 'slip-bill' ? 'Slip Bill No' : 'Invoice No')}
            </label>
            <input
                type="text"
                value={invoiceData.invoiceDetails.invoiceNo}
                onChange={(e) => handleInputChange('invoiceDetails', 'invoiceNo', e.target.value)}
                placeholder={currentMode === 'quotation' ? 'QTN-001' : 'INV-001'}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all font-mono"
            />
          </div>
        )}
        <div className={(hideBillNumber && !isDcBill) ? 'col-span-2' : ''}>
             <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Date</label>
             <input
                type="date"
                value={invoiceData.invoiceDetails.date}
                onChange={(e) => handleInputChange('invoiceDetails', 'date', e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all cursor-pointer"
            />
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
         <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Due Date</label>
            <input
                type="date"
                value={invoiceData.invoiceDetails.dueDate}
                onChange={(e) => handleInputChange('invoiceDetails', 'dueDate', e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all cursor-pointer"
            />
         </div>
         <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">PO Number</label>
            <input
                type="text"
                value={invoiceData.invoiceDetails.poNumber}
                onChange={(e) => handleInputChange('invoiceDetails', 'poNumber', e.target.value)}
                placeholder="PO-202X-001"
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all font-mono"
            />
         </div>
      </div>

      <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Reference</label>
            <input
                type="text"
                value={invoiceData.invoiceDetails.reference}
                onChange={(e) => handleInputChange('invoiceDetails', 'reference', e.target.value)}
                placeholder="Additional Reference / Note"
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
      </div>

      {/* Tax and Supply Details - Hidden for DC Bill mode */}
      {!isDcBill && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
               <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Tax Type</label>
               <select
                    value={invoiceData.invoiceDetails.taxType}
                    onChange={(e) => handleInputChange('invoiceDetails', 'taxType', e.target.value)}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all appearance-none"
                >
                    <option value="cgst_sgst">Intrastate (CGST + SGST)</option>
                    <option value="igst">Interstate (IGST)</option>
                </select>
            </div>
            <div>
               <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">GST Rate (%)</label>
               <input
                    type="number"
                    value={invoiceData.taxRate}
                    onChange={(e) => handleInputChange('taxRate', '', parseFloat(e.target.value) || 0)}
                    placeholder="18"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Place of Supply</label>
                <input
                    type="text"
                    value={invoiceData.invoiceDetails.placeOfSupply}
                    onChange={(e) => handleInputChange('invoiceDetails', 'placeOfSupply', e.target.value)}
                    placeholder="State / City"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all"
                />
            </div>
            <div className="flex items-center">
                 <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl hover:bg-gray-50 w-full transition-colors border border-transparent hover:border-gray-100">
                    <input
                        type="checkbox"
                        checked={invoiceData.invoiceDetails.reverseCharge}
                        onChange={(e) => handleInputChange('invoiceDetails', 'reverseCharge', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Reverse Charge</span>
                </label>
            </div>
          </div>
        </>
      )}

      {/* Transport Details - Show for GST bill mode */}
      {!isDcBill && !hideBillNumber && (
        <div className="mb-4">
          <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
            Transport Details (For Transporter Copy)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Vehicle Number</label>
              <input
                type="text"
                value={invoiceData.invoiceDetails.vehicleNo || ''}
                onChange={(e) => handleInputChange('invoiceDetails', 'vehicleNo', e.target.value)}
                placeholder="TN 01 AB 1234"
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Driver Name</label>
              <input
                type="text"
                value={invoiceData.invoiceDetails.transporterName || ''}
                onChange={(e) => handleInputChange('invoiceDetails', 'transporterName', e.target.value)}
                placeholder="Driver / Transporter Name"
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Mode of Transport</label>
              <select
                value={invoiceData.invoiceDetails.modeOfTransport || ''}
                onChange={(e) => handleInputChange('invoiceDetails', 'modeOfTransport', e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
              >
                <option value="">Select Mode</option>
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
                <option value="Air">Air</option>
                <option value="Ship">Ship</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">E-way Bill Number</label>
              <input
                type="text"
                value={invoiceData.invoiceDetails.ewayBillNo || ''}
                onChange={(e) => handleInputChange('invoiceDetails', 'ewayBillNo', e.target.value)}
                placeholder="E-way Bill No"
                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* DC Bill specific fields */}
      {isDcBill && (
        <>
          <div className="mb-4">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
              Transport Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Transport Name</label>
                <input
                    type="text"
                    value={invoiceData.invoiceDetails.transporterName || ''}
                    onChange={(e) => handleInputChange('invoiceDetails', 'transporterName', e.target.value)}
                    placeholder="Transport Name"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Vehicle Number</label>
                <input
                    type="text"
                    value={invoiceData.invoiceDetails.vehicleNo || ''}
                    onChange={(e) => handleInputChange('invoiceDetails', 'vehicleNo', e.target.value)}
                    placeholder="TN 01 AB 1234"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Driver Name</label>
                <input
                    type="text"
                    value={invoiceData.invoiceDetails.driverName || ''}
                    onChange={(e) => handleInputChange('invoiceDetails', 'driverName', e.target.value)}
                    placeholder="Driver Name"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Driver Mobile</label>
                <input
                    type="text"
                    value={invoiceData.invoiceDetails.driverMobile || ''}
                    onChange={(e) => handleInputChange('invoiceDetails', 'driverMobile', e.target.value)}
                    placeholder="Driver Mobile"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-mono"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Receiver Name</label>
              <input
                  type="text"
                  value={invoiceData.dcDetails?.receiverName || ''}
                  onChange={(e) => handleInputChange('dcDetails', 'receiverName', e.target.value)}
                  placeholder="Name of receiver"
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">DC Status</label>
              <select
                  value={invoiceData.dcDetails?.dcStatus || 'pending'}
                  onChange={(e) => handleInputChange('dcDetails', 'dcStatus', e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all"
              >
                  <option value="pending">Pending</option>
                  <option value="in-transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Notes Section */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Notes / Terms</label>
        <textarea
          value={invoiceData.invoiceDetails.notes}
          onChange={(e) => handleInputChange('invoiceDetails', 'notes', e.target.value)}
          placeholder="Payment Terms: Net 30..."
          rows="3"
          className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all resize-none text-sm"
        />
      </div>

    </div>
  );
};

export default InvoiceDetailsForm;
