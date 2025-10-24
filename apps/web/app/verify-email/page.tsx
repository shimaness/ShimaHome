"use client";

import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const e = url.searchParams.get("email");
      if (e) setEmail(e);
      const hint = url.searchParams.get("code");
      if (hint) setMsg(`A verification code was issued. Code (dev): ${hint}`);
    } catch {}
  }, []);

  function notice(ok: boolean, text: string) {
    if (ok) { setMsg(text); setErr(null); } else { setErr(text); setMsg(null); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Invalid code");
      notice(true, "Email verified. You can now sign in.");
    } catch (e: any) {
      notice(false, e.message);
    } finally { setBusy(false); }
  }

  async function resend() {
    if (resendIn > 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || "Failed to resend");
      notice(true, data?.devCode ? `Code resent. Code (dev): ${data.devCode}` : "Code resent. Check your inbox.");
      setResendIn(30);
      const t = setInterval(() => setResendIn((s) => { if (s <= 1) { clearInterval(t); return 0; } return s - 1; }), 1000);
    } catch (e: any) {
      notice(false, e.message);
    } finally { setBusy(false); }
  }

  return (
    <main className="max-w-md mx-auto py-10">
      <h1 className="text-2xl font-semibold">Verify your email</h1>
      <p className="text-slate-600 mt-1">Enter the 6-digit code we sent to your email to activate your account.</p>

      {msg && <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-800 text-sm">{msg}</div>}
      {err && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm">{err}</div>}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="text-slate-700">Email</span>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="you@example.com" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">6-digit code</span>
          <input value={code} onChange={(e)=>setCode(e.target.value)} inputMode="numeric" maxLength={6} pattern="[0-9]*" required className="mt-1 w-full rounded-md border border-slate-300 p-2 tracking-widest" placeholder="123456" />
        </label>
        <div className="flex items-center gap-2">
          <button disabled={busy} className="rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark disabled:opacity-60">Verify email</button>
          <button type="button" onClick={resend} disabled={busy || resendIn>0} className="text-sm text-slate-700 hover:underline disabled:opacity-50">{resendIn>0?`Resend in ${resendIn}s`:'Resend code'}</button>
          <a href="/login" className="ml-auto text-sm text-brand hover:underline">Go to sign in</a>
        </div>
      </form>
    </main>
  );
}
