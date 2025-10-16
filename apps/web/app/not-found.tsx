export default function NotFound() {
  return (
    <main className="container py-10">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-slate-600 mt-2">The page you are looking for does not exist.</p>
      <p className="mt-4"><a href="/" className="text-brand hover:text-brand-dark">Go back home</a></p>
    </main>
  );
}
