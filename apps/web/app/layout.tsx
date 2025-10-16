import './globals.css';
import HeaderUser from '../components/HeaderUser';
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
    const c = cookies();
    const cookieHeader = c.getAll().map((ck) => `${ck.name}=${encodeURIComponent(ck.value)}`).join('; ');
    const res = await fetch(meUrl, { cache: 'no-store', headers: { cookie: cookieHeader } });
    if (res.ok) {
      const data = await res.json();
      if (!('error' in data)) me = { email: data.email, role: data.role };
    }
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
                <span className="hidden sm:inline text-slate-600">{me.email}</span>
              ) : null}
              <HeaderUser />
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
