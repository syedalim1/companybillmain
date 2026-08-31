import React, { useState, useEffect } from 'react';

const PaymentStatusModal = ({ isOpen, onClose, invoice, onUpdate }) => {
  const [formData, setFormData] = useState({
    paymentStatus: 'unpaid',
    paymentDate: '',
    paymentAmount: '',
    paymentNotes: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (invoice) {
      setFormData({
        paymentStatus: invoice.paymentStatus || 'unpaid',
        paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate).toISOString().split('T')[0] : '',
        paymentAmount: invoice.paymentAmount?.toString() || '',
        paymentNotes: invoice.paymentNotes || '',
      });
    }
  }, [invoice]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const updateData = {
        paymentStatus: formData.paymentStatus,
        paymentDate: formData.paymentDate ? new Date(formData.paymentDate).toISOString() : null,
        paymentAmount: parseFloat(formData.paymentAmount) || 0,
        paymentNotes: formData.paymentNotes,
      };

      const response = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: invoice.id, ...updateData }),
      });

      if (response.ok) {
        const result = await response.json();
        onUpdate(result.invoice);
        alert('Payment status updated successfully!');
        onClose();
      } else {
        throw new Error('Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100 ';
      case 'partial': return 'text-yellow-600 bg-yellow-100 ';
      case 'overdue': return 'text-red-600 bg-red-100 ';
      default: return '  ';
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-bg-surface   rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text-title">Update Payment Status</h2>
            <button
              onClick={onClose}
              className="  hover:text-text-body text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Invoice Summary */}
          <div className=" p-4 rounded-xl mb-6 border border-slate-100    ">
            <h3 className="font-semibold text-text-title mb-2">Invoice Details</h3>
            <div className="text-sm text-text-body space-y-1">
              <p><strong>Invoice No:</strong> {invoice.invoiceNo}</p>
              <p><strong>Customer:</strong> {invoice.buyerName || invoice.buyer?.name || 'N/A'}</p>
              <p><strong>Total Amount:</strong> ₹{invoice.grandTotal?.toLocaleString('en-IN')}</p>
              <p><strong>Current Status:</strong>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.paymentStatus)}`}>
                  {invoice.paymentStatus?.toUpperCase() || 'UNPAID'}
                </span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Status Buttons */}
            <div>
              <label className="block text-sm font-medium text-text-body mb-2">
                Payment Status *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'unpaid', label: 'Unpaid', active: 'bg-slate-100 text-slate-800 border-slate-400 ring-2 ring-slate-400/20 font-bold' },
                  { id: 'partial', label: 'Partial', active: 'bg-amber-50 text-amber-700 border-amber-400 ring-2 ring-amber-400/20 font-bold' },
                  { id: 'paid', label: 'Paid', active: 'bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-500/20 font-bold' },
                  { id: 'overdue', label: 'Overdue', active: 'bg-rose-50 text-rose-700 border-rose-400 ring-2 ring-rose-400/20 font-bold' },
                ].map((status) => {
                  const isSelected = formData.paymentStatus === status.id;
                  return (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => handleInputChange('paymentStatus', status.id)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? status.active
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                      {status.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-text-body mb-2">
                Payment Date
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                className="w-full p-3 bg-slate-50  border border-slate-200     rounded-xl focus:bg-white    focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all text-text-title"
              />
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-text-body mb-2">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.paymentAmount}
                onChange={(e) => handleInputChange('paymentAmount', e.target.value)}
                placeholder="Enter payment amount"
                className="w-full p-3 bg-slate-50  border border-slate-200     rounded-xl focus:bg-white    focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all text-text-title"
              />
              <p className="text-xs   mt-1">
                Total Invoice Amount: ₹{invoice.grandTotal?.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Payment Notes */}
            <div>
              <label className="block text-sm font-medium text-text-body mb-2">
                Payment Notes
              </label>
              <textarea
                value={formData.paymentNotes}
                onChange={(e) => handleInputChange('paymentNotes', e.target.value)}
                placeholder="Add payment notes or transaction details..."
                className="w-full p-3 bg-slate-50  border border-slate-200     rounded-xl focus:bg-white    focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all text-text-title resize-none"
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-100   text-text-body rounded-xl  transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-200 dark:hover:shadow-blue-950"
              >
                {isUpdating ? 'Updating...' : 'Update Payment Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusModal;