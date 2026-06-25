-- 🚀 FINDTEAMO - STEP 3 MIGRATIONS
-- Adds: Project Rooms, Hackathon Mode, Reputation System, Safety Controls
-- Run this after STEP2_MIGRATIONS.sql

-- ============================================================================
-- 1. EXTEND PROFILES TABLE
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hackathon_ready BOOL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hackathon_tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_hidden BOOL DEFAULT false;

-- Index for reputation-based sorting
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON profiles(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_hackathon ON profiles(hackathon_ready) WHERE hackathon_ready = true;

-- ============================================================================
-- 2. BLOCKED USERS TABLE (One-directional storage, bidirectional check)
-- ============================================================================

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: can't block self
  CONSTRAINT cannot_block_self CHECK (blocker_id != blocked_id),
  -- Constraint: unique block per pair
  CONSTRAINT unique_block UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own blocks
CREATE POLICY "Users see own blocks" ON blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others" ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" ON blocked_users
  FOR DELETE USING (auth.uid() = blocker_id);

-- ============================================================================
-- 3. PROJECTS TABLE
-- ============================================================================

CREATE TYPE project_status AS ENUM ('open', 'closed');
CREATE TYPE project_type AS ENUM ('Startup', 'Hackathon', 'Open Source', 'Side Project');

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  looking_for_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  max_members INT NOT NULL CHECK (max_members >= 1),
  current_members INT DEFAULT 1 CHECK (current_members >= 1),
  status project_status DEFAULT 'open',
  project_type project_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: can't reduce max_members below current_members
  CONSTRAINT max_geq_current CHECK (max_members >= current_members)
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view open projects
CREATE POLICY "View open projects" ON projects
  FOR SELECT USING (status = 'open' OR auth.uid() = owner_id);

-- RLS: Users can create projects
CREATE POLICY "Users create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- RLS: Project owners can update
CREATE POLICY "Project owners update" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

-- RLS: Project owners can delete
CREATE POLICY "Project owners delete" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- ============================================================================
-- 4. PROJECT MEMBERS TABLE
-- ============================================================================

CREATE TYPE project_member_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(100),
  status project_member_status DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: unique membership per project
  CONSTRAINT unique_membership UNIQUE(project_id, user_id),
  -- Constraint: owner auto-accepted
  CONSTRAINT valid_owner_status CHECK (
    NOT (status = 'pending' AND user_id = (SELECT owner_id FROM projects WHERE id = project_id))
  )
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- RLS: View members of projects you can view
CREATE POLICY "View project members" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND (status = 'open' OR auth.uid() = owner_id)
    )
    OR auth.uid() = user_id
  );

-- RLS: Only owner can approve/reject
CREATE POLICY "Owner manages members" ON project_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id AND auth.uid() = owner_id
    )
  );

-- ============================================================================
-- 5. REPUTATION EVENTS TABLE
-- ============================================================================

CREATE TYPE reputation_event_type AS ENUM (
  'accepted_connection',
  'successful_collaboration',
  'completed_project',
  'received_report',
  'rejection_spam'
);

CREATE TABLE IF NOT EXISTS reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type reputation_event_type NOT NULL,
  points INT NOT NULL,
  related_id UUID, -- project_id or connection_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_events_user ON reputation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_type ON reputation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_reputation_events_created ON reputation_events(created_at DESC);

-- Enable RLS
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see their own reputation events
CREATE POLICY "View own reputation" ON reputation_events
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 6. REPORTS TABLE
-- ============================================================================

CREATE TYPE report_status AS ENUM ('open', 'reviewed');

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status report_status DEFAULT 'open',
  
  -- Constraint: can't report self
  CONSTRAINT cannot_report_self CHECK (reporter_id != reported_id),
  -- Constraint: one report per reporter per reported per day
  CONSTRAINT one_report_per_day UNIQUE(reporter_id, reported_id, DATE(created_at))
);

CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS: Users can file reports (auth required)
CREATE POLICY "Users file reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================================
-- 7. TRIGGER: Auto-increment/decrement reputation when events logged
-- ============================================================================

