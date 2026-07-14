export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const env = getEnv();
    const isValid = await validateSession(request, env.JWT_SECRET);
    if (!isValid) return NextResponse.json({ authenticated: false }, { status: 401 });
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
