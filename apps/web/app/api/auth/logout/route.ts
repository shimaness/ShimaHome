import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const redirectUrl = new URL('/', request.url);
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set('session', '', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 0 });
  return res;
}
