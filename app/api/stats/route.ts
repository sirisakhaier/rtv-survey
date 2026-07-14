export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDB, getEnv } from '@/lib/db';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const isAdmin = await validateSession(request, env.JWT_SECRET);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getDB();
    const [totalSurveys, totalProducts, totalStores, recentSurveys] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as count FROM survey_headers WHERE status = 'submitted'`).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) as count FROM survey_details`).first<{ count: number }>(),
      db.prepare(`SELECT COUNT(*) as count FROM customers WHERE is_active = 1`).first<{ count: number }>(),
      db.prepare(
        `SELECT sh.id, sh.respondent_name, sh.submitted_at, c.customer_name, c.store_name,
                (SELECT COUNT(*) FROM survey_details sd WHERE sd.header_id = sh.id) as detail_count
         FROM survey_headers sh JOIN customers c ON c.id = sh.customer_id
         WHERE sh.status = 'submitted' ORDER BY sh.submitted_at DESC LIMIT 5`
      ).all(),
    ]);
    return NextResponse.json({
      totalSurveys: totalSurveys?.count || 0,
      totalProductsReported: totalProducts?.count || 0,
      totalStores: totalStores?.count || 0,
      recentSurveys: recentSurveys.results,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
