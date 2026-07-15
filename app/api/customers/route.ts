export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDB, getEnv } from '@/lib/db';
import { validateAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const db = getDB();
    const url = new URL(request.url);
    const includeStores = url.searchParams.get('include_stores') === 'true';
    const customerId = url.searchParams.get('customer_id');

    if (customerId) {
      const stores = await db.prepare(`SELECT * FROM customers WHERE id = ? AND is_active = 1`).bind(customerId).all();
      return NextResponse.json({ stores: stores.results });
    }
    if (includeStores) {
      const all = await db.prepare(`SELECT * FROM customers WHERE is_active = 1 ORDER BY customer_name, store_name`).all();
      return NextResponse.json({ customers: all.results });
    }
    const customers = await db.prepare(`SELECT DISTINCT customer_name FROM customers WHERE is_active = 1 ORDER BY customer_name`).all();
    return NextResponse.json({ customers: customers.results });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const isAdmin = await validateAdminSession(request, env.JWT_SECRET);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDB();
    const body = (await request.json()) as any;

    if (Array.isArray(body)) {
      const statements = body
        .filter(item => item.customer_name && item.store_id && item.store_name)
        .map(item =>
          db.prepare(`INSERT INTO customers (customer_name, store_id, store_name, province, region) VALUES (?, ?, ?, ?, ?)`).bind(
            item.customer_name,
            item.store_id,
            item.store_name,
            item.province || '',
            item.region || ''
          )
        );
      if (statements.length > 0) {
        await db.batch(statements);
      }
      return NextResponse.json({ success: true, count: statements.length });
    }

    const { customer_name, store_id, store_name, province, region } = body;
    if (!customer_name || !store_id || !store_name) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const result = await db.prepare(`INSERT INTO customers (customer_name, store_id, store_name, province, region) VALUES (?, ?, ?, ?, ?)`).bind(customer_name, store_id, store_name, province || '', region || '').run();
    return NextResponse.json({ id: result.meta.last_row_id, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create customer(s)' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const env = getEnv();
    const isAdmin = await validateAdminSession(request, env.JWT_SECRET);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDB();
    const body = (await request.json()) as any;
    const { id, customer_name, store_id, store_name, province, region } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await db.prepare(`UPDATE customers SET customer_name=?, store_id=?, store_name=?, province=?, region=?, updated_at=datetime('now') WHERE id=?`).bind(customer_name, store_id, store_name, province || '', region || '', id).run();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const env = getEnv();
    const isAdmin = await validateAdminSession(request, env.JWT_SECRET);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDB();
    const url = new URL(request.url);

    if (url.searchParams.get('clear_all') === 'true') {
      // Clear all master data
      await db.prepare(`DELETE FROM customers`).run();
      try {
        await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'customers'`).run();
      } catch { /* ignore if sequence doesn't exist */ }
      return NextResponse.json({ success: true, cleared: true });
    }

    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await db.prepare(`UPDATE customers SET is_active=0, updated_at=datetime('now') WHERE id=?`).bind(id).run();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    // If it fails due to foreign key or any other reason, return description
    return NextResponse.json({ error: err.message || 'Failed to delete customer' }, { status: 500 });
  }
}
