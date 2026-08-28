import { NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';

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

// GET /api/buyers - Get all buyers
export async function GET() {
  const guard = guardDB();
  if (guard) return guard;

  try {
    const buyers = await query('SELECT * FROM buyers ORDER BY "createdAt" DESC');
    return NextResponse.json(buyers || []);
  } catch (error) {
    console.error('Error fetching buyers:', error);
    return NextResponse.json({ error: 'Failed to fetch buyers', details: error.message }, { status: 500 });
  }
}

// POST /api/buyers - Create or update buyer by GSTIN
// Bug 4 fix: GSTIN is now optional — only name is required
export async function POST(request) {
  const guard = guardDB();
  if (guard) return guard;

  try {
    const data = await request.json();
    console.log('Received buyer data:', data);

    if (!data.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if buyer already exists by GSTIN (only if GSTIN is provided)
    if (data.gstin && data.gstin.trim() !== '') {
      const existingRows = await query(
        'SELECT * FROM buyers WHERE "gstin" = $1 LIMIT 1',
        [data.gstin]
      );

      if (existingRows.length > 0) {
        const existingBuyer = existingRows[0];
        console.log('Updating existing buyer:', existingBuyer.id);

        const updatedRows = await query(
          `UPDATE buyers SET
            "name" = $1, 
            "address" = COALESCE(NULLIF($2, ''), "address"), 
            "destination" = COALESCE(NULLIF($3, ''), "destination"), 
            "contact" = COALESCE(NULLIF($4, ''), "contact"),
            "state" = $5, "stateCode" = $6, 
            "buyerNumber" = COALESCE(NULLIF($7, ''), "buyerNumber"), 
            "email" = COALESCE(NULLIF($8, ''), "email"),
            "legalName" = $9, "tradeName" = $10, "constitutionOfBusiness" = $11,
            "taxType" = $12, "gstStatus" = $13, "registrationDate" = $14,
            "cancelledDate" = $15, "eInvoiceStatus" = $16, "natureOfBusinessActivity" = $17,
            "lastUpdateDate" = $18, "stateJurisdiction" = $19, "stateJurisdictionCode" = $20,
            "centerJurisdiction" = $21, "centerJurisdictionCode" = $22, "pincode" = $23,
            "updatedAt" = $24
          WHERE "id" = $25
          RETURNING *`,
          [
            data.name,
            data.address || null,
            data.destination || null,
            data.contact || null,
            data.state || null,
            data.stateCode || null,
            data.buyerNumber || null,
            data.email || null,
            data.legalName || null,
            data.tradeName || null,
            data.constitutionOfBusiness || null,
            data.taxType || null,
            data.gstStatus || null,
            data.registrationDate || null,
            data.cancelledDate || null,
            data.eInvoiceStatus || null,
            data.natureOfBusinessActivity || null,
            data.lastUpdateDate || null,
            data.stateJurisdiction || null,
            data.stateJurisdictionCode || null,
            data.centerJurisdiction || null,
            data.centerJurisdictionCode || null,
            data.pincode || null,
            new Date().toISOString(),
            existingBuyer.id,
          ]
        );

        console.log('Buyer updated successfully:', updatedRows[0].id);
        return NextResponse.json(updatedRows[0]);
      }
    }

    // Create new buyer
    console.log('Creating new buyer');
    const newId = crypto.randomUUID();

    const createdRows = await query(
      `INSERT INTO buyers ("id", "name", "address", "destination", "contact", "gstin", "state", "stateCode", "buyerNumber", "email",
        "legalName", "tradeName", "constitutionOfBusiness", "taxType", "gstStatus", "registrationDate",
        "cancelledDate", "eInvoiceStatus", "natureOfBusinessActivity", "lastUpdateDate",
        "stateJurisdiction", "stateJurisdictionCode", "centerJurisdiction", "centerJurisdictionCode", "pincode")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
       RETURNING *`,
      [
        newId,
        data.name,
        data.address || null,
        data.destination || null,
        data.contact || null,
        data.gstin || null,
        data.state || null,
        data.stateCode || null,
        data.buyerNumber || null,
        data.email || null,
        data.legalName || null,
        data.tradeName || null,
        data.constitutionOfBusiness || null,
        data.taxType || null,
        data.gstStatus || null,
        data.registrationDate || null,
        data.cancelledDate || null,
        data.eInvoiceStatus || null,
        data.natureOfBusinessActivity || null,
        data.lastUpdateDate || null,
        data.stateJurisdiction || null,
        data.stateJurisdictionCode || null,
        data.centerJurisdiction || null,
        data.centerJurisdictionCode || null,
        data.pincode || null,
      ]
    );

    console.log('Buyer created successfully:', createdRows[0].id);
    return NextResponse.json(createdRows[0], { status: 201 });
  } catch (error) {
    console.error('Error saving buyer:', error);
    return NextResponse.json({
      error: 'Failed to save buyer',
      details: error.message
    }, { status: 500 });
  }
}

// PUT /api/buyers - Update a buyer
// Bug 5 fix: Use explicit field picks instead of raw spread
export async function PUT(request) {
  const guard = guardDB();
  if (guard) return guard;

  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'Buyer ID is required' }, { status: 400 });
    }

    const updatedRows = await query(
      `UPDATE buyers SET
        "name" = $1, "address" = $2, "destination" = $3, "contact" = $4,
        "gstin" = $5, "state" = $6, "stateCode" = $7, "buyerNumber" = $8,
        "email" = $9, "legalName" = $10, "tradeName" = $11, "constitutionOfBusiness" = $12,
        "taxType" = $13, "gstStatus" = $14, "registrationDate" = $15,
        "cancelledDate" = $16, "eInvoiceStatus" = $17, "natureOfBusinessActivity" = $18,
        "lastUpdateDate" = $19, "stateJurisdiction" = $20, "stateJurisdictionCode" = $21,
        "centerJurisdiction" = $22, "centerJurisdictionCode" = $23, "pincode" = $24,
        "updatedAt" = $25
      WHERE "id" = $26
      RETURNING *`,
      [
        data.name,
        data.address || null,
        data.destination || null,
        data.contact || null,
        data.gstin || null,
        data.state || null,
        data.stateCode || null,
        data.buyerNumber || null,
        data.email || null,
        data.legalName || null,
        data.tradeName || null,
        data.constitutionOfBusiness || null,
        data.taxType || null,
        data.gstStatus || null,
        data.registrationDate || null,
        data.cancelledDate || null,
        data.eInvoiceStatus || null,
        data.natureOfBusinessActivity || null,
        data.lastUpdateDate || null,
        data.stateJurisdiction || null,
        data.stateJurisdictionCode || null,
        data.centerJurisdiction || null,
        data.centerJurisdictionCode || null,
        data.pincode || null,
        new Date().toISOString(),
        data.id,
      ]
    );

    if (updatedRows.length === 0) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    console.error('Error updating buyer:', error);
    return NextResponse.json({
      error: 'Failed to update buyer',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE /api/buyers - Delete a buyer
// Bug 6 fix: Check for linked invoices before deleting
export async function DELETE(request) {
  const guard = guardDB();
  if (guard) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Buyer ID is required' }, { status: 400 });
    }

    // Check if buyer has linked invoices
    const linkedInvoices = await query(
      'SELECT "id" FROM invoices WHERE "buyerId" = $1 LIMIT 1',
      [id]
    );

    if (linkedInvoices && linkedInvoices.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete this buyer because they have existing invoices. Delete the invoices first.',
      }, { status: 409 });
    }

    await query('DELETE FROM buyers WHERE "id" = $1', [id]);

    return NextResponse.json({ message: 'Buyer deleted successfully' });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    return NextResponse.json({
      error: 'Failed to delete buyer',
      details: error.message
    }, { status: 500 });
  }
}