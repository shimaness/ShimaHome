import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { unitId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { occupancyStatus } = body;

    const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
    const res = await fetch(`${base}/landlord/units/${params.unitId}/occupancy`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'authorization': authHeader,
      },
      body: JSON.stringify({ occupancyStatus }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update occupancy' }, { status: 500 });
  }
}
