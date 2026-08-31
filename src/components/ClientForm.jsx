"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getStateFromGstin, validateGstin, INDIAN_STATES } from '@/utils/gstStateHelper';

const ClientForm = ({ invoiceData, handleInputChange }) => {
  const [buyers, setBuyers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFetchingGst, setIsFetchingGst] = useState(false);

  // State autocomplete
  const [stateSearchTerm, setStateSearchTerm] = useState('');
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const stateInputRef = useRef(null);
  const stateSuggestionsRef = useRef(null);

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const response = await fetch('/api/buyers');
        if (response.ok) {
          const data = await response.json();
          setBuyers(data);
        }
      } catch (error) {
        console.error('Error fetching buyers:', error);
      }
    };
    fetchBuyers();
  }, []);

  // Close state suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        stateInputRef.current &&
        !stateInputRef.current.contains(e.target)
      ) {
        setShowStateSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBuyers = buyers.filter(buyer =>
    buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buyer.gstin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buyer.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buyer.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBuyerSelect = (buyer) => {
    handleInputChange('buyer', 'name', buyer.name);
    handleInputChange('buyer', 'address', buyer.address);
    handleInputChange('buyer', 'destination', buyer.destination);
    handleInputChange('buyer', 'contact', buyer.contact);
    handleInputChange('buyer', 'gstin', buyer.gstin);
    handleInputChange('buyer', 'state', buyer.state);
    handleInputChange('buyer', 'stateCode', buyer.stateCode);
    handleInputChange('buyer', 'buyerNumber', buyer.buyerNumber || '');
    handleInputChange('buyer', 'email', buyer.email || '');
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleNameChange = (value) => {
    setSearchTerm(value);
    handleInputChange('buyer', 'name', value);
    setShowDropdown(value.length > 0);
  };

  const handleGstinChange = (value) => {
    const uppercaseValue = value.toUpperCase();
    handleInputChange('buyer', 'gstin', uppercaseValue);
    
    // Auto-parse state
    const parsedState = getStateFromGstin(uppercaseValue);
    if (parsedState) {
      handleInputChange('buyer', 'state', parsedState.name);
      handleInputChange('buyer', 'stateCode', parsedState.code);
    }
  };

  const fetchGstDetails = async (gstin) => {
    if (!gstin) return;
    
    // Basic validation
    if (!validateGstin(gstin)) {
      alert("Please enter a valid 15-character GSTIN before fetching.");
      return;
    }

    setIsFetchingGst(true);
    try {
      const response = await fetch(`/api/gst-lookup?gstin=${gstin}`);
      if (response.ok) {
        const data = await response.json();
        
        // Handle different API response structures
        let gstInfo = data;
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          gstInfo = data.data[0];
        }

        // --- Map GST response fields ---
        const legalName = gstInfo?.legalName || gstInfo?.lgnm || '';
        const tradeName = gstInfo?.tradeName || gstInfo?.tradeNam || '';
        const businessName = tradeName || legalName;
        
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
        
        if (businessName) handleInputChange('buyer', 'name', businessName);
        if (address) handleInputChange('buyer', 'address', address);
        
        // Auto-parse state
        const stateName = gstInfo?.principalAddress?.address?.stateCode || gstInfo?.state || getStateFromGstin(gstin)?.name;
        if (stateName) handleInputChange('buyer', 'state', stateName);

        const stateCode = parseInt(gstin.substring(0, 2), 10);
        if (!isNaN(stateCode)) handleInputChange('buyer', 'stateCode', stateCode);

        // Map all GST detail fields
        if (legalName) handleInputChange('buyer', 'legalName', legalName);
        if (tradeName) handleInputChange('buyer', 'tradeName', tradeName);
        
        const constitutionOfBusiness = gstInfo?.constitutionOfBusiness || gstInfo?.ctb || '';
        if (constitutionOfBusiness) handleInputChange('buyer', 'constitutionOfBusiness', constitutionOfBusiness);
        
        const taxType = gstInfo?.taxType || gstInfo?.dty || '';
        if (taxType) handleInputChange('buyer', 'taxType', taxType);
        
        const gstStatus = gstInfo?.status || gstInfo?.sts || '';
        if (gstStatus) handleInputChange('buyer', 'gstStatus', gstStatus);
        
        const registrationDate = gstInfo?.registrationDate || gstInfo?.rgdt || '';
        if (registrationDate) handleInputChange('buyer', 'registrationDate', registrationDate);
        
        const cancelledDate = gstInfo?.cancelledDate || gstInfo?.cxdt || '';
        if (cancelledDate) handleInputChange('buyer', 'cancelledDate', cancelledDate);
        
        const eInvoiceStatus = gstInfo?.eInvoiceStatus || gstInfo?.einvoiceStatus || '';
        if (eInvoiceStatus) handleInputChange('buyer', 'eInvoiceStatus', eInvoiceStatus);

        const natureOfBusinessActivity = Array.isArray(gstInfo?.natureOfBusinessActivity)
          ? gstInfo.natureOfBusinessActivity.join(', ')
          : (gstInfo?.natureOfBusinessActivity || gstInfo?.nba || '');
        if (natureOfBusinessActivity) handleInputChange('buyer', 'natureOfBusinessActivity', natureOfBusinessActivity);

        const lastUpdateDate = gstInfo?.lastUpdateDate || gstInfo?.lstupdt || '';
        if (lastUpdateDate) handleInputChange('buyer', 'lastUpdateDate', lastUpdateDate);

        // Jurisdiction fields
        const stateJurisdiction = gstInfo?.stateJurisdiction || gstInfo?.stj || '';
        if (stateJurisdiction) handleInputChange('buyer', 'stateJurisdiction', stateJurisdiction);
        
        const stateJurisdictionCode = gstInfo?.stateJurisdictionCode || gstInfo?.stjCd || '';
        if (stateJurisdictionCode) handleInputChange('buyer', 'stateJurisdictionCode', stateJurisdictionCode);
        
        const centerJurisdiction = gstInfo?.centerJurisdiction || gstInfo?.ctj || '';
        if (centerJurisdiction) handleInputChange('buyer', 'centerJurisdiction', centerJurisdiction);
        
        const centerJurisdictionCode = gstInfo?.centerJurisdictionCode || gstInfo?.ctjCd || '';
        if (centerJurisdictionCode) handleInputChange('buyer', 'centerJurisdictionCode', centerJurisdictionCode);

        if (pincode) handleInputChange('buyer', 'pincode', pincode);
        
        alert("GST details fetched successfully!");
      } else {
        const err = await response.json();
        alert(`Failed to fetch GST details: ${err.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching GST details:', error);
      alert('Error fetching GST details. Please check your network or API key.');
    } finally {
      setIsFetchingGst(false);
    }
  };

  const handleGstinKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission if inside a form
      fetchGstDetails(invoiceData.buyer.gstin);
    }
  };

  const handleSaveBuyer = async () => {
    if (!invoiceData.buyer.name || !invoiceData.buyer.gstin) {
      alert('Please fill in buyer name and GSTIN before saving.');
      return;
    }

    try {
      const response = await fetch('/api/buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData.buyer),
      });

      if (response.ok) {
        alert('Buyer saved successfully!');
        const buyersResponse = await fetch('/api/buyers');
        if (buyersResponse.ok) {
            const data = await buyersResponse.json();
            setBuyers(data);
        }
      } else {
        const result = await response.json();
        alert(`Failed to save buyer: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving buyer:', error);
      alert('Failed to save buyer. Please try again.');
    }
  };

  const isGstinValid = validateGstin(invoiceData.buyer.gstin);

  return (
    <div className="bg-white   rounded-2xl shadow-sm border border-slate-100    /80 p-6 transition-all duration-300">
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100    /80">
        <h3 className="text-sm font-bold text-text-title uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Client Information
        </h3>
        <button
          onClick={handleSaveBuyer}
          className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover bg-brand-primary/10 hover:bg-brand-primary/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save Client
        </button>
      </div>

      <div className="space-y-4">
        {/* Name with autocomplete */}
        <div className="relative">
          <label className="block text-xs font-medium   mb-1 ml-1">Client Name</label>
          <input
            type="text"
            value={invoiceData.buyer.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all font-medium text-text-title"
            placeholder="Search or enter client name..."
          />
          {showDropdown && filteredBuyers.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white   border border-slate-100    /80 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {filteredBuyers.map((buyer) => (
                <div
                  key={buyer.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  onClick={() => handleBuyerSelect(buyer)}
                >
                  <div className="font-semibold text-text-title text-sm">{buyer.name}</div>
                  <div className="text-[11px]   flex flex-wrap gap-2 mt-1">
                    {buyer.gstin && <span className="bg-slate-100   px-1.5 py-0.5 rounded">GST: {buyer.gstin}</span>}
                    {buyer.state && <span>{buyer.state}</span>}
                    {buyer.email && <span>{buyer.email}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Address and Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium   mb-1 ml-1">Address</label>
            <input
              type="text"
              value={invoiceData.buyer.address}
              onChange={(e) => handleInputChange('buyer', 'address', e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-text-title text-sm"
              placeholder="Street Address"
            />
          </div>
          <div>
            <label className="block text-xs font-medium   mb-1 ml-1">Destination</label>
            <input
              type="text"
              value={invoiceData.buyer.destination}
              onChange={(e) => handleInputChange('buyer', 'destination', e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-text-title text-sm"
              placeholder="City / Destination"
            />
          </div>
        </div>

        {/* GSTIN and Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1 ml-1">GSTIN</label>
            <div className="relative">
              <input
                type="text"
                value={invoiceData.buyer.gstin}
                onChange={(e) => handleGstinChange(e.target.value)}
                onKeyDown={handleGstinKeyDown}
                className={`w-full p-3 pr-24 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all font-mono text-sm text-text-title uppercase tracking-wider ${
                  invoiceData.buyer.gstin
                    ? isGstinValid
                      ? "border-emerald-500 focus:ring-emerald-500/50"
                      : "border-amber-500 focus:ring-amber-500/50"
                    : "border-slate-200 focus:ring-brand-primary/50 focus:border-brand-primary"
                }`}
                placeholder="GSTIN Number"
              />
              <button
                type="button"
                onClick={() => fetchGstDetails(invoiceData.buyer.gstin)}
                disabled={!isGstinValid || isFetchingGst}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isGstinValid && !isFetchingGst
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                title={!isGstinValid ? 'Enter a valid 15-character GSTIN' : 'Fetch GST details'}
              >
                {isFetchingGst ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Fetching</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Fetch GST</span>
                  </>
                )}
              </button>
            </div>
            {invoiceData.buyer.gstin && !isGstinValid && (
              <span className="text-[10px] text-amber-500 mt-1 block">Invalid GSTIN format (should be 15-char code)</span>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium   mb-1 ml-1">Contact</label>
            <input
              type="text"
              value={invoiceData.buyer.contact}
              onChange={(e) => handleInputChange('buyer', 'contact', e.target.value)}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-text-title text-sm"
              placeholder="Phone Number"
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-medium   mb-1 ml-1">Email (for invoice)</label>
          <input
            type="email"
            value={invoiceData.buyer.email || ''}
            onChange={(e) => handleInputChange('buyer', 'email', e.target.value)}
            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-text-title text-sm"
            placeholder="client@company.com"
          />
        </div>

        {/* State and State Code */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 relative" ref={stateInputRef}>
            <label className="block text-xs font-medium mb-1 ml-1">State</label>
            <input
              type="text"
              value={showStateSuggestions ? stateSearchTerm : (invoiceData.buyer.state || '')}
              onChange={(e) => {
                const val = e.target.value;
                setStateSearchTerm(val);
                setShowStateSuggestions(true);
                handleInputChange('buyer', 'state', val);
              }}
              onFocus={() => {
                setStateSearchTerm(invoiceData.buyer.state || '');
                setShowStateSuggestions(true);
              }}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-text-title text-sm"
              placeholder="Type state name..."
              autoComplete="off"
            />
            {showStateSuggestions && (() => {
              const query = stateSearchTerm.toLowerCase().trim();
              const filtered = query
                ? INDIAN_STATES.filter(s =>
                    s.name.toLowerCase().includes(query) ||
                    s.name.toLowerCase().startsWith(query) ||
                    s.key.startsWith(query) ||
                    String(s.code).startsWith(query)
                  )
                : INDIAN_STATES;
              return filtered.length > 0 ? (
                <div
                  ref={stateSuggestionsRef}
                  className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                >
                  {filtered.map((state) => (
                    <button
                      key={state.key}
                      type="button"
                      onClick={() => {
                        handleInputChange('buyer', 'state', state.name);
                        handleInputChange('buyer', 'stateCode', state.code);
                        setStateSearchTerm(state.name);
                        setShowStateSuggestions(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center justify-between hover:bg-brand-primary/5 ${
                        invoiceData.buyer.state === state.name
                          ? 'bg-brand-primary/10 text-brand-primary font-medium'
                          : 'text-slate-700'
                      }`}
                    >
                      <span>{state.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{String(state.code).padStart(2, '0')}</span>
                    </button>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 ml-1">Code</label>
            <input
              type="number"
              value={invoiceData.buyer.stateCode || ''}
              onChange={(e) => {
                const code = parseInt(e.target.value) || null;
                handleInputChange('buyer', 'stateCode', code);
                // Auto-fill state name from code
                if (code) {
                  const paddedCode = String(code).padStart(2, '0');
                  const match = INDIAN_STATES.find(s => s.key === paddedCode);
                  if (match) {
                    handleInputChange('buyer', 'state', match.name);
                  }
                }
              }}
              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-text-title text-sm"
              placeholder="33"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium   mb-1 ml-1">Buyer Order No (Optional)</label>
          <input
            type="text"
            value={invoiceData.buyer.buyerNumber || ''}
            onChange={(e) => handleInputChange('buyer', 'buyerNumber', e.target.value)}
            className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all text-text-title text-sm"
            placeholder="PO / Order reference"
          />
        </div>
      </div>
    </div>
  );
};

export default ClientForm;
