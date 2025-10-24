import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, unitType, rent, deposit, description } = body;

    const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
    const res = await fetch(`${base}/landlord/properties/${params.propertyId}/units`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': authHeader,
      },
      body: JSON.stringify({ name, unitType, rent, deposit, description }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create unit' }, { status: 500 });
  }
}
