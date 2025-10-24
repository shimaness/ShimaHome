import { NextResponse } from 'next/server';

function getSessionCookie(req: Request): string | null {
  const cookie = req.headers.get('cookie') || '';
  for (const p of cookie.split(/;\s*/)) {
    const [k, ...rest] = p.split('=');
    if (k === 'session') return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function POST(request: Request) {
  const token = getSessionCookie(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const form = await request.formData();
  const res = await fetch(`${base}/tenant/avatar/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
