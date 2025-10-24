"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginMfaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mfaToken, setMfaToken] = useState("");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("mfaToken");
    if (token) {
      setMfaToken(token);
    } else {
      // No MFA token, redirect to login
      router.push("/login");
    }
  }, [searchParams, router]);

  // Generate device fingerprint (simple version)
  function getDeviceFingerprint(): string {
    const ua = navigator.userAgent;
    const screen = `${window.screen.width}x${window.screen.height}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${ua}-${screen}-${tz}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError("Enter a valid 6-digit code");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mfaToken,
          code,
          trustDevice,
          deviceFingerprint: getDeviceFingerprint(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || data.message || "Invalid code");
      }

      // Store tokens
      localStorage.setItem("token", data.token);
      localStorage.setItem("refresh", data.refresh);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  if (!mfaToken) {
    return <div className="min-h-[80vh] flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Two-Factor Authentication</h1>
          <p className="mt-2 text-slate-600">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-slate-700 mb-2">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              required
              maxLength={6}
              className="w-full rounded-md border border-slate-300 px-4 py-3 text-center text-2xl font-mono tracking-widest shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              disabled={busy}
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-500">
              Enter the code from Google Authenticator, Authy, or your authenticator app.
            </p>
          </div>

          <div className="flex items-center">
            <input
              id="trustDevice"
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              disabled={busy}
            />
            <label htmlFor="trustDevice" className="ml-2 text-sm text-slate-700">
              Trust this device for 30 days
            </label>
          </div>

          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full rounded-md bg-brand px-4 py-3 text-white font-medium hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <details className="text-sm">
            <summary className="cursor-pointer text-slate-600 hover:text-slate-900">
              Lost access to your authenticator?
            </summary>
            <p className="mt-2 text-slate-600">
              Use one of your backup codes instead of the 6-digit code, or contact support if you've lost both.
            </p>
          </details>
        </div>

        <div className="mt-6 text-center text-sm">
          <a href="/login" className="text-brand hover:text-brand-dark font-medium">
            ← Back to login
          </a>
        </div>
      </div>
    </main>
  );
}
