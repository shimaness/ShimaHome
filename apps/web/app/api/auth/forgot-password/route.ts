import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const body = await request.json().catch(() => ({}));
  const res = await fetch(`${base}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
