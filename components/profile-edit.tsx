"use client";

import { useState } from "react";
import { updateProfile, addSkill, addGoal, addInterest, deleteSkill, deleteGoal, deleteInterest } from "@/lib/db";
import type { Profile, Skill, Goal, Interest } from "@/lib/types";

const SKILL_OPTIONS = [
  "Frontend",
  "Backend",
  "Full Stack",
  "Mobile",
  "DevOps",
  "AI/ML",
  "Design",
  "Product",
  "Marketing",
  "Sales",
];

const GOAL_OPTIONS = ["Startup", "Hackathon", "SaaS", "Open Source", "Side Project"];

const INTEREST_OPTIONS = [
  "AI/ML",
  "Web3",
  "Apps",
  "Games",
  "Social",
  "Fintech",
  "Healthcare",
  "Climate Tech",
  "Education",
  "E-commerce",
];

type ProfileEditProps = {
  profile: Profile;
  skills: Skill[];
  goals: Goal[];
  interests: Interest[];
  onSave?: () => void;
};

type FormData = {
  full_name: string;
  bio: string;
  experience_level: "beginner" | "intermediate" | "advanced";
  hours_per_week: number;
};

export function ProfileEdit({ profile, skills, goals, interests, onSave }: ProfileEditProps) {
  const [formData, setFormData] = useState<FormData>({
    full_name: profile.full_name || "",
    bio: profile.bio || "",
    experience_level: (profile.experience_level as "beginner" | "intermediate" | "advanced") || "beginner",
    hours_per_week: profile.hours_per_week || 10,
  });

  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(skills);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>(goals);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>(interests);

  const [newSkill, setNewSkill] = useState<{ name: string; proficiency: "learning" | "intermediate" | "expert" }>({ 
    name: "", 
    proficiency: "intermediate" 
  });
  const [newGoal, setNewGoal] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "hours_per_week" ? parseInt(value) || 0 : value,
    }));
  };
    
  const handleAddSkill = async () => {
    if (!newSkill.name) return;

    const skill = await addSkill(profile.id, newSkill.name, newSkill.proficiency);
    if (skill) {
      setSelectedSkills([...selectedSkills, skill]);
      setNewSkill({ name: "", proficiency: "intermediate" });
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    if (await deleteSkill(skillId)) {
      setSelectedSkills(selectedSkills.filter((s) => s.id !== skillId));
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal) return;
    
    const goal = await addGoal(profile.id, newGoal);
    if (goal) {
      setSelectedGoals([...selectedGoals, goal]);
      setNewGoal("");
    }
  };

  const handleRemoveGoal = async (goalId: number) => {
    if (await deleteGoal(goalId)) {
      setSelectedGoals(selectedGoals.filter((g) => g.id !== goalId));
    }
  };

  const handleAddInterest = async () => {
    if (!newInterest) return;
    
    const interest = await addInterest(profile.id, newInterest);
    if (interest) {
      setSelectedInterests([...selectedInterests, interest]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = async (interestId: number) => {
    if (await deleteInterest(interestId)) {
      setSelectedInterests(selectedInterests.filter((i) => i.id !== interestId));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // age parameter ko bina touch kiye db call ho raha hai, zero TypeScript mismatch
      await updateProfile(profile.id, {
        full_name: formData.full_name,
        bio: formData.bio,
        experience_level: formData.experience_level,
        hours_per_week: formData.hours_per_week,
      });

      setMessage({ type: "success", text: "Profile saved successfully!" });
      onSave?.();
    } catch {
      setMessage({ type: "error", text: "Failed to save profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-8">
      {message && (
        <div className={`rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">About You</h2>
        
        <div>
          <label className="block text-sm font-medium text-slate-700">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Tell us about yourself, your interests, and what you're looking for..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Experience Level</label>
            <select
              name="experience_level"
              value={formData.experience_level}
              onChange={handleInputChange}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Hours per Week</label>
            <input
              type="number"
              name="hours_per_week"
              value={formData.hours_per_week}
              onChange={handleInputChange}
              min="1"
              max="168"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">Skills</h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            placeholder="Skill name"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            list="skill-options"
          />
          <datalist id="skill-options">
            {SKILL_OPTIONS.map((skill) => (
              <option key={skill} value={skill} />
            ))}
          </datalist>
          
          <select
            value={newSkill.proficiency}
            onChange={(e) => setNewSkill({ ...newSkill, proficiency: e.target.value as "learning" | "intermediate" | "expert" })}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="learning">Learning</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert</option>
          </select>

          <button
            onClick={handleAddSkill}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <div
              key={skill.id}
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-900"
            >
              <span>
                {skill.skill_name} <span className="text-xs opacity-75">({skill.proficiency})</span>
              </span>
              <button
                onClick={() => handleRemoveSkill(skill.id)}
                className="hover:opacity-75"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">Goals</h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Add a goal"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            list="goal-options"
          />
          <datalist id="goal-options">
            {GOAL_OPTIONS.map((goal) => (
              <option key={goal} value={goal} />
            ))}
          </datalist>
          
          <button
            onClick={handleAddGoal}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedGoals.map((goal) => (
            <div
              key={goal.id}
              className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-900"
            >
              <span>{goal.goal_name}</span>
              <button
                onClick={() => handleRemoveGoal(goal.id)}
                className="hover:opacity-75"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-950">Interests</h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            placeholder="Add an interest"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            list="interest-options"
          />
          <datalist id="interest-options">
            {INTEREST_OPTIONS.map((interest) => (
              <option key={interest} value={interest} />
            ))}
          </datalist>
          
          <button
            onClick={handleAddInterest}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedInterests.map((interest) => (
            <div
              key={interest.id}
              className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-900"
            >
              <span>{interest.interest_name}</span>
              <button
                onClick={() => handleRemoveInterest(interest.id)}
                className="hover:opacity-75"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}