-- PRD v3.0 rupiah pivot: replace the points-based deposit/ledger/redemption
-- domain with rupiah transactions, versioned pricing, and a two-step
-- withdrawal flow. See root README.md "Posisi Produk" / "Status
-- Implementasi" and prisma/README.md.
--
-- Destructive on purpose: deposits/point_ledger/redemptions only ever held
-- seeded test data (see prisma/seed-phase3-test-data.sql), never real
-- production data, so dropping them here is safe.

-- Drop dependents first (FK order), then the tables themselves.
DROP TABLE IF EXISTS "deposit_items";
DROP TABLE IF EXISTS "point_ledger";
DROP TABLE IF EXISTS "redemptions";
DROP TABLE IF EXISTS "deposits";

DROP FUNCTION IF EXISTS public.validate_deposit_tenant();
DROP FUNCTION IF EXISTS public.validate_deposit_item_tenant();
DROP FUNCTION IF EXISTS public.validate_redemption_tenant();
DROP FUNCTION IF EXISTS public.prevent_final_deposit_mutation();

ALTER TABLE "waste_types" DROP CONSTRAINT IF EXISTS "waste_types_points_per_kg_positive";
ALTER TABLE "waste_types" DROP COLUMN IF EXISTS "points_per_kg";

DROP TYPE IF EXISTS "deposit_status";
DROP TYPE IF EXISTS "ledger_entry_type";
DROP TYPE IF EXISTS "ledger_source_type";
DROP TYPE IF EXISTS "redemption_status";

