"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ProfileWithDetails } from "@/lib/types";
import { getMatches, getOrCreateConversation } from "@/lib/db";
import { useAuth } from "@/lib/use-auth";
import { ProfileCardSkeleton } from "@/components/ui/skeleton";

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<ProfileWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMatches = async () => {
      if (!user) return;

      try {
        setError(null);
        const userMatches = await getMatches(user.id);
        setMatches(userMatches);
      } catch {
        setError("Failed to load matches. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initMatches();
  }, [user]);

  const handleMessage = async (otherUserId: string) => {
    if (!user) return;
    const conversationId = await getOrCreateConversation(user.id, otherUserId);
    if (conversationId) {
      router.push(`/messages?c=${conversationId}`);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <ProfileCardSkeleton />
          <ProfileCardSkeleton />
          <ProfileCardSkeleton />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-slate-950 hover:text-slate-700">
            FindTeamo
          </Link>
          <div className="flex gap-4">
            <Link
              href="/discover"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Discover
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">Your Matches 💫</h1>
          <p className="mt-2 text-slate-600">
            {matches.length === 0
              ? "No matches yet. Keep exploring to find your perfect teammate!"
              : `You have ${matches.length} mutual match${matches.length === 1 ? "" : "es"}!`}
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-slate-950">Something went wrong</h2>
            <p className="mt-2 text-slate-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-slate-950">No matches yet</h2>
            <p className="mt-2 text-slate-600">
              Keep exploring profiles! When someone you liked also likes you, it&apos;s a match!
            </p>
            <Link
              href="/discover"
              className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Start Discovering
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100 relative flex items-center justify-center">
                  {match.avatar_url ? (
                    <Image src={match.avatar_url} alt={match.full_name || match.username} fill className="object-cover" />
                  ) : (
                    <div className="text-4xl">👤</div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-950">{match.full_name || match.username}</h3>

                  {(match.experience_level || match.hours_per_week) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {match.experience_level && (
                        <span className="inline-block rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-900 capitalize">
                          {match.experience_level}
                        </span>
                      )}
                      {match.hours_per_week && (
                        <span className="inline-block rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-900">
                          {match.hours_per_week} hrs
                        </span>
                      )}
                    </div>
                  )}

                  {match.bio && (
                    <p className="mt-3 text-sm text-slate-600 line-clamp-2">{match.bio}</p>
                  )}

                  {match.skills && match.skills.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {match.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill.id}
                            className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-900"
                          >
                            {skill.skill_name}
                          </span>
                        ))}
                        {match.skills.length > 3 && (
                          <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-900">
                            +{match.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {match.goals && match.goals.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Goals</p>
                      <div className="flex flex-wrap gap-1">
                        {match.goals.slice(0, 2).map((goal) => (
                          <span
                            key={goal.id}
                            className="inline-block rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-900"
                          >
                            {goal.goal_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleMessage(match.id)}
                    className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    💬 Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}