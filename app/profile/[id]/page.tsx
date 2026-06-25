"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProfileWithDetails, likeProfile, rejectProfile } from "@/lib/db";
import { useAuth } from "@/lib/use-auth";
import type { ProfileWithDetails } from "@/lib/types";
import { ProfileCardSkeleton } from "@/components/ui/skeleton";

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;

  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initProfile = async () => {
      if (!user) return;

      try {
        setError(null);
        if (user.id === profileId) {
          router.push("/profile");
          return;
        }
        const profileData = await getProfileWithDetails(profileId);
        setProfile(profileData);
      } catch {
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initProfile();
  }, [user, profileId, router]);

  const handleLike = async () => {
    if (!user || !profile) return;
    await likeProfile(user.id, profile.id);
    router.push("/discover");
  };

  const handleReject = async () => {
    if (!user || !profile) return;
    await rejectProfile(user.id, profile.id);
    router.push("/discover");
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

  if (!profile) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-950">{error || "Profile not found"}</h1>
          <p className="mt-2 text-slate-600">{error ? "Please try again." : "This profile may not exist or you don't have access."}</p>
          <Link href="/discover" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            Back to Discovery
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold text-slate-950 hover:text-slate-700">
            FindTeamo
          </Link>
          <Link
            href="/discover"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="h-80 bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden flex items-center justify-center">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name || profile.username} fill className="object-cover" />
            ) : (
              <div className="text-9xl">👤</div>
            )}
          </div>

          <div className="p-12">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-950">{profile.full_name || profile.username}</h1>
              <p className="mt-2 text-slate-600">@{profile.username}</p>

              <div className="mt-4 flex flex-wrap gap-3">
                {profile.experience_level && (
                  <span className="inline-block rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900 capitalize">
                    {profile.experience_level}
                  </span>
                )}
                {profile.hours_per_week && (
                  <span className="inline-block rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-900">
                    {profile.hours_per_week} hours/week available
                  </span>
                )}
              </div>
            </div>

            {profile.bio && (
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-slate-950">About</h2>
                <p className="text-slate-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-slate-950">Skills</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {profile.skills.map((skill) => (
                    <div key={skill.id} className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                      <p className="font-medium text-blue-900">{skill.skill_name}</p>
                      <p className="text-xs text-blue-700 mt-1 capitalize">{skill.proficiency}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.goals && profile.goals.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-slate-950">Goals</h2>
                <div className="flex flex-wrap gap-3">
                  {profile.goals.map((goal) => (
                    <span
                      key={goal.id}
                      className="inline-block rounded-lg bg-purple-50 px-4 py-2 text-sm font-medium text-purple-900 border border-purple-100"
                    >
                      {goal.goal_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-slate-950">Interests</h2>
                <div className="flex flex-wrap gap-3">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest.id}
                      className="inline-block rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 border border-amber-100"
                    >
                      {interest.interest_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-12">
              <button
                onClick={handleReject}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <span>👎</span> Pass
              </button>
              <button
                onClick={handleLike}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <span>❤️</span> Like
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
