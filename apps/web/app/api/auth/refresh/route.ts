import { NextResponse } from 'next/server';

function getCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get('cookie') || '';
  const parts = cookie.split(/;\s*/);
  for (const p of parts) {
    const [k, ...rest] = p.split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function POST(request: Request) {
  const refresh = getCookie(request, 'refresh');
  if (!refresh) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const res = await fetch(`${base}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access) {
    const r = NextResponse.json({ error: data?.message || 'Refresh failed' }, { status: res.status || 401 });
    // Clear potentially stale cookies
    r.cookies.set('session', '', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 0 });
    r.cookies.set('refresh', '', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 0 });
    return r;
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('session', data.access, { httpOnly: true, path: '/', sameSite: 'lax' });
  if (data.refresh) {
    response.cookies.set('refresh', data.refresh, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
  }
  return response;
}
