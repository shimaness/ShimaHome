import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let contact = '';
    let channel: 'email' | 'phone' = 'email';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      contact = String(body.contact || '');
      channel = (body.channel === 'phone' ? 'phone' : 'email');
    } else {
      const form = await request.formData();
      contact = String(form.get('contact') || '');
      channel = (String(form.get('channel') || 'email') === 'phone' ? 'phone' : 'email');
    }

    if (!contact) {
      return NextResponse.json({ error: 'Missing contact' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const challengeId = Math.random().toString(36).slice(2);

    const res = NextResponse.json({ challengeId, sent: true, channel });
    res.cookies.set('otp_code', code, { httpOnly: true, maxAge: 300, path: '/', sameSite: 'lax' });
    res.cookies.set('otp_contact', contact, { httpOnly: true, maxAge: 300, path: '/', sameSite: 'lax' });
    res.cookies.set('otp_challenge', challengeId, { httpOnly: true, maxAge: 300, path: '/', sameSite: 'lax' });
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
