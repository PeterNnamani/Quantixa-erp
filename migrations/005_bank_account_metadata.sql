-- Add the account setup fields used by Super Admin bank management.
ALTER TABLE bank_accounts
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'Current',
  ADD COLUMN IF NOT EXISTS branch text,
  ADD COLUMN IF NOT EXISTS opening_balance numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_balance_date date;

CREATE INDEX IF NOT EXISTS idx_bank_accounts_company_id ON bank_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON bank_accounts(status);