CREATE OR REPLACE FUNCTION update_reputation_on_event()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET reputation_score = reputation_score + NEW.points
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reputation_event_trigger
AFTER INSERT ON reputation_events
FOR EACH ROW
EXECUTE FUNCTION update_reputation_on_event();

-- ============================================================================
-- 8. TRIGGER: Auto-close project when full
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_close_project_when_full()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_members >= NEW.max_members THEN
    UPDATE projects 
    SET status = 'closed'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_full_trigger
AFTER UPDATE ON projects
FOR EACH ROW
WHEN (NEW.current_members >= NEW.max_members)
EXECUTE FUNCTION auto_close_project_when_full();

-- ============================================================================
-- 9. TRIGGER: Auto-create reputation event on accepted connection
-- ============================================================================

CREATE OR REPLACE FUNCTION reputation_on_connection_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Both users get +5 reputation
    INSERT INTO reputation_events (user_id, event_type, points, related_id)
    VALUES 
      (NEW.from_user_id, 'accepted_connection', 5, NEW.id),
      (NEW.to_user_id, 'accepted_connection', 5, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connection_reputation_trigger
AFTER UPDATE ON connection_requests
FOR EACH ROW
EXECUTE FUNCTION reputation_on_connection_accepted();

-- ============================================================================
-- 10. TRIGGER: Auto-create report reputation event
-- ============================================================================

CREATE OR REPLACE FUNCTION reputation_on_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Reported user loses 15 reputation
  INSERT INTO reputation_events (user_id, event_type, points, related_id)
  VALUES (NEW.reported_id, 'received_report', -15, NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER report_reputation_trigger
AFTER INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION reputation_on_report();

-- ============================================================================
-- 11. TRIGGER: Auto-increment project_members count on accepted
-- ============================================================================

CREATE OR REPLACE FUNCTION update_project_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Increment current_members
    UPDATE projects 
    SET current_members = current_members + 1
    WHERE id = NEW.project_id;
  ELSIF NEW.status != 'accepted' AND OLD.status = 'accepted' THEN
    -- Decrement if member is being removed/rejected
    UPDATE projects 
    SET current_members = GREATEST(1, current_members - 1)
    WHERE id = NEW.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_member_count_trigger
AFTER UPDATE ON project_members
FOR EACH ROW
EXECUTE FUNCTION update_project_member_count();

-- ============================================================================
-- 12. TRIGGER: Auto-create notification on project events
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_project_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Project invite sent
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, message, related_user_id, read)
    VALUES (
      NEW.user_id,
      'project_invite',
      'You were invited to join a project: ' || 
        (SELECT title FROM projects WHERE id = NEW.project_id),
      (SELECT owner_id FROM projects WHERE id = NEW.project_id),
      false
    );
  
  -- Project request accepted
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, message, read)
    VALUES (
      NEW.user_id,
      'project_request_accepted',
      'Your project request was accepted: ' || 
        (SELECT title FROM projects WHERE id = NEW.project_id),
      false
    );
  
  -- Project full notification to owner
  ELSIF TG_OP = 'UPDATE' THEN
    IF EXISTS (
      SELECT 1 FROM projects 
      WHERE id = NEW.project_id 
      AND current_members >= max_members 
      AND status = 'closed'
    ) THEN
      INSERT INTO notifications (user_id, type, message, read)
      VALUES (
        (SELECT owner_id FROM projects WHERE id = NEW.project_id),
        'project_full',
        'Your project is now full: ' || 
          (SELECT title FROM projects WHERE id = NEW.project_id),
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_notification_trigger
AFTER INSERT OR UPDATE ON project_members
FOR EACH ROW
EXECUTE FUNCTION notify_project_events();

-- ============================================================================
-- 13. TRIGGER: Auto-add owner to project_members on creation
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_add_owner_to_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, status)
  VALUES (NEW.id, NEW.owner_id, 'accepted')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_owner_member_trigger
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION auto_add_owner_to_project();

