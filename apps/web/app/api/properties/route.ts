import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';

  const url = new URL('/properties', base);
  // Forward supported query params
  for (const key of ['type', 'maxRent', 'location'] as const) {
    const v = searchParams.get(key);
    if (v !== null) url.searchParams.set(key, v);
  }

  const res = await fetch(url.toString(), { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
