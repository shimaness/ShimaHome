import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const authHeader = request.headers.get('authorization');
  
  const res = await fetch(`${base}/auth/mfa/setup`, {
    method: 'POST',
    headers: {
      'authorization': authHeader || '',
    },
  });
  
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