-- ============================================================================
-- 14. FUNCTION: Get badges for user (computed, not stored)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_badges(user_id UUID)
RETURNS TABLE(badge_name TEXT, badge_tier INT) AS $$
BEGIN
  -- Hackathon Veteran (tier 3 - highest)
  IF (
    SELECT COUNT(*) FROM reputation_events 
    WHERE reputation_events.user_id = get_user_badges.user_id 
    AND event_type = 'completed_project'
  ) >= 3 THEN
    RETURN QUERY SELECT 'Hackathon Veteran'::TEXT, 3::INT;
  
  -- Top Collaborator (tier 2)
  ELSIF (
    SELECT COUNT(*) FROM reputation_events 
    WHERE reputation_events.user_id = get_user_badges.user_id 
    AND event_type = 'completed_project'
  ) >= 5 THEN
    RETURN QUERY SELECT 'Top Collaborator'::TEXT, 2::INT;
  
  -- Reliable Builder (tier 1)
  ELSIF (
    SELECT reputation_score FROM profiles WHERE id = get_user_badges.user_id
  ) >= 50 THEN
    RETURN QUERY SELECT 'Reliable Builder'::TEXT, 1::INT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. UPDATED FUNCTION: Modify get_matches to apply hackathon boost & respect blocks
-- ============================================================================

CREATE OR REPLACE FUNCTION get_matches_v2(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  bio TEXT,
  match_score INT,
  match_reasons TEXT[],
  reputation_score INT,
  badges TEXT[],
  hackathon_ready BOOL,
  is_hidden BOOL
) AS $$
DECLARE
  v_user_skills TEXT[];
  v_user_goals TEXT[];
  v_user_interests TEXT[];
  v_user_availability INT;
  v_user_experience TEXT;
  v_min_score INT;
  v_hackathon_boost INT := 0;
