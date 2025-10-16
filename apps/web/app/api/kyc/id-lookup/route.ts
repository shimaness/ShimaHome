import { NextResponse } from 'next/server';

// Very simple mock: maps ID/passport numbers to demo profiles
const MOCK_KYC: Record<string, any> = {
  '12345678': {
    fullName: 'Amina Njeri',
    phone: '+254712345678',
    residence: 'Nairobi, Kileleshwa',
    dob: '1993-05-14',
    idType: 'NATIONAL_ID',
  },
  'A1234567': {
    fullName: 'Brian Otieno',
    phone: '+254701112233',
    residence: 'Nairobi, Westlands',
    dob: '1990-09-02',
    idType: 'PASSPORT',
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const match = MOCK_KYC[id];
  if (!match) return NextResponse.json({ found: false }, { status: 404 });

  return NextResponse.json({ found: true, profile: match });
}
