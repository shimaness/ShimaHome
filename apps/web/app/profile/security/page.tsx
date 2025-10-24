"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SecurityPage() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadMfaStatus();
  }, []);

  async function loadMfaStatus() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMfaEnabled(data.mfaEnabled || false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function setupMfa() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to setup MFA");
      setQrCode(data.qrCode);
      setSecret(data.secret);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function enableMfa() {
    if (!verifyCode || verifyCode.length !== 6) {
      setMessage({ type: "error", text: "Enter a valid 6-digit code" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/mfa/enable", {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Invalid code");
      setBackupCodes(data.backupCodes);
      setMfaEnabled(true);
      setQrCode(null);
      setSecret(null);
      setMessage({ type: "success", text: data.message });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function disableMfa() {
    if (!password) {
      setMessage({ type: "error", text: "Password required" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to disable MFA");
      setMfaEnabled(false);
      setShowDisableConfirm(false);
      setPassword("");
      setMessage({ type: "success", text: data.message });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto py-8">Loading...</div>;
  }

  return (
    <main className="max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Security Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account security and authentication methods.</p>
      </div>

      {message && (
        <div className={`rounded-lg border p-4 ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Backup Codes Display */}
      {backupCodes && (
        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-2">⚠️ Save Your Backup Codes</h3>
          <p className="text-sm text-amber-800 mb-4">
            Store these codes in a safe place. You can use each code once if you lose access to your authenticator app.
          </p>
          <div className="grid grid-cols-2 gap-2 bg-white p-4 rounded border border-amber-200 font-mono text-sm">
            {backupCodes.map((code, i) => (
              <div key={i} className="text-slate-800">{code}</div>
            ))}
          </div>
          <button
            onClick={() => setBackupCodes(null)}
            className="mt-4 text-sm text-amber-900 underline hover:text-amber-700"
          >
            I've saved these codes
          </button>
        </div>
      )}

      {/* MFA Status */}
      <div className="rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Two-Factor Authentication (2FA)</h2>
            <p className="text-sm text-slate-600 mt-1">
              Add an extra layer of security to your account with TOTP authentication.
            </p>
            <div className="mt-3">
              {mfaEnabled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Enabled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Disabled
                </span>
              )}
            </div>
          </div>
          <div>
            {!mfaEnabled && !qrCode && (
              <button
                onClick={setupMfa}
                disabled={busy}
                className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
              >
                Enable 2FA
              </button>
            )}
            {mfaEnabled && (
              <button
                onClick={() => setShowDisableConfirm(true)}
                disabled={busy}
                className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                Disable 2FA
              </button>
            )}
          </div>
        </div>

        {/* Setup Flow */}
        {qrCode && !mfaEnabled && (
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <div>
              <h3 className="font-medium mb-2">Scan QR Code</h3>
              <p className="text-sm text-slate-600 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
              </p>
              <img src={qrCode} alt="QR Code" className="border border-slate-200 rounded-lg" />
              {secret && (
                <details className="mt-3">
                  <summary className="text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                    Can't scan? Enter code manually
                  </summary>
                  <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-200">
                    <code className="text-sm font-mono break-all">{secret}</code>
                  </div>
                </details>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Enter the 6-digit code from your app
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-32 rounded-md border border-slate-300 px-3 py-2 text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                />
                <button
                  onClick={enableMfa}
                  disabled={busy || verifyCode.length !== 6}
                  className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  Verify & Enable
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Disable Confirmation */}
        {showDisableConfirm && mfaEnabled && (
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <h3 className="font-medium text-red-900 mb-2">Confirm Disable 2FA</h3>
              <p className="text-sm text-red-700 mb-4">
                Disabling 2FA will make your account less secure. Enter your password to confirm.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="flex-1 rounded-md border border-red-300 px-3 py-2"
                />
                <button
                  onClick={disableMfa}
                  disabled={busy || !password}
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Confirm Disable
                </button>
                <button
                  onClick={() => {
                    setShowDisableConfirm(false);
                    setPassword("");
                  }}
                  className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sessions & Login History */}
      <div className="rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-2">Sessions & Login History</h2>
        <p className="text-sm text-slate-600 mb-4">View active sessions and recent login activity on your account.</p>
        <Link
          href="/profile/security/sessions"
          className="inline-block rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Manage Sessions
        </Link>
      </div>

      {/* Password Change */}
      <div className="rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-2">Password</h2>
        <p className="text-sm text-slate-600 mb-4">Change your password or reset it if you've forgotten.</p>
        <Link
          href="/forgot-password"
          className="inline-block rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Reset Password
        </Link>
      </div>

      <div className="text-sm text-slate-500">
        <Link href="/profile" className="text-brand hover:underline">← Back to Profile</Link>
      </div>
    </main>
  );
}