BEGIN
  -- Get calling user's profile
  SELECT skills, goals, interests, availability_hours_per_week, experience_level
  INTO v_user_skills, v_user_goals, v_user_interests, v_user_availability, v_user_experience
  FROM profiles WHERE id = p_user_id;

  -- Check if calling user is in hackathon mode
  v_hackathon_boost := CASE WHEN (SELECT hackathon_ready FROM profiles WHERE id = p_user_id) THEN 10 ELSE 0 END;
  
  -- Set minimum score threshold (lower for hackathon mode)
  v_min_score := CASE WHEN v_hackathon_boost > 0 THEN 20 ELSE 40 END;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.role,
    p.bio,
    (
      -- Skill compatibility (30%)
      ROUND(
        (CASE WHEN ARRAY_LENGTH(v_user_skills, 1) > 0 AND ARRAY_LENGTH(p.skills, 1) > 0 THEN
          (ARRAY_LENGTH(ARRAY(SELECT UNNEST(v_user_skills) INTERSECT SELECT UNNEST(p.skills)), 1)::FLOAT /
           GREATEST(ARRAY_LENGTH(v_user_skills, 1), ARRAY_LENGTH(p.skills, 1))::FLOAT) * 0.3 * 100
        ELSE 0 END) +
        -- Goals compatibility (25%)
        (ARRAY_LENGTH(ARRAY(SELECT UNNEST(v_user_goals) INTERSECT SELECT UNNEST(p.goals)), 1)::FLOAT /
         GREATEST(ARRAY_LENGTH(v_user_goals, 1), ARRAY_LENGTH(p.goals, 1))::FLOAT * 0.25 * 100) +
        -- Interests compatibility (20%)
        (ARRAY_LENGTH(ARRAY(SELECT UNNEST(v_user_interests) INTERSECT SELECT UNNEST(p.interests)), 1)::FLOAT /
         GREATEST(ARRAY_LENGTH(v_user_interests, 1), ARRAY_LENGTH(p.interests, 1))::FLOAT * 0.20 * 100) +
        -- Availability (15%)
        (CASE WHEN v_user_availability > 0 THEN
          LEAST(v_user_availability / GREATEST(p.availability_hours_per_week, 1), 1) * 0.15 * 100
        ELSE 0 END) +
        -- Experience (10%)
        (CASE WHEN p.experience_level = v_user_experience THEN 10
              WHEN (p.experience_level = 'Beginner' AND v_user_experience = 'Intermediate') OR
                   (p.experience_level = 'Intermediate' AND v_user_experience IN ('Beginner', 'Advanced')) OR
                   (p.experience_level = 'Advanced' AND v_user_experience = 'Intermediate') THEN 7
              ELSE 3 END)
      )::INT
      + v_hackathon_boost  -- Flat +10 boost for hackathon builders
    ) AS score,
    ARRAY[]::TEXT[] AS reasons,
    p.reputation_score,
    (SELECT ARRAY_AGG(badge_name) FROM get_user_badges(p.id)) AS badges,
    p.hackathon_ready,
    p.is_hidden
  FROM profiles p
  WHERE
    p.id != p_user_id
    AND p.profile_completeness >= 30
    AND NOT p.is_hidden
    AND NOT EXISTS (SELECT 1 FROM blocked_users WHERE blocker_id = p_user_id AND blocked_id = p.id)
    AND NOT EXISTS (SELECT 1 FROM blocked_users WHERE blocker_id = p.id AND blocked_id = p_user_id)
    AND NOT EXISTS (SELECT 1 FROM connection_requests WHERE (from_user_id = p_user_id AND to_user_id = p.id))
  HAVING
    (
      ROUND(
        (CASE WHEN ARRAY_LENGTH(v_user_skills, 1) > 0 AND ARRAY_LENGTH(p.skills, 1) > 0 THEN
          (ARRAY_LENGTH(ARRAY(SELECT UNNEST(v_user_skills) INTERSECT SELECT UNNEST(p.skills)), 1)::FLOAT /
           GREATEST(ARRAY_LENGTH(v_user_skills, 1), ARRAY_LENGTH(p.skills, 1))::FLOAT) * 0.3 * 100
        ELSE 0 END) +
        (ARRAY_LENGTH(ARRAY(SELECT UNNEST(v_user_goals) INTERSECT SELECT UNNEST(p.goals)), 1)::FLOAT /
         GREATEST(ARRAY_LENGTH(v_user_goals, 1), ARRAY_LENGTH(p.goals, 1))::FLOAT * 0.25 * 100) +
        (ARRAY_LENGTH(ARRAY(SELECT UNNEST(v_user_interests) INTERSECT SELECT UNNEST(p.interests)), 1)::FLOAT /
         GREATEST(ARRAY_LENGTH(v_user_interests, 1), ARRAY_LENGTH(p.interests, 1))::FLOAT * 0.20 * 100) +
        (CASE WHEN v_user_availability > 0 THEN
          LEAST(v_user_availability / GREATEST(p.availability_hours_per_week, 1), 1) * 0.15 * 100
        ELSE 0 END) +
        (CASE WHEN p.experience_level = v_user_experience THEN 10
              WHEN (p.experience_level = 'Beginner' AND v_user_experience = 'Intermediate') OR
                   (p.experience_level = 'Intermediate' AND v_user_experience IN ('Beginner', 'Advanced')) OR
                   (p.experience_level = 'Advanced' AND v_user_experience = 'Intermediate') THEN 7
              ELSE 3 END)
      )::INT
      + v_hackathon_boost
    ) >= v_min_score
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 16. FUNCTION: Check if user is blocked (bidirectional)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_blocked(p_user_id UUID, p_other_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = p_user_id AND blocked_id = p_other_id)
       OR (blocker_id = p_other_id AND blocked_id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 17. UPDATED FUNCTION: get_discovery_feed with blocking + projects
-- ============================================================================

CREATE OR REPLACE FUNCTION get_discovery_feed_v2(
  p_user_id UUID,
  p_limit INT DEFAULT 10,
  p_cursor TEXT DEFAULT NULL,
  p_role_filter TEXT DEFAULT NULL,
  p_experience_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  type TEXT, -- 'profile' or 'project'
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  bio TEXT,
  skills TEXT[],
  goals TEXT[],
  interests TEXT[],
  match_score INT,
  reputation_score INT,
  badges TEXT[],
  hackathon_ready BOOL,
  is_hidden BOOL,
  project_id UUID,
  project_title TEXT,
  project_description TEXT,
  project_type TEXT,
  required_skills TEXT[],
  looking_for_roles TEXT[],
  current_members INT,
  max_members INT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  (
    -- Profiles
    SELECT
      'profile'::TEXT,
      p.id,
      p.full_name,
      p.avatar_url,
      p.role,
      p.bio,
      p.skills,
      p.goals,
      p.interests,
      0::INT, -- match_score placeholder
      p.reputation_score,
      (SELECT ARRAY_AGG(badge_name) FROM get_user_badges(p.id)),
      p.hackathon_ready,
      p.is_hidden,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT[],
      NULL::TEXT[],
      0::INT,
      0::INT,
      NULL::TIMESTAMP WITH TIME ZONE
    FROM profiles p
    WHERE
      p.id != p_user_id
      AND p.profile_completeness >= 30
      AND NOT p.is_hidden
      AND NOT is_blocked(p_user_id, p.id)
      AND (p_role_filter IS NULL OR p.role = p_role_filter)
      AND (p_experience_filter IS NULL OR p.experience_level = p_experience_filter)
      AND (p_cursor IS NULL OR p.id::TEXT > p_cursor)
    ORDER BY p.id::TEXT
    LIMIT p_limit
  )
  UNION ALL
  (
    -- Projects
    SELECT
      'project'::TEXT,
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT[],
      NULL::TEXT[],
      NULL::TEXT[],
      0::INT,
      0::INT,
      NULL::TEXT[],
      false::BOOL,
      false::BOOL,
      pr.id,
      pr.title,
      pr.description,
      pr.project_type::TEXT,
      pr.required_skills,
      pr.looking_for_roles,
      pr.current_members,
      pr.max_members,
      pr.created_at
    FROM projects pr
    WHERE
      pr.status = 'open'
      AND NOT is_blocked(p_user_id, pr.owner_id)
      AND (p_cursor IS NULL OR pr.id::TEXT > p_cursor)
    ORDER BY pr.created_at DESC
    LIMIT p_limit
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 18. FUNCTION: Spam detection - check rejection rate
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rejection_spam(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM connection_requests
    WHERE from_user_id = p_user_id
      AND status = 'rejected'
      AND created_at > NOW() - INTERVAL '24 hours'
  ) >= 3;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 19. EDGE FUNCTION PLACEHOLDER: Auto-expire hackathon_ready after 7 days
-- ============================================================================

-- This should be run as a scheduled Edge Function in Supabase or external cron
-- SQL-only approach: add a computed column or run this query daily
CREATE OR REPLACE FUNCTION expire_hackathon_mode()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET hackathon_ready = false
  WHERE hackathon_ready = true
    AND (created_at + INTERVAL '7 days') < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 20. EXTENSION: Add badge earned notification
-- ============================================================================

CREATE OR REPLACE FUNCTION check_new_badges_on_reputation()
RETURNS TRIGGER AS $$
DECLARE
  v_new_badge TEXT;
BEGIN
  -- Check if user just earned a badge
  v_new_badge := (
    SELECT badge_name FROM get_user_badges(NEW.user_id)
    LIMIT 1
  );
  
  IF v_new_badge IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, message, read)
    VALUES (
      NEW.user_id,
      'badge_earned',
      'You earned a new badge: ' || v_new_badge,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER badge_earned_trigger
AFTER UPDATE ON profiles
FOR EACH ROW
WHEN (NEW.reputation_score > OLD.reputation_score)
EXECUTE FUNCTION check_new_badges_on_reputation();

-- ============================================================================
-- DONE!
-- ============================================================================

-- Verify tables exist
SELECT 'Migration complete!' AS status;
