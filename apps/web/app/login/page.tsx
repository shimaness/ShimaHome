export default function LoginPage() {
  return (
    <main className="max-w-sm mx-auto py-10">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-slate-600 mt-1">Sign in to your ShimaHome account.</p>

      <form method="post" action="/api/auth/login" className="mt-6 space-y-4">
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
            placeholder="••••••••"
          />
        </label>
        <button type="submit" className="w-full rounded-md bg-brand px-3 py-2 text-white hover:bg-brand-dark">Sign in</button>
      </form>

      <div className="my-4 text-center text-slate-400 text-sm">or</div>
      <a href="/api/auth/google" className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="18" width="18"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12 c3.059,0,5.842,1.155,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20 c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.155,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.197l-6.191-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.323-11.275-7.964l-6.557,5.047C9.472,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.094,5.565l0.003-0.002l6.191,5.238 C35.246,39.936,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
        Continue with Google
      </a>

      <p className="text-sm text-slate-600 mt-4">
        Don&apos;t have an account? <a href="/register" className="text-brand hover:underline">Register</a>
      </p>
    </main>
  );
}
