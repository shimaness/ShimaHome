"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  
  if (password.length >= 12) score += 25;
  if (password.length >= 16) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  let label = "Weak";
  let color = "bg-red-500";
  
  if (score >= 80) {
    label = "Strong";
    color = "bg-green-500";
  } else if (score >= 60) {
    label = "Good";
    color = "bg-yellow-500";
  } else if (score >= 40) {
    label = "Fair";
    color = "bg-orange-500";
  }

  return { score, label, color };
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!searchParams) return;
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  const strength = password ? calculatePasswordStrength(password) : null;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordMismatch = confirmPassword && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset link");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(data?.error || data?.message || "Failed to reset password");
      }

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <svg className="mx-auto h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-red-900">Invalid Reset Link</h2>
            <p className="mt-2 text-sm text-red-700">
              This password reset link is invalid or has expired.
            </p>
            <Link 
              href="/forgot-password"
              className="mt-4 inline-block rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Request new link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">Set new password</h1>
          <p className="mt-2 text-slate-600">
            Create a strong password to protect your account.
          </p>
        </div>

        {success ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-green-900">Password reset successful!</h2>
            <p className="mt-2 text-sm text-green-700">
              Redirecting you to login...
            </p>
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
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  New password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={12}
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="••••••••••••"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                
                {strength && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">Password strength:</span>
                      <span className={`text-xs font-medium ${strength.score >= 80 ? 'text-green-700' : strength.score >= 60 ? 'text-yellow-700' : 'text-red-700'}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}

                <ul className="mt-3 text-xs space-y-1 text-slate-600">
                  <li className={password.length >= 12 ? "text-green-700" : ""}>
                    {password.length >= 12 ? "✓" : "○"} At least 12 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? "text-green-700" : ""}>
                    {/[A-Z]/.test(password) ? "✓" : "○"} One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? "text-green-700" : ""}>
                    {/[a-z]/.test(password) ? "✓" : "○"} One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? "text-green-700" : ""}>
                    {/[0-9]/.test(password) ? "✓" : "○"} One number
                  </li>
                  <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-700" : ""}>
                    {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"} One special character
                  </li>
                </ul>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                    passwordMismatch 
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
                      : passwordsMatch
                      ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                      : "border-slate-300 focus:border-brand focus:ring-brand"
                  }`}
                  placeholder="••••••••••••"
                  disabled={busy}
                />
                {passwordMismatch && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
                {passwordsMatch && (
                  <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={busy || !passwordsMatch || !strength || strength.score < 60}
                className="w-full rounded-md bg-brand px-4 py-2 text-white font-medium hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? "Resetting password..." : "Reset password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
