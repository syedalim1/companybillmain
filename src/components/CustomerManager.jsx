import React, { useState, useEffect } from 'react';
import { getStateFromGstin, validateGstin } from '../utils/gstStateHelper';

// --- Icons Components ---
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CustomerManager = () => {
  const [buyers, setBuyers] = useState([]);
  const [editingBuyer, setEditingBuyer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBuyer, setNewBuyer] = useState({
    name: '',
    address: '',
    destination: '',
    gstin: '',
    state: '',
    stateCode: '',
    contact: '',
    buyerNumber: '',
    email: '',
    legalName: '',
    tradeName: '',
    constitutionOfBusiness: '',
    taxType: '',
    gstStatus: '',
    registrationDate: '',
    cancelledDate: '',
    eInvoiceStatus: '',
    natureOfBusinessActivity: '',
    lastUpdateDate: '',
    stateJurisdiction: '',
    stateJurisdictionCode: '',
    centerJurisdiction: '',
    centerJurisdictionCode: '',
    pincode: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFetchingGst, setIsFetchingGst] = useState(false);

  const fetchGstDetails = async (isEditing = false) => {
    const gstin = isEditing ? editingBuyer.gstin : newBuyer.gstin;
    
    if (!gstin || gstin.length !== 15) {
      alert("Please enter a valid 15-character GSTIN");
      return;
    }

    setIsFetchingGst(true);
    try {
      const response = await fetch(`/api/gst-lookup?gstin=${gstin}`);
      if (!response.ok) {
        throw new Error("Invalid GST Number or API Error");
      }
      
      const data = await response.json();
      
      let gstInfo = data;
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        gstInfo = data.data[0];
      }
      
      // --- Map GST response fields ---
      const legalName = gstInfo?.legalName || gstInfo?.lgnm || '';
      const tradeName = gstInfo?.tradeName || gstInfo?.tradeNam || '';
      const displayName = tradeName || legalName;
      
      // Build full address from principal address object
      let address = '';
      let pincode = '';
      if (gstInfo?.principalAddress?.address) {
        const a = gstInfo.principalAddress.address;
        address = [a.buildingNumber, a.buildingName, a.floorNumber, a.street, a.location, a.locality, a.district, a.stateCode, a.pincode].filter(Boolean).join(', ');
        pincode = a.pincode || '';
      } else {
        address = gstInfo?.pradr?.adr || gstInfo?.pradr?.addr?.bno || gstInfo?.address || '';
      }
      
      const stateCode = parseInt(gstin.substring(0, 2), 10);
      const stateName = gstInfo?.principalAddress?.address?.stateCode || gstInfo?.state || getStateFromGstin(gstin)?.name || '';

      // Build the GST fields object
      const gstFields = {
        name: displayName,
        address: address,
        state: stateName,
        stateCode: isNaN(stateCode) ? null : stateCode,
        legalName: legalName,
        tradeName: tradeName,
        constitutionOfBusiness: gstInfo?.constitutionOfBusiness || gstInfo?.ctb || '',
        taxType: gstInfo?.taxType || gstInfo?.dty || '',
        gstStatus: gstInfo?.status || gstInfo?.sts || '',
        registrationDate: gstInfo?.registrationDate || gstInfo?.rgdt || '',
        cancelledDate: gstInfo?.cancelledDate || gstInfo?.cxdt || '',
        eInvoiceStatus: gstInfo?.eInvoiceStatus || gstInfo?.einvoiceStatus || '',
        natureOfBusinessActivity: Array.isArray(gstInfo?.natureOfBusinessActivity)
          ? gstInfo.natureOfBusinessActivity.join(', ')
          : (gstInfo?.natureOfBusinessActivity || gstInfo?.nba || ''),
        lastUpdateDate: gstInfo?.lastUpdateDate || gstInfo?.lstupdt || '',
        stateJurisdiction: gstInfo?.stateJurisdiction || gstInfo?.stj || '',
        stateJurisdictionCode: gstInfo?.stateJurisdictionCode || gstInfo?.stjCd || '',
        centerJurisdiction: gstInfo?.centerJurisdiction || gstInfo?.ctj || '',
        centerJurisdictionCode: gstInfo?.centerJurisdictionCode || gstInfo?.ctjCd || '',
        pincode: pincode,
      };
      
      if (isEditing) {
        setEditingBuyer(prev => ({
          ...prev,
          ...gstFields,
          name: gstFields.name || prev.name,
          address: gstFields.address || prev.address,
        }));
      } else {
        setNewBuyer(prev => ({
          ...prev,
          ...gstFields,
          name: gstFields.name || prev.name,
          address: gstFields.address || prev.address,
        }));
      }
      
      if (!displayName) {
        alert("Could not extract company name from GST response.");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Invalid GST Number");
    } finally {
      setIsFetchingGst(false);
    }
  };

  // Fetch buyers from database
  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    try {
      const response = await fetch('/api/buyers');
      if (response.ok) {
        const data = await response.json();
        setBuyers(data);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter buyers based on search term
  const filteredBuyers = buyers.filter(buyer =>
    buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buyer.gstin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buyer.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buyer.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle edit buyer
  const handleEditBuyer = (buyer) => {
    setEditingBuyer({
      ...buyer,
      destination: buyer.destination || '',
      contact: buyer.contact || '',
      address: buyer.address || '',
      state: buyer.state || '',
      gstin: buyer.gstin || '',
      email: buyer.email || '',
      buyerNumber: buyer.buyerNumber || '',
      legalName: buyer.legalName || '',
      tradeName: buyer.tradeName || '',
      constitutionOfBusiness: buyer.constitutionOfBusiness || '',
      taxType: buyer.taxType || '',
      gstStatus: buyer.gstStatus || '',
      registrationDate: buyer.registrationDate || '',
      cancelledDate: buyer.cancelledDate || '',
      eInvoiceStatus: buyer.eInvoiceStatus || '',
      natureOfBusinessActivity: buyer.natureOfBusinessActivity || '',
      lastUpdateDate: buyer.lastUpdateDate || '',
      stateJurisdiction: buyer.stateJurisdiction || '',
      stateJurisdictionCode: buyer.stateJurisdictionCode || '',
      centerJurisdiction: buyer.centerJurisdiction || '',
      centerJurisdictionCode: buyer.centerJurisdictionCode || '',
      pincode: buyer.pincode || '',
    });
  };

  // Handle save edited buyer
  const handleSaveEdit = async () => {
    if (!editingBuyer.name) {
      alert('Name is required');
      return;
    }

    try {
      const response = await fetch('/api/buyers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingBuyer),
      });

      if (response.ok) {
        alert('Buyer updated successfully!');
        setEditingBuyer(null);
        fetchBuyers();
      } else {
        const error = await response.json();
        alert(`Failed to update buyer: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating buyer:', error);
      alert('Failed to update buyer. Please try again.');
    }
  };

  // Handle create new buyer
  const handleCreateBuyer = async () => {
    if (!newBuyer.name) {
      alert('Name is required');
      return;
    }

    try {
      const response = await fetch('/api/buyers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBuyer),
      });

      if (response.ok) {
        alert('Customer added successfully!');
        setShowAddModal(false);
        setNewBuyer({
          name: '',
          address: '',
          destination: '',
          gstin: '',
          state: '',
          stateCode: '',
          contact: '',
          buyerNumber: '',
          email: '',
          legalName: '',
          tradeName: '',
          constitutionOfBusiness: '',
          taxType: '',
          gstStatus: '',
          registrationDate: '',
          cancelledDate: '',
          eInvoiceStatus: '',
          natureOfBusinessActivity: '',
          lastUpdateDate: '',
          stateJurisdiction: '',
          stateJurisdictionCode: '',
          centerJurisdiction: '',
          centerJurisdictionCode: '',
          pincode: '',
        });
        fetchBuyers();
      } else {
        const error = await response.json();
        alert(`Failed to add customer: ${error.error || error.details}`);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer. Please try again.');
    }
  };

  // Handle delete buyer
  const handleDeleteBuyer = async (buyerId) => {
    if (!confirm('Are you sure you want to delete this buyer?')) {
      return;
    }

    try {
      const response = await fetch(`/api/buyers?id=${buyerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Buyer deleted successfully!');
        fetchBuyers();
      } else {
        const error = await response.json();
        alert(`Failed to delete buyer: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting buyer:', error);
      alert('Failed to delete buyer. Please try again.');
    }
  };

  // Handle input change for editing
  const handleEditChange = (field, value) => {
    if (field === 'gstin') {
      const gstinVal = value.toUpperCase();
      const stateInfo = getStateFromGstin(gstinVal);
      if (stateInfo) {
        setEditingBuyer(prev => ({
          ...prev,
          gstin: gstinVal,
          state: stateInfo.name,
          stateCode: stateInfo.code
        }));
        return;
      }
    }
    setEditingBuyer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle input change for adding
  const handleNewBuyerChange = (field, value) => {
    if (field === 'gstin') {
      const gstinVal = value.toUpperCase();
      const stateInfo = getStateFromGstin(gstinVal);
      if (stateInfo) {
        setNewBuyer(prev => ({
          ...prev,
          gstin: gstinVal,
          state: stateInfo.name,
          stateCode: stateInfo.code
        }));
        return;
      }
    }
    setNewBuyer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-gray-800 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Customer Manager
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your customer database with ease.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Customer
          </button>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
            <span className="text-sm font-medium text-gray-500">Total:</span>
            <span className="ml-2 text-lg font-bold text-blue-600">{buyers.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, GSTIN, contact, or state..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* Mobile Card View (Visible on < md) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredBuyers.map((buyer) => (
          <div key={buyer.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <UserIcon />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{buyer.name}</h3>
                  {buyer.tradeName && buyer.tradeName !== buyer.name && (
                    <div className="text-xs text-gray-500 mt-0.5">{buyer.tradeName}</div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {buyer.gstin || "No GSTIN"}
                    </span>
                    {buyer.gstStatus && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        buyer.gstStatus.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {buyer.gstStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <PhoneIcon />
                <span>{buyer.contact || "N/A"}</span>
              </div>
              {buyer.email && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{buyer.email}</span>
                </div>
              )}
              <div className="flex items-start">
                <MapPinIcon />
                <span className="truncate">{buyer.address || "N/A"}</span>
              </div>
              <div className="flex items-center ml-5">
                 <span className="text-xs text-gray-400 mr-1">State:</span>
                 <span>{buyer.state} {buyer.stateCode && `(${buyer.stateCode})`}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleEditBuyer(buyer)}
                className="flex-1 flex items-center justify-center py-2 px-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
              >
                <EditIcon />
                <span className="ml-1.5">Edit</span>
              </button>
              <button
                onClick={() => handleDeleteBuyer(buyer.id)}
                className="flex-1 flex items-center justify-center py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <TrashIcon />
                <span className="ml-1.5">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (Hidden on < md) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">GSTIN</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact / Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider font-medium">Address</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBuyers.map((buyer) => (
                <tr key={buyer.id} className="hover:bg-white transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{buyer.name}</div>
                    {buyer.tradeName && buyer.tradeName !== buyer.name && (
                      <div className="text-xs text-gray-400">{buyer.tradeName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block">
                      {buyer.gstin || "N/A"}
                    </div>
                    {buyer.gstStatus && (
                      <div className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded inline-block ${
                        buyer.gstStatus.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {buyer.gstStatus}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{buyer.contact || "N/A"}</div>
                    {buyer.email && (
                      <div className="text-xs text-gray-400 mt-0.5">{buyer.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {buyer.state} <span className="text-gray-400 text-xs">{buyer.stateCode && `(${buyer.stateCode})`}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate" title={buyer.address}>
                      {buyer.address || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleEditBuyer(buyer)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDeleteBuyer(buyer.id)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBuyers.length === 0 && (
          <div className="p-12 text-center">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-3">
              <SearchIcon />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search terms.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-gray-900">Add New Customer</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200 cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Customer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newBuyer.name}
                    onChange={(e) => handleNewBuyerChange("name", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={newBuyer.address}
                    onChange={(e) => handleNewBuyerChange("address", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Destination</label>
                  <input
                    type="text"
                    value={newBuyer.destination}
                    onChange={(e) => handleNewBuyerChange("destination", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. Local"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-gray-700">GSTIN</label>
                    {newBuyer.gstin && (
                      <span className={`text-xs font-semibold ${validateGstin(newBuyer.gstin) ? "text-emerald-600" : "text-rose-500"}`}>
                        {validateGstin(newBuyer.gstin) ? "Valid GSTIN format" : "Invalid GSTIN format"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBuyer.gstin}
                      onChange={(e) => handleNewBuyerChange("gstin", e.target.value)}
                      className={`flex-1 p-3 border rounded-lg focus:ring-2 outline-none transition-all font-mono ${
                        newBuyer.gstin 
                          ? (validateGstin(newBuyer.gstin) ? "border-emerald-500 focus:ring-emerald-500/50" : "border-rose-400 focus:ring-rose-500/50") 
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      placeholder="e.g. 33AACJ5553C1Z0"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => fetchGstDetails(false)}
                      disabled={isFetchingGst || !newBuyer.gstin || newBuyer.gstin.length !== 15}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-semibold transition-colors flex items-center justify-center whitespace-nowrap"
                    >
                      {isFetchingGst ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : "Fetch"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    value={newBuyer.state}
                    onChange={(e) => handleNewBuyerChange("state", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Auto-populated from GSTIN"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">State Code</label>
                  <input
                    type="number"
                    value={newBuyer.stateCode || ""}
                    onChange={(e) => handleNewBuyerChange("stateCode", parseInt(e.target.value) || null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Auto-populated"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contact Number</label>
                  <input
                    type="text"
                    value={newBuyer.contact}
                    onChange={(e) => handleNewBuyerChange("contact", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. +91 9999999999"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={newBuyer.email || ""}
                    onChange={(e) => handleNewBuyerChange("email", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="customer@domain.com"
                  />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Customer Reference Code (Optional)</label>
                  <input
                    type="text"
                    value={newBuyer.buyerNumber || ""}
                    onChange={(e) => handleNewBuyerChange("buyerNumber", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. CUST-102"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBuyer}
                className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all cursor-pointer"
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBuyer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-gray-900">Edit Customer</h2>
              <button 
                onClick={() => setEditingBuyer(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200 cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Customer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editingBuyer.name}
                    onChange={(e) => handleEditChange("name", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    value={editingBuyer.address}
                    onChange={(e) => handleEditChange("address", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Destination</label>
                  <input
                    type="text"
                    value={editingBuyer.destination}
                    onChange={(e) => handleEditChange("destination", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-gray-700">GSTIN</label>
                    {editingBuyer.gstin && (
                      <span className={`text-xs font-semibold ${validateGstin(editingBuyer.gstin) ? "text-emerald-600" : "text-rose-500"}`}>
                        {validateGstin(editingBuyer.gstin) ? "Valid GSTIN format" : "Invalid GSTIN format"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingBuyer.gstin}
                      onChange={(e) => handleEditChange("gstin", e.target.value)}
                      className={`flex-1 p-3 border rounded-lg focus:ring-2 outline-none transition-all font-mono ${
                        editingBuyer.gstin 
                          ? (validateGstin(editingBuyer.gstin) ? "border-emerald-500 focus:ring-emerald-500/50" : "border-rose-400 focus:ring-rose-500/50") 
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => fetchGstDetails(true)}
                      disabled={isFetchingGst || !editingBuyer.gstin || editingBuyer.gstin.length !== 15}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-semibold transition-colors flex items-center justify-center whitespace-nowrap"
                    >
                      {isFetchingGst ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : "Fetch"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    value={editingBuyer.state}
                    onChange={(e) => handleEditChange("state", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">State Code</label>
                  <input
                    type="number"
                    value={editingBuyer.stateCode || ""}
                    onChange={(e) => handleEditChange("stateCode", parseInt(e.target.value) || null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contact</label>
                  <input
                    type="text"
                    value={editingBuyer.contact}
                    onChange={(e) => handleEditChange("contact", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={editingBuyer.email || ""}
                    onChange={(e) => handleEditChange("email", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="customer@domain.com"
                  />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Buyer Number</label>
                  <input
                    type="text"
                    value={editingBuyer.buyerNumber || ""}
                    onChange={(e) => handleEditChange("buyerNumber", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setEditingBuyer(null)}
                className="flex-1 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;