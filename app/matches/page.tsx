"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, ArrowLeft } from "lucide-react";
import type { ProfileWithDetails } from "@/lib/types";
import { getMatches, getOrCreateConversation } from "@/lib/db";
import { useAuth } from "@/lib/use-auth";
import { ProfileCardSkeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<ProfileWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  useEffect(() => {
    const initMatches = async () => {
      if (!user) return;

      try {
        setError(null);
        const userMatches = await getMatches(user.id);
        setMatches(userMatches);
      } catch (err) {
        console.error("Matches error:", err);
        setError("Failed to load matches. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initMatches();
  }, [user]);

  const handleStartConversation = async (matchId: string) => {
    if (!user) return;
    setMessagingId(matchId);
    try {
      const conversationId = await getOrCreateConversation(user.id, matchId);
      if (conversationId) {
        router.push(`/messages?c=${conversationId}`);
      } else {
        setError("Failed to start conversation. Please try again.");
        setMessagingId(null);
      }
    } catch (err) {
      console.error("Conversation error:", err);
      setError("Failed to start conversation.");
      setMessagingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-70 transition">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
            <span className="text-xl sm:text-2xl font-bold text-slate-950">Matches</span>
          </Link>
          <Link
            href="/discover"
            className="rounded-lg border border-slate-300 bg-white px-3 sm:px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Discover
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Title Section */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 flex items-center gap-2">
            Your Matches
            {matches.length > 0 && <span className="text-3xl">✨</span>}
          </h1>
          <p className="mt-2 sm:mt-3 text-base text-slate-600">
            {matches.length === 0
              ? "No matches yet. Keep exploring to find your perfect teammate!"
              : `You have ${matches.length} mutual match${matches.length === 1 ? "" : "es"}! Start chatting now.`}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="text-red-900 font-semibold">Something went wrong</p>
              <p className="text-red-800 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex-shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* No Matches State */}
        {matches.length === 0 && !error && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 sm:p-16 text-center shadow-sm">
            <div className="mb-4 text-6xl">🔍</div>
            <h2 className="text-2xl font-semibold text-slate-950">No matches yet</h2>
            <p className="mt-3 text-slate-600 max-w-md mx-auto">
              When someone you liked also likes you back, it's a match! Keep exploring profiles to find your perfect teammates.
            </p>
            <Link
              href="/discover"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 hover:shadow-lg"
            >
              Start Discovering
            </Link>
          </div>
        )}

        {/* Matches Grid */}
        {matches.length > 0 && !error && (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-blue-300"
              >
                {/* Header with Avatar */}
                <div className="flex items-center gap-4 border-b border-slate-100 bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 sm:p-6">
                  <Avatar
                    src={match.avatar_url}
                    alt={match.full_name || match.username || "Match"}
                    name={match.full_name || match.username || "Match"}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-slate-950 truncate">
                      {match.full_name || match.username || "Unknown"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 truncate">
                      {match.location || "Open to collaborate"}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Experience & Availability */}
                  {(match.experience_level || match.hours_per_week) && (
                    <div className="flex flex-wrap gap-2">
                      {match.experience_level && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-900 capitalize">
                          {match.experience_level}
                        </span>
                      )}
                      {match.hours_per_week && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900">
                          ⏱️ {match.hours_per_week} hrs/week
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bio */}
                  {match.bio && (
                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-2">
                      {match.bio}
                    </p>
                  )}

                  {/* Skills */}
                  {match.skills && match.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {match.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                          >
                            {skill.skill_name}
                          </span>
                        ))}
                        {match.skills.length > 3 && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            +{match.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Goals */}
                  {match.goals && match.goals.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                        Goals
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {match.goals.slice(0, 2).map((goal) => (
                          <span
                            key={goal.id}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-900"
                          >
                            {goal.goal_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Match Badge */}
                  <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 px-4 py-2.5 text-center">
                    <p className="text-sm font-semibold text-emerald-700">
                      ✓ It's a Match!
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartConversation(match.id)}
                    disabled={messagingId === match.id}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-md"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {messagingId === match.id ? "Starting chat..." : "Start Chatting"}
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