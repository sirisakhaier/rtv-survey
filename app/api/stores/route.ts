export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDB();
    const url = new URL(request.url);
    const customerName = url.searchParams.get('customer_name');
    if (!customerName) return NextResponse.json({ error: 'customer_name is required' }, { status: 400 });
    const stores = await db.prepare(`SELECT id, store_id, store_name, province, region FROM customers WHERE customer_name = ? AND is_active = 1 ORDER BY store_name`).bind(customerName).all();
    return NextResponse.json({ stores: stores.results });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}
