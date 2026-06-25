"use client";

import { supabase } from "@/lib/supabase";

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
       redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) console.error("Error signing in:", error.message);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white/80 p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-slate-950">
          Welcome to FindTeamo
        </h1>
        <p className="mb-6 text-center text-sm text-slate-600">
          Sign in to find your startup teammates
        </p>
        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.95c-.32 1.56-1.22 2.76-2.54 3.47v2.72h3.85c2.28-.97 3.52-2.84 3.52-5.22z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.7 0 5.02-.88 6.88-2.38l-3.38-2.73c-.89.6-2.03.96-3.5.96-2.66 0-4.95-1.85-5.77-4.35H3.53v2.84C5.35 21.35 8.47 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M7.23 14.12c-.23-.66-.36-1.36-.36-2.09s.13-1.43.36-2.09V7.11H3.53A11.04 11.04 0 0 0 2 12c0 1.73.4 3.36 1.12 4.86l3.11-2.38z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.32 0 2.55.48 3.62 1.55l2.67-2.67C16.7 2.53 14.28 1.5 12 1.5 8.47 1.5 5.35 3.15 3.53 5.41l3.7 2.84c.82-2.5 3.1-4.35 5.77-4.35z"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </main>
  );
}
