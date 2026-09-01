-- Reconcile the transaction tables that were created manually before Prisma
-- started tracking the financial transaction migration. All statements retain
-- existing rows and are safe after a clean 20260901090000 deployment.

DO $$ BEGIN
  CREATE TYPE "transaction_source" AS ENUM ('DIRECT_ENTRY', 'IMPORT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "payout_method" AS ENUM ('DIRECT_CASH', 'SAVINGS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "financial_ledger_entry_type" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'REVERSAL', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "transaction_status" ADD VALUE IF NOT EXISTS 'VOIDED';

-- The legacy schema protects COMPLETED rows from application mutations. The
-- migration temporarily disables user triggers while preserving the row.
ALTER TABLE "transactions" DISABLE TRIGGER USER;

-- Keep the legacy transaction identifiers and monetary values.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'client_uuid'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'client_request_id'
  ) THEN
    ALTER TABLE "transactions" RENAME COLUMN "client_uuid" TO "client_request_id";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'total_rupiah'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE "transactions" RENAME COLUMN "total_rupiah" TO "total_amount";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transaction_items' AND column_name = 'subtotal_rupiah'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transaction_items' AND column_name = 'subtotal_amount'
  ) THEN
    ALTER TABLE "transaction_items" RENAME COLUMN "subtotal_rupiah" TO "subtotal_amount";
  END IF;
END $$;

ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "source" "transaction_source" NOT NULL DEFAULT 'DIRECT_ENTRY',
  ADD COLUMN IF NOT EXISTS "payout_method" "payout_method",
  ADD COLUMN IF NOT EXISTS "notes" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "total_weight_kg" DECIMAL(14,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "finalized_by" UUID;

UPDATE "transactions" SET "total_amount" = 0 WHERE "total_amount" IS NULL;
ALTER TABLE "transactions"
  ALTER COLUMN "total_amount" SET DEFAULT 0,
  ALTER COLUMN "total_amount" SET NOT NULL;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'settlement_method'
  ) THEN
    UPDATE "transactions"
    SET "payout_method" = "settlement_method"::text::"payout_method"
    WHERE "settlement_method" IS NOT NULL AND "payout_method" IS NULL;
    ALTER TABLE "transactions" DROP COLUMN "settlement_method";
  END IF;
END $$;

ALTER TABLE "transactions" DROP COLUMN IF EXISTS "photo_path";

ALTER TABLE "transaction_items"
  ADD COLUMN IF NOT EXISTS "waste_type_name_snapshot" VARCHAR(120);

UPDATE "transaction_items" ti
SET "waste_type_name_snapshot" = wt."name"
FROM "waste_types" wt
WHERE wt."id" = ti."waste_type_id"
  AND ti."waste_type_name_snapshot" IS NULL;

ALTER TABLE "transaction_items"
  ALTER COLUMN "waste_type_name_snapshot" SET NOT NULL;

UPDATE "transactions" t
SET "total_weight_kg" = totals."weight_kg"
FROM (
  SELECT "transaction_id", COALESCE(SUM("weight_kg"), 0) AS "weight_kg"
  FROM "transaction_items"
  GROUP BY "transaction_id"
) totals
WHERE totals."transaction_id" = t."id";

UPDATE "transactions"
SET "finalized_by" = COALESCE("completed_by", "created_by")
WHERE "finalized_at" IS NOT NULL AND "finalized_by" IS NULL;

ALTER TABLE "waste_price_versions"
  ADD COLUMN IF NOT EXISTS "organization_id" UUID,
  ADD COLUMN IF NOT EXISTS "created_by" UUID;

UPDATE "waste_price_versions" wp
SET "organization_id" = wt."organization_id"
FROM "waste_types" wt
WHERE wt."id" = wp."waste_type_id"
  AND wp."organization_id" IS NULL;

ALTER TABLE "waste_price_versions"
  ALTER COLUMN "organization_id" SET NOT NULL;

ALTER TABLE "waste_price_versions" DROP COLUMN IF EXISTS "price_scheme";

CREATE TABLE IF NOT EXISTS "financial_ledger" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "transaction_id" UUID,
  "entry_type" "financial_ledger_entry_type" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "reference_key" VARCHAR(160) NOT NULL,
  "notes" VARCHAR(500),
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "financial_ledger_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "financial_ledger_amount_check" CHECK ("amount" > 0)
);

