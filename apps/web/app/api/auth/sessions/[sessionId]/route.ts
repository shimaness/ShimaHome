import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const authHeader = request.headers.get('authorization');
  const sessionId = params.sessionId;
  
  const res = await fetch(`${base}/auth/sessions/${sessionId}/revoke`, {
    method: 'POST',
    headers: {
      'authorization': authHeader || '',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  });
  
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
