"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);
    setDevToken(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(data?.error || data?.message || "Failed to send reset link");
      }

      setSuccess(true);
      if (data.devResetToken) {
        setDevToken(data.devResetToken);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Reset your password</h1>
          <p className="mt-2 text-slate-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Check your email</h3>
                <p className="mt-1 text-sm text-green-700">
                  If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
                  Please check your inbox and spam folder.
                </p>
                {devToken && (
                  <div className="mt-3 p-3 rounded bg-green-100 border border-green-300">
                    <p className="text-xs font-semibold text-green-900 mb-1">Dev Mode - Reset Link:</p>
                    <Link 
                      href={`/reset-password?token=${devToken}`}
                      className="text-sm text-green-800 hover:text-green-900 underline break-all"
                    >
                      /reset-password?token={devToken}
                    </Link>
                  </div>
                )}
                <p className="mt-3 text-sm text-green-700">
                  <Link href="/login" className="font-medium underline">
                    Back to login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="you@example.com"
                  disabled={busy}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-brand px-4 py-2 text-white font-medium hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <Link href="/login" className="text-brand hover:text-brand-dark font-medium">
                ← Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
