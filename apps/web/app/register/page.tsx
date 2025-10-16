export default function RegisterPage() {
  return (
    <main className="max-w-sm mx-auto py-10">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <p className="text-slate-600 mt-1">Register to manage or rent properties.</p>

      <form method="post" action="/api/auth/register" className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="text-slate-700">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-slate-300 p-2"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Password</span>
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-slate-300 p-2"
            placeholder="Create a strong password"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Role</span>
          <select name="role" className="mt-1 w-full rounded-md border border-slate-300 p-2" defaultValue="TENANT">
            <option value="TENANT">Tenant</option>
            <option value="LANDLORD">Landlord</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button type="submit" className="w-full rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark">Create account</button>
      </form>

      <p className="text-sm text-slate-600 mt-4">
        Already have an account? <a href="/login" className="text-brand hover:underline">Login</a>
      </p>
    </main>
  );
}
