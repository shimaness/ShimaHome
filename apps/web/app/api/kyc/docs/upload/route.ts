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
  // Forward the multipart body stream and content-type boundary directly
  const res = await fetch(`${base}/kyc/docs/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // preserve content-type (includes multipart boundary)
      'content-type': request.headers.get('content-type') || '',
    },
    body: request.body,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
