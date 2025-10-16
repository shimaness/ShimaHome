import type { Property } from '@shimahome/shared';
import { headers } from 'next/headers';

async function getProperty(id: string): Promise<Property | null> {
  const hdrs = headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const url = `${proto}://${host}/api/properties/${id}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  if ('error' in data) return null;
  return data as Property;
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);

  if (!property) {
    return (
      <main style={{ padding: 24 }}>
        <a href="/" style={{ textDecoration: 'none' }}>&larr; Back</a>
        <h1 style={{ marginTop: 12 }}>Listing not found</h1>
        <p>We couldn't find this property. It may have been removed.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <a href="/" style={{ textDecoration: 'none' }}>&larr; Back</a>
      <h1 style={{ marginTop: 12 }}>{property.title}</h1>
      <div style={{ marginTop: 8, color: '#555' }}>{property.location}</div>

      <section style={{ marginTop: 16 }}>
        <div><strong>Type:</strong> {property.type.replace('_', ' ')}</div>
        <div><strong>Rent:</strong> {property.rent.toLocaleString()} / month</div>
        <div><strong>Reputation:</strong> {property.reputation.toFixed(1)} / 5</div>
      </section>

      <section style={{ marginTop: 24 }}>
        <button style={{ padding: '10px 14px' }} disabled>
          Apply (coming soon)
        </button>
      </section>
    </main>
  );
}
