-- ============================================
-- FINDTEAMO STEP 2 - MIGRATIONS
-- Run these after SETUP.md migrations
-- ============================================

-- ============================================
-- 1. EXTEND PROFILES TABLE
-- ============================================

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS x_url VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS looking_for TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_users UUID[] DEFAULT ARRAY[]::UUID[];

-- Rename hours_per_week to availability_hours_per_week if needed
-- ALTER TABLE profiles RENAME COLUMN hours_per_week TO availability_hours_per_week;

-- Create enum for experience level if not exists
DO $$ 
BEGIN 
  CREATE TYPE experience_level_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for roles if not exists
DO $$ 
BEGIN 
  CREATE TYPE role_enum AS ENUM ('Developer', 'Designer', 'Founder', 'Marketer', 'Other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. CREATE CONNECTION_REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_connection_requests_from_user_id ON connection_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_to_user_id ON connection_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);

-- Enable RLS
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connection_requests
DROP POLICY IF EXISTS "Users can view their own connection requests" ON connection_requests;
CREATE POLICY "Users can view their own connection requests" ON connection_requests
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create connection requests" ON connection_requests;
CREATE POLICY "Users can create connection requests" ON connection_requests
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their received requests" ON connection_requests;
CREATE POLICY "Users can update their received requests" ON connection_requests
  FOR UPDATE USING (to_user_id = auth.uid());

-- ============================================
-- 3. CREATE NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'connection_request', 'connection_accepted', 'message'
  message TEXT NOT NULL,
  related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- 4. CREATE MESSAGES TABLE (for chat)
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_user_id ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- ============================================
-- 5. MATCHING ENGINE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_matches(user_id UUID, limit_count INT DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  bio TEXT,
  match_score NUMERIC,
  match_reasons TEXT[]
) AS $$
DECLARE
  v_user RECORD;
  v_skill_weight NUMERIC := 0.30;
  v_goal_weight NUMERIC := 0.25;
  v_interest_weight NUMERIC := 0.20;
  v_availability_weight NUMERIC := 0.15;
  v_experience_weight NUMERIC := 0.10;
BEGIN
  -- Get the current user's profile
  SELECT * INTO v_user FROM profiles WHERE id = user_id;
  
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH candidate_profiles AS (
    SELECT 
      p.id,
      p.full_name,
      p.avatar_url,
      p.role,
      p.bio,
      p.skills,
      p.goals,
      p.interests,
      p.experience_level,
      p.availability_hours_per_week,
      p.profile_completeness
    FROM profiles p
    WHERE p.id != user_id
      AND p.profile_completeness >= 30
      AND NOT p.id = ANY(v_user.blocked_users)
      AND NOT EXISTS (
        SELECT 1 FROM connection_requests cr
        WHERE (cr.from_user_id = user_id AND cr.to_user_id = p.id)
           OR (cr.from_user_id = p.id AND cr.to_user_id = user_id AND cr.status != 'rejected')
      )
  ),
  scored_profiles AS (
    SELECT
      cp.id,
      cp.full_name,
      cp.avatar_url,
      cp.role,
      cp.bio,
      -- Skill complementarity score (30%)
      (
        CASE WHEN v_user.role = 'Developer' AND cp.role IN ('Designer', 'Founder') THEN 1.0
             WHEN v_user.role = 'Designer' AND cp.role IN ('Developer', 'Founder') THEN 1.0
             WHEN v_user.role = 'Founder' THEN 0.8
             ELSE 0.5
        END * v_skill_weight
      ) +
      -- Shared goals score (25%)
      (
        CASE WHEN array_length(cp.goals, 1) > 0 AND array_length(v_user.goals, 1) > 0
          THEN (
            (SELECT COUNT(*)::NUMERIC / GREATEST(array_length(cp.goals, 1), array_length(v_user.goals, 1))
             FROM UNNEST(cp.goals) AS goal
             WHERE goal = ANY(v_user.goals))
          ) * v_goal_weight
          ELSE 0
        END
      ) +
      -- Shared interests score (20%)
      (
        CASE WHEN array_length(cp.interests, 1) > 0 AND array_length(v_user.interests, 1) > 0
          THEN (
            (SELECT COUNT(*)::NUMERIC / GREATEST(array_length(cp.interests, 1), array_length(v_user.interests, 1))
             FROM UNNEST(cp.interests) AS interest
             WHERE interest = ANY(v_user.interests))
          ) * v_interest_weight
          ELSE 0
        END
      ) +
      -- Availability overlap score (15%)
      (
        CASE WHEN v_user.availability_hours_per_week > 0 AND cp.availability_hours_per_week > 0
          THEN (
            LEAST(v_user.availability_hours_per_week, cp.availability_hours_per_week)::NUMERIC / 
            GREATEST(v_user.availability_hours_per_week, cp.availability_hours_per_week)::NUMERIC
          ) * v_availability_weight
          ELSE 0
        END
      ) +
      -- Experience compatibility score (10%)
      (
        CASE WHEN v_user.experience_level = cp.experience_level THEN 1.0
             WHEN ABS(
               CASE v_user.experience_level WHEN 'Beginner' THEN 1 WHEN 'Intermediate' THEN 2 WHEN 'Advanced' THEN 3 ELSE 0 END -
               CASE cp.experience_level WHEN 'Beginner' THEN 1 WHEN 'Intermediate' THEN 2 WHEN 'Advanced' THEN 3 ELSE 0 END
             ) = 1 THEN 0.7
             ELSE 0.3
        END * v_experience_weight
      ) AS match_score,
      -- Generate match reasons
      ARRAY_FILTER(ARRAY[
        CASE WHEN v_user.role != cp.role THEN 'Complementary role: ' || v_user.role || ' + ' || cp.role ELSE NULL END,
        CASE WHEN (SELECT COUNT(*) FROM UNNEST(cp.goals) AS goal WHERE goal = ANY(v_user.goals)) > 0 
          THEN 'Shared goals' ELSE NULL END,
        CASE WHEN (SELECT COUNT(*) FROM UNNEST(cp.interests) AS interest WHERE interest = ANY(v_user.interests)) > 0 
          THEN 'Shared interests' ELSE NULL END,
        CASE WHEN LEAST(v_user.availability_hours_per_week, cp.availability_hours_per_week) > 5
          THEN 'Good availability overlap' ELSE NULL END
      ], 'null'::TEXT) AS match_reasons
    FROM candidate_profiles cp
  )
  SELECT 
    sp.id,
    sp.full_name,
    sp.avatar_url,
    sp.role,
    sp.bio,
    ROUND(sp.match_score * 100, 0)::NUMERIC,
    sp.match_reasons
  FROM scored_profiles sp
  WHERE sp.match_score > 0
  ORDER BY sp.match_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 6. TRIGGER FOR PROFILE COMPLETENESS
-- ============================================

CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completeness := (
    CASE WHEN NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN 15 ELSE 0 END +
    CASE WHEN NEW.bio IS NOT NULL AND NEW.bio != '' THEN 15 ELSE 0 END +
    CASE WHEN NEW.avatar_url IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN NEW.role IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) >= 1 THEN 15 ELSE 0 END +
    CASE WHEN NEW.goals IS NOT NULL AND array_length(NEW.goals, 1) >= 1 THEN 10 ELSE 0 END +
    CASE WHEN NEW.interests IS NOT NULL AND array_length(NEW.interests, 1) >= 1 THEN 10 ELSE 0 END +
    CASE WHEN NEW.experience_level IS NOT NULL THEN 5 ELSE 0 END
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_completeness ON profiles;
CREATE TRIGGER trigger_update_profile_completeness
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completeness();

-- ============================================
-- 7. TRIGGER FOR NOTIFICATIONS ON NEW CONNECTION REQUEST
-- ============================================

CREATE OR REPLACE FUNCTION notify_connection_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, message, related_user_id)
    SELECT NEW.to_user_id, 'connection_request', 
           (SELECT full_name FROM profiles WHERE id = NEW.from_user_id) || ' wants to connect!',
           NEW.from_user_id;
  ELSIF NEW.status = 'accepted' THEN
    INSERT INTO notifications (user_id, type, message, related_user_id)
    SELECT NEW.from_user_id, 'connection_accepted',
           (SELECT full_name FROM profiles WHERE id = NEW.to_user_id) || ' accepted your connection!',
           NEW.to_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_connection_request ON connection_requests;
