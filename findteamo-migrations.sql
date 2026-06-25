-- FindTeamo Additional Tables and Migrations
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  favorite_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, favorite_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_favorite_id ON favorites(favorite_profile_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can add to their favorites" ON favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove from their favorites" ON favorites
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 2. CREATE MESSAGES TABLE (conversations)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON messages(to_user_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- ============================================
-- 3. UPDATE PROFILES TABLE
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_users UUID[] DEFAULT ARRAY[]::UUID[];

-- ============================================
-- 4. UPDATE CONNECTIONS TABLE STATUS
-- ============================================
ALTER TABLE connections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- 5. TRIGGER FOR PROFILE COMPLETENESS
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
-- 6. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, experience_level, hours_per_week, looking_for)
  SELECT 
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NULL,
    NULL,
    NULL,
    NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_handle_new_user ON auth.users;
CREATE TRIGGER trigger_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. CREATE CONVERSATION ON MATCH
-- ============================================
CREATE OR REPLACE FUNCTION create_conversation_on_match()
RETURNS TRIGGER AS $$
DECLARE
  conv_id UUID;
BEGIN
  IF NEW.status = 'matched' THEN
    INSERT INTO conversations (id, created_at, updated_at)
    VALUES (gen_random_uuid(), NOW(), NOW())
    RETURNING id INTO conv_id;
    
    -- Insert initial message placeholder
    INSERT INTO messages (conversation_id, from_user_id, to_user_id, content, read, created_at)
    VALUES (conv_id, NEW.from_user_id, NEW.to_user_id, 'You are now matched!Say hello :)', true, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_conversation_on_match ON connections;
CREATE TRIGGER trigger_create_conversation_on_match
  AFTER INSERT OR UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_on_match();