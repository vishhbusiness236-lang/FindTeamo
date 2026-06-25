"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { getProfile, getMatches, getFavorites } from "@/lib/db";
import { useAuth } from "@/lib/use-auth";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    matches: 0,
    favorites: 0,
    profileViews: 0,
    likesSent: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user) return;

      try {
        setError(null);
        const userProfile = await getProfile(user.id);
        setProfile(userProfile);

        const matches = await getMatches(user.id);
        const favorites = await getFavorites(user.id);
        setStats({
          matches: matches.length,
          favorites: favorites.length,
          profileViews: 0,
          likesSent: 0,
        });
      } catch {
        setError("Failed to load dashboard data.");
      }
    };
    loadDashboard();
  }, [user]);

  const handleLogout = async () => {
    const { supabase } = await import("@/lib/supabase");
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const profileComplete =
    profile?.full_name && profile?.bio && profile?.experience_level;
  const completionPercent = profile?.profile_completeness || 0;

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <CardSkeleton />
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-slate-950 hover:text-slate-700">
            FindTeamo
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/discover" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">Discover</Link>
              <Link href="/matches" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">Matches</Link>
              <Link href="/favorites" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">Favorites</Link>
              <Link href="/messages" className="text-sm font-medium text-slate-700 hover:text-blue-600 transition">Messages</Link>
            </nav>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-950">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split("@")[0]}!
          </h2>
          <p className="mt-2 text-slate-600">Find your perfect teammate for your next startup or project.</p>
        </div>

        {!profileComplete && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-amber-900">Complete Your Profile</h3>
                <p className="mt-1 text-sm text-amber-800">
                  Profile is {completionPercent}% complete. Add your skills, goals, and interests for better matches.
                </p>
              </div>
              <Link
                href="/profile"
                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
              >
                Complete Profile
              </Link>
            </div>
            <div className="mt-4 h-2 w-full bg-amber-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-600 transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs text-slate-600">Matches</p>
            <p className="text-2xl font-bold text-slate-950">{stats.matches}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs text-slate-600">Favorites</p>
            <p className="text-2xl font-bold text-slate-950">{stats.favorites}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs text-slate-600">Profile Views</p>
            <p className="text-2xl font-bold text-slate-950">{stats.profileViews}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs text-slate-600">Likes Sent</p>
            <p className="text-2xl font-bold text-slate-950">{stats.likesSent}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Link
            href="/discover"
            className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="mb-4 text-4xl">🔍</div>
            <h3 className="text-lg font-semibold text-slate-950 group-hover:text-blue-600">Discover Teammates</h3>
            <p className="mt-2 text-sm text-slate-600">Browse profiles and like people you want to connect with.</p>
          </Link>

          <Link
            href="/matches"
            className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-purple-300 hover:shadow-md"
          >
            <div className="mb-4 text-4xl">💫</div>
            <h3 className="text-lg font-semibold text-slate-950 group-hover:text-purple-600">Matches</h3>
            <p className="mt-2 text-sm text-slate-600">View profiles that also liked you. It&apos;s a match!</p>
          </Link>

          <Link
            href="/profile"
            className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="mb-4 text-4xl">👤</div>
            <h3 className="text-lg font-semibold text-slate-950 group-hover:text-slate-600">Your Profile</h3>
            <p className="mt-2 text-sm text-slate-600">Edit your profile and manage your information.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}