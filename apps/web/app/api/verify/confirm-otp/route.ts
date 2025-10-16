import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let code = '';
    let challengeId = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      code = String(body.code || '');
      challengeId = String(body.challengeId || '');
    } else {
      const form = await request.formData();
      code = String(form.get('code') || '');
      challengeId = String(form.get('challengeId') || '');
    }

    const cookies = request.headers.get('cookie') || '';
    const cookieMap = Object.fromEntries(
      cookies.split(';').map((c) => {
        const [k, ...rest] = c.trim().split('=');
        return [decodeURIComponent(k), decodeURIComponent(rest.join('='))];
      }),
    );

    const expected = cookieMap['otp_code'];
    const expectedChallenge = cookieMap['otp_challenge'];

    if (!expected || !expectedChallenge) {
      return NextResponse.json({ error: 'OTP expired or missing' }, { status: 400 });
    }
    if (expected !== code || expectedChallenge !== challengeId) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    const res = NextResponse.json({ verified: true });
    // mark verified
    res.cookies.set('otp_verified', 'true', { httpOnly: true, maxAge: 600, path: '/', sameSite: 'lax' });
    // clear transient if desired (keep short-lived)
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Failed to confirm OTP' }, { status: 500 });
  }
}
