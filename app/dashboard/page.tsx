"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, MessageSquare, Heart, Users, Zap } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  const loadDashboard = async () => {
    if (!user) return;

    try {
      setError(null);
      const [userProfile, matches, favorites] = await Promise.all([
        getProfile(user.id),
        getMatches(user.id),
        getFavorites(user.id),
      ]);

      setProfile(userProfile);
      setStats({
        matches: matches.length,
        favorites: favorites.length,
        profileViews: 0,
        likesSent: 0,
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
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

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <CardSkeleton />
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="group flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold">
                FT
              </div>
              <span className="text-xl sm:text-2xl font-bold text-slate-950 group-hover:text-blue-600 transition">
                FindTeamo
              </span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-6">
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/discover"
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  Discover
                </Link>
                <Link
                  href="/matches"
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  Matches
                </Link>
                <Link
                  href="/favorites"
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  Favorites
                </Link>
                <Link
                  href="/messages"
                  className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  Messages
                </Link>
              </nav>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 sm:px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split("@")[0]}! 👋
          </h1>
          <p className="mt-2 sm:mt-3 text-base sm:text-lg text-slate-600">
            Find your perfect teammate for your next startup or project.
          </p>
        </div>

        {/* Profile Completion Alert */}
        {!profileComplete && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-950 text-lg">Complete Your Profile</h3>
                </div>
                <p className="mt-2 text-sm text-amber-800">
                  Profile is <span className="font-bold">{completionPercent}%</span> complete. Add your skills, goals, and interests for better matches.
                </p>
              </div>
              <Link
                href="/profile"
                className="inline-block rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 hover:shadow-lg"
              >
                Complete Now
              </Link>
            </div>
            <div className="mt-4 h-2 w-full bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-orange-600 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Matches</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-950 mt-1">{stats.matches}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Favorites</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-950 mt-1">{stats.favorites}</p>
              </div>
              <Heart className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Profile Views</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-950 mt-1">{stats.profileViews}</p>
              </div>
              <div className="text-2xl">👁️</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all hover:border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500">Likes Sent</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-950 mt-1">{stats.likesSent}</p>
              </div>
              <div className="text-2xl">👍</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Discover Card */}
          <Link
            href="/discover"
            className="group rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-lg hover:border-blue-300"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 group-hover:bg-blue-200 transition">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-950 group-hover:text-blue-600 transition">
              Discover Teammates
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Browse profiles and like people you want to connect with. Find your perfect match!
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition">
              Start Browsing →
            </div>
          </Link>

          {/* Matches Card */}
          <Link
            href="/matches"
            className="group rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-lg hover:border-purple-300"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 group-hover:bg-purple-200 transition">
              <span className="text-2xl">💫</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-950 group-hover:text-purple-600 transition">
              Your Matches
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              View profiles that also liked you. {stats.matches > 0 ? "You have matches!" : "Keep exploring!"}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-purple-600 opacity-0 group-hover:opacity-100 transition">
              View Matches ({stats.matches}) →
            </div>
          </Link>

          {/* Messages Card */}
          <Link
            href="/messages"
            className="group rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-lg hover:border-emerald-300"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition">
              <MessageSquare className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-950 group-hover:text-emerald-600 transition">
              Messages
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Chat with your matches in real-time. Send images and voice messages too!
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition">
              Open Chat →
            </div>
          </Link>

          {/* Profile Card */}
          <Link
            href="/profile"
            className="group rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-lg hover:border-slate-300"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 group-hover:bg-slate-200 transition">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-950 group-hover:text-slate-700 transition">
              Your Profile
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Edit your profile, upload photos, and manage your skills and interests.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition">
              Edit Profile →
            </div>
          </Link>

          {/* Favorites Card */}
          <Link
            href="/favorites"
            className="group rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-lg hover:border-red-300"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 group-hover:bg-red-200 transition">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-950 group-hover:text-red-600 transition">
              Favorites
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Keep track of profiles you really like for later.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-600 opacity-0 group-hover:opacity-100 transition">
              Browse Favorites ({stats.favorites}) →
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}