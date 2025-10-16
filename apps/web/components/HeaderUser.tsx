"use client";

import { useEffect, useState } from 'react';

export default function HeaderUser() {
  const [me, setMe] = useState<{ email: string; role: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (!('error' in data)) {
            if (alive) setMe({ email: data.email, role: data.role });
          }
        }
      } finally {
        if (alive) setReady(true);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  if (!ready) return null; // keep server-rendered state until client knows

  if (!me) {
    return (
      <>
        <a href="/login" className="text-slate-700 hover:text-slate-900">Login</a>
        <a href="/register" className="rounded-md bg-brand px-3 py-1.5 text-white hover:bg-brand-dark">Register</a>
      </>
    );
  }

  return (
    <details className="relative">
      <summary className="list-none inline-flex items-center gap-2 cursor-pointer select-none">
        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-medium">
          {me.email?.[0]?.toUpperCase()}
        </div>
        <span className="hidden sm:inline text-slate-700">
          {me.email}
        </span>
        <span className="ml-1 hidden sm:inline rounded bg-slate-100 px-2 py-0.5 text-xs uppercase">{me.role}</span>
      </summary>
      <div className="absolute right-0 mt-2 w-56 rounded-md border border-slate-200 bg-white shadow">
        <div className="px-3 py-2 text-xs text-slate-500">Account</div>
        <a href="/profile" className="block px-3 py-2 hover:bg-slate-50">Profile</a>
        <a href="/onboarding/tenant" className="block px-3 py-2 hover:bg-slate-50">Onboarding</a>
        <a href="/dashboard" className="block px-3 py-2 hover:bg-slate-50">Dashboard</a>
        {me.role === 'LANDLORD' && (
          <a href="/landlord/onboarding" className="block px-3 py-2 hover:bg-slate-50">Landlord</a>
        )}
        {me.role === 'ADMIN' && (
          <a href="/admin" className="block px-3 py-2 hover:bg-slate-50">Admin</a>
        )}
        <div className="my-2 border-t border-slate-200" />
        <form method="post" action="/api/auth/logout" className="px-3 py-2">
          <button className="w-full text-left rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">Logout</button>
        </form>
      </div>
    </details>
  );
}
