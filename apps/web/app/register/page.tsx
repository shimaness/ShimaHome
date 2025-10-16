"use client";

import { useState } from 'react';

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: basic creds + contact
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'email' | 'phone'>('email');
  const [challengeId, setChallengeId] = useState('');

  // Step 2: OTP
  const [otp, setOtp] = useState('');

  // Step 3: KYC auto-fill
  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [residence, setResidence] = useState('');
  const [dob, setDob] = useState('');

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/verify/send-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contact: channel === 'email' ? email : phone, channel }),
      });
      const data = await res.json();
      if (!res.ok || !data.challengeId) throw new Error(data?.error || 'Failed to send code');
      setChallengeId(data.challengeId);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function confirmOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/verify/confirm-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: otp, challengeId }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) throw new Error(data?.error || 'Invalid code');
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  async function lookupId(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await fetch(`/api/kyc/id-lookup?id=${encodeURIComponent(idNumber)}`);
      const data = await res.json();
      if (res.ok && data?.found) {
        setFullName(data.profile?.fullName || '');
        setResidence(data.profile?.residence || '');
        setDob(data.profile?.dob || '');
      } else {
        setError('No match found. You can fill details manually.');
      }
    } catch (err: any) {
      setError('Lookup failed');
    } finally {
      setLoading(false);
    }
  }

  async function finalizeSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'TENANT', phone, fullName, residence, dob, idNumber }),
      });
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      if (!res.ok) throw new Error('Registration failed');
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-semibold">Create tenant account</h1>
      <p className="text-slate-600 mt-1">Secure signup with contact verification and KYC auto-fill.</p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {step === 1 && (
        <form onSubmit={sendOtp} className="mt-6 space-y-4">
          <div className="grid gap-3">
            <label className="block text-sm">
              <span className="text-slate-700">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="you@example.com" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700">Password</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="Create a strong password" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700">Phone</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="+2547XXXXXXXX" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-700">Verify via</span>
              <select value={channel} onChange={(e) => setChannel(e.target.value as any)} className="mt-1 w-full rounded-md border border-slate-300 p-2">
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button disabled={loading} className="rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark disabled:opacity-60">
              {loading ? 'Sending…' : 'Send code'}
            </button>
            <a href="/login" className="text-sm text-brand hover:underline">I already have an account</a>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={confirmOtp} className="mt-6 space-y-4">
          <div className="text-sm text-slate-600">We sent a 6-digit code to your {channel === 'email' ? 'email' : 'phone'}.</div>
          <label className="block text-sm">
            <span className="text-slate-700">Enter code</span>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" pattern="[0-9]*" maxLength={6} required className="mt-1 w-full rounded-md border border-slate-300 p-2 tracking-widest" placeholder="123456" />
          </label>
          <div className="flex items-center gap-2">
            <button disabled={loading} className="rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark disabled:opacity-60">
              {loading ? 'Verifying…' : 'Verify'}
            </button>
            <button type="button" onClick={() => setStep(1)} className="text-sm text-slate-600 hover:underline">Back</button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={finalizeSignup} className="mt-6 space-y-4">
          <div className="rounded-md border border-slate-200 p-3">
            <div className="text-sm font-medium">KYC auto-fill</div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <div className="text-slate-700">ID/Passport number</div>
                <div className="flex gap-2">
                  <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" required />
                  <button onClick={lookupId} className="shrink-0 rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50" type="button">Lookup</button>
                </div>
              </label>
              <label className="text-sm">
                <div className="text-slate-700">Full name</div>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" required />
              </label>
              <label className="text-sm">
                <div className="text-slate-700">Residence</div>
                <input value={residence} onChange={(e) => setResidence(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" required />
              </label>
              <label className="text-sm">
                <div className="text-slate-700">Date of birth</div>
                <input value={dob} onChange={(e) => setDob(e.target.value)} type="date" className="mt-1 w-full rounded-md border border-slate-300 p-2" required />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button disabled={loading} className="rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark disabled:opacity-60">
              {loading ? 'Creating…' : 'Create account'}
            </button>
            <button type="button" onClick={() => setStep(2)} className="text-sm text-slate-600 hover:underline">Back</button>
          </div>
        </form>
      )}

      {step === 4 && (
        <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
          <div className="font-medium">Account created</div>
          <div className="text-sm">Welcome to ShimaHome! You can now continue to browse listings.</div>
          <div className="mt-3"><a className="rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark" href="/">Go to home</a></div>
        </div>
      )}

      <p className="text-sm text-slate-600 mt-6">
        Already have an account? <a href="/login" className="text-brand hover:underline">Login</a>
      </p>
    </main>
  );
}
