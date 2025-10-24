import { NextResponse } from 'next/server';

function getSessionCookie(req: Request): string | null {
  const cookie = req.headers.get('cookie') || '';
  for (const p of cookie.split(/;\s*/)) {
    const [k, ...rest] = p.split('=');
    if (k === 'session') return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function GET(request: Request) {
  const token = getSessionCookie(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const res = await fetch(`${base}/tenant/avatar`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }
  const headers = new Headers();
  headers.set('Content-Type', res.headers.get('content-type') || 'image/jpeg');
  headers.set('Cache-Control', res.headers.get('cache-control') || 'private, max-age=60');
  return new Response(res.body, { status: 200, headers });
}
