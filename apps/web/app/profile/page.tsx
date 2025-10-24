export default async function ProfilePage() {
  // Simple SSR fetch to get current profile and docs via internal API
  async function getMe() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/auth/me`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      if ('error' in data) return null;
      return data as { id?: string; email: string; role: string; name?: string };
    } catch {
      return null;
    }
  }
  const me = await getMe();

  return (
    <main className="max-w-2xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <p className="text-slate-600">Update your avatar, display name and bio.</p>
      </div>

      {!me ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          You are not logged in. Please <a className="underline" href="/login">login</a>.
        </div>
      ) : (
        <div className="rounded-md border border-slate-200 p-4">
          <div className="text-sm text-slate-600">Signed in</div>
          <div className="font-medium">{me.name || (me.email?.split('@')[0])}</div>
        </div>
      )}

      {me && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Profile</h2>
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <img src="/api/tenant/avatar" alt="avatar" className="h-16 w-16 rounded-full border border-slate-200 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <form method="post" action="/api/tenant/avatar/upload" encType="multipart/form-data" className="flex items-center gap-2">
                <input type="file" name="file" accept="image/*" className="text-sm" />
                <button className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Upload avatar</button>
              </form>
            </div>
            <form method="post" action="/api/tenant/profile" className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <div className="text-slate-700">Display name</div>
                  <input name="displayName" defaultValue={me?.name || ''} className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="e.g. Jane N. Doe" />
                </label>
                <label className="text-sm">
                  <div className="text-slate-700">Bio</div>
                  <input name="bio" className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="Short intro (optional)" />
                </label>
              </div>
              <div>
                <button className="rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark">Save profile</button>
              </div>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
