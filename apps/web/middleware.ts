import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  const req = _req;
  const url = req.nextUrl;
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

  // KYC gate: if logged-in but not verified, redirect to onboarding (except allowed paths)
  try {
    const path = url.pathname;
    const allow = [
      '/onboarding',
      '/login',
      '/register',
      '/api',
      '/health',
      '/_next',
      '/404',
      '/500',
    ];
    const isAllowed = allow.some((p) => path.startsWith(p));
    if (!isAllowed) {
      const hasSession = Boolean(
        req.cookies.get('session')?.value ||
          req.cookies.get('__Secure-next-auth.session-token')?.value ||
          req.cookies.get('next-auth.session-token')?.value,
      );
      const kycVerified = req.cookies.get('kyc_verified')?.value === 'true';
      if (hasSession && !kycVerified) {
        const dest = new URL('/onboarding/tenant', req.url);
        return NextResponse.redirect(dest);
      }
    }
  } catch {}
  return res;
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|api/|_error|404|500).*)'],
};
