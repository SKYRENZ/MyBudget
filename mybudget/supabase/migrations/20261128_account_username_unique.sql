-- Ensure profiles has username and full_name columns and enforce case-insensitive username uniqueness
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS full_name text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON profiles (lower(username))
  WHERE username IS NOT NULL;
