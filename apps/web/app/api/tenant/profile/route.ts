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
  const res = await fetch(`${base}/tenant/profile`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const token = getSessionCookie(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const contentType = request.headers.get('content-type') || '';
  let payload: any = {};
  if (contentType.includes('application/json')) payload = await request.json();
  else {
    const form = await request.formData();
    payload = {
      fullName: form.get('fullName') ? String(form.get('fullName')) : undefined,
      displayName: form.get('displayName') ? String(form.get('displayName')) : undefined,
      bio: form.get('bio') ? String(form.get('bio')) : undefined,
    };
  }
  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const res = await fetch(`${base}/tenant/profile`, { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
