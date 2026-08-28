import React from "react";

const InvoiceMain = ({
  copyType,
  invoiceData,
  subtotal,
  cgstAmount,
  sgstAmount,
  igstAmount,
  grandTotal,
  amountInWords,
  lessAmount,
  discountAmount,
  mode,
  gstOption,
}) => {
  const totalQuantity = invoiceData.items.reduce(
    (acc, item) => acc + (parseFloat(item.quantity) || 0),
    0
  );
  const isCGST_SGST = invoiceData.invoiceDetails.taxType === "cgst_sgst";
  const shouldShowGST =
    (mode === "gst-bill" || (mode === "quotation" && gstOption === "with-gst")) && mode !== 'slip-bill';
  const isSlipBill = mode === 'slip-bill';

  const minRows = isSlipBill ? 12 : 5; // Minimum number of rows for the items section

  // Additional charges to display as items
  const additionalRows = [];

  if (invoiceData.additionalCharges?.freight > 0)
    additionalRows.push({
      type: "freight",
      description: "Transport Charge",
      amount: invoiceData.additionalCharges.freight,
    });
  if (invoiceData.additionalCharges?.insurance > 0)
    additionalRows.push({
      type: "insurance",
      description: "Insurance",
      amount: invoiceData.additionalCharges.insurance,
    });
  if (invoiceData.additionalCharges?.packing > 0)
    additionalRows.push({
      type: "packing",
      description: "Packing Charge",
      amount: invoiceData.additionalCharges.packing,
    });
  if (invoiceData.additionalCharges?.other > 0)
    additionalRows.push({
      type: "other",
      description: "Other Charges",
      amount: invoiceData.additionalCharges.other,
    });

  const emptyRowsCount =
    minRows > invoiceData.items.length ? minRows - invoiceData.items.length : 0;

  // Dynamic tax rate from user settings
  const taxRate = parseFloat(invoiceData.taxRate) || 18;
  const halfRate = taxRate / 2;

  // Calculate GST data grouped by HSN
  let gstData = {};
  if (shouldShowGST) {
    invoiceData.items.forEach((item) => {
      const itemTotal = item.quantity * item.rate * (1 - item.discount / 100);
      if (!gstData[item.hsn]) {
        gstData[item.hsn] = { taxable: 0 };
      }
      gstData[item.hsn].taxable += itemTotal;
    });

    // Add transport charge if present
    if (invoiceData.additionalCharges?.freight > 0) {
      const freight = invoiceData.additionalCharges.freight;
      const hsn = "996511"; // HSN for transportation services
      gstData[hsn] = { taxable: freight };
    }

    Object.keys(gstData).forEach((hsn) => {
      const taxable = gstData[hsn].taxable;
      if (isCGST_SGST) {
        gstData[hsn].cgst = taxable * (halfRate / 100);
        gstData[hsn].sgst = taxable * (halfRate / 100);
        gstData[hsn].totalTax = gstData[hsn].cgst + gstData[hsn].sgst;
      } else {
        gstData[hsn].igst = taxable * (taxRate / 100);
        gstData[hsn].totalTax = gstData[hsn].igst;
      }
    });
  }

  // Calculate totals for GST table
  const totalTaxable = Object.values(gstData).reduce(
    (sum, d) => sum + d.taxable,
    0
  );
  const totalCgst = isCGST_SGST
    ? Object.values(gstData).reduce((sum, d) => sum + d.cgst, 0)
    : 0;
  const totalSgst = isCGST_SGST
    ? Object.values(gstData).reduce((sum, d) => sum + d.sgst, 0)
    : 0;
  const totalIgst = !isCGST_SGST
    ? Object.values(gstData).reduce((sum, d) => sum + d.igst, 0)
    : 0;
  const totalTaxAmount = Object.values(gstData).reduce(
    (sum, d) => sum + d.totalTax,
    0
  );

  return (
    <main className="flex-grow text-[12px]">
      {/* Billing Information */}
      {/* Billing Information */}
      {isSlipBill ? (
          <div className="border-b border-dashed border-black p-2">
            {/* Customer Name */}
            <div className="mb-1">
              <span className="font-bold text-xs">To: </span>
              <span className="font-bold text-xs uppercase">{invoiceData.buyer.name}</span>
            </div>
            
            {/* Phone & Address */}
            <div className="text-xs mt-1">
              {invoiceData.buyer.buyerNumber && (
                <div className="mb-0.5"><span className="font-bold">Mobile:</span> {invoiceData.buyer.buyerNumber}</div>
              )}
              {invoiceData.buyer.address && (
                <div><span className="font-bold">Address:</span> {invoiceData.buyer.address}</div>
              )}
            </div>
          </div>
      ) : (shouldShowGST ? (
        <div className="grid grid-cols-2 border border-t-0 ">
          <div className=" p-2 border-r-1  bg-white">
            <h3 className="text-[10px] font-bold uppercase  mb-2">Bill To</h3>
            <p className="font-bold  text-[13px]">
              {invoiceData.billing?.name || invoiceData.buyer.name}
            </p>
            <p className="text-[13px] ">
              {invoiceData.billing?.address || invoiceData.buyer.address}
            </p>
            <p className="text-[13px]  mt-1">
              <strong>GSTIN:</strong>{" "}
              {invoiceData.billing?.gstin || invoiceData.buyer.gstin || "N/A"}
            </p>
            {invoiceData.buyer.buyerNumber && (
              <p className="text-[13px] ">
                <strong>Contact Number:</strong> {invoiceData.buyer.buyerNumber}
              </p>
            )}
            <p className="text-[13px] ">
              <strong>State:</strong>{" "}
              {invoiceData.billing?.state || invoiceData.buyer.state} (Code:{" "}
              {invoiceData.billing?.stateCode || invoiceData.buyer.stateCode})
            </p>
          </div>
          <div className=" p-2   bg-white">
            <h3 className="text-[10px] font-bold uppercase  mb-2">Ship To</h3>
            <p className="font-bold text-gray-800 text-[13px]">
              {invoiceData.shipping?.name || invoiceData.buyer.name}
            </p>
            <p className="text-[13px] ">
              {invoiceData.shipping?.address || invoiceData.buyer.destination}
            </p>
            {invoiceData.buyer.buyerNumber && (
              <p className="text-[13px]  mt-1">
                <strong>Contact Number:</strong> {invoiceData.buyer.buyerNumber}
              </p>
            )}
            <p className="text-[13px]  mt-1">
              <strong>State:</strong>{" "}
              {invoiceData.shipping?.state || invoiceData.buyer.state} (Code:{" "}
              {invoiceData.shipping?.stateCode || invoiceData.buyer.stateCode})
            </p>
            {invoiceData.invoiceDetails.placeOfSupply && (
              <p className="text-[13px] ">
                <strong>Place of Supply:</strong>{" "}
                {invoiceData.invoiceDetails.placeOfSupply}
              </p>
            )}
            {invoiceData.shipping?.gstin && (
              <p className="text-[13px]  mt-1">
                <strong>GSTIN:</strong> {invoiceData.shipping.gstin}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className=" p-2  bg-white border border-t-0">
          <h3 className="text-[10px] font-bold uppercase text-gray-500 mb-2">
            {mode === 'dc-bill' ? 'Delivery / Party Details' : 'Party Details'}
          </h3>
          <p className="font-bold  text-[13px]">{invoiceData.buyer.name}</p>
          <p className="text-[13px] ">{invoiceData.buyer.address}</p>
          {invoiceData.buyer.destination && (
            <p className="text-[13px] mt-1">
              <strong>Destination:</strong> {invoiceData.buyer.destination}
            </p>
          )}
          {invoiceData.buyer.gstin && (
            <p className="text-[13px] mt-1">
              <strong>GSTIN:</strong> {invoiceData.buyer.gstin}
            </p>
          )}
          {invoiceData.buyer.buyerNumber && (
            <p className="text-[13px]  mt-1">
              <strong>Buyer No:</strong> {invoiceData.buyer.buyerNumber}
            </p>
          )}
          <p className="text-[13px]  mt-1">
            <strong>Contact:</strong> {invoiceData.buyer.contact || "N/A"}
          </p>
          <p className="text-[13px] mt-1">
            <strong>State:</strong> {invoiceData.buyer.state} (Code:{" "}
            {invoiceData.buyer.stateCode})
          </p>
        </div>
      ))}

      {/* Items Table - "Box Table" Style */}
      <div className={`pt-2 border-b-0 ${isSlipBill ? '' : 'bg-white'}`}>
        {/* --- Main Items Table --- */}
        <div className="overflow-hidden">
          {isSlipBill ? (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="py-2 text-center font-bold" style={{width: '8%'}}>No</th>
                  <th className="py-2 text-center font-bold" style={{width: '55%'}}>Item</th>
                  <th className="py-2 text-center font-bold" style={{width: '7%'}}>Qty</th>
                  <th className="py-2 text-center font-bold" style={{width: '15%'}}>Rate</th>
                  <th className="py-2 text-center font-bold " style={{width: '15%'}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => {
                  const itemTotal = item.quantity * item.rate * (1 - item.discount / 100);
                  return (
                    <tr key={item.id}>
                      <td className="py-1 text-center">{index + 1}</td>
                      <td className="py-1 text-left">{item.description}</td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-center">{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-1 text-center">{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  )
                })}
                {/* Empty rows */}
                {Array.from({ length: Math.max(0, minRows - invoiceData.items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                        <td className="py-1 text-center text-gray-400">{invoiceData.items.length + i + 1}</td>
                        <td className="py-1">&nbsp;</td>
                        <td className="py-1"></td>
                        <td className="py-1"></td>
                        <td className="py-1"></td>
                    </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-bold text-xs">
                  <td colSpan="4" className="py-2 text-right">Total: </td>
                  <td className="py-2 text-center "><div className="px-2">
                    Rs.{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>   </td>
                </tr>
              </tfoot>
            </table>

          ) : (
          <table className="w-full text-xs border-collapse border border-slate-400">
            <thead className="bg-white">
              <tr className="">
                <th className="p-2 text-center w-[5%] border ">SI No.</th>
                <th className="p-2 text-left w-[35%] border ">
                  Description of Goods
                </th>
                <th className="p-2 text-center w-[10%] border ">HSN/SAC</th>
                <th className="p-2 text-center w-[10%] border ">Qty</th>
                <th className="p-2 text-right w-[10%] border ">Rate</th>
                <th className="p-2 text-right  border ">{mode === 'dc-bill' ? 'Value' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {/* --- Item Rows --- */}
              {invoiceData.items.map((item, index) => {
                const itemTotal =
                  item.quantity * item.rate * (1 - item.discount / 100);
                return (
                  <tr key={item.id}>
                    <td className="p-2 text-center border ">{index + 1}</td>
                    <td className="p-2 text-left font-semibold border ">
                      {item.description}
                    </td>
                    <td className="p-2 text-center border ">{item.hsn}</td>
                    <td className="p-2 text-center border ">{item.quantity}</td>
                    <td className="p-2 text-right border ">
                      {item.rate.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2 text-right font-semibold border ">
                      {itemTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })}

              {/* --- Empty rows to maintain table height --- */}
              {Array.from({ length: emptyRowsCount }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="p-2 border  border-y-0">&nbsp;</td>
                  <td className="p-2 border  border-y-0"></td>
                  <td className="p-2 border  border-y-0"></td>
                  <td className="p-2 border  border-y-0"></td>
                  <td className="p-2 border  border-y-0"></td>
                  <td className="p-2 border  border-y-0"></td>
                </tr>
              ))}
            </tbody>

            {/* --- Footer with Totals --- */}
            <tfoot>
              {/* --- Subtotal Row --- */}
              {/* --- Additional Charges Rows --- */}
              {additionalRows.map((row) => (
                <tr key={`additional-${row.type}`}>
                  <td
                    colSpan="5"
                    className="p-2 text-right font-semibold border "
                  >
                    {row.description}
                  </td>
                  <td className="p-2 text-right border ">
                    {(parseFloat(row.amount) || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}

              {/* --- Subtotal Row --- */}
              <tr>
                <td
                  colSpan="5"
                  className="p-2 text-right font-semibold border "
                >
                  Subtotal
                </td>
                <td className="p-2 text-right font-semibold border ">
                  {subtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>

              {/* --- Discount Row --- */}
              {invoiceData.additionalCharges.discount > 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-2 text-right font-semibold border "
                  >
                    Less: Discount @ {invoiceData.additionalCharges.discount}%
                  </td>
                  <td className="p-2 text-right border ">
                    -
                    {discountAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              )}
              
              {/* --- Less Amount Row --- */}
              {invoiceData.additionalCharges.lessAmount > 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="p-2 text-right font-semibold border "
                  >
                    Less:{" "}
                    {invoiceData.additionalCharges.lessDescription ||
                      "Advance Paid"}
                  </td>
                  <td className="p-2 text-right border ">
                    -
                    {invoiceData.additionalCharges.lessAmount.toLocaleString(
                      "en-IN",
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                  </td>
                </tr>
              )}

              {/* --- Tax Rows --- */}
              {shouldShowGST &&
                (isCGST_SGST ? (
                  <>
                    {/* --- CGST Row --- */}
                    <tr>
                      <td
                        colSpan="5"
                        className="p-2 text-right font-semibold border "
                      >
                        CGST @ {halfRate}%
                      </td>
                      <td className="p-2 text-right border ">
                        {cgstAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    {/* --- SGST Row --- */}
                    <tr>
                      <td
                        colSpan="5"
                        className="p-2 text-right font-semibold border "
                      >
                        SGST @ {halfRate}%
                      </td>
                      <td className="p-2 text-right border ">
                        {sgstAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </>
                ) : (
                  /* --- IGST Row --- */
                  <tr>
                    <td
                      colSpan="5"
                      className="p-2 text-right font-semibold border "
                    >
                      IGST @ {taxRate}%
                    </td>
                    <td className="p-2 text-right border ">
                      {igstAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              {/* --- Grand Total Row --- */}
              <tr className="font-bold bg-white">
                <td colSpan="3" className="p-2 text-left border-b ">
                  {(invoiceData.additionalCharges.discount > 0 ||
                    invoiceData.additionalCharges.lessAmount > 0)
                    ? "Balance Amount"
                    : mode === 'dc-bill' ? "Total Declared Value" : "Total"}
                </td>
                <td className="p-2 text-center border-b "></td>
                <td className=" border-b"></td>
                <td className="p-2 text-right border-b border-l">
                  ₹
                  {grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
          )}
        </div>

        {/* --- Amount in Words and E&OE --- */}
        {mode !== 'dc-bill' && mode !== 'slip-bill' && (
          <div className="flex border-x-1 justify-between p-2 text-xs">
            <div>
              <p className="font-semibold">Amount Chargeable (in words)</p>
              <p>{amountInWords} </p>
            </div>
          </div>
        )}
        {/* GST Column */}
        {shouldShowGST && (
          <div className=" font-sans">
            <table className="w-full border-collapse border border-black">
              <thead>
                <tr className="text-center font-bold">
                  {/* HSN/SAC */}
                  <th rowSpan="2" className="border border-black align-middle">
                    HSN/SAC
                  </th>
                  {/* Taxable Value */}
                  <th rowSpan="2" className="border border-black align-middle">
                    Taxable Value
                  </th>
                  {/* Integrated Tax or Central Tax */}
                  {isCGST_SGST ? (
                    <>
                      <th
                        colSpan="2"
                        className="border border-black align-middle"
                      >
                        Central Tax
                      </th>
                      <th
                        colSpan="2"
                        className="border border-black align-middle"
                      >
                        State Tax
                      </th>
                    </>
                  ) : (
                    <th
                      colSpan="2"
                      className="border border-black align-middle"
                    >
                      Integrated Tax
                    </th>
                  )}
                  {/* Total Tax Amount */}
                  <th rowSpan="2" className="border border-black align-middle">
                    Total Tax Amount
                  </th>
                </tr>
                <tr className="text-center font-bold">
                  {isCGST_SGST ? (
                    <>
                      <th className="border border-black align-middle">Rate</th>
                      <th className="border border-black align-middle">
                        Amount
                      </th>
                      <th className="border border-black align-middle">Rate</th>
                      <th className="border border-black align-middle">
                        Amount
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="border border-black align-middle">Rate</th>
                      <th className="border border-black align-middle">
                        Amount
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {Object.entries(gstData).map(([hsn, data]) => (
                  <tr key={hsn}>
                    <td className="border border-black text-center align-middle">
                      {hsn}
                    </td>
                    <td className="border border-black  text-center align-middle ">
                      {data.taxable.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    {isCGST_SGST ? (
                      <>
                        <td className="border border-black text-center align-middle">
                          {halfRate}%
                        </td>
                        <td className="border border-black text-center align-middle">
                          {data.cgst.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="border border-black text-center align-middle">
                          {halfRate}%
                        </td>
                        <td className="border border-black text-center align-middle">
                          {data.sgst.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border border-black text-center align-middle">
                          {taxRate}%
                        </td>
                        <td className="border border-black text-center align-middle">
                          {data.igst.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </>
                    )}
                    <td className="border border-black text-center align-middle">
                      {data.totalTax.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <th className="border border-black text-center align-middle">
                    Total
                  </th>
                  <td className="border border-black text-center align-middle">
                    {totalTaxable.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  {isCGST_SGST ? (
                    <>
                      <td className="border border-black"></td>
                      <td className="border border-black text-center align-middle">
                        {totalCgst.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="border border-black"></td>
                      <td className="border border-black text-center align-middle">
                        {totalSgst.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border border-black"></td>
                      <td className="border border-black text-center align-middle">
                        {totalIgst.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </>
                  )}
                  <td className="border border-black text-center align-middle">
                    {totalTaxAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* --- Transport Details Section (Duplicate/Transporter copy only) --- */}
        {copyType === 'duplicate' && mode === 'gst-bill' && (
          <div className="border border-t-0 p-3 bg-white">
            <h3 className="text-[11px] font-bold uppercase text-gray-600 mb-2 border-b pb-1">Transport Details</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <p className="text-[12px]">
                <strong>Vehicle No:</strong> {invoiceData.invoiceDetails.vehicleNo || '_______________'}
              </p>
              <p className="text-[12px]">
                <strong>Driver Name:</strong> {invoiceData.invoiceDetails.transporterName || '_______________'}
              </p>
              <p className="text-[12px]">
                <strong>Mode of Transport:</strong> {invoiceData.invoiceDetails.modeOfTransport || '_______________'}
              </p>
              <p className="text-[12px]">
                <strong>E-way Bill No:</strong> {invoiceData.invoiceDetails.ewayBillNo || '_______________'}
              </p>
            </div>
          </div>
        )}

        {/* --- Notes Section --- */}
        {invoiceData.invoiceDetails.notes && (
          <div className="mt-4 p-2 border-t ">
            <p className="font-semibold text-xs mb-1">Notes:</p>
            <p className="text-xs">{invoiceData.invoiceDetails.notes}</p>
          </div>
        )}

        {/* --- Receiver Signature Section for DC Bill --- */}
        {mode === 'dc-bill' && (
          <div className="mt-6 p-4 border border-b-0 bg-white ">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-semibold text-xs mb-1">Goods Dispatched By:</p>
                <p className="text-xs">{invoiceData.seller.name}</p>
                <div className="mt-8 border-t border-gray-400 pt-1">
                  <p className="text-xs text-center">Authorized Signatory</p>
                </div>
              </div>
              <div>
                <p className="font-semibold text-xs mb-1">Received By:</p>
                <p className="text-xs">{invoiceData.dcDetails?.receiverName || '________________________'}</p>
                <div className="mt-8 border-t border-gray-400 pt-1">
                  <p className="text-xs text-center">Receiver's Signature</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-4 text-center italic">
              This is a Delivery Challan and not a Tax Invoice. No GST is charged on this document.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default InvoiceMain;
