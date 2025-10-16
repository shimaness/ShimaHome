"use client";

import { useState } from 'react';

export default function TenantOnboardingPage() {
  const [idType, setIdType] = useState<'NATIONAL_ID'|'PASSPORT'|'DRIVERS_LICENSE'>('NATIONAL_ID');
  const [idNumber, setIdNumber] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [info, setInfo] = useState<string|null>("Provide a valid ID/Passport/Driver's License. Photos should include front/back and a clear selfie.");

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const f = Array.from(e.target.files || []);
    setFiles(f);
  }

  async function uploadDocs() {
    if (!files.length) return;
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    try {
      await fetch('/api/kyc/docs/upload', { method: 'POST', body: form });
    } catch {}
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setLoading(true);
    try {
      await uploadDocs();
      const res = await fetch('/api/kyc/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idType, idNumber })
      });
      const data = await res.json();
      if (!res.ok || !data?.verified) throw new Error(data?.error || 'Verification failed');
      setInfo('Verification complete. Redirecting…');
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Failed to verify');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto py-10">
      <h1 className="text-2xl font-semibold">Tenant verification</h1>
      <p className="text-slate-600 mt-1">KYC is required even when signing in with Google.</p>

      {error && (<div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>)}
      {info && (<div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">{info}</div>)}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="text-slate-700">ID type</span>
          <select value={idType} onChange={(e)=>setIdType(e.target.value as any)} className="mt-1 w-full rounded-md border border-slate-300 p-2">
            <option value="NATIONAL_ID">National ID</option>
            <option value="PASSPORT">Passport</option>
            <option value="DRIVERS_LICENSE">Driver's License</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">ID number</span>
          <input value={idNumber} onChange={(e)=>setIdNumber(e.target.value)} required className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="Enter your ID/Passport/License number" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Photos (front/back/selfie)</span>
          <input onChange={onPickFiles} type="file" multiple accept="image/*" className="mt-1 w-full rounded-md border border-slate-300 p-2" />
          <div className="mt-2 text-xs text-slate-500">Upload clear images. You can proceed; uploads are mocked and stored temporarily.</div>
        </label>
        <button disabled={loading} className="rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark disabled:opacity-60">{loading? 'Verifying…' : 'Verify and continue'}</button>
      </form>
    </main>
  );
}
