import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
    const res = await fetch(`${base}/discover`, {
      headers: {
        'cache-control': 'no-cache',
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load listings' }, { status: 500 });
  }
}
