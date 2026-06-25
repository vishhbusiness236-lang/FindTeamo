"use client";

import { useState } from "react";
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
  isFavoriteInitial = false 
}: ProfileCardProps) {
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);

  const handleFavoriteClick = () => {
    setIsFavorite(!isFavorite);
    onToggleFavorite?.();
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden p-6 space-y-6 relative">
      
      {/* Top Section: Circular Avatar, Name & Favorite Star Icon */}
      <div className="flex items-center justify-between border-b border-slate-50 pb-4">
        <div className="flex items-center space-x-4">
          {/* Circular Profile Image */}
          <div className="w-16 h-16 rounded-full bg-purple-600 text-white font-bold text-xl flex items-center justify-center overflow-hidden shadow-inner border border-slate-100 flex-shrink-0">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || profile.username} 
                className="w-full h-full object-cover"
              />
            ) : (
              (profile.full_name || profile.username || "U").substring(0, 2).toUpperCase()
            )}
          </div>
          
          {/* Name & Match Percentage */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 capitalize leading-tight">
              {profile.full_name || profile.username || "User"}
            </h2>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
              {profile.matchScore ?? 0}% Match
            </span>
          </div>
        </div>

        {/* Favorite Star Button - Near Image/Name (Top Right) */}
        <button 
          onClick={handleFavoriteClick}
          className="p-2 rounded-full hover:bg-slate-50 transition active:scale-95 group"
          aria-label="Toggle Favorite"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill={isFavorite ? "#eab308" : "none"} 
            stroke={isFavorite ? "#eab308" : "#94a3b8"} 
            strokeWidth="2" 
            className="w-7 h-7 transition-colors group-hover:stroke-yellow-500"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.151-.326.621-.326.772 0l2.034 4.397 4.72.49c.358.037.502.483.232.727l-3.528 3.197.97 4.646c.074.354-.314.636-.622.454l-4.14-2.42-4.14 2.42c-.308.182-.696-.1-.621-.454l.97-4.646-3.528-3.197c-.27-.244-.126-.69.232-.727l4.72-.49 2.034-4.397z" />
          </svg>
        </button>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-slate-600 leading-relaxed">
          {profile.bio}
        </p>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <span key={skill.id} className="px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                {skill.skill_name} <span className="text-slate-400 font-normal text-[10px]">({skill.proficiency})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {profile.goals && profile.goals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Goals</h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.goals.map((goal) => (
              <span key={goal.id} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                {goal.goal_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Interests</h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.map((interest) => (
              <span key={interest.id} className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                {interest.interest_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions: Exactly 2 Buttons (Skip and Message) */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <button
          onClick={onSkip}
          className="w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition active:scale-[0.98]"
        >
          Skip
        </button>
        <button
          onClick={onMessage}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition shadow-md shadow-blue-100 active:scale-[0.98]"
        >
          Message
        </button>
      </div>

    </div>
  );
}