-- PRD v3.0 financial transaction workflow. Legacy point tables remain available
-- temporarily so existing data can be migrated independently.
CREATE TYPE "transaction_status" AS ENUM ('DRAFT', 'FINALIZED', 'COMPLETED', 'CANCELLED', 'VOIDED');
CREATE TYPE "transaction_source" AS ENUM ('DIRECT_ENTRY', 'IMPORT');
CREATE TYPE "payout_method" AS ENUM ('DIRECT_CASH', 'SAVINGS');
CREATE TYPE "financial_ledger_entry_type" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'REVERSAL', 'ADJUSTMENT');

-- Upload bukti tidak digunakan pada PRD final.
ALTER TABLE "deposits" DROP COLUMN IF EXISTS "photo_path";

CREATE TABLE "waste_price_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "waste_type_id" UUID NOT NULL,
  "price_per_kg" DECIMAL(16,2) NOT NULL,
  "effective_from" TIMESTAMPTZ(3) NOT NULL,
  "effective_until" TIMESTAMPTZ(3),
  "created_by" UUID,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "waste_price_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "waste_price_versions_price_check" CHECK ("price_per_kg" > 0),
  CONSTRAINT "waste_price_versions_period_check" CHECK ("effective_until" IS NULL OR "effective_until" > "effective_from")
);

CREATE TABLE "transactions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "status" "transaction_status" NOT NULL DEFAULT 'DRAFT',
  "source" "transaction_source" NOT NULL DEFAULT 'DIRECT_ENTRY',
  "payout_method" "payout_method",
  "client_request_id" UUID NOT NULL,
  "receipt_token" UUID NOT NULL DEFAULT gen_random_uuid(),
  "notes" VARCHAR(500),
  "total_weight_kg" DECIMAL(14,3) NOT NULL DEFAULT 0,
  "total_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "created_by" UUID NOT NULL,
  "finalized_by" UUID,
  "finalized_at" TIMESTAMPTZ(3),
  "completed_by" UUID,
  "completed_at" TIMESTAMPTZ(3),
  "cancelled_at" TIMESTAMPTZ(3),
  "cancellation_reason" VARCHAR(500),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transactions_totals_check" CHECK ("total_weight_kg" >= 0 AND "total_amount" >= 0),
  CONSTRAINT "transactions_state_check" CHECK (
    ("status" = 'DRAFT' AND "finalized_at" IS NULL AND "completed_at" IS NULL)
    OR ("status" = 'FINALIZED' AND "finalized_at" IS NOT NULL AND "completed_at" IS NULL)
    OR ("status" = 'COMPLETED' AND "finalized_at" IS NOT NULL AND "completed_at" IS NOT NULL AND "payout_method" IS NOT NULL)
    OR ("status" IN ('CANCELLED', 'VOIDED'))
  )
);

CREATE TABLE "transaction_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "transaction_id" UUID NOT NULL,
  "waste_type_id" UUID NOT NULL,
  "waste_type_name_snapshot" VARCHAR(120) NOT NULL,
  "weight_kg" DECIMAL(12,3) NOT NULL,
  "price_per_kg_snapshot" DECIMAL(16,2) NOT NULL,
  "subtotal_amount" DECIMAL(18,2) NOT NULL,
  CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "transaction_items_amounts_check" CHECK ("weight_kg" > 0 AND "price_per_kg_snapshot" > 0 AND "subtotal_amount" >= 0)
);

CREATE TABLE "financial_ledger" (
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

CREATE UNIQUE INDEX "transactions_organization_id_client_request_id_key" ON "transactions"("organization_id", "client_request_id");
CREATE INDEX "waste_price_versions_organization_id_waste_type_id_effective_from_idx" ON "waste_price_versions"("organization_id", "waste_type_id", "effective_from");
CREATE UNIQUE INDEX "transactions_receipt_token_key" ON "transactions"("receipt_token");
CREATE INDEX "transactions_organization_id_status_created_at_idx" ON "transactions"("organization_id", "status", "created_at");
CREATE INDEX "transactions_organization_id_member_id_created_at_idx" ON "transactions"("organization_id", "member_id", "created_at");
CREATE UNIQUE INDEX "transaction_items_transaction_id_waste_type_id_key" ON "transaction_items"("transaction_id", "waste_type_id");
CREATE INDEX "transaction_items_waste_type_id_idx" ON "transaction_items"("waste_type_id");
CREATE UNIQUE INDEX "financial_ledger_organization_id_reference_key_key" ON "financial_ledger"("organization_id", "reference_key");
CREATE INDEX "financial_ledger_organization_id_member_id_created_at_idx" ON "financial_ledger"("organization_id", "member_id", "created_at");
CREATE INDEX "financial_ledger_transaction_id_idx" ON "financial_ledger"("transaction_id");

ALTER TABLE "waste_price_versions" ADD CONSTRAINT "waste_price_versions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "waste_price_versions" ADD CONSTRAINT "waste_price_versions_waste_type_id_fkey" FOREIGN KEY ("waste_type_id") REFERENCES "waste_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "waste_price_versions" ADD CONSTRAINT "waste_price_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_finalized_by_fkey" FOREIGN KEY ("finalized_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_waste_type_id_fkey" FOREIGN KEY ("waste_type_id") REFERENCES "waste_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_ledger" ADD CONSTRAINT "financial_ledger_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "waste_price_versions" ("organization_id", "waste_type_id", "price_per_kg", "effective_from")
SELECT "organization_id", "id", "points_per_kg", "created_at" FROM "waste_types";

CREATE TRIGGER "financial_ledger_append_only" BEFORE UPDATE OR DELETE ON "financial_ledger"
FOR EACH ROW EXECUTE FUNCTION public.prevent_append_only_mutation();

ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "waste_price_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transaction_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "financial_ledger" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_tenant_access" ON "transactions" FOR ALL TO authenticated
USING (organization_id = public.current_organization_id())
WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "waste_price_versions_tenant_access" ON "waste_price_versions" FOR ALL TO authenticated
USING (organization_id = public.current_organization_id())
WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "transaction_items_tenant_access" ON "transaction_items" FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM "transactions" t WHERE t.id = transaction_id AND t.organization_id = public.current_organization_id()))
WITH CHECK (EXISTS (SELECT 1 FROM "transactions" t WHERE t.id = transaction_id AND t.organization_id = public.current_organization_id()));

CREATE POLICY "financial_ledger_select_own_tenant" ON "financial_ledger" FOR SELECT TO authenticated
USING (organization_id = public.current_organization_id());
