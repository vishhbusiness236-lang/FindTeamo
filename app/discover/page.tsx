"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProfileWithDetails } from "@/lib/types";
import { getDiscoveryProfiles, getProfileWithDetails, likeProfile, rejectProfile, calculateMatchScore, addFavorite, removeFavorite, getFavorites } from "@/lib/db";
import { useAuth } from "@/lib/use-auth";
import { ProfileCardSkeleton } from "@/components/ui/skeleton";
import { ProfileCard } from "@/components/project-card";

export default function DiscoverPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileWithDetails[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const initDiscovery = async () => {
      if (!user) return;

      try {
        setError(null);
        const [userProfile, favoriteProfiles] = await Promise.all([
          getProfileWithDetails(user.id),
          getFavorites(user.id),
        ]);
        setFavorites(favoriteProfiles.map(p => p.id));

        const discoveryProfiles = await getDiscoveryProfiles(user.id, 20);

        if (userProfile) {
          const profilesWithScores = discoveryProfiles.map((p) => ({
            ...p,
            matchScore: calculateMatchScore(userProfile, p),
          }));
          profilesWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
          setProfiles(profilesWithScores);
        } else {
          setProfiles(discoveryProfiles);
        }
      } catch {
        setError("Failed to load profiles. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initDiscovery();
  }, [user]);

  const isFavorited = (profileId: string) => favorites.includes(profileId);

  const handleFavorite = async () => {
    if (!user || currentIndex >= profiles.length) return;
    const profile = profiles[currentIndex];
    if (isFavorited(profile.id)) {
      await removeFavorite(user.id, profile.id);
      setFavorites(favorites.filter(id => id !== profile.id));
    } else {
      await addFavorite(user.id, profile.id);
      setFavorites([...favorites, profile.id]);
    }
  };

  const handleMessage = async () => {
    if (!user || currentIndex >= profiles.length) return;
    const profile = profiles[currentIndex];
    await likeProfile(user.id, profile.id);
    router.push("/matches");
  };

  const handleSkip = async () => {
    if (!user || currentIndex >= profiles.length) return;
    const profile = profiles[currentIndex];
    await rejectProfile(user.id, profile.id);
    setCurrentIndex((prev) => prev + 1);
  };

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <ProfileCardSkeleton />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-slate-950 hover:text-slate-700">
              FindTeamo
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-slate-950">Something went wrong</h1>
          <p className="mt-2 text-slate-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (profiles.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-slate-950 hover:text-slate-700">
              FindTeamo
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-slate-950">No more profiles!</h1>
          <p className="mt-2 text-slate-600">You&apos;ve viewed all available profiles.</p>
          <Link
            href="/matches"
            className="mt-6 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Check Your Matches
          </Link>
        </div>
      </main>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <main className="min-h-screen bg-white">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-slate-950 hover:text-slate-700">
              FindTeamo
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-slate-950">All caught up!</h1>
          <p className="mt-2 text-slate-600">You&apos;ve reviewed all profiles. Check back later for more!</p>
          <Link
            href="/matches"
            className="mt-6 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Check Your Matches
          </Link>
        </div>
      </main>
    );
  }

  const profile = profiles[currentIndex];
  const progress = ((currentIndex + 1) / profiles.length) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-slate-950 hover:text-slate-700">
            FindTeamo
          </Link>
          <div className="flex gap-4">
            <Link
              href="/matches"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Matches
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <div className="h-1 w-full bg-slate-200">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12 flex flex-col items-center">
        <ProfileCard
          key={profile.id}
          profile={profile}
          onMessage={handleMessage}
          onSkip={handleSkip}
          onToggleFavorite={handleFavorite}
          isFavoriteInitial={isFavorited(profile.id)}
        />

        <div className="mt-6 text-center text-sm text-slate-600">
          {currentIndex + 1} of {profiles.length}
        </div>
      </div>
    </main>
  );
}