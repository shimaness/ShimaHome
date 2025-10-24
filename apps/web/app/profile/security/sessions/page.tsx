"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Session {
  id: string;
  device: string;
  deviceType: string;
  ip?: string;
  lastUsed: string;
  createdAt: string;
  expiresAt: string;
}

interface LoginAttempt {
  id: string;
  ip?: string;
  succeeded: boolean;
  timestamp: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage({ type: "error", text: "Not authenticated" });
        setLoading(false);
        return;
      }

      const [sessionsRes, historyRes] = await Promise.all([
        fetch("/api/auth/sessions", {
          headers: { authorization: `Bearer ${token}` },
        }),
        fetch("/api/auth/login-history", {
          headers: { authorization: `Bearer ${token}` },
        }),
      ]);

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        if (Array.isArray(sessionsData)) {
          setSessions(sessionsData);
        }
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        if (Array.isArray(historyData)) {
          setLoginHistory(historyData);
        }
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  }

  async function revokeSession(sessionId: string) {
    if (!confirm("Are you sure you want to end this session?")) return;
    
    setBusy(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to revoke session");

      setMessage({ type: "success", text: "Session ended successfully" });
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function logoutAllDevices() {
    if (!confirm("Are you sure you want to log out of all devices? You'll need to log in again on this device.")) return;
    
    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/logout-all", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to logout");

      // Clear local storage and redirect to login
      localStorage.clear();
      window.location.href = "/login";
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
      setBusy(false);
    }
  }

  function formatRelativeTime(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return then.toLocaleDateString();
  }

  function getDeviceIcon(deviceType: string) {
    switch (deviceType) {
      case "mobile":
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case "tablet":
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto py-8">Loading...</div>;
  }

  return (
    <main className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Active Sessions & Login History</h1>
          <p className="text-slate-600 mt-1">Manage your active sessions and review recent login activity.</p>
        </div>
        <button
          onClick={logoutAllDevices}
          disabled={busy || sessions.length === 0}
          className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          Logout All Devices
        </button>
      </div>

      {message && (
        <div className={`rounded-lg border p-4 ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Active Sessions */}
      <div className="rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-semibold">Active Sessions ({sessions.length})</h2>
          <p className="text-sm text-slate-600 mt-1">These devices are currently logged in to your account.</p>
        </div>
        <div className="divide-y divide-slate-200">
          {sessions.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-600">
              No active sessions found.
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="px-6 py-4 flex items-start justify-between hover:bg-slate-50">
                <div className="flex items-start gap-4">
                  <div className="mt-1 text-slate-600">
                    {getDeviceIcon(session.deviceType)}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{session.device}</div>
                    <div className="text-sm text-slate-600 mt-1 space-y-0.5">
                      {session.ip && (
                        <div className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{session.ip}</span>
                        </div>
                      )}
                      <div>Last active: {formatRelativeTime(session.lastUsed)}</div>
                      <div>Created: {new Date(session.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => revokeSession(session.id)}
                  disabled={busy}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-60"
                >
                  End Session
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Login History */}
      <div className="rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-semibold">Login History</h2>
          <p className="text-sm text-slate-600 mt-1">Recent login attempts on your account (last 50).</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">IP Address</th>
                <th className="px-6 py-3 font-medium">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loginHistory.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-600">
                    No login history available.
                  </td>
                </tr>
              ) : (
                loginHistory.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      {attempt.succeeded ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700">{attempt.ip || "N/A"}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(attempt.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-slate-500">
        <Link href="/profile/security" className="text-brand hover:underline">← Back to Security Settings</Link>
      </div>
    </main>
  );
}
