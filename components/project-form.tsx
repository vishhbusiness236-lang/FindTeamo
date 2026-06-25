"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Chip } from "./ui/chip";
import type { Project } from "@/lib/db-step3";

interface ProjectFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    projectType: "Startup" | "Hackathon" | "Open Source" | "Side Project";
    requiredSkills: string[];
    lookingForRoles: string[];
    maxMembers: number;
  }) => Promise<void>;
  initialData?: Partial<Project>;
  isLoading?: boolean;
}

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
  "Growth",
  "Data Science",
];

const ROLE_OPTIONS = [
  "Developer",
  "Designer",
  "Founder",
  "Product Manager",
  "Marketer",
  "Data Scientist",
  "Investor",
  "Advisor",
];

const PROJECT_TYPES: (
  | "Startup"
  | "Hackathon"
  | "Open Source"
  | "Side Project"
)[] = ["Startup", "Hackathon", "Open Source", "Side Project"];

export const ProjectForm: React.FC<ProjectFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [projectType, setProjectType] = useState<
    "Startup" | "Hackathon" | "Open Source" | "Side Project"
  >(initialData?.project_type || "Startup");
  const [requiredSkills, setRequiredSkills] = useState<string[]>(
    initialData?.required_skills || []
  );
  const [customSkill, setCustomSkill] = useState("");
  const [lookingForRoles, setLookingForRoles] = useState<string[]>(
    initialData?.looking_for_roles || []
  );
  const [maxMembers, setMaxMembers] = useState(
    initialData?.max_members || 4
  );
  const [error, setError] = useState("");

  const handleAddSkill = (skill: string) => {
    if (!requiredSkills.includes(skill) && skill.length > 0) {
      setRequiredSkills([...requiredSkills, skill]);
      setCustomSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const handleToggleRole = (role: string) => {
    if (lookingForRoles.includes(role)) {
      setLookingForRoles(lookingForRoles.filter((r) => r !== role));
    } else {
      setLookingForRoles([...lookingForRoles, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    if (maxMembers < 1) {
      setError("Must have at least 1 member slot");
      return;
    }

    if (lookingForRoles.length === 0) {
      setError("Select at least one role you're looking for");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        projectType,
        requiredSkills,
        lookingForRoles,
        maxMembers,
      });
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Project Type */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          Project Type
        </label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {PROJECT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setProjectType(type)}
              className={`p-3 rounded-lg border-2 transition ${
                projectType === type
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="text-sm font-semibold">{type}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <Input
        label="Project Title"
        placeholder="e.g., AI-Powered Task Manager"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        required
      />

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-slate-900 mb-2">
          Description
        </label>
        <textarea
          id="description"
          placeholder="What is this project about?"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          {description.length}/500 characters
        </p>
      </div>

      {/* Required Skills */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Required Skills
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Search skills..."
            value={customSkill}
            onChange={(e) => setCustomSkill(e.currentTarget.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleAddSkill(customSkill)}
          >
            Add
          </Button>
        </div>

        {/* Skill chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {requiredSkills.map((skill) => (
            <Chip
              key={skill}
              label={skill}
              onRemove={() => handleRemoveSkill(skill)}
              variant="primary"
            />
          ))}
        </div>

        {/* Suggested skills */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500">Suggested:</p>
          <div className="flex flex-wrap gap-1">
            {SKILL_OPTIONS.filter((s) => !requiredSkills.includes(s))
              .slice(0, 6)
              .map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleAddSkill(skill)}
                  className="px-2 py-1 rounded text-xs border border-slate-300 hover:bg-slate-50"
                >
                  + {skill}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Looking For Roles */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-3">
          We're Looking For
        </label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleToggleRole(role)}
              className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                lookingForRoles.includes(role)
                  ? "border-blue-600 bg-blue-50 text-blue-600"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Max Members */}
      <Input
        label="Team Size (max members)"
        type="number"
        min="1"
        max="50"
        value={maxMembers}
        onChange={(e) => setMaxMembers(parseInt(e.currentTarget.value) || 1)}
        required
      />

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={isLoading}
      >
        {initialData ? "Update Project" : "Create Project"}
      </Button>
    </form>
  );
};

export default ProjectForm;
