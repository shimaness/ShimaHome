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

export async function GET(request: Request) {
  const token = getSessionCookie(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Frontend-only mock session support: token like "mock.<base64>"
  if (token.startsWith('mock.')) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.', 2)[1], 'base64').toString('utf8')) as { email?: string; role?: string };
      return NextResponse.json({ email: payload.email || 'user@demo.local', role: payload.role || 'TENANT' });
    } catch {}
  }

  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    // fallback unauthorized if backend unreachable and not a mock
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
