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

    // Try providers when available
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const TWILIO_SID = process.env.TWILIO_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_FROM = process.env.TWILIO_FROM;

    let provider = 'demo';
    if (channel === 'email' && RESEND_API_KEY) {
      try {
        // send email via Resend
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ShimaHome <no-reply@shimahome.local>',
            to: [contact],
            subject: 'Your ShimaHome verification code',
            text: `Your verification code is ${code}. It expires in 5 minutes.`,
          }),
        });
        provider = 'resend';
      } catch {}
    }
    if (channel === 'phone' && TWILIO_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM) {
      try {
        // send SMS via Twilio
        const creds = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        const params = new URLSearchParams({ To: contact, From: TWILIO_FROM, Body: `Your ShimaHome code is ${code}` });
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });
        provider = 'twilio';
      } catch {}
    }

    const res = NextResponse.json({ challengeId, sent: true, channel, provider, demoCode: provider === 'demo' ? code : undefined });
    res.cookies.set('otp_code', code, { httpOnly: true, maxAge: 300, path: '/', sameSite: 'lax' });
    res.cookies.set('otp_contact', contact, { httpOnly: true, maxAge: 300, path: '/', sameSite: 'lax' });
    res.cookies.set('otp_challenge', challengeId, { httpOnly: true, maxAge: 300, path: '/', sameSite: 'lax' });
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
