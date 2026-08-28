"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, PartyPopper } from "lucide-react";
import type { ProfileWithDetails } from "@/lib/types";
import { getDiscoveryProfiles, getProfileWithDetails, likeProfile, rejectProfile, calculateMatchScore, addFavorite, removeFavorite, getFavorites, getOrCreateConversation } from "@/lib/db";
import { useAuth } from "@/lib/use-auth";
import { ProfileCardSkeleton } from "@/components/ui/skeleton";
import { ProfileCard } from "@/components/project-card";

const DEMO_PROFILES: ProfileWithDetails[] = [
  {
    id: "demo-1",
    full_name: "Aarav Sharma",
    bio: "Full-stack dev who loves shipping fast. Looking for a co-founder to build something ambitious.",
    avatar_url: null,
    experience_level: "intermediate",
    hours_per_week: 15,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    skills: [
      { id: 1, profile_id: "demo-1", skill_name: "React", proficiency: "expert" },
      { id: 2, profile_id: "demo-1", skill_name: "Node.js", proficiency: "intermediate" },
    ],
    interests: [],
    goals: [],
    matchScore: 87,
  } as any,
  {
    id: "demo-2",
    full_name: "Priya Nair",
    bio: "Designer with a product mindset. Have shipped 3 apps to production, want to find technical co-founders.",
    avatar_url: null,
    experience_level: "expert",
    hours_per_week: 20,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    skills: [
      { id: 3, profile_id: "demo-2", skill_name: "UI/UX", proficiency: "expert" },
      { id: 4, profile_id: "demo-2", skill_name: "Figma", proficiency: "expert" },
    ],
    interests: [],
    goals: [],
    matchScore: 74,
  } as any,
  {
    id: "demo-3",
    full_name: "Kabir Mehta",
    bio: "ML engineer exploring startup ideas in the AI agents space. Open to hackathons and long-term projects.",
    avatar_url: null,
    experience_level: "intermediate",
    hours_per_week: 10,
    onboarding_completed: true,
    created_at: new Date().toISOString(),
    skills: [
      { id: 5, profile_id: "demo-3", skill_name: "Python", proficiency: "expert" },
      { id: 6, profile_id: "demo-3", skill_name: "ML/AI", proficiency: "intermediate" },
    ],
    interests: [],
    goals: [],
    matchScore: 65,
  } as any,
];

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { user, loading: authLoading } = useAuth({ skipRedirect: isDemo });

  const [profiles, setProfiles] = useState<ProfileWithDetails[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (isDemo) {
      setProfiles(DEMO_PROFILES);
      setLoading(false);
      return;
    }

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
  }, [user, isDemo]);

  const isFavorited = (profileId: string) => favorites.includes(profileId);

  const handleFavorite = async () => {
    if (isDemo) {
      const profile = profiles[currentIndex];
      if (isFavorited(profile.id)) {
        setFavorites(favorites.filter(id => id !== profile.id));
      } else {
        setFavorites([...favorites, profile.id]);
      }
      return;
    }
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
    if (isDemo) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }
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
    if (isDemo) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }
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

  if (!isDemo && (authLoading || loading)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col items-center gap-3">
          <ProfileCardSkeleton />
        </div>
      </main>
    );
  }

  if (!isDemo && !user) {
    return null;
  }

  if (!isDemo && error) {
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
            {isDemo ? "That's the full demo!" : profiles.length === 0 ? "No profiles yet" : "All caught up!"}
          </h1>
          <p className="mt-2 text-slate-600 text-center max-w-md">
            {isDemo
              ? "This is a preview using sample profiles. Sign up to discover real teammates."
              : profiles.length === 0
              ? "Check back soon for more teammates to discover."
              : "You've reviewed all available profiles. More will appear soon!"}
          </p>
          <Link
            href={isDemo ? "/login" : "/matches"}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 hover:shadow-lg"
          >
            {isDemo ? "Sign Up" : "Check Your Matches"}
          </Link>
        </div>
      </main>
    );
  }

  const profile = profiles[currentIndex];
  const progress = ((currentIndex + 1) / profiles.length) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {isDemo && (
        <div className="bg-blue-600 text-white text-center text-sm py-2 px-4">
          You&apos;re viewing a demo with sample profiles.{" "}
          <Link href="/login" className="underline font-medium">Sign up</Link> to get started for real.
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href={isDemo ? "/" : "/dashboard"} className="flex items-center gap-2 hover:opacity-70 transition">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
              <span className="text-xl sm:text-2xl font-bold text-slate-950">Discover</span>
            </Link>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span>{currentIndex + 1}</span>
              <span className="text-slate-400">/</span>
              <span>{profiles.length}</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center">
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

        <div className="mt-2 text-center text-xs text-slate-500">
          <p>Swipe through profiles to find your perfect teammate</p>
        </div>
      </div>
    </main>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col items-center gap-3">
          <ProfileCardSkeleton />
        </div>
      </main>
    }>
      <DiscoverContent />
    </Suspense>
  );
}