export default async function DashboardPage() {
  async function getMe() {
    try {
      const { headers: hdrs, cookies } = await import('next/headers');
      const h = hdrs();
      const host = h.get('x-forwarded-host') ?? h.get('host');
      const proto = h.get('x-forwarded-proto') ?? 'http';
      const url = `${proto}://${host}/api/auth/me`;
      const c = cookies();
      const cookieHeader = c.getAll().map((ck) => `${ck.name}=${encodeURIComponent(ck.value)}`).join('; ');
      const res = await fetch(url, { cache: 'no-store', headers: { cookie: cookieHeader } });
      if (!res.ok) return null;
      const data = await res.json();
      if ('error' in data) return null;
      return data as { email: string; role: 'TENANT'|'LANDLORD'|'ADMIN' };
    } catch { return null; }
  }
  const me = await getMe();
  if (!me) {
    return (
      <main className="max-w-xl mx-auto py-10">
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          You are not logged in. Please <a className="underline" href="/login">login</a>.
        </div>
      </main>
    );
  }
  return (
    <main className="max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {me.role === 'TENANT' && (
        <section className="rounded-md border border-slate-200 p-4">
          <h2 className="text-lg font-semibold">Tenant</h2>
          <ul className="list-disc ml-5 text-slate-700 text-sm mt-2">
            <li>Profile & KYC: <a className="underline" href="/profile">Complete verification</a></li>
            <li>Search listings on the home page and apply (coming soon)</li>
            <li>Payments and receipts (coming soon)</li>
          </ul>
        </section>
      )}
      {me.role === 'LANDLORD' && (
        <section className="rounded-md border border-slate-200 p-4">
          <h2 className="text-lg font-semibold">Landlord</h2>
          <ul className="list-disc ml-5 text-slate-700 text-sm mt-2">
            <li>Portfolio and payouts (coming soon)</li>
            <li>Maintenance tickets overview (coming soon)</li>
            <li>Ownership documents in profile (via /profile)</li>
          </ul>
        </section>
      )}
      {me.role === 'ADMIN' && (
        <section className="rounded-md border border-slate-200 p-4">
          <h2 className="text-lg font-semibold">Admin</h2>
          <ul className="list-disc ml-5 text-slate-700 text-sm mt-2">
            <li>KYC review queue: <a className="underline" href="/admin">Open admin</a></li>
            <li>User management (coming soon)</li>
            <li>Audit logs (coming soon)</li>
          </ul>
        </section>
      )}
    </main>
  );
}
