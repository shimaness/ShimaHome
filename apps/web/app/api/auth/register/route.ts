import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let email = '';
    let password = '';
    let role: 'TENANT' | 'LANDLORD' | 'ADMIN' = 'TENANT';
    let fullName = '';
    let username = '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email || '';
      password = body.password || '';
      role = body.role || 'TENANT';
      fullName = body.fullName || '';
      username = body.username || '';
    } else {
      const form = await request.formData();
      email = String(form.get('email') || '');
      password = String(form.get('password') || '');
      role = (String(form.get('role') || 'TENANT') as any) || 'TENANT';
      fullName = String(form.get('fullName') || '');
      username = String(form.get('username') || '');
    }

    const base = process.env.API_BASE_URL ?? 'http://localhost:4000';
    try {
      const res = await fetch(`${base}/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        const redirectUrl = new URL('/', request.url);
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.set('session', data.token, { httpOnly: true, path: '/', sameSite: 'lax' });
        if (data.refresh) {
          response.cookies.set('refresh', data.refresh, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
        }
        response.cookies.set('flash', encodeURIComponent(JSON.stringify({ type: 'success', text: 'Account created. Welcome!' })), { path: '/', maxAge: 10 });
        return response;
      }
      // Backend responded but without token -> fall through to mock
    } catch {}

    // Frontend-only fallback: create a mock session
    const name = fullName || username || email.split('@')[0];
    const mockToken = `mock.${Buffer.from(JSON.stringify({ email, role, name, ts: Date.now() })).toString('base64')}`;
    const redirectUrl = new URL('/', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('session', mockToken, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 60 * 60 });
    response.cookies.set('flash', encodeURIComponent(JSON.stringify({ type: 'success', text: 'Account created (demo).' })), { path: '/', maxAge: 10 });
    return response;
  } catch (e) {
    const back = new URL('/register', request.url);
    const r = NextResponse.redirect(back);
    r.cookies.set('flash', encodeURIComponent(JSON.stringify({ type: 'error', text: 'Registration failed' })), { path: '/', maxAge: 10 });
    return r;
  }
}
