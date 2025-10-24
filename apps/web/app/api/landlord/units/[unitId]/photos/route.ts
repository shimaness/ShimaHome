import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { unitId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
    const res = await fetch(`${base}/landlord/units/${params.unitId}/photos`, {
      method: 'POST',
      headers: {
        'authorization': authHeader,
      },
      body: formData,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
