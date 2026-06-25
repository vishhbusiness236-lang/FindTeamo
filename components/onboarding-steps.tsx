"use client";

import { useState } from "react";
import { Input, Avatar, Button, Chip } from "@/components/ui";
import { Upload } from "lucide-react";

interface OnboardingStep1Props {
  data: {
    full_name: string;
    bio: string;
    avatar_url: string | null;
  };
  onChange: (data: Partial<OnboardingStep1Props["data"]>) => void;
  onUploadAvatar?: (file: File) => Promise<string>;
}

export const OnboardingStep1: React.FC<OnboardingStep1Props> = ({
  data,
  onChange,
  onUploadAvatar,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadAvatar) return;

    setIsUploading(true);
    try {
      const url = await onUploadAvatar(file);
      onChange({ avatar_url: url });
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Upload */}
      <div>
        <label className="block mb-3 text-sm font-medium text-slate-900">
          Profile Picture
        </label>
        <div className="flex gap-6 items-start">
          <Avatar src={data.avatar_url} name={data.full_name} size="xl" />
          <div className="flex-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploading}
                className="hidden"
              />
              <button className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all px-4 py-2.5 text-base bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload className="h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload Photo"}
              </button>
            </label>
            <p className="mt-2 text-xs text-slate-600">JPG, PNG up to 5MB</p>
          </div>
        </div>
      </div>

      {/* Name */}
      <Input
        label="Full Name"
        placeholder="Your name"
        value={data.full_name}
        onChange={(e) => onChange({ full_name: e.target.value })}
        required
      />

      {/* Bio */}
      <div>
        <label className="block mb-2 text-sm font-medium text-slate-900">
          Bio <span className="text-slate-500 font-normal">(max 500 chars)</span>
        </label>
        <textarea
          placeholder="Tell us about yourself, what you're passionate about, and what you're looking to build..."
          value={data.bio}
          onChange={(e) => onChange({ bio: e.target.value.slice(0, 500) })}
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
        />
        <p className="mt-1 text-xs text-slate-600">
          {data.bio.length}/500 characters
        </p>
      </div>
    </div>
  );
};

interface OnboardingStep2Props {
  data: {
    role: string;
    skills: string[];
  };
  onChange: (data: Partial<OnboardingStep2Props["data"]>) => void;
}

const ROLE_OPTIONS = ["Developer", "Designer", "Founder", "Marketer", "Other"];
const SKILL_OPTIONS = [
  "React",
  "Node.js",
  "Python",
  "TypeScript",
  "UI/UX",
  "Figma",
  "Product",
  "Growth",
  "Sales",
  "Data",
  "DevOps",
  "Mobile",
  "Blockchain",
  "AI/ML",
];

