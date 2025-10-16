export default async function ProfilePage() {
  // Simple SSR fetch to get current profile and docs via internal API
  async function getMe() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/auth/me`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      if ('error' in data) return null;
      return data as { id: string; email: string; role: string };
    } catch {
      return null;
    }
  }
  async function getProfile() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/kyc/profile`, { cache: 'no-store' });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }
  async function getDocs() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/kyc/docs`, { cache: 'no-store' });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [] as any[];
    }
  }

  const [me, profile, docs] = await Promise.all([getMe(), getProfile(), getDocs()]);

  return (
    <main className="max-w-2xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Account verification</h1>
        <p className="text-slate-600">Provide your identity and documents to get verified.</p>
      </div>

      {!me ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          You are not logged in. Please <a className="underline" href="/login">login</a>.
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 p-4">
          <div className="text-sm text-slate-600">Signed in as</div>
          <div className="font-medium">{me.email} <span className="ml-1 rounded bg-slate-100 px-2 py-0.5 text-xs uppercase">{me.role}</span></div>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Identity information</h2>
        <form method="post" action="/api/kyc/profile" className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <div className="text-slate-700">Full name</div>
            <input name="fullName" defaultValue={profile?.fullName || ''} className="mt-1 w-full rounded-md border border-slate-300 p-2" required />
          </label>
          <label className="text-sm">
            <div className="text-slate-700">ID/Passport number</div>
            <input name="idNumber" defaultValue={profile?.idNumber || ''} className="mt-1 w-full rounded-md border border-slate-300 p-2" required />
          </label>
          <label className="text-sm">
            <div className="text-slate-700">Date of birth</div>
            <input name="dob" type="date" defaultValue={profile?.dob ? String(profile.dob).slice(0,10) : ''} className="mt-1 w-full rounded-md border border-slate-300 p-2" required />
          </label>
          <div className="self-end">
            <button className="rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark">Save</button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Documents</h2>
        <form method="post" action="/api/kyc/docs" className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <div className="text-slate-700">Kind</div>
            <select name="kind" className="mt-1 w-full rounded-md border border-slate-300 p-2">
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="UTILITY_BILL">Utility Bill</option>
              <option value="SELFIE">Selfie</option>
              <option value="OWNERSHIP_DOC">Ownership Document</option>
            </select>
          </label>
          <label className="text-sm">
            <div className="text-slate-700">Storage key (placeholder)</div>
            <input name="storageKey" placeholder="e.g. uploads/user-123/id-front.jpg" className="mt-1 w-full rounded-md border border-slate-300 p-2" required />
          </label>
          <label className="text-sm">
            <div className="text-slate-700">Note (optional)</div>
            <input name="note" className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </label>
          <div className="self-end">
            <button className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50">Add document</button>
          </div>
        </form>

        <div className="text-sm text-slate-600">Or upload a file (jpeg/png/webp/pdf up to 5MB):</div>
        <form method="post" action="/api/kyc/docs/upload" encType="multipart/form-data" className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <div className="text-slate-700">Kind</div>
            <select name="kind" className="mt-1 w-full rounded-md border border-slate-300 p-2">
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="UTILITY_BILL">Utility Bill</option>
              <option value="SELFIE">Selfie</option>
              <option value="OWNERSHIP_DOC">Ownership Document</option>
            </select>
          </label>
          <label className="text-sm">
            <div className="text-slate-700">File</div>
            <input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-1 w-full rounded-md border border-slate-300 p-2" required />
          </label>
          <label className="text-sm">
            <div className="text-slate-700">Note (optional)</div>
            <input name="note" className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          </label>
          <div className="self-end">
            <button className="rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark">Upload document</button>
          </div>
        </form>

        <div className="rounded-md border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-600">
                <th className="p-2">Kind</th>
                <th className="p-2">Status</th>
                <th className="p-2">Storage key</th>
                <th className="p-2">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(docs) && docs.length > 0 ? (
                docs.map((d: any) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-2">{d.kind}</td>
                    <td className="p-2">{d.status}</td>
                    <td className="p-2 font-mono text-xs">{d.storageKey}</td>
                    <td className="p-2">{new Date(d.uploadedAt).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-2 text-slate-600" colSpan={4}>No documents yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
