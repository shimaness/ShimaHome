import './globals.css';
export const metadata = {
  title: "ShimaHome",
  description: "Tenant–Landlord platform",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch current user (if any)
  let me: { email: string; role: string } | null = null;
  let flash: { type: 'success'|'error'; text: string } | null = null;
  try {
    const { headers: hdrs } = await import('next/headers');
    const { cookies } = await import('next/headers');
    const h = hdrs();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'http';
    const meUrl = `${proto}://${host}/api/auth/me`;
    const res = await fetch(meUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (!('error' in data)) me = { email: data.email, role: data.role };
    }
    const c = cookies();
    const raw = c.get('flash')?.value;
    if (raw) {
      try { flash = JSON.parse(decodeURIComponent(raw)); } catch {}
    }
  } catch {}
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <header className="border-b border-slate-200">
          <div className="container flex items-center gap-3 py-3">
            <a href="/" className="text-xl font-semibold text-slate-900">ShimaHome</a>
            <nav className="ml-auto flex items-center gap-3 text-sm">
              {me ? (
                <>
                  <a href="/dashboard" className="text-slate-700 hover:text-slate-900">Dashboard</a>
                  {me.role === 'LANDLORD' && (
                    <a href="/landlord/onboarding" className="text-slate-700 hover:text-slate-900">Landlord</a>
                  )}
                  {me.role === 'ADMIN' && (
                    <a href="/admin" className="text-slate-700 hover:text-slate-900">Admin</a>
                  )}
                  <span className="text-slate-700">{me.email} <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 text-xs uppercase">{me.role}</span></span>
                  <form method="post" action="/api/auth/logout">
                    <button className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">Logout</button>
                  </form>
                </>
              ) : (
                <>
                  <a href="/login" className="text-slate-700 hover:text-slate-900">Login</a>
                  <a href="/register" className="rounded-md bg-brand px-3 py-1.5 text-white hover:bg-brand-dark">Register</a>
                </>
              )}
            </nav>
          </div>
        </header>
        {flash && (
          <div className={`border-b ${flash.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <div className="container py-2 text-sm">{flash.text}</div>
          </div>
        )}
        <main className="container py-6">{children}</main>
        <footer className="border-t border-slate-200 mt-8">
          <div className="container py-3 text-sm text-slate-500">
            © {new Date().getFullYear()} ShimaHome
          </div>
        </footer>
      </body>
    </html>
  );
}
