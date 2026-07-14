export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDB, getEnv } from '@/lib/db';
import { validateSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDB();
    const env = getEnv();
    const isAdmin = await validateSession(request, env.JWT_SECRET);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const header = await db.prepare(
      `SELECT sh.*, c.customer_name, c.store_id, c.store_name, c.province, c.region
       FROM survey_headers sh JOIN customers c ON c.id = sh.customer_id WHERE sh.id = ?`
    ).bind(id).first();
    if (!header) return NextResponse.json({ error: 'Survey not found' }, { status: 404 });

    const details = await db.prepare(`SELECT * FROM survey_details WHERE header_id = ? ORDER BY id`).bind(id).all();
    return NextResponse.json({ header, details: details.results });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch survey' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const env = getEnv();
    const isAdmin = await validateSession(request, env.JWT_SECRET);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDB();
    await db.prepare(`DELETE FROM survey_headers WHERE id = ?`).bind(id).run();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 });
  }
}
