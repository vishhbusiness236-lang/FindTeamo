-- FindTeamo Database Indexes
-- Run this in the Supabase SQL Editor to improve query performance

-- Index on profile_id foreign keys for batch lookups (skills, interests, goals)
CREATE INDEX IF NOT EXISTS idx_skills_profile_id ON skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_interests_profile_id ON interests(profile_id);
CREATE INDEX IF NOT EXISTS idx_goals_profile_id ON goals(profile_id);

-- Indexes for connection (match) queries
CREATE INDEX IF NOT EXISTS idx_connections_from_user_id ON connections(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_to_user_id ON connections(to_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

-- Composite index for the match lookup (who liked whom)
CREATE INDEX IF NOT EXISTS idx_connections_lookup ON connections(from_user_id, to_user_id, status);

-- Index on profiles for discovery queries
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
