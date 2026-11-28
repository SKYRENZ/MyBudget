-- Add category ordering and pinning columns
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_categories_user_sort
  ON categories (user_id, is_pinned DESC, sort_order ASC);
