"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "@/components/onboarding-layout";
import { useAuth } from "@/lib/use-auth";
import { uploadAvatar, addSkill, addGoal, addInterest } from "@/lib/db";
import {
  OnboardingStep1,
  OnboardingStep2,
  OnboardingStep3,
  OnboardingStep4,
} from "@/components/onboarding-steps";

const STEPS = [
  { number: 1, title: "Let's start with you", description: "Add your name, photo, and a quick bio" },
  { number: 2, title: "What's your role?", description: "Pick your primary role and the skills you bring" },
  { number: 3, title: "What excites you?", description: "Select your goals and interests" },
  { number: 4, title: "Final details", description: "How experienced are you? How much time can you commit?" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    avatar_url: null as string | null,
    role: "",
    skills: [] as string[],
    goals: [] as string[],
    interests: [] as string[],
    experience_level: "Intermediate",
    availability_hours_per_week: 10,
    age: null as number | null,
  });

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      full_name: user.user_metadata?.full_name || prev.full_name,
      avatar_url: user.user_metadata?.avatar_url || prev.avatar_url,
    }));
  }, [user]);

  const handleAvatarUpload = async (file: File): Promise<string> => {
    if (!user) throw new Error("No user");
    const url = await uploadAvatar(user.id, file);
    if (!url) {
      setAvatarError("Failed to upload avatar");
      throw new Error("Upload failed");
    }
    setAvatarError(null);
    return url;
  };

  const handleNext = async () => {
    if (currentStep === 1 && !formData.full_name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (currentStep === 2 && !formData.role) {
      alert("Please select a role");
      return;
    }
    if (currentStep === 2 && formData.skills.length < 1) {
      alert("Please select at least one skill");
      return;
    }
    if (currentStep === 3 && formData.goals.length < 1) {
      alert("Please select at least one goal");
      return;
    }
    if (currentStep === 3 && formData.interests.length < 1) {
      alert("Please select at least one interest");
      return;
    }

    if (currentStep === STEPS.length) {
      await saveProfile();
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { supabase } = await import("@/lib/supabase");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
          experience_level: formData.experience_level.toLowerCase(),
          hours_per_week: formData.availability_hours_per_week,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error saving profile:", error.message, error.details, error.hint, error.code);
        alert(`Failed to save profile: ${error.message || "Unknown error"}`);
        return;
      }

      // Save skills, goals, interests into their own tables
      await Promise.all([
        ...formData.skills.map((skill) => addSkill(user.id, skill, "intermediate")),
        ...formData.goals.map((goal) => addGoal(user.id, goal)),
        ...formData.interests.map((interest) => addInterest(user.id, interest)),
      ]);

      router.push("/dashboard");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-slate-600">Loading...</div>
      </main>
    );
  }

  return (
    <OnboardingLayout
      steps={STEPS}
      currentStep={currentStep}
      onNext={handleNext}
      onPrev={handlePrev}
      isLoading={isSaving}
    >
      {currentStep === 1 && (
        <OnboardingStep1
          data={{
            full_name: formData.full_name,
            bio: formData.bio,
            avatar_url: formData.avatar_url,
          }}
          onChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
          onUploadAvatar={handleAvatarUpload}
        />
      )}
      {avatarError && (
        <p className="text-sm text-red-600 mt-2">{avatarError}</p>
      )}

      {currentStep === 2 && (
        <OnboardingStep2
          data={{
            role: formData.role,
            skills: formData.skills,
          }}
          onChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
        />
      )}

      {currentStep === 3 && (
        <OnboardingStep3
          data={{
            goals: formData.goals,
            interests: formData.interests,
          }}
          onChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
        />
      )}

      {currentStep === 4 && (
        <OnboardingStep4
          data={{
            experience_level: formData.experience_level,
            availability_hours_per_week: formData.availability_hours_per_week,
            age: formData.age,
          }}
          onChange={(data) => setFormData((prev) => ({ ...prev, ...data }))}
        />
      )}
    </OnboardingLayout>
  );
}