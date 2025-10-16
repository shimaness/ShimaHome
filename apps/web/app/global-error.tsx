"use client";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <main className="container py-10">
          <h1 className="text-2xl font-semibold">Application error</h1>
          <p className="text-slate-600 mt-2">An unexpected error occurred.</p>
          {error?.message ? (
            <pre className="mt-3 rounded bg-slate-100 p-3 text-xs text-slate-700 overflow-auto">{error.message}</pre>
          ) : null}
          <button onClick={() => reset()} className="mt-4 rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark">Try again</button>
        </main>
      </body>
    </html>
  );
}
