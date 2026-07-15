export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';
import { getSessionPayload } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const payload = await getSessionPayload(request, env.JWT_SECRET);
    if (!payload) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true, role: payload.role });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
