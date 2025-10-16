export default async function AdminPage() {
  async function getMe() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/auth/me`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      if ('error' in data) return null;
      return data as { id: string; email: string; role: 'TENANT'|'LANDLORD'|'ADMIN' };
    } catch { return null; }
  }
  async function getPending() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/kyc/admin/docs/pending`, { cache: 'no-store' });
      if (!res.ok) return [] as any[];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch { return [] as any[]; }
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
  if (me.role !== 'ADMIN') {
    return (
      <main className="max-w-xl mx-auto py-10">
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Forbidden. Admins only.
        </div>
      </main>
    );
  }

  const pending = await getPending();

  return (
    <main className="max-w-5xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Admin – KYC Review</h1>
      <div className="rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              <th className="p-2">Doc ID</th>
              <th className="p-2">User</th>
              <th className="p-2">Kind</th>
              <th className="p-2">Storage key</th>
              <th className="p-2">Uploaded</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.length > 0 ? (
              pending.map((d: any) => (
                <tr key={d.id} className="border-t">
                  <td className="p-2 font-mono text-xs">{d.id}</td>
                  <td className="p-2 font-mono text-xs">{d.userId}</td>
                  <td className="p-2">{d.kind}</td>
                  <td className="p-2 font-mono text-xs">{d.storageKey}</td>
                  <td className="p-2">{new Date(d.uploadedAt).toLocaleString()}</td>
                  <td className="p-2">
                    <form method="post" action="/api/kyc/admin/docs/approve" className="inline">
                      <input type="hidden" name="id" value={d.id} />
                      <button className="rounded border border-green-600 text-green-700 px-2 py-1 text-xs hover:bg-green-50">Approve</button>
                    </form>
                    <form method="post" action="/api/kyc/admin/docs/reject" className="inline ml-2">
                      <input type="hidden" name="id" value={d.id} />
                      <button className="rounded border border-red-600 text-red-700 px-2 py-1 text-xs hover:bg-red-50">Reject</button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-3 text-slate-600" colSpan={6}>No pending documents.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
