import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const products = await query('SELECT * FROM products ORDER BY name ASC');
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, description, hsn, sac, unit, rate, gstRate } = data;

    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO products (name, description, hsn, sac, unit, rate, "gstRate")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        description || '',
        hsn || '',
        sac || '',
        unit || 'Nos',
        parseFloat(rate) || 0,
        parseFloat(gstRate) || 18,
      ]
    );

    return NextResponse.json({ product: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, name, description, hsn, sac, unit, rate, gstRate } = data;

    if (!id || !name) {
      return NextResponse.json({ error: 'Product ID and name are required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE products 
       SET name = $1, description = $2, hsn = $3, sac = $4, unit = $5, rate = $6, "gstRate" = $7
       WHERE id = $8
       RETURNING *`,
      [
        name,
        description || '',
        hsn || '',
        sac || '',
        unit || 'Nos',
        parseFloat(rate) || 0,
        parseFloat(gstRate) || 18,
        id,
      ]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: result[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await query('DELETE FROM products WHERE id = $1', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
