-- Add granular per-section privacy configuration columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hide_dashboard boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hide_category_budgets boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hide_transactions boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hide_accounts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hide_goals_savings boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hide_reports boolean NOT NULL DEFAULT true;
