CREATE TYPE "public"."withdrawal_status" AS ENUM ('REQUESTED', 'APPROVED', 'PAID', 'REJECTED');

CREATE TABLE "public"."withdrawals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "member_id" UUID NOT NULL,
  "status" "public"."withdrawal_status" NOT NULL DEFAULT 'REQUESTED',
  "amount" DECIMAL(18,2) NOT NULL,
  "notes" VARCHAR(500),
  "rejection_reason" VARCHAR(500),
  "requested_by" UUID NOT NULL,
  "approved_by" UUID,
  "paid_by" UUID,
  "approved_at" TIMESTAMPTZ(3),
  "paid_at" TIMESTAMPTZ(3),
  "rejected_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "withdrawals_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "withdrawals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT,
  CONSTRAINT "withdrawals_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE RESTRICT,
  CONSTRAINT "withdrawals_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "withdrawals_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT,
  CONSTRAINT "withdrawals_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT
);

CREATE INDEX "withdrawals_organization_id_status_created_at_idx" ON "public"."withdrawals"("organization_id", "status", "created_at");
CREATE INDEX "withdrawals_organization_id_member_id_created_at_idx" ON "public"."withdrawals"("organization_id", "member_id", "created_at");

ALTER TABLE "public"."financial_ledger" ADD COLUMN "withdrawal_id" UUID;
CREATE UNIQUE INDEX "financial_ledger_withdrawal_id_key" ON "public"."financial_ledger"("withdrawal_id");
ALTER TABLE "public"."financial_ledger" ADD CONSTRAINT "financial_ledger_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "public"."withdrawals"("id") ON DELETE RESTRICT;

ALTER TABLE "public"."withdrawals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "withdrawals_tenant_access" ON "public"."withdrawals" FOR ALL TO authenticated
USING ("organization_id" = public.current_organization_id())
WITH CHECK ("organization_id" = public.current_organization_id());
