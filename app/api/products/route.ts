export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDB, getEnv } from '@/lib/db';
import { validateAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const db = getDB();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    let query = `SELECT * FROM products WHERE is_active = 1`;
    const params: string[] = [];
    if (category) { query += ` AND category = ?`; params.push(category); }
    query += ` ORDER BY category, sub_category, model`;
    const products = await db.prepare(query).bind(...params).all();
    return NextResponse.json({ products: products.results });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
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
        .filter(item => item.category && item.model)
        .map(item =>
          db.prepare(`INSERT INTO products (category, sub_category, model) VALUES (?, ?, ?)`).bind(
            item.category,
            item.sub_category || '',
            item.model
          )
        );
      if (statements.length > 0) {
        await db.batch(statements);
      }
      return NextResponse.json({ success: true, count: statements.length });
    }

    const { category, sub_category, model } = body;
    if (!category || !model) return NextResponse.json({ error: 'category and model are required' }, { status: 400 });
    const result = await db.prepare(`INSERT INTO products (category, sub_category, model) VALUES (?, ?, ?)`).bind(category, sub_category || '', model).run();
    return NextResponse.json({ id: result.meta.last_row_id, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create product(s)' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const env = getEnv();
    const isAdmin = await validateAdminSession(request, env.JWT_SECRET);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDB();
    const body = (await request.json()) as any;
    const { id, category, sub_category, model } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await db.prepare(`UPDATE products SET category=?, sub_category=?, model=?, updated_at=datetime('now') WHERE id=?`).bind(category, sub_category || '', model, id).run();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
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
      await db.prepare(`DELETE FROM products`).run();
      try {
        await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'products'`).run();
      } catch { /* ignore if sequence doesn't exist */ }
      return NextResponse.json({ success: true, cleared: true });
    }

    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await db.prepare(`UPDATE products SET is_active=0, updated_at=datetime('now') WHERE id=?`).bind(id).run();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500 });
  }
}
