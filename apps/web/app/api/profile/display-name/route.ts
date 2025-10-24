import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let displayName = '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      displayName = String(body.displayName || '').trim();
    } else {
      const form = await request.formData();
      displayName = String(form.get('displayName') || '').trim();
    }
    if (!displayName) {
      return NextResponse.json({ error: 'Display name required' }, { status: 400 });
    }

    // Persist in cookie for demo; later, save to DB
    const res = NextResponse.redirect(new URL('/profile', request.url));
    res.cookies.set('display_name', encodeURIComponent(displayName), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    res.cookies.set(
      'flash',
      encodeURIComponent(JSON.stringify({ type: 'success', text: 'Display name updated' })),
      { path: '/', maxAge: 10 },
    );
    return res;
  } catch (e) {
    const back = NextResponse.redirect(new URL('/profile', request.url));
    back.cookies.set(
      'flash',
      encodeURIComponent(JSON.stringify({ type: 'error', text: 'Failed to update display name' })),
      { path: '/', maxAge: 10 },
    );
    return back;
  }
}
