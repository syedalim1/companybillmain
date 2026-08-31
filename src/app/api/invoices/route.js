import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';

// ============================================================================
// HELPERS
// ============================================================================

// Guard: return 503 if database is not configured
function guardDB() {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Please check environment variables.' },
      { status: 503 }
    );
  }
  return null;
}

/**
 * Safely parse a string to an integer, returning 0 if it fails.
 */
function safeParseInt(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Safely format a date value to 'YYYY-MM-DD' for PostgreSQL.
 * Handles Date objects, JS date strings (e.g. "Sun Aug 02 2026 00:00:00 GMT..."),
 * truncated JS date strings (e.g. "Sun Aug 02 2026 00:00:00 GM"),
 * ISO strings, and YYYY-MM-DD strings.
 * Returns null if the value is falsy or unparseable.
 */
function safeDateFormat(val) {
  if (!val) return null;
  const str = typeof val === 'string' ? val.trim() : String(val).trim();
  if (!str) return null;

  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Handle ISO strings like "2026-08-02T00:00:00.000Z"
  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoMatch) {
    return isoMatch[1];
  }

  // Handle JS Date.toString() format: "Sun Aug 02 2026 00:00:00 GMT+0530..."
  // Also handles truncated versions like "Sun Aug 02 2026 00:00:00 GM"
  const jsDateMatch = str.match(/^\w{3}\s+(\w{3})\s+(\d{1,2})\s+(\d{4})/);
  if (jsDateMatch) {
    const months = { Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06',
                     Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12' };
    const month = months[jsDateMatch[1]];
    if (month) {
      const day = jsDateMatch[2].padStart(2, '0');
      return `${jsDateMatch[3]}-${month}-${day}`;
    }
  }

  // Fallback: try standard Date parsing
  try {
    // Strip trailing partial timezone text that may cause parse failures
    const cleaned = str.replace(/\s+[A-Z]{1,2}$/, '');
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Calculate the next invoice/DC/quotation/slip numbers from the database.
 * Completely independent numbering for each document type.
 */
async function getNextNumbers() {
  const invoices = await query('SELECT "invoiceNo", "dcNo", mode FROM invoices');
  const invoiceList = invoices || [];

  // Next GST Invoice number
  const gstNos = invoiceList
    .filter((inv) => inv.mode === 'gst-bill')
    .map((inv) => safeParseInt(inv.invoiceNo));
  const maxGstNo = gstNos.length > 0 ? Math.max(...gstNos) : 0;

  // Next Quotation number
  const quotationNos = invoiceList
    .filter((inv) => inv.mode === 'quotation')
    .map((inv) => safeParseInt(inv.invoiceNo));
  const maxQuotationNo = quotationNos.length > 0 ? Math.max(...quotationNos) : 0;

  // Next DC number
  const dcNos = invoiceList
    .filter((inv) => inv.mode === 'dc-bill')
    .map((inv) => safeParseInt(String(inv.dcNo).replace('DC-', '')));
  const maxDcNo = dcNos.length > 0 ? Math.max(...dcNos) : 0;

  // Next slip number
  const slipNos = invoiceList
    .filter((inv) => inv.mode === 'slip-bill')
    .map((inv) => safeParseInt(inv.invoiceNo));
  const maxSlipNo = slipNos.length > 0 ? Math.max(...slipNos) : 0;

  return {
    nextInvoiceNo: maxGstNo + 1,
    nextQuotationNo: maxQuotationNo + 1,
    nextDcNo: maxDcNo + 1,
    nextSlipNo: maxSlipNo + 1,
  };
}

/**
 * Find or create a seller record by GSTIN.
 */
async function findOrCreateSeller(sellerData) {
  if (sellerData.gstin) {
    const rows = await query('SELECT * FROM sellers WHERE "gstin" = $1 LIMIT 1', [sellerData.gstin]);
    if (rows.length > 0) return rows[0];
  }

  const id = crypto.randomUUID();
  const newSeller = {
    id,
    name: sellerData.name || '',
    address: sellerData.address || '',
    gstin: sellerData.gstin || '',
    state: sellerData.state || '',
    stateCode: sellerData.stateCode || null,
    contact: sellerData.contact || '',
    email: sellerData.email || '',
    bankName: sellerData.bankName || '',
    accNo: sellerData.accNo || '',
    branch: sellerData.branch || '',
    ifsc: sellerData.ifsc || '',
    logo: sellerData.logo || null,
  };

  const rows = await query(
    `INSERT INTO sellers ("id", "name", "address", "gstin", "state", "stateCode", "contact", "email", "bankName", "accNo", "branch", "ifsc", "logo")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [newSeller.id, newSeller.name, newSeller.address, newSeller.gstin, newSeller.state, newSeller.stateCode, newSeller.contact, newSeller.email, newSeller.bankName, newSeller.accNo, newSeller.branch, newSeller.ifsc, newSeller.logo]
  );
  return rows[0];
}

/**
 * Find or create a buyer record by GSTIN (or name if no GSTIN).
 */
async function findOrCreateBuyer(buyerData) {
  // Try to find by GSTIN first (if provided and non-empty)
  if (buyerData.gstin && buyerData.gstin.trim() !== '') {
    const rows = await query('SELECT * FROM buyers WHERE "gstin" = $1 LIMIT 1', [buyerData.gstin]);
    if (rows.length > 0) return rows[0];
  }

  // Try to find by name if no GSTIN match
  if (buyerData.name && buyerData.name.trim() !== '') {
    const rows = await query('SELECT * FROM buyers WHERE "name" = $1 LIMIT 1', [buyerData.name]);
    if (rows.length > 0) return rows[0];
  }

  // Create new buyer
  const id = crypto.randomUUID();
  const newBuyer = {
    id,
    name: buyerData.name || '',
    address: buyerData.address || '',
    destination: buyerData.destination || '',
    contact: buyerData.contact || '',
    gstin: buyerData.gstin || '',
    state: buyerData.state || '',
    stateCode: buyerData.stateCode || null,
    buyerNumber: buyerData.buyerNumber || null,
    email: buyerData.email || null,
    legalName: buyerData.legalName || null,
    tradeName: buyerData.tradeName || null,
    constitutionOfBusiness: buyerData.constitutionOfBusiness || null,
    taxType: buyerData.taxType || null,
    gstStatus: buyerData.gstStatus || null,
    registrationDate: buyerData.registrationDate || null,
    cancelledDate: buyerData.cancelledDate || null,
    eInvoiceStatus: buyerData.eInvoiceStatus || null,
    natureOfBusinessActivity: buyerData.natureOfBusinessActivity || null,
    lastUpdateDate: buyerData.lastUpdateDate || null,
    stateJurisdiction: buyerData.stateJurisdiction || null,
    stateJurisdictionCode: buyerData.stateJurisdictionCode || null,
    centerJurisdiction: buyerData.centerJurisdiction || null,
    centerJurisdictionCode: buyerData.centerJurisdictionCode || null,
    pincode: buyerData.pincode || null,
  };

  const rows = await query(
    `INSERT INTO buyers ("id", "name", "address", "destination", "contact", "gstin", "state", "stateCode", "buyerNumber", "email",
      "legalName", "tradeName", "constitutionOfBusiness", "taxType", "gstStatus", "registrationDate",
      "cancelledDate", "eInvoiceStatus", "natureOfBusinessActivity", "lastUpdateDate",
      "stateJurisdiction", "stateJurisdictionCode", "centerJurisdiction", "centerJurisdictionCode", "pincode")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
     RETURNING *`,
    [newBuyer.id, newBuyer.name, newBuyer.address, newBuyer.destination, newBuyer.contact, newBuyer.gstin, newBuyer.state, newBuyer.stateCode, newBuyer.buyerNumber, newBuyer.email,
     newBuyer.legalName, newBuyer.tradeName, newBuyer.constitutionOfBusiness, newBuyer.taxType, newBuyer.gstStatus, newBuyer.registrationDate,
     newBuyer.cancelledDate, newBuyer.eInvoiceStatus, newBuyer.natureOfBusinessActivity, newBuyer.lastUpdateDate,
     newBuyer.stateJurisdiction, newBuyer.stateJurisdictionCode, newBuyer.centerJurisdiction, newBuyer.centerJurisdictionCode, newBuyer.pincode]
  );
  return rows[0];
}

/**
 * Build snapshot fields for the invoice from buyer/seller data.
 * Bug 9 fix: Use ?? instead of || to preserve empty strings and falsy values.
 */
function buildSnapshotFields(data) {
  return {
    // Seller snapshot
    sellerName: data.seller?.name ?? null,
    sellerAddress: data.seller?.address ?? null,
    sellerGstin: data.seller?.gstin ?? null,
    sellerState: data.seller?.state ?? null,
    sellerStateCode: data.seller?.stateCode ?? null,
    sellerContact: data.seller?.contact ?? null,
    sellerEmail: data.seller?.email ?? null,
    sellerBankName: data.seller?.bankName ?? null,
    sellerAccNo: data.seller?.accNo ?? null,
    sellerBranch: data.seller?.branch ?? null,
    sellerIfsc: data.seller?.ifsc ?? null,
    sellerLogo: data.seller?.logo ?? null,
    // Buyer snapshot
    buyerName: data.buyer?.name ?? null,
    buyerAddress: data.buyer?.address ?? null,
    buyerDestination: data.buyer?.destination ?? null,
    buyerContact: data.buyer?.contact ?? null,
    buyerGstin: data.buyer?.gstin ?? null,
    buyerState: data.buyer?.state ?? null,
    buyerStateCode: data.buyer?.stateCode ?? null,
    buyerNumber: data.buyer?.buyerNumber ?? null,
    buyerEmail: data.buyer?.email ?? null,
  };
}

/**
 * Fetch a full invoice by ID with all related data (seller, buyer, items, additional charges).
 * Assembles a full invoice object with related data using separate queries.
 */
async function fetchFullInvoice(invoiceId) {
  const invoiceRows = await query('SELECT * FROM invoices WHERE "id" = $1', [invoiceId]);
  if (invoiceRows.length === 0) return null;

  const invoice = invoiceRows[0];

  // Fetch related data in parallel
  const [sellerRows, buyerRows, itemRows, chargeRows] = await Promise.all([
    query('SELECT * FROM sellers WHERE "id" = $1', [invoice.sellerId]),
    query('SELECT * FROM buyers WHERE "id" = $1', [invoice.buyerId]),
    query('SELECT * FROM items WHERE "invoiceId" = $1', [invoiceId]),
    query('SELECT * FROM additional_charges WHERE "invoiceId" = $1', [invoiceId]),
  ]);

  return {
    ...invoice,
    seller: sellerRows[0] || null,
    buyer: buyerRows[0] || null,
    items: itemRows || [],
    additionalCharges: chargeRows[0] || null,
  };
}

/**
 * Fetch all invoices with related data.
 */
async function fetchAllInvoices() {
  const invoiceRows = await query('SELECT * FROM invoices ORDER BY "createdAt" DESC');

  if (!invoiceRows || invoiceRows.length === 0) return [];

  // Collect all unique seller/buyer IDs
  const sellerIds = [...new Set(invoiceRows.map(inv => inv.sellerId).filter(Boolean))];
  const buyerIds = [...new Set(invoiceRows.map(inv => inv.buyerId).filter(Boolean))];
  const invoiceIds = invoiceRows.map(inv => inv.id);

  // Batch fetch related data
  const [sellers, buyers, items, charges] = await Promise.all([
    sellerIds.length > 0
      ? query(`SELECT * FROM sellers WHERE "id" = ANY($1)`, [sellerIds])
      : [],
    buyerIds.length > 0
      ? query(`SELECT * FROM buyers WHERE "id" = ANY($1)`, [buyerIds])
      : [],
    invoiceIds.length > 0
      ? query(`SELECT * FROM items WHERE "invoiceId" = ANY($1)`, [invoiceIds])
      : [],
    invoiceIds.length > 0
      ? query(`SELECT * FROM additional_charges WHERE "invoiceId" = ANY($1)`, [invoiceIds])
      : [],
  ]);

  // Build lookup maps
  const sellerMap = new Map(sellers.map(s => [s.id, s]));
  const buyerMap = new Map(buyers.map(b => [b.id, b]));
  const itemsMap = new Map();
  for (const item of items) {
    if (!itemsMap.has(item.invoiceId)) itemsMap.set(item.invoiceId, []);
    itemsMap.get(item.invoiceId).push(item);
  }
  const chargesMap = new Map(charges.map(c => [c.invoiceId, c]));

  // Assemble full invoices
  return invoiceRows.map(inv => ({
    ...inv,
    seller: sellerMap.get(inv.sellerId) || null,
    buyer: buyerMap.get(inv.buyerId) || null,
    items: itemsMap.get(inv.id) || [],
    additionalCharges: chargesMap.get(inv.id) || null,
  }));
}


// ============================================================================
// POST — Create a new invoice
// ============================================================================
export async function POST(request) {
  const guard = guardDB();
  if (guard) return guard;

  try {
    const data = await request.json();

    // --- Validation ---
    if (!data.invoiceDetails || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Invoice details and at least one item are required' },
        { status: 400 }
      );
    }

    // --- Duplicate invoice number check ---
    const invoiceNo = data.invoiceDetails.invoiceNo;
    const mode = data.mode || 'gst-bill';

    if (mode === 'dc-bill') {
      const dcNo = data.dcDetails?.dcNo;
      if (dcNo) {
        const duplicateRows = await query(
          'SELECT "id" FROM invoices WHERE "dcNo" = $1 AND "mode" = $2 LIMIT 1',
          [dcNo, mode]
        );
        if (duplicateRows.length > 0) {
          return NextResponse.json(
            { error: `Delivery Challan number ${dcNo} already exists. Please use a different number.` },
            { status: 409 }
          );
        }
      }
    } else if (invoiceNo) {
      // STRICT separation: Only check for duplicates within the EXACT same document type.
      const duplicateRows = await query(
        'SELECT "id" FROM invoices WHERE "invoiceNo" = $1 AND "mode" = $2 LIMIT 1',
        [invoiceNo, mode]
      );

      if (duplicateRows.length > 0) {
        const docName = mode === 'quotation' ? 'Quotation' : mode === 'slip-bill' ? 'Slip Bill' : 'Invoice';
        return NextResponse.json(
          { error: `${docName} number ${invoiceNo} already exists. Please use a different number.` },
          { status: 409 }
        );
      }
    }

    // --- Find or create seller/buyer (for relational reference only) ---
    const seller = await findOrCreateSeller(data.seller || {});
    const buyer = await findOrCreateBuyer(data.buyer || {});

    // --- Build snapshot fields ---
    const snapshots = buildSnapshotFields(data);

    // --- Create invoice with snapshot data ---
    const invoiceId = crypto.randomUUID();

    await query(
      `INSERT INTO invoices (
        "id", "invoiceNo", "date", "dueDate", "poNumber", "reference", "placeOfSupply",
        "taxType", "reverseCharge", "ewayBillNo", "vehicleNo", "transporterName",
        "driverName", "driverMobile", "transporterId", "distance", "modeOfTransport",
        "terms", "paymentTerms", "notes", "taxRate", "mode", "quotationGstOption",
        "subtotal", "cgstAmount", "sgstAmount", "igstAmount", "grandTotal",
        "dcNo", "dcStatus", "receiverName",
        "sellerId", "buyerId",
        "sellerName", "sellerAddress", "sellerGstin", "sellerState", "sellerStateCode",
        "sellerContact", "sellerEmail", "sellerBankName", "sellerAccNo", "sellerBranch", "sellerIfsc", "sellerLogo",
        "buyerName", "buyerAddress", "buyerDestination", "buyerContact", "buyerGstin",
        "buyerState", "buyerStateCode", "buyerNumber", "buyerEmail",
        "billingName", "billingAddress", "billingGstin", "billingState", "billingStateCode",
        "shippingName", "shippingAddress", "shippingGstin", "shippingState", "shippingStateCode"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23,
        $24, $25, $26, $27, $28,
        $29, $30, $31,
        $32, $33,
        $34, $35, $36, $37, $38,
        $39, $40, $41, $42, $43, $44, $45,
        $46, $47, $48, $49, $50,
        $51, $52, $53, $54,
        $55, $56, $57, $58, $59,
        $60, $61, $62, $63, $64
      )`,
      [
        invoiceId,
        data.invoiceDetails.invoiceNo || '',
        safeDateFormat(data.invoiceDetails.date) || new Date().toISOString().split('T')[0],
        safeDateFormat(data.invoiceDetails.dueDate),
        data.invoiceDetails.poNumber || null,
        data.invoiceDetails.reference || null,
        data.invoiceDetails.placeOfSupply || null,
        data.invoiceDetails.taxType || 'cgst_sgst',
        data.invoiceDetails.reverseCharge || false,
        data.invoiceDetails.ewayBillNo || null,
        data.invoiceDetails.vehicleNo || null,
        data.invoiceDetails.transporterName || null,
        data.invoiceDetails.driverName || null,
        data.invoiceDetails.driverMobile || null,
        data.invoiceDetails.transporterId || null,
        data.invoiceDetails.distance || null,
        data.invoiceDetails.modeOfTransport || null,
        data.invoiceDetails.terms || null,
        data.invoiceDetails.paymentTerms || null,
        data.invoiceDetails.notes || null,
        parseFloat(data.taxRate) || 0,
        mode,
        data.quotationGstOption || null,
        parseFloat(data.subtotal) || 0,
        parseFloat(data.cgstAmount) || 0,
        parseFloat(data.sgstAmount) || 0,
        parseFloat(data.igstAmount) || 0,
        parseFloat(data.grandTotal) || 0,
        data.dcDetails?.dcNo || null,
        data.dcDetails?.dcStatus || null,
        data.dcDetails?.receiverName || null,
        seller.id,
        buyer.id,
        snapshots.sellerName,
        snapshots.sellerAddress,
        snapshots.sellerGstin,
        snapshots.sellerState,
        snapshots.sellerStateCode,
        snapshots.sellerContact,
        snapshots.sellerEmail,
        snapshots.sellerBankName,
        snapshots.sellerAccNo,
        snapshots.sellerBranch,
        snapshots.sellerIfsc,
        snapshots.sellerLogo,
        snapshots.buyerName,
        snapshots.buyerAddress,
        snapshots.buyerDestination,
        snapshots.buyerContact,
        snapshots.buyerGstin,
        snapshots.buyerState,
        snapshots.buyerStateCode,
        snapshots.buyerNumber,
        snapshots.buyerEmail,
        data.billing?.name || null,
        data.billing?.address || null,
        data.billing?.gstin || null,
        data.billing?.state || null,
        data.billing?.stateCode || null,
        data.shipping?.name || null,
        data.shipping?.address || null,
        data.shipping?.gstin || null,
        data.shipping?.state || null,
        data.shipping?.stateCode || null,
      ]
    );

    try {
      // --- Create Items ---
      for (const item of data.items) {
        await query(
          `INSERT INTO items ("id", "description", "hsn", "sac", "quantity", "rate", "discount", "unit", "invoiceId")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            crypto.randomUUID(),
            item.description || '',
            item.hsn || null,
            item.sac || null,
            parseFloat(item.quantity) || 0,
            parseFloat(item.rate) || 0,
            parseFloat(item.discount) || 0,
            item.unit || null,
            invoiceId,
          ]
        );
      }

      // --- Create Additional Charges ---
      await query(
        `INSERT INTO additional_charges ("id", "freight", "insurance", "packing", "other", "discount", "lessAmount", "lessDescription", "invoiceId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          crypto.randomUUID(),
          parseFloat(data.additionalCharges?.freight) || 0,
          parseFloat(data.additionalCharges?.insurance) || 0,
          parseFloat(data.additionalCharges?.packing) || 0,
          parseFloat(data.additionalCharges?.other) || 0,
          parseFloat(data.additionalCharges?.discount) || 0,
          parseFloat(data.additionalCharges?.lessAmount) || 0,
          data.additionalCharges?.lessDescription || null,
          invoiceId,
        ]
      );
    } catch (err) {
      // Rollback newly created invoice (cascades to items/charges if any were created)
      await query('DELETE FROM invoices WHERE "id" = $1', [invoiceId]);
      throw err;
    }

    // --- Retrieve full invoice ---
    const fullInvoice = await fetchFullInvoice(invoiceId);

    const formattedInvoice = {
      ...fullInvoice,
      date: safeDateFormat(fullInvoice.date),
      dueDate: safeDateFormat(fullInvoice.dueDate),
    };

    // --- Get updated next numbers ---
    const nextNumbers = await getNextNumbers();

    const response = { invoice: formattedInvoice, ...nextNumbers };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET — Fetch all invoices + next numbers
// ============================================================================
export async function GET() {
  const guard = guardDB();
  if (guard) return guard;

  try {
    const invoices = await fetchAllInvoices();

    const formattedInvoices = invoices.map((inv) => ({
      ...inv,
      date: safeDateFormat(inv.date),
      dueDate: safeDateFormat(inv.dueDate),
    }));

    const nextNumbers = await getNextNumbers();

    return NextResponse.json({ invoices: formattedInvoices, ...nextNumbers });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT — Update an existing invoice
// ============================================================================
export async function PUT(request) {
  const guard = guardDB();
  if (guard) return guard;

  try {
    const { id, ...data } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required for update' },
        { status: 400 }
      );
    }

    // --- Find existing invoice ---
    const existingRows = await query(
      'SELECT * FROM invoices WHERE "id" = $1',
      [id]
    );

    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const existingInvoice = existingRows[0];
    const mode = data.mode || existingInvoice.mode;
    const newInvoiceNo = data.invoiceDetails?.invoiceNo || existingInvoice.invoiceNo;
    const newDcNo = data.dcDetails?.dcNo || existingInvoice.dcNo;

    // --- Duplicate Number Check ---
    if (mode === 'dc-bill' && newDcNo && newDcNo !== existingInvoice.dcNo) {
      const duplicateRows = await query(
        'SELECT "id" FROM invoices WHERE "dcNo" = $1 AND "mode" = $2 AND "id" != $3 LIMIT 1',
        [newDcNo, mode, id]
      );
      if (duplicateRows.length > 0) {
        return NextResponse.json(
          { error: `Delivery Challan number ${newDcNo} already exists. Please use a different number.` },
          { status: 409 }
        );
      }
    } else if (mode !== 'dc-bill' && newInvoiceNo && newInvoiceNo !== existingInvoice.invoiceNo) {
      const duplicateRows = await query(
        'SELECT "id" FROM invoices WHERE "invoiceNo" = $1 AND "mode" = $2 AND "id" != $3 LIMIT 1',
        [newInvoiceNo, mode, id]
      );
      if (duplicateRows.length > 0) {
        const docName = mode === 'quotation' ? 'Quotation' : mode === 'slip-bill' ? 'Slip Bill' : 'Invoice';
        return NextResponse.json(
          { error: `${docName} number ${newInvoiceNo} already exists. Please use a different number.` },
          { status: 409 }
        );
      }
    }

    // Check for existing additional charges
    const existingChargeRows = await query(
      'SELECT * FROM additional_charges WHERE "invoiceId" = $1',
      [id]
    );
    const existingCharges = existingChargeRows.length > 0 ? existingChargeRows[0] : null;

    // --- Find or create seller/buyer ---
    const seller = await findOrCreateSeller(data.seller || {});
    const buyer = await findOrCreateBuyer(data.buyer || {});

    // --- Build snapshot fields ---
    const snapshots = buildSnapshotFields(data);

    // --- Update invoice ---
    await query(
      `UPDATE invoices SET
        "invoiceNo" = $1, "date" = $2, "dueDate" = $3, "poNumber" = $4, "reference" = $5,
        "placeOfSupply" = $6, "taxType" = $7, "reverseCharge" = $8, "ewayBillNo" = $9,
        "vehicleNo" = $10, "transporterName" = $11, "driverName" = $12, "driverMobile" = $13,
        "transporterId" = $14, "distance" = $15, "modeOfTransport" = $16, "terms" = $17,
        "paymentTerms" = $18, "notes" = $19, "taxRate" = $20, "mode" = $21, "quotationGstOption" = $22,
        "subtotal" = $23, "cgstAmount" = $24, "sgstAmount" = $25, "igstAmount" = $26, "grandTotal" = $27,
        "dcNo" = $28, "dcStatus" = $29, "receiverName" = $30,
        "sellerId" = $31, "buyerId" = $32,
        "sellerName" = $33, "sellerAddress" = $34, "sellerGstin" = $35, "sellerState" = $36, "sellerStateCode" = $37,
        "sellerContact" = $38, "sellerEmail" = $39, "sellerBankName" = $40, "sellerAccNo" = $41,
        "sellerBranch" = $42, "sellerIfsc" = $43, "sellerLogo" = $44,
        "buyerName" = $45, "buyerAddress" = $46, "buyerDestination" = $47, "buyerContact" = $48,
        "buyerGstin" = $49, "buyerState" = $50, "buyerStateCode" = $51, "buyerNumber" = $52, "buyerEmail" = $53,
        "billingName" = $54, "billingAddress" = $55, "billingGstin" = $56, "billingState" = $57, "billingStateCode" = $58,
        "shippingName" = $59, "shippingAddress" = $60, "shippingGstin" = $61, "shippingState" = $62, "shippingStateCode" = $63,
        "updatedAt" = $64
      WHERE "id" = $65`,
      [
        data.invoiceDetails?.invoiceNo || existingInvoice.invoiceNo,
        safeDateFormat(data.invoiceDetails?.date) || safeDateFormat(existingInvoice.date) || new Date().toISOString().split('T')[0],
        safeDateFormat(data.invoiceDetails?.dueDate),
        data.invoiceDetails?.poNumber || null,
        data.invoiceDetails?.reference || null,
        data.invoiceDetails?.placeOfSupply || null,
        data.invoiceDetails?.taxType || 'cgst_sgst',
        data.invoiceDetails?.reverseCharge || false,
        data.invoiceDetails?.ewayBillNo || null,
        data.invoiceDetails?.vehicleNo || null,
        data.invoiceDetails?.transporterName || null,
        data.invoiceDetails?.driverName || null,
        data.invoiceDetails?.driverMobile || null,
        data.invoiceDetails?.transporterId || null,
        data.invoiceDetails?.distance || null,
        data.invoiceDetails?.modeOfTransport || null,
        data.invoiceDetails?.terms || null,
        data.invoiceDetails?.paymentTerms || null,
        data.invoiceDetails?.notes || null,
        parseFloat(data.taxRate) || 0,
        data.mode || existingInvoice.mode,
        data.quotationGstOption || null,
        parseFloat(data.subtotal) || 0,
        parseFloat(data.cgstAmount) || 0,
        parseFloat(data.sgstAmount) || 0,
        parseFloat(data.igstAmount) || 0,
        parseFloat(data.grandTotal) || 0,
        data.dcDetails?.dcNo || null,
        data.dcDetails?.dcStatus || null,
        data.dcDetails?.receiverName || null,
        seller.id,
        buyer.id,
        snapshots.sellerName,
        snapshots.sellerAddress,
        snapshots.sellerGstin,
        snapshots.sellerState,
        snapshots.sellerStateCode,
        snapshots.sellerContact,
        snapshots.sellerEmail,
        snapshots.sellerBankName,
        snapshots.sellerAccNo,
        snapshots.sellerBranch,
        snapshots.sellerIfsc,
        snapshots.sellerLogo,
        snapshots.buyerName,
        snapshots.buyerAddress,
        snapshots.buyerDestination,
        snapshots.buyerContact,
        snapshots.buyerGstin,
        snapshots.buyerState,
        snapshots.buyerStateCode,
        snapshots.buyerNumber,
        snapshots.buyerEmail,
        data.billing?.name || null,
        data.billing?.address || null,
        data.billing?.gstin || null,
        data.billing?.state || null,
        data.billing?.stateCode || null,
        data.shipping?.name || null,
        data.shipping?.address || null,
        data.shipping?.gstin || null,
        data.shipping?.state || null,
        data.shipping?.stateCode || null,
        new Date().toISOString(),
        id,
      ]
    );

    // --- Re-create Items: Delete old ones and insert new ones ---
    await query('DELETE FROM items WHERE "invoiceId" = $1', [id]);

    for (const item of (data.items || [])) {
      await query(
        `INSERT INTO items ("id", "description", "hsn", "sac", "quantity", "rate", "discount", "unit", "invoiceId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          crypto.randomUUID(),
          item.description || '',
          item.hsn || null,
          item.sac || null,
          parseFloat(item.quantity) || 0,
          parseFloat(item.rate) || 0,
          parseFloat(item.discount) || 0,
          item.unit || null,
          id,
        ]
      );
    }

    // --- Update/Upsert Additional Charges ---
    const chargesData = {
      freight: parseFloat(data.additionalCharges?.freight) || 0,
      insurance: parseFloat(data.additionalCharges?.insurance) || 0,
      packing: parseFloat(data.additionalCharges?.packing) || 0,
      other: parseFloat(data.additionalCharges?.other) || 0,
      discount: parseFloat(data.additionalCharges?.discount) || 0,
      lessAmount: parseFloat(data.additionalCharges?.lessAmount) || 0,
      lessDescription: data.additionalCharges?.lessDescription || null,
    };

    if (existingCharges) {
      await query(
        `UPDATE additional_charges SET
          "freight" = $1, "insurance" = $2, "packing" = $3, "other" = $4,
          "discount" = $5, "lessAmount" = $6, "lessDescription" = $7
        WHERE "invoiceId" = $8`,
        [chargesData.freight, chargesData.insurance, chargesData.packing, chargesData.other,
         chargesData.discount, chargesData.lessAmount, chargesData.lessDescription, id]
      );
    } else {
      await query(
        `INSERT INTO additional_charges ("id", "freight", "insurance", "packing", "other", "discount", "lessAmount", "lessDescription", "invoiceId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [crypto.randomUUID(), chargesData.freight, chargesData.insurance, chargesData.packing,
         chargesData.other, chargesData.discount, chargesData.lessAmount, chargesData.lessDescription, id]
      );
    }

    // --- Retrieve updated full invoice ---
    const updatedInvoice = await fetchFullInvoice(id);

    const formattedInvoice = {
      ...updatedInvoice,
      date: safeDateFormat(updatedInvoice.date),
      dueDate: safeDateFormat(updatedInvoice.dueDate),
    };

    return NextResponse.json({ invoice: formattedInvoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE — Delete an invoice
// ============================================================================
export async function DELETE(request) {
  const guard = guardDB();
  if (guard) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // --- Find invoice before deleting ---
    const invoiceRows = await query(
      'SELECT "id", "mode" FROM invoices WHERE "id" = $1',
      [id]
    );

    if (invoiceRows.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // --- Delete invoice (cascades to items and additionalCharges via foreign keys) ---
    await query('DELETE FROM invoices WHERE "id" = $1', [id]);

    // --- Return updated next numbers ---
    const nextNumbers = await getNextNumbers();

    return NextResponse.json({
      message: 'Invoice deleted successfully',
      ...nextNumbers,
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH — Partial update for payment status
// ============================================================================
export async function PATCH(request) {
  const guard = guardDB();
  if (guard) return guard;

  try {
    const body = await request.json();
    const { id, paymentStatus, paymentDate, paymentAmount, paymentNotes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Build dynamic update fields
    const setClauses = [];
    const values = [];
    let paramIdx = 1;

    if (paymentStatus !== undefined) {
      setClauses.push(`"paymentStatus" = $${paramIdx++}`);
      values.push(paymentStatus);
    }
    if (paymentDate !== undefined) {
      setClauses.push(`"paymentDate" = $${paramIdx++}`);
      values.push(paymentDate ? new Date(paymentDate).toISOString() : null);
    }
    if (paymentAmount !== undefined) {
      setClauses.push(`"paymentAmount" = $${paramIdx++}`);
      values.push(parseFloat(paymentAmount) || 0);
    }
    if (paymentNotes !== undefined) {
      setClauses.push(`"paymentNotes" = $${paramIdx++}`);
      values.push(paymentNotes);
    }
    setClauses.push(`"updatedAt" = $${paramIdx++}`);
    values.push(new Date().toISOString());

    // Add the WHERE clause parameter
    values.push(id);

    await query(
      `UPDATE invoices SET ${setClauses.join(', ')} WHERE "id" = $${paramIdx}`,
      values
    );

    // Retrieve updated invoice
    const invoice = await fetchFullInvoice(id);

    const formattedInvoice = {
      ...invoice,
      additionalCharges: invoice.additionalCharges || null,
    };

    return NextResponse.json({ invoice: formattedInvoice });
  } catch (error) {
    console.error('Error updating invoice payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status', details: error.message },
      { status: 500 }
    );
  }
}
