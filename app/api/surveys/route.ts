export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDB, getEnv } from '@/lib/db';
import { validateSession } from '@/lib/auth';
import { sendSurveyNotification } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const db = getDB();
    const url = new URL(request.url);
    const checkDraft = url.searchParams.get('check_draft') === 'true';
    const customerId = url.searchParams.get('customer_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (checkDraft && customerId) {
      const draft = await db.prepare(
        `SELECT sh.*, c.customer_name, c.store_id, c.store_name, c.province, c.region,
                (SELECT COUNT(*) FROM survey_details sd WHERE sd.header_id = sh.id) as detail_count
         FROM survey_headers sh
         JOIN customers c ON c.id = sh.customer_id
         WHERE sh.customer_id = ? AND sh.status = 'draft'
         ORDER BY sh.created_at DESC LIMIT 1`
      ).bind(customerId).first();
      return NextResponse.json({ draft: draft || null });
    }

    const env = getEnv();
    const isAdmin = await validateSession(request, env.JWT_SECRET);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const surveys = await db.prepare(
      `SELECT sh.*, c.customer_name, c.store_id, c.store_name, c.province, c.region,
              (SELECT COUNT(*) FROM survey_details sd WHERE sd.header_id = sh.id) as detail_count
       FROM survey_headers sh
       JOIN customers c ON c.id = sh.customer_id
       ORDER BY sh.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    const total = await db.prepare(`SELECT COUNT(*) as count FROM survey_headers`).first<{ count: number }>();
    return NextResponse.json({ surveys: surveys.results, total: total?.count || 0, page, limit });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDB();
    const body = (await request.json()) as any;
    const { customer_id, respondent_name, respondent_phone, details, action } = body;

    if (!customer_id || !respondent_name || !respondent_phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'submit_complete') {
      const headerResult = await db.prepare(
        `INSERT INTO survey_headers (customer_id, respondent_name, respondent_phone, status, submitted_at)
         VALUES (?, ?, ?, 'submitted', datetime('now'))`
      ).bind(customer_id, respondent_name, respondent_phone).run();

      const headerId = headerResult.meta.last_row_id as number;

      if (details && Array.isArray(details)) {
        for (const detail of details) {
          await db.prepare(
            `INSERT INTO survey_details (header_id, category, model, serial_number, damage_issue, product_photos, box_package, box_photos, service_doc, service_doc_photos)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            headerId, detail.category, detail.model,
            detail.serial_number || '', detail.damage_issue || '',
            JSON.stringify(detail.product_photos || []),
            detail.box_package || 'ไม่มีกล่อง',
            JSON.stringify(detail.box_photos || []),
            detail.service_doc || 'ไม่มี',
            JSON.stringify(detail.service_doc_photos || [])
          ).run();
        }
      }

      try {
        const env = getEnv();
        const surveyHeader = await db.prepare(
          `SELECT sh.*, c.customer_name, c.store_id, c.store_name FROM survey_headers sh JOIN customers c ON c.id = sh.customer_id WHERE sh.id = ?`
        ).bind(headerId).first();
        if (surveyHeader) {
          // Retrieve settings from database
          await db.prepare('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)').run();
          const dbEmail = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('admin_email').first<{ value: string }>();
          const dbApiKey = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('resend_api_key').first<{ value: string }>();

          const finalEmail = dbEmail?.value || env.ADMIN_EMAIL || '';
          const finalApiKey = dbApiKey?.value || env.RESEND_API_KEY || 're_fHu6Tprb_PXUb92k1QJ5MxSEGC8E6j9xS';

          if (finalEmail && finalApiKey) {
            await sendSurveyNotification(
              { ...(surveyHeader as any), detail_count: details?.length || 0 },
              finalApiKey,
              finalEmail,
              env.FROM_EMAIL || 'noreply@resend.dev',
              env.NEXT_PUBLIC_APP_URL || ''
            );
          } else {
            console.log('[Email] Dynamic email config or API key is not ready. Skipping notification.');
          }
        }
      } catch (emailErr) {
        console.error('Email notification failed:', emailErr);
      }

      return NextResponse.json({ id: headerId, success: true });
    }

    const result = await db.prepare(
      `INSERT INTO survey_headers (customer_id, respondent_name, respondent_phone, status) VALUES (?, ?, ?, 'draft')`
    ).bind(customer_id, respondent_name, respondent_phone).run();
    return NextResponse.json({ id: result.meta.last_row_id, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}
