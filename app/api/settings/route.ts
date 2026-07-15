export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDB, getEnv } from '@/lib/db';
import { validateSession, validateAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const isAuthed = await validateSession(request, env.JWT_SECRET);
    if (!isAuthed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDB();
    await db.prepare('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)').run();
    
    const emailRow = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('admin_email').first<{ value: string }>();
    const apiKeyRow = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('resend_api_key').first<{ value: string }>();

    return NextResponse.json({
      admin_email: emailRow?.value || env.ADMIN_EMAIL || '',
      resend_api_key: apiKeyRow?.value || env.RESEND_API_KEY || '',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const isAdmin = await validateAdminSession(request, env.JWT_SECRET);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDB();
    const body = (await request.json()) as any;
    const { admin_email, resend_api_key } = body;

    await db.prepare('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)').run();

    await db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .bind('admin_email', admin_email || '').run();
    
    await db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .bind('resend_api_key', resend_api_key || '').run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
