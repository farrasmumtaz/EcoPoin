-- Reconcile withdrawals created by an older branch with the current model.
DO $$ BEGIN
  CREATE TYPE public.withdrawal_status AS ENUM ('REQUESTED', 'APPROVED', 'PAID', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF to_regclass('public.withdrawals') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS withdrawals_validate_tenant ON public.withdrawals;
  END IF;
END $$;
DROP FUNCTION IF EXISTS public.validate_withdrawal_tenant();
ALTER TABLE IF EXISTS public.withdrawals
  DROP CONSTRAINT IF EXISTS withdrawals_status_fields_valid,
  DROP CONSTRAINT IF EXISTS withdrawals_amount_positive,
  DROP CONSTRAINT IF EXISTS withdrawals_created_by_fkey;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='withdrawals' AND column_name='amount_rupiah')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='withdrawals' AND column_name='amount') THEN
    ALTER TABLE public.withdrawals RENAME COLUMN amount_rupiah TO amount;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='withdrawals' AND column_name='created_by')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='withdrawals' AND column_name='requested_by') THEN
    ALTER TABLE public.withdrawals RENAME COLUMN created_by TO requested_by;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid(), organization_id UUID NOT NULL,
  member_id UUID NOT NULL, status public.withdrawal_status NOT NULL DEFAULT 'REQUESTED',
  amount DECIMAL(18,2) NOT NULL, notes VARCHAR(500), rejection_reason VARCHAR(500),
  requested_by UUID NOT NULL, approved_by UUID, paid_by UUID,
  approved_at TIMESTAMPTZ(3), paid_at TIMESTAMPTZ(3), rejected_at TIMESTAMPTZ(3),
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT withdrawals_pkey PRIMARY KEY (id)
);

ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500),
  ADD COLUMN IF NOT EXISTS approved_by UUID, ADD COLUMN IF NOT EXISTS paid_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ(3), ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ(3),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN amount TYPE DECIMAL(18,2);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='withdrawals_amount_positive') THEN
    ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_amount_positive CHECK (amount > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='withdrawals_organization_id_fkey') THEN
    ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='withdrawals_member_id_fkey') THEN
    ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='withdrawals_requested_by_fkey') THEN
    ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='withdrawals_approved_by_fkey') THEN
    ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='withdrawals_paid_by_fkey') THEN
    ALTER TABLE public.withdrawals ADD CONSTRAINT withdrawals_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS withdrawals_organization_id_status_created_at_idx ON public.withdrawals(organization_id,status,created_at);
CREATE INDEX IF NOT EXISTS withdrawals_organization_id_member_id_created_at_idx ON public.withdrawals(organization_id,member_id,created_at);
ALTER TABLE public.financial_ledger ADD COLUMN IF NOT EXISTS withdrawal_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS financial_ledger_withdrawal_id_key ON public.financial_ledger(withdrawal_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='financial_ledger_withdrawal_id_fkey') THEN
    ALTER TABLE public.financial_ledger ADD CONSTRAINT financial_ledger_withdrawal_id_fkey FOREIGN KEY (withdrawal_id) REFERENCES public.withdrawals(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.validate_withdrawal_tenant()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.members WHERE id=NEW.member_id AND organization_id=NEW.organization_id) THEN
    RAISE EXCEPTION 'Withdrawal member belongs to a different organization';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=NEW.requested_by AND organization_id=NEW.organization_id AND is_active=true) THEN
    RAISE EXCEPTION 'Withdrawal requester is not active in this organization';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER withdrawals_validate_tenant BEFORE INSERT OR UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_tenant();

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS withdrawals_tenant_access ON public.withdrawals;
CREATE POLICY withdrawals_tenant_access ON public.withdrawals FOR ALL TO authenticated
USING (organization_id=public.current_organization_id())
WITH CHECK (organization_id=public.current_organization_id());
