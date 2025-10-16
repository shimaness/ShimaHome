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
  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const res = await fetch(`${base}/kyc/docs`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const token = getSessionCookie(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = request.headers.get('content-type') || '';
  let payload: any = {};
  if (contentType.includes('application/json')) {
    payload = await request.json();
  } else {
    const form = await request.formData();
    payload = {
      kind: String(form.get('kind') || ''),
      storageKey: String(form.get('storageKey') || ''),
      note: form.get('note') ? String(form.get('note')) : undefined,
    };
  }

  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const res = await fetch(`${base}/kyc/docs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