INSERT INTO "financial_ledger" (
  "organization_id", "member_id", "transaction_id", "entry_type",
  "amount", "reference_key", "created_by", "created_at"
)
SELECT
  t."organization_id", t."member_id", t."id", 'DEPOSIT',
  t."total_amount", 'transaction:' || t."id"::text,
  COALESCE(t."completed_by", t."created_by"), COALESCE(t."completed_at", t."created_at")
FROM "transactions" t
WHERE t."status" = 'COMPLETED'
  AND t."payout_method" = 'SAVINGS'
  AND t."total_amount" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "financial_ledger" fl
    WHERE fl."organization_id" = t."organization_id"
      AND fl."reference_key" = 'transaction:' || t."id"::text
  );

ALTER TABLE "transactions" ENABLE TRIGGER USER;

CREATE UNIQUE INDEX IF NOT EXISTS "transactions_organization_id_client_request_id_key"
  ON "transactions"("organization_id", "client_request_id");
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_receipt_token_key"
  ON "transactions"("receipt_token");
CREATE INDEX IF NOT EXISTS "transactions_organization_id_status_created_at_idx"
  ON "transactions"("organization_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "transactions_organization_id_member_id_created_at_idx"
  ON "transactions"("organization_id", "member_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "transaction_items_transaction_id_waste_type_id_key"
  ON "transaction_items"("transaction_id", "waste_type_id");
CREATE INDEX IF NOT EXISTS "transaction_items_waste_type_id_idx"
  ON "transaction_items"("waste_type_id");
CREATE INDEX IF NOT EXISTS "waste_price_versions_organization_id_waste_type_id_effective_from_idx"
  ON "waste_price_versions"("organization_id", "waste_type_id", "effective_from");
CREATE UNIQUE INDEX IF NOT EXISTS "financial_ledger_organization_id_reference_key_key"
  ON "financial_ledger"("organization_id", "reference_key");
CREATE INDEX IF NOT EXISTS "financial_ledger_organization_id_member_id_created_at_idx"
  ON "financial_ledger"("organization_id", "member_id", "created_at");
CREATE INDEX IF NOT EXISTS "financial_ledger_transaction_id_idx"
  ON "financial_ledger"("transaction_id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_finalized_by_fkey') THEN
    ALTER TABLE "transactions" ADD CONSTRAINT "transactions_finalized_by_fkey"
      FOREIGN KEY ("finalized_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'waste_price_versions_organization_id_fkey') THEN
    ALTER TABLE "waste_price_versions" ADD CONSTRAINT "waste_price_versions_organization_id_fkey"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'waste_price_versions_created_by_fkey') THEN
    ALTER TABLE "waste_price_versions" ADD CONSTRAINT "waste_price_versions_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'financial_ledger_organization_id_fkey') THEN
    ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_organization_id_fkey"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_member_id_fkey"
      FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_transaction_id_fkey"
      FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DROP TRIGGER IF EXISTS "financial_ledger_append_only" ON "financial_ledger";
CREATE TRIGGER "financial_ledger_append_only"
BEFORE UPDATE OR DELETE ON "financial_ledger"
FOR EACH ROW EXECUTE FUNCTION public.prevent_append_only_mutation();

ALTER TABLE "waste_price_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transaction_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "financial_ledger" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waste_price_versions_tenant_access" ON "waste_price_versions";
CREATE POLICY "waste_price_versions_tenant_access" ON "waste_price_versions" FOR ALL TO authenticated
USING (organization_id = public.current_organization_id())
WITH CHECK (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS "transactions_tenant_access" ON "transactions";
CREATE POLICY "transactions_tenant_access" ON "transactions" FOR ALL TO authenticated
USING (organization_id = public.current_organization_id())
WITH CHECK (organization_id = public.current_organization_id());

DROP POLICY IF EXISTS "transaction_items_tenant_access" ON "transaction_items";
CREATE POLICY "transaction_items_tenant_access" ON "transaction_items" FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM "transactions" t
  WHERE t."id" = "transaction_id" AND t."organization_id" = public.current_organization_id()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM "transactions" t
  WHERE t."id" = "transaction_id" AND t."organization_id" = public.current_organization_id()
));

DROP POLICY IF EXISTS "financial_ledger_select_own_tenant" ON "financial_ledger";
CREATE POLICY "financial_ledger_select_own_tenant" ON "financial_ledger" FOR SELECT TO authenticated
USING (organization_id = public.current_organization_id());
