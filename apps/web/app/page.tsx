import type { Property } from '@shimahome/shared';
import { headers } from 'next/headers';

async function getProperties(params?: { type?: string; maxRent?: string; location?: string }): Promise<Property[]> {
  const qs = new URLSearchParams();
  if (params?.type) qs.set('type', params.type);
  if (params?.maxRent) qs.set('maxRent', params.maxRent);
  if (params?.location) qs.set('location', params.location);
  const hdrs = headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const url = `${proto}://${host}/api/properties${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function HomePage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const params = {
    type: typeof searchParams?.type === 'string' ? searchParams?.type : undefined,
    maxRent: typeof searchParams?.maxRent === 'string' ? searchParams?.maxRent : undefined,
    location: typeof searchParams?.location === 'string' ? searchParams?.location : undefined,
  };
  let error: string | null = null;
  let properties: Property[] = [];
  try {
    properties = await getProperties(params);
  } catch (e) {
    error = 'Failed to load listings. Please try again.';
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ShimaHome</h1>
        <p className="text-slate-600">Tenant–Landlord platform: search, apply, pay, and manage properties.</p>
      </div>

      <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm text-slate-600">
          <div>Type</div>
          <select name="type" defaultValue={params.type ?? ''} className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2">
            <option value="">Any</option>
            <option value="bedsitter">Bedsitter</option>
            <option value="studio">Studio</option>
            <option value="one_bedroom">One Bedroom</option>
            <option value="two_bedroom">Two Bedroom</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          <div>Max rent</div>
          <input name="maxRent" type="number" placeholder="e.g. 30000" defaultValue={params.maxRent ?? ''} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
        </label>
        <label className="text-sm text-slate-600">
          <div>Location contains</div>
          <input name="location" type="text" placeholder="e.g. Nairobi" defaultValue={params.location ?? ''} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
        </label>
        <div className="self-end">
          <button type="submit" className="rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark">Search</button>
        </div>
      </form>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <h2 className="text-xl font-semibold">Featured Listings</h2>
        {properties.length === 0 ? (
          <div className="mt-2 rounded-md border border-slate-200 p-4 text-slate-600">No listings match your filters.</div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((p) => (
              <a href={`/properties/${p.id}`} key={p.id} className="block rounded-lg border border-slate-200 p-4 hover:shadow-sm bg-white">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-medium mb-1">{p.title}</h3>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {p.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm text-slate-600">{p.location}</div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div><span className="font-semibold">Rent:</span> KES {p.rent.toLocaleString()} / mo</div>
                  <div className="flex items-center gap-1" aria-label={`Rating ${p.reputation.toFixed(1)} of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < Math.round(p.reputation) ? 'text-amber-500' : 'text-slate-300'}>★</span>
                    ))}
                    <span className="ml-1 text-slate-600">{p.reputation.toFixed(1)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
