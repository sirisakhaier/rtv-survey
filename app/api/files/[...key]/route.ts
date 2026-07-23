export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getFromR2 } from '@/lib/r2';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    const fileKey = key.join('/');
    const object = await getFromR2(fileKey);
    if (!object) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);
    headers.set('Access-Control-Allow-Origin', '*');
    return new NextResponse(object.body, { headers });
  } catch {
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
