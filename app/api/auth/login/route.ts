export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';
import { createSessionToken, getSessionCookie, getLogoutCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const body = (await request.json()) as any;
    const { username, password } = body;
    if (!username || !password) return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    const validUsername = env.ADMIN_USERNAME || 'admin';
    const validPassword = env.ADMIN_PASSWORD;
    if (!validPassword) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    if (username !== validUsername || password !== validPassword) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) return NextResponse.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
    const token = await createSessionToken(username, jwtSecret);
    const cookieString = getSessionCookie(token);
    const response = NextResponse.json({ success: true, username });
    response.headers.set('Set-Cookie', cookieString);
    return response;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', getLogoutCookie());
  return response;
}
