import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  // Security headers (adjust CSP as needed when adding external origins)
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'same-origin');
  // HSTS only when served over HTTPS and on production host; keep disabled in dev proxies
  // res.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  // Basic CSP (relaxed); tighten when you add external scripts/styles
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' data:",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  );
  return res;
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|api/|_error|404|500).*)'],
};
