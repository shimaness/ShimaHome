import { NextResponse } from 'next/server';
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
  const url = `${base.replace(/\/$/, '')}/properties/${encodeURIComponent(params.id)}`;

  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