-- CreateEnum
CREATE TYPE "settlement_method" AS ENUM ('DIRECT_CASH', 'SAVINGS');
CREATE TYPE "transaction_status" AS ENUM ('DRAFT', 'FINALIZED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "withdrawal_status" AS ENUM ('REQUESTED', 'APPROVED', 'PAID', 'REJECTED');
CREATE TYPE "ledger_entry_type" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'OPENING_BALANCE', 'REVERSAL', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "waste_price_versions" (
    "id" UUID NOT NULL,
    "waste_type_id" UUID NOT NULL,
    "price_scheme" VARCHAR(40) NOT NULL DEFAULT 'STANDARD',
    "price_per_kg" DECIMAL(14,2) NOT NULL,
    "effective_from" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_until" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waste_price_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "status" "transaction_status" NOT NULL DEFAULT 'DRAFT',
    "settlement_method" "settlement_method",
    "total_rupiah" DECIMAL(16,2),
    "receipt_token" UUID NOT NULL,
    "client_uuid" UUID NOT NULL,
    "photo_path" TEXT,
    "created_by" UUID NOT NULL,
    "finalized_at" TIMESTAMPTZ(3),
    "completed_by" UUID,
    "completed_at" TIMESTAMPTZ(3),
    "cancelled_by" UUID,
    "cancelled_at" TIMESTAMPTZ(3),
    "cancellation_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "waste_type_id" UUID NOT NULL,
    "weight_kg" DECIMAL(12,3) NOT NULL,
    "price_per_kg_snapshot" DECIMAL(14,2) NOT NULL,
    "subtotal_rupiah" DECIMAL(16,2) NOT NULL,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "entry_type" "ledger_entry_type" NOT NULL,
    "amount_rupiah" DECIMAL(16,2) NOT NULL,
    "source_id" UUID NOT NULL,
    "reversal_of_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "amount_rupiah" DECIMAL(16,2) NOT NULL,
    "status" "withdrawal_status" NOT NULL DEFAULT 'REQUESTED',
    "notes" VARCHAR(500),
    "proof_path" TEXT,
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(3),
    "paid_by" UUID,
    "paid_at" TIMESTAMPTZ(3),
    "rejected_by" UUID,
    "rejected_at" TIMESTAMPTZ(3),
    "rejection_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waste_price_versions_waste_type_id_price_scheme_effective__idx"
ON "waste_price_versions"("waste_type_id", "price_scheme", "effective_from");

-- Only one still-open (effective_until IS NULL) version per waste type + scheme.
CREATE UNIQUE INDEX "waste_price_versions_one_open_per_scheme"
ON "waste_price_versions"("waste_type_id", "price_scheme")
WHERE "effective_until" IS NULL;

CREATE UNIQUE INDEX "transactions_receipt_token_key" ON "transactions"("receipt_token");
CREATE INDEX "transactions_organization_id_status_created_at_idx" ON "transactions"("organization_id", "status", "created_at");
CREATE INDEX "transactions_organization_id_member_id_created_at_idx" ON "transactions"("organization_id", "member_id", "created_at");
CREATE UNIQUE INDEX "transactions_organization_id_client_uuid_key" ON "transactions"("organization_id", "client_uuid");

CREATE INDEX "transaction_items_waste_type_id_idx" ON "transaction_items"("waste_type_id");
CREATE UNIQUE INDEX "transaction_items_transaction_id_waste_type_id_key" ON "transaction_items"("transaction_id", "waste_type_id");

CREATE INDEX "ledger_entries_organization_id_member_id_created_at_idx" ON "ledger_entries"("organization_id", "member_id", "created_at");
CREATE UNIQUE INDEX "ledger_entries_organization_id_entry_type_source_id_key" ON "ledger_entries"("organization_id", "entry_type", "source_id");
CREATE UNIQUE INDEX "ledger_entries_reversal_of_id_key" ON "ledger_entries"("reversal_of_id");

CREATE INDEX "withdrawals_organization_id_member_id_created_at_idx" ON "withdrawals"("organization_id", "member_id", "created_at");
CREATE INDEX "withdrawals_organization_id_status_created_at_idx" ON "withdrawals"("organization_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "waste_price_versions" ADD CONSTRAINT "waste_price_versions_waste_type_id_fkey" FOREIGN KEY ("waste_type_id") REFERENCES "waste_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_waste_type_id_fkey" FOREIGN KEY ("waste_type_id") REFERENCES "waste_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "ledger_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain invariants. Rupiah amounts are decimal and ledger amounts are
-- signed so a balance is always SUM(ledger_entries.amount_rupiah).
ALTER TABLE "waste_price_versions"
    ADD CONSTRAINT "waste_price_versions_price_positive" CHECK ("price_per_kg" > 0),
    ADD CONSTRAINT "waste_price_versions_range_valid"
        CHECK ("effective_until" IS NULL OR "effective_until" > "effective_from");

ALTER TABLE "transaction_items"
    ADD CONSTRAINT "transaction_items_weight_positive"
        CHECK ("weight_kg" > 0),
    ADD CONSTRAINT "transaction_items_price_snapshot_positive"
        CHECK ("price_per_kg_snapshot" > 0),
    ADD CONSTRAINT "transaction_items_subtotal_positive"
        CHECK ("subtotal_rupiah" > 0),
    ADD CONSTRAINT "transaction_items_subtotal_matches_snapshot"
        CHECK ("subtotal_rupiah" = ROUND("weight_kg" * "price_per_kg_snapshot", 2));

ALTER TABLE "transactions"
    ADD CONSTRAINT "transactions_status_fields_valid"
    CHECK (
        ("status" = 'DRAFT'
            AND "settlement_method" IS NULL AND "finalized_at" IS NULL AND "total_rupiah" IS NULL
            AND "completed_by" IS NULL AND "completed_at" IS NULL
            AND "cancelled_by" IS NULL AND "cancelled_at" IS NULL AND "cancellation_reason" IS NULL)
        OR
        ("status" = 'FINALIZED'
            AND "finalized_at" IS NOT NULL AND "total_rupiah" IS NOT NULL AND "settlement_method" IS NULL
            AND "completed_by" IS NULL AND "completed_at" IS NULL
            AND "cancelled_by" IS NULL AND "cancelled_at" IS NULL AND "cancellation_reason" IS NULL)
        OR
        ("status" = 'COMPLETED'
            AND "finalized_at" IS NOT NULL AND "total_rupiah" IS NOT NULL AND "settlement_method" IS NOT NULL
            AND "completed_by" IS NOT NULL AND "completed_at" IS NOT NULL
            AND "cancelled_by" IS NULL AND "cancelled_at" IS NULL)
        OR
        ("status" = 'CANCELLED'
            AND "completed_by" IS NULL AND "completed_at" IS NULL
            AND "cancelled_by" IS NOT NULL AND "cancelled_at" IS NOT NULL
            AND NULLIF(BTRIM("cancellation_reason"), '') IS NOT NULL)
    );

ALTER TABLE "ledger_entries"
    ADD CONSTRAINT "ledger_entries_entry_sign_valid"
    CHECK (
        ("entry_type" = 'DEPOSIT' AND "amount_rupiah" > 0 AND "reversal_of_id" IS NULL)
        OR
        ("entry_type" = 'WITHDRAWAL' AND "amount_rupiah" < 0 AND "reversal_of_id" IS NULL)
        OR
        ("entry_type" = 'REVERSAL' AND "amount_rupiah" <> 0 AND "reversal_of_id" IS NOT NULL)
        OR
        ("entry_type" IN ('OPENING_BALANCE', 'ADJUSTMENT') AND "amount_rupiah" <> 0 AND "reversal_of_id" IS NULL)
    );

ALTER TABLE "withdrawals"
    ADD CONSTRAINT "withdrawals_amount_positive"
        CHECK ("amount_rupiah" > 0),
    ADD CONSTRAINT "withdrawals_status_fields_valid"
    CHECK (
        ("status" = 'REQUESTED'
            AND "approved_by" IS NULL AND "approved_at" IS NULL
            AND "paid_by" IS NULL AND "paid_at" IS NULL
            AND "rejected_by" IS NULL AND "rejected_at" IS NULL AND "rejection_reason" IS NULL)
        OR
        ("status" = 'APPROVED'
            AND "approved_by" IS NOT NULL AND "approved_at" IS NOT NULL
            AND "paid_by" IS NULL AND "paid_at" IS NULL
            AND "rejected_by" IS NULL AND "rejected_at" IS NULL AND "rejection_reason" IS NULL)
        OR
        ("status" = 'PAID'
            AND "approved_by" IS NOT NULL AND "approved_at" IS NOT NULL
            AND "paid_by" IS NOT NULL AND "paid_at" IS NOT NULL
            AND "rejected_by" IS NULL AND "rejected_at" IS NULL)
        OR
        ("status" = 'REJECTED'
            AND "paid_by" IS NULL AND "paid_at" IS NULL
            AND "rejected_by" IS NOT NULL AND "rejected_at" IS NOT NULL
            AND NULLIF(BTRIM("rejection_reason"), '') IS NOT NULL)
    );

-- Validate organization ownership even when writes use a service connection
-- that bypasses RLS (same pattern as the original migration).
CREATE OR REPLACE FUNCTION public.validate_transaction_tenant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.members
        WHERE id = NEW.member_id AND organization_id = NEW.organization_id
    ) THEN
        RAISE EXCEPTION 'Transaction member belongs to a different organization';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.created_by AND organization_id = NEW.organization_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Transaction creator is not active in this organization';
    END IF;

    IF NEW.completed_by IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.completed_by AND organization_id = NEW.organization_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Transaction completer is not active in this organization';
    END IF;

    IF NEW.cancelled_by IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.cancelled_by AND organization_id = NEW.organization_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Transaction canceller is not active in this organization';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "transactions_validate_tenant"
BEFORE INSERT OR UPDATE ON "transactions"
FOR EACH ROW EXECUTE FUNCTION public.validate_transaction_tenant();

CREATE OR REPLACE FUNCTION public.validate_transaction_item_tenant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.transactions t
        JOIN public.waste_types w ON w.id = NEW.waste_type_id
        WHERE t.id = NEW.transaction_id
          AND t.organization_id = w.organization_id
    ) THEN
        RAISE EXCEPTION 'Transaction item waste type belongs to a different organization';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "transaction_items_validate_tenant"
BEFORE INSERT OR UPDATE ON "transaction_items"
FOR EACH ROW EXECUTE FUNCTION public.validate_transaction_item_tenant();

-- Reused for ledger_entries with a rewritten body (old point_ledger table is
-- gone); same function name kept for continuity with prisma/README.md.
CREATE OR REPLACE FUNCTION public.validate_ledger_entry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    original_entry public.ledger_entries%ROWTYPE;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.members
        WHERE id = NEW.member_id AND organization_id = NEW.organization_id
    ) THEN
        RAISE EXCEPTION 'Ledger member belongs to a different organization';
    END IF;

    IF NEW.entry_type = 'REVERSAL' THEN
        SELECT * INTO original_entry
        FROM public.ledger_entries
        WHERE id = NEW.reversal_of_id;

        IF NOT FOUND
           OR original_entry.organization_id <> NEW.organization_id
           OR original_entry.member_id <> NEW.member_id
           OR original_entry.entry_type = 'REVERSAL'
           OR NEW.amount_rupiah <> -original_entry.amount_rupiah THEN
            RAISE EXCEPTION 'Invalid ledger reversal';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "ledger_entries_validate_entry"
