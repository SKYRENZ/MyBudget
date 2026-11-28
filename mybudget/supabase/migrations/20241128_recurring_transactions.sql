-- ============================================================
-- Migration: Recurring Transactions & Transaction Metadata
-- ============================================================

-- 1. Create recurring_transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('income', 'expense')),
  amount          numeric(14,4) NOT NULL CHECK (amount > 0),
  category_id     uuid REFERENCES categories(id) ON DELETE SET NULL,
  account_id      uuid REFERENCES accounts(id) ON DELETE SET NULL,
  description     text,
  frequency       text NOT NULL CHECK (frequency IN ('daily','weekly','biweekly','monthly','quarterly','yearly','custom')),
  custom_days     integer,                 -- used when frequency = 'custom'
  start_date      date NOT NULL,
  end_date        date,                    -- null = never ends
  next_occurrence date,
  last_generated_at timestamptz,
  auto_create     boolean DEFAULT false,   -- auto-generate transaction on due date
  reminder_days   integer DEFAULT 0,       -- days before due date to remind
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 3. Now add the FK column on transactions (safe to do after table is created)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS recurring_transaction_id uuid REFERENCES recurring_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_auto_generated boolean DEFAULT false;

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_occurrence ON recurring_transactions(next_occurrence) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_id ON transactions(recurring_transaction_id) WHERE recurring_transaction_id IS NOT NULL;

-- 5. Row Level Security for recurring_transactions
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring transactions"
  ON recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring transactions"
  ON recurring_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions"
  ON recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions"
  ON recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_recurring_transactions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recurring_transactions_updated_at ON recurring_transactions;
CREATE TRIGGER trg_recurring_transactions_updated_at
  BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION update_recurring_transactions_updated_at();

-- 7. Helper function: compute next occurrence date
CREATE OR REPLACE FUNCTION compute_next_occurrence(
  p_frequency text,
  p_custom_days integer,
  p_from_date date
) RETURNS date LANGUAGE plpgsql AS $$
BEGIN
  RETURN CASE p_frequency
    WHEN 'daily'     THEN p_from_date + INTERVAL '1 day'
    WHEN 'weekly'    THEN p_from_date + INTERVAL '7 days'
    WHEN 'biweekly'  THEN p_from_date + INTERVAL '14 days'
    WHEN 'monthly'   THEN p_from_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN p_from_date + INTERVAL '3 months'
    WHEN 'yearly'    THEN p_from_date + INTERVAL '1 year'
    WHEN 'custom'    THEN p_from_date + (COALESCE(p_custom_days, 30) || ' days')::INTERVAL
    ELSE p_from_date + INTERVAL '1 month'
  END;
END;
$$;
