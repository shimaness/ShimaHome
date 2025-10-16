import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let idType = 'NATIONAL_ID';
    let idNumber = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      idType = String(body.idType || 'NATIONAL_ID');
      idNumber = String(body.idNumber || '');
    } else {
      const form = await request.formData();
      idType = String(form.get('idType') || 'NATIONAL_ID');
      idNumber = String(form.get('idNumber') || '');
    }

    if (!idNumber) {
      return NextResponse.json({ error: 'Missing ID number' }, { status: 400 });
    }

    // In real life: call KYC provider, validate documents, etc.
    // Here: mark KYC as verified via a cookie for 30 days
    const res = NextResponse.json({ verified: true, idType, idNumber });
    res.cookies.set('kyc_verified', 'true', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
