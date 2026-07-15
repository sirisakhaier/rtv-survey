export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getDB, getEnv } from '@/lib/db';
import { validateSession } from '@/lib/auth';
import { generateExcel } from '@/lib/export';
import type { SurveyHeader, SurveyDetail } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const isAdmin = await validateSession(request, env.JWT_SECRET);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDB();
    const url = new URL(request.url);
    const includePhotos = url.searchParams.get('include_photos') !== 'false';

    const headers = await db.prepare(
      `SELECT sh.*, c.customer_name, c.store_id, c.store_name, c.province, c.region
       FROM survey_headers sh JOIN customers c ON c.id = sh.customer_id
       WHERE sh.status = 'submitted' ORDER BY sh.submitted_at DESC`
    ).all();

    const headerResults = headers.results as any as SurveyHeader[];
    const detailsMap: Record<number, SurveyDetail[]> = {};
    for (const header of headerResults) {
      const details = await db.prepare(`SELECT * FROM survey_details WHERE header_id = ? ORDER BY id`).bind(header.id).all();
      detailsMap[header.id] = details.results as any as SurveyDetail[];
    }

    if (url.searchParams.get('format') === 'json') {
      return NextResponse.json({ headers: headerResults, detailsMap });
    }

    const buffer = generateExcel(headerResults, detailsMap, includePhotos);
    const date = new Date().toISOString().split('T')[0];
    const filename = `RTV_Survey_${date}${includePhotos ? '_with_photos' : ''}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
