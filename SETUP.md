# 🚀 FindTeamo - Setup Guide

## Environment Setup

1. **Copy .env.local.example to .env.local**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Get your Supabase credentials:**
   - Create a project at https://supabase.com
   - Go to **Settings > API**
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `Anon Public Key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Configure Google OAuth in Supabase:**
   - Go to **Authentication > Providers > Google**
   - Enable Google
   - Add your OAuth credentials from Google Cloud Console
   - Authorized redirect URLs should include:
     - `http://localhost:3000/auth/callback`
     - `https://yourdomain.com/auth/callback`

## Database Schema

Run these SQL commands in Supabase SQL Editor to set up the database:

```sql
-- Users profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,
  experience_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
  hours_per_week INTEGER,
  looking_for TEXT, -- comma-separated list
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table
CREATE TABLE skills (
  id BIGSERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  proficiency VARCHAR(20), -- 'learning', 'intermediate', 'expert'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interests table
CREATE TABLE interests (
  id BIGSERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table
CREATE TABLE goals (
  id BIGSERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_name VARCHAR(100) NOT NULL, -- 'startup', 'hackathon', 'saas', 'open_source'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes/Connections table
CREATE TABLE connections (
  id BIGSERIAL PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'liked', -- 'liked', 'matched', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can read all, but only edit their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Skills: Users can read all, only edit their own
CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);
CREATE POLICY "Users can manage their own skills" ON skills FOR ALL USING (profile_id = auth.uid());

-- Interests: Users can read all, only edit their own
CREATE POLICY "Interests are viewable by everyone" ON interests FOR SELECT USING (true);
CREATE POLICY "Users can manage their own interests" ON interests FOR ALL USING (profile_id = auth.uid());

-- Goals: Users can read all, only edit their own
CREATE POLICY "Goals are viewable by everyone" ON goals FOR SELECT USING (true);
CREATE POLICY "Users can manage their own goals" ON goals FOR ALL USING (profile_id = auth.uid());

-- Connections: Users can read and manage their own
CREATE POLICY "Users can view their own connections" ON connections FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
CREATE POLICY "Users can create connections" ON connections FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "Users can update their connections" ON connections FOR UPDATE USING (from_user_id = auth.uid());
```

## Running the app

```bash
npm install
npm run dev
```

Visit http://localhost:3000
