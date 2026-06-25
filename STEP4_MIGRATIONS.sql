-- ============================================
-- FINDTEAMO STEP 4 - MIGRATIONS
-- Adds: Age field to profiles table
-- ============================================

-- Add age column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;