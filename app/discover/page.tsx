"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, PartyPopper } from "lucide-react";
import type { ProfileWithDetails } from "@/lib/types";
import { getDiscoveryProfiles, getProfileWithDetails, likeProfile, rejectProfile, calculateMatchScore, addFavorite, removeFavorite, getFavorites, getOrCreateConversation } from "@/lib/db";
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
      } catch (err) {
        console.error("Discovery error:", err);
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
    try {
      if (isFavorited(profile.id)) {
        await removeFavorite(user.id, profile.id);
        setFavorites(favorites.filter(id => id !== profile.id));
      } else {
        await addFavorite(user.id, profile.id);
        setFavorites([...favorites, profile.id]);
      }
    } catch (err) {
      console.error("Favorite error:", err);
    }
  };

  const handleSkip = async () => {
    if (!user || currentIndex >= profiles.length) return;
    const profile = profiles[currentIndex];
    try {
      await rejectProfile(user.id, profile.id);
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error("Skip error:", err);
    }
  };

  const handleMessage = async () => {
    if (!user || currentIndex >= profiles.length) return;
    const profile = profiles[currentIndex];
    try {
      await likeProfile(user.id, profile.id);
      const conversationId = await getOrCreateConversation(user.id, profile.id);
      if (conversationId) {
        router.push(`/messages?c=${conversationId}`);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Message error:", err);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col items-center gap-3">
          <ProfileCardSkeleton />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-70 transition">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
              <span className="text-xl sm:text-2xl font-bold text-slate-950">Discover</span>
            </Link>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h1 className="text-3xl font-bold text-slate-950 text-center">Something went wrong</h1>
          <p className="mt-2 text-slate-600 text-center max-w-md">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-70 transition">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
              <span className="text-xl sm:text-2xl font-bold text-slate-950">Discover</span>
            </Link>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center py-20 px-4">
          <PartyPopper className="h-12 w-12 text-blue-500 mb-4" />
          <h1 className="text-3xl font-bold text-slate-950 text-center">
            {profiles.length === 0 ? "No profiles yet" : "All caught up!"}
          </h1>
          <p className="mt-2 text-slate-600 text-center max-w-md">
            {profiles.length === 0
              ? "Check back soon for more teammates to discover."
              : "You've reviewed all available profiles. More will appear soon!"}
          </p>
          <Link
            href="/matches"
            className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 hover:shadow-lg"
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-70 transition">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
              <span className="text-xl sm:text-2xl font-bold text-slate-950">Discover</span>
            </Link>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span>{currentIndex + 1}</span>
              <span className="text-slate-400">/</span>
              <span>{profiles.length}</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
        {/* Profile Card */}
        <div className="w-full max-w-md mb-8">
          <ProfileCard
            key={`${profile.id}-${currentIndex}`}
            profile={profile}
            onMessage={handleMessage}
            onSkip={handleSkip}
            onToggleFavorite={handleFavorite}
            isFavoriteInitial={isFavorited(profile.id)}
          />
        </div>

        {/* Info Text */}
        <div className="mt-2 text-center text-xs text-slate-500">
          <p>Swipe through profiles to find your perfect teammate</p>
        </div>
      </div>
    </main>
  );
}