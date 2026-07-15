"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Avatar } from "@/components/ui";
import type { ProfileWithDetails } from "@/lib/types";

type ProfileCardProps = {
  profile: ProfileWithDetails;
  onMessage?: () => void;
  onSkip?: () => void;
  onToggleFavorite?: () => void;
  isFavoriteInitial?: boolean;
};

export function ProfileCard({
  profile,
  onMessage,
  onSkip,
  onToggleFavorite,
  isFavoriteInitial = false,
}: ProfileCardProps) {
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite);
    onToggleFavorite?.();
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_-24px_rgba(37,99,235,0.35)]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
          <Avatar
            src={profile.avatar_url}
            alt={profile.full_name || profile.username || "User"}
            name={profile.full_name || profile.username || "User"}
            size="lg"
          />

          <div className="min-w-0">
            <h2 className="text-xl font-semibold capitalize text-slate-950">
              {profile.full_name || profile.username || "User"}
            </h2>
            <div className="mt-2 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {profile.matchScore ?? 0}% Match
            </div>
          </div>
        </div>

        <button
          onClick={handleFavoriteClick}
          className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-400 transition hover:bg-slate-50 hover:text-amber-500 active:scale-95"
          aria-label="Toggle Favorite"
        >
          <Heart className={`h-5 w-5 transition-all ${isFavorite ? "fill-amber-400 text-amber-500" : "text-slate-400"}`} />
        </button>
      </div>

      {profile.bio && <p className="mt-5 text-sm leading-6 text-slate-600">{profile.bio}</p>}

      {profile.skills && profile.skills.length > 0 && (
        <div className="mt-5 space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span key={skill.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {skill.skill_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.goals && profile.goals.length > 0 && (
        <div className="mt-5 space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Goals</h3>
          <div className="flex flex-wrap gap-2">
            {profile.goals.map((goal) => (
              <span key={goal.id} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {goal.goal_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.interests && profile.interests.length > 0 && (
        <div className="mt-5 space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span key={interest.id} className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                {interest.interest_name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={onSkip}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]"
        >
          Skip
        </button>
        <button
          onClick={onMessage}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-100 transition hover:bg-blue-700 active:scale-[0.98]"
        >
          Message
        </button>
      </div>
    </div>
  );
}