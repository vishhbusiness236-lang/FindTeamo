export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  experience_level: "beginner" | "intermediate" | "advanced" | null;
  hours_per_week: number | null;
  looking_for: string[] | null;
  created_at: string;
  updated_at: string;
  role?: string | null;
  location?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  profile_completeness?: number | null;
  blocked_users?: string[] | null;
  hackathon_ready?: boolean | null;
  hackathon_tags?: string[] | null;
  reputation_score?: number | null;
  is_hidden?: boolean | null;
};

export type Skill = {
  id: number;
  profile_id: string;
  skill_name: string;
  proficiency: "learning" | "intermediate" | "expert";
  created_at: string;
};

export type Interest = {
  id: number;
  profile_id: string;
  interest_name: string;
  created_at: string;
};

export type Goal = {
  id: number;
  profile_id: string;
  goal_name: string;
  created_at: string;
};

export type Connection = {
  id: number;
  from_user_id: string;
  to_user_id: string;
  status: "liked" | "matched" | "rejected";
  created_at: string;
};

export type ProfileWithDetails = Profile & {
  skills?: Skill[];
  interests?: Interest[];
  goals?: Goal[];
  matchScore?: number;
};

export type Favorite = {
  id: string;
  user_id: string;
  favorite_profile_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  read: boolean;
  created_at: string;
};