export const OnboardingStep2: React.FC<OnboardingStep2Props> = ({ data, onChange }) => {
  const [customSkill, setCustomSkill] = useState("");

  const toggleSkill = (skill: string) => {
    const newSkills = data.skills.includes(skill)
      ? data.skills.filter((s) => s !== skill)
      : [...data.skills, skill];
    onChange({ skills: newSkills });
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !data.skills.includes(customSkill)) {
      onChange({ skills: [...data.skills, customSkill] });
      setCustomSkill("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <div>
        <label className="block mb-3 text-sm font-medium text-slate-900">
          Primary Role <span className="text-red-600">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role}
              onClick={() => onChange({ role })}
              className={`rounded-lg border-2 px-4 py-3 font-medium transition-all ${
                data.role === role
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Selection */}
      <div>
        <label className="block mb-3 text-sm font-medium text-slate-900">
          Skills <span className="text-slate-600 font-normal">(pick 3-5)</span>
        </label>
        <div className="mb-4 flex flex-wrap gap-2">
          {data.skills.map((skill) => (
            <Chip
              key={skill}
              label={skill}
              variant="primary"
              onRemove={() => toggleSkill(skill)}
            />
          ))}
        </div>

        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Add a custom skill"
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addCustomSkill()}
          />
          <Button variant="secondary" onClick={addCustomSkill}>
            Add
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SKILL_OPTIONS.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                data.skills.includes(skill)
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface OnboardingStep3Props {
  data: {
    goals: string[];
    interests: string[];
  };
  onChange: (data: Partial<OnboardingStep3Props["data"]>) => void;
}

const GOAL_OPTIONS = ["Startup", "Hackathon", "SaaS", "Open Source", "Side Project"];
const INTEREST_OPTIONS = [
  "AI/ML",
  "Web3",
  "Climate Tech",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Gaming",
  "SocialMedia",
  "E-commerce",
  "DevTools",
];

export const OnboardingStep3: React.FC<OnboardingStep3Props> = ({ data, onChange }) => {
  const toggleGoal = (goal: string) => {
    const newGoals = data.goals.includes(goal)
      ? data.goals.filter((g) => g !== goal)
      : [...data.goals, goal];
    onChange({ goals: newGoals });
  };

  const toggleInterest = (interest: string) => {
    const newInterests = data.interests.includes(interest)
      ? data.interests.filter((i) => i !== interest)
      : [...data.interests, interest];
    onChange({ interests: newInterests });
  };

  return (
    <div className="space-y-8">
      {/* Goals */}
      <div>
        <label className="block mb-3 text-sm font-medium text-slate-900">
          What are you looking to build? <span className="text-slate-600 font-normal">(pick 1+)</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {data.goals.map((goal) => (
            <Chip
              key={goal}
              label={goal}
              variant="primary"
              onRemove={() => toggleGoal(goal)}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GOAL_OPTIONS.map((goal) => (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                data.goals.includes(goal)
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block mb-3 text-sm font-medium text-slate-900">
          Industries & Technologies <span className="text-slate-600 font-normal">(pick 2+)</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {data.interests.map((interest) => (
            <Chip
              key={interest}
              label={interest}
              variant="primary"
              onRemove={() => toggleInterest(interest)}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {INTEREST_OPTIONS.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                data.interests.includes(interest)
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface OnboardingStep4Props {
  data: {
    experience_level: string;
    availability_hours_per_week: number;
    age: number | null;
  };
  onChange: (data: Partial<OnboardingStep4Props["data"]>) => void;
}

export const OnboardingStep4: React.FC<OnboardingStep4Props> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Experience Level */}
      <div>
        <label className="block mb-3 text-sm font-medium text-slate-900">
          Experience Level <span className="text-red-600">*</span>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["Beginner", "Intermediate", "Advanced"].map((level) => (
            <button
              key={level}
              onClick={() => onChange({ experience_level: level })}
              className={`rounded-lg border-2 px-4 py-4 font-medium transition-all text-center ${
                data.experience_level === level
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Availability Slider */}
      <div>
        <label className="block mb-3 text-sm font-medium text-slate-900">
          Weekly Availability <span className="text-red-600">*</span>
        </label>
        <div className="space-y-4">
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="40"
              value={data.availability_hours_per_week}
              onChange={(e) =>
                onChange({ availability_hours_per_week: parseInt(e.target.value) })
              }
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">1 hour</span>
              <span className="font-semibold text-blue-600">
                {data.availability_hours_per_week} hours/week
              </span>
              <span className="text-slate-600">40 hours</span>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            {data.availability_hours_per_week <= 10 && "Side project energy"}
            {data.availability_hours_per_week > 10 && data.availability_hours_per_week <= 20 && "Part-time commitment"}
            {data.availability_hours_per_week > 20 && "Full-time commitment"}
          </p>
        </div>
      </div>

      {/* Age */}
      <div>
        <label className="block mb-3 text-sm font-medium text-slate-900">
          Age <span className="text-slate-600 font-normal">(optional)</span>
        </label>
        <div className="space-y-2">
          <input
            type="number"
            min="13"
            max="120"
            value={data.age || ""}
            onChange={(e) =>
              onChange({ age: e.target.value ? parseInt(e.target.value) : null })
            }
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Your age"
          />
          <p className="text-xs text-slate-600">Help us match you with age-compatible teammates</p>
        </div>
      </div>
    </div>
  );
};
