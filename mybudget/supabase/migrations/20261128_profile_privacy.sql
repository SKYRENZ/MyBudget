-- Add per-user amount visibility preference to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hide_amounts boolean NOT NULL DEFAULT false;