CREATE TRIGGER trigger_notify_connection_request
  AFTER INSERT OR UPDATE ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_connection_request();

-- ============================================
-- 8. CURSOR-BASED PAGINATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_discovery_feed(
  user_id UUID,
  p_limit INT DEFAULT 10,
  p_cursor TIMESTAMP DEFAULT NULL,
  p_role_filter TEXT DEFAULT NULL,
  p_experience_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  profile_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  bio TEXT,
  skills TEXT[],
  goals TEXT[],
  interests TEXT[],
  experience_level TEXT,
  availability_hours_per_week INT,
  cursor_value TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.role,
    SUBSTRING(p.bio, 1, 120),
    p.skills,
    p.goals,
    p.interests,
    p.experience_level,
    p.availability_hours_per_week,
    p.created_at
  FROM profiles p
  WHERE p.id != user_id
    AND p.profile_completeness >= 30
    AND NOT p.id = ANY((SELECT blocked_users FROM profiles WHERE id = user_id))
    AND NOT EXISTS (
      SELECT 1 FROM connection_requests cr
      WHERE (cr.from_user_id = user_id AND cr.to_user_id = p.id)
         OR (cr.from_user_id = p.id AND cr.to_user_id = user_id AND cr.status != 'rejected')
    )
    AND (p_cursor IS NULL OR p.created_at < p_cursor)
    AND (p_role_filter IS NULL OR p.role = p_role_filter)
    AND (p_experience_filter IS NULL OR p.experience_level = p_experience_filter)
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 9. FUNCTION TO GET ACCEPTED CONNECTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_connections(user_id UUID)
RETURNS TABLE(
  connection_id UUID,
  other_user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  bio TEXT,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    CASE WHEN cr.from_user_id = user_id THEN cr.to_user_id ELSE cr.from_user_id END,
    p.full_name,
    p.avatar_url,
    p.role,
    p.bio,
    cr.status
  FROM connection_requests cr
  JOIN profiles p ON (
    (cr.from_user_id = user_id AND p.id = cr.to_user_id) OR
    (cr.to_user_id = user_id AND p.id = cr.from_user_id)
  )
  WHERE cr.from_user_id = user_id OR cr.to_user_id = user_id;
END;
$$ LANGUAGE plpgsql STABLE;
