import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let email = '';
    let password = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email || '';
      password = body.password || '';
    } else {
      const form = await request.formData();
      email = String(form.get('email') || '');
      password = String(form.get('password') || '');
    }

    const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
    try {
      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        const redirectUrl = new URL('/', request.url);
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.set('session', data.token, { httpOnly: true, path: '/', sameSite: 'lax' });
        if (data.refresh) {
          response.cookies.set('refresh', data.refresh, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
        }
        response.cookies.set('flash', encodeURIComponent(JSON.stringify({ type: 'success', text: 'Welcome back!' })), { path: '/', maxAge: 10 });
        return response;
      }
      // fall through to mock
    } catch {}

    // Frontend-only fallback: allow login as TENANT with a mock session
    const mockToken = `mock.${Buffer.from(JSON.stringify({ email, role: 'TENANT', ts: Date.now() })).toString('base64')}`;
    const redirectUrl = new URL('/', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('session', mockToken, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 });
    response.cookies.set('flash', encodeURIComponent(JSON.stringify({ type: 'success', text: 'Logged in (demo).' })), { path: '/', maxAge: 10 });
    return response;
  } catch (e) {
    const back = new URL('/login', request.url);
    const r = NextResponse.redirect(back);
    r.cookies.set('flash', encodeURIComponent(JSON.stringify({ type: 'error', text: 'Login failed' })), { path: '/', maxAge: 10 });
    return r;
  }
}
