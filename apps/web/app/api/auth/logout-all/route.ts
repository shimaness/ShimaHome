import { NextResponse } from 'next/server';

function getSessionCookie(req: Request): string | null {
  const cookie = req.headers.get('cookie') || '';
  const parts = cookie.split(/;\s*/);
  for (const p of parts) {
    const [k, ...rest] = p.split('=');
    if (k === 'session') return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function POST(request: Request) {
  const token = getSessionCookie(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const res = await fetch(`${base}/auth/logout-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));

  const r = NextResponse.json(data, { status: res.status || 200 });
  // Clear cookies on client
  r.cookies.set('session', '', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 0 });
  r.cookies.set('refresh', '', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 0 });
  return r;
}
