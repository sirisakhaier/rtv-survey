/**
 * Simple Admin Authentication using Web Crypto API (Edge Runtime compatible)
 */

export const ADMIN_COOKIE_NAME = 'rtv_admin_session';
export const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

async function sign(payload: object, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const sigArray = Array.from(new Uint8Array(signature));
  const sigHex = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const payloadB64 = btoa(JSON.stringify(payload));
  return `${payloadB64}.${sigHex}`;
}

async function verify(token: string, secret: string): Promise<object | null> {
  try {
    const [payloadB64, sigHex] = token.split('.');
    if (!payloadB64 || !sigHex) return null;
    const payload = JSON.parse(atob(payloadB64));
    const expected = await sign(payload, secret);
    if (expected !== token) return null;
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSessionToken(username: string, jwtSecret: string): Promise<string> {
  return sign(
    { sub: username, role: 'admin', iat: Date.now(), exp: Date.now() + COOKIE_MAX_AGE * 1000 },
    jwtSecret
  );
}

export async function validateSession(request: Request, jwtSecret: string): Promise<boolean> {
  const cookie = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookie.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );
  const token = cookies[ADMIN_COOKIE_NAME];
  if (!token) return false;
  const payload = await verify(token, jwtSecret);
  return payload !== null;
}

export function getSessionCookie(token: string): string {
  return `${ADMIN_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`;
}

export function getLogoutCookie(): string {
  return `${ADMIN_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