BEFORE INSERT ON "ledger_entries"
FOR EACH ROW EXECUTE FUNCTION public.validate_ledger_entry();

CREATE OR REPLACE FUNCTION public.validate_withdrawal_tenant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.members
        WHERE id = NEW.member_id AND organization_id = NEW.organization_id
    ) THEN
        RAISE EXCEPTION 'Withdrawal member belongs to a different organization';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.created_by AND organization_id = NEW.organization_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Withdrawal creator is not active in this organization';
    END IF;

    IF NEW.approved_by IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.approved_by AND organization_id = NEW.organization_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Withdrawal approver is not active in this organization';
    END IF;

    IF NEW.paid_by IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.paid_by AND organization_id = NEW.organization_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Withdrawal payer is not active in this organization';
    END IF;

    IF NEW.rejected_by IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.rejected_by AND organization_id = NEW.organization_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Withdrawal rejecter is not active in this organization';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "withdrawals_validate_tenant"
BEFORE INSERT OR UPDATE ON "withdrawals"
FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_tenant();

-- Completed/cancelled transactions and the ledger are append-only past that point.
CREATE OR REPLACE FUNCTION public.prevent_final_transaction_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF OLD.status IN ('COMPLETED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Completed or cancelled transactions are immutable; create a ledger reversal instead';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "transactions_prevent_final_mutation"
BEFORE UPDATE OR DELETE ON "transactions"
FOR EACH ROW EXECUTE FUNCTION public.prevent_final_transaction_mutation();

-- public.prevent_append_only_mutation() already exists (created in the first
-- migration for audit_logs) - reused as-is for ledger_entries.
CREATE TRIGGER "ledger_entries_append_only"
BEFORE UPDATE OR DELETE ON "ledger_entries"
FOR EACH ROW EXECUTE FUNCTION public.prevent_append_only_mutation();

-- Row Level Security
ALTER TABLE "waste_price_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transaction_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "withdrawals" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waste_price_versions_tenant_access"
ON "waste_price_versions" FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.waste_types w
        WHERE w.id = waste_price_versions.waste_type_id
          AND w.organization_id = public.current_organization_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.waste_types w
        WHERE w.id = waste_price_versions.waste_type_id
          AND w.organization_id = public.current_organization_id()
    )
);

CREATE POLICY "transactions_tenant_access"
ON "transactions" FOR ALL TO authenticated
USING (organization_id = public.current_organization_id())
WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "transaction_items_tenant_access"
ON "transaction_items" FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.id = transaction_items.transaction_id
          AND t.organization_id = public.current_organization_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.id = transaction_items.transaction_id
          AND t.organization_id = public.current_organization_id()
    )
);

CREATE POLICY "ledger_entries_select_own_tenant"
ON "ledger_entries" FOR SELECT TO authenticated
USING (organization_id = public.current_organization_id());

CREATE POLICY "withdrawals_tenant_access"
ON "withdrawals" FOR ALL TO authenticated
USING (organization_id = public.current_organization_id())
WITH CHECK (organization_id = public.current_organization_id());
