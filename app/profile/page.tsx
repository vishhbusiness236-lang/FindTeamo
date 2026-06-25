"use client";

import { useEffect, useState, useRef } from "react";
import { getProfileWithDetails, createProfile, uploadAvatar } from "@/lib/db";
import { ProfileEdit } from "@/components/profile-edit";
import { useAuth } from "@/lib/use-auth";
import type { Profile, Skill, Goal, Interest } from "@/lib/types";
import { ProfileCardSkeleton } from "@/components/ui/skeleton";
import Image from "next/image";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initProfile = async () => {
      if (!user) return;

      try {
        setError(null);
        const existingProfile = await getProfileWithDetails(user.id);

        if (existingProfile) {
          setProfile(existingProfile);
          setSkills(existingProfile.skills || []);
          setGoals(existingProfile.goals || []);
          setInterests(existingProfile.interests || []);
        } else {
          const newProfile = await createProfile(user.id, {
            username: user.email?.split("@")[0] || "user" + Math.random().toString(36).substr(2, 9),
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            bio: null,
            experience_level: null,
            hours_per_week: null,
            looking_for: null,
            age: null,
          });

          if (newProfile) {
            setProfile(newProfile);
            setIsNewProfile(true);
          }
        }
      } catch {
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initProfile();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setAvatarError("File size must be less than 5MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarError(null);
  };

  const handleAvatarUpload = async () => {
    if (!user || !avatarFile) return;

    setUploadingAvatar(true);
    setAvatarError(null);

    try {
      const publicUrl = await uploadAvatar(user.id, avatarFile);
      if (publicUrl) {
        setAvatarPreview(publicUrl);
        setAvatarFile(null);
        setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));
      } else {
        setAvatarError("Failed to upload avatar. Please try again.");
      }
    } catch {
      setAvatarError("An error occurred. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveAndContinue = () => {
    if (isNewProfile) {
      window.location.href = "/discover";
    }
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

  if (!profile && !loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-950">Error loading profile</h1>
          <p className="mt-2 text-slate-600">{error || "Please try again."}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  const avatarSrc = avatarPreview || profile.avatar_url;

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">
            {isNewProfile ? "Create Your Profile" : "Edit Your Profile"}
          </h1>
          <p className="mt-2 text-slate-600">
            {isNewProfile
              ? "Help us learn more about you so we can match you with the perfect teammates."
              : "Update your profile to find better matches."}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Avatar Upload Section */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-3">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              {avatarSrc ? (
               <Image src={avatarSrc} alt="Avatar" fill sizes="96px" className="object-cover rounded-full" />
              ) : (
                <span className="text-2xl font-semibold text-slate-600">
                  {profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "👤"}
                </span>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 rounded-full bg-blue-600 text-white p-2 hover:bg-blue-700 disabled:opacity-50"
              title="Change avatar"
            >
              {uploadingAvatar ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          </div>
          {avatarError && <p className="text-sm text-red-600 mb-2">{avatarError}</p>}
          {avatarFile && !uploadingAvatar && (
            <button
              onClick={handleAvatarUpload}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Upload Avatar
            </button>
          )}
          <p className="mt-2 text-xs text-slate-500">Click the plus button to change your avatar (max 5MB)</p>
        </div>

        <ProfileEdit
          profile={profile}
          skills={skills}
          goals={goals}
          interests={interests}
          onSave={handleSaveAndContinue}
        />

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back
          </button>
          <button
            onClick={() => (window.location.href = "/discover")}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            {isNewProfile ? "Skip to Discover" : "Go to Discover"}
          </button>
        </div>
      </div>
    </main>
  );
}