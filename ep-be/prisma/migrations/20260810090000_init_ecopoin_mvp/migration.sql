-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'OPERATOR', 'COORDINATOR');

-- CreateEnum
CREATE TYPE "waste_category" AS ENUM ('ORGANIC', 'INORGANIC');

-- CreateEnum
CREATE TYPE "deposit_status" AS ENUM ('DRAFT', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ledger_entry_type" AS ENUM ('CREDIT', 'DEBIT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "ledger_source_type" AS ENUM ('DEPOSIT', 'REDEMPTION');

-- CreateEnum
CREATE TYPE "redemption_status" AS ENUM ('COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "address" VARCHAR(500),
    "contact_phone" VARCHAR(32),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "full_name" VARCHAR(160) NOT NULL,
    "role" "user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "member_number" VARCHAR(32) NOT NULL,
    "full_name" VARCHAR(160) NOT NULL,
    "rt" VARCHAR(16) NOT NULL,
    "phone" VARCHAR(32),
    "public_token" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_types" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "category" "waste_category" NOT NULL,
    "unit" VARCHAR(16) NOT NULL DEFAULT 'kg',
    "points_per_kg" DECIMAL(14,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "waste_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact_factors" (
    "id" UUID NOT NULL,
    "waste_type_id" UUID NOT NULL,
    "factor_value" DECIMAL(18,6) NOT NULL,
    "unit" VARCHAR(80) NOT NULL,
    "source_url" TEXT NOT NULL,
    "source_accessed_at" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "impact_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "status" "deposit_status" NOT NULL DEFAULT 'DRAFT',
    "receipt_token" UUID NOT NULL,
    "client_uuid" UUID NOT NULL,
    "photo_path" TEXT,
    "created_by" UUID NOT NULL,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ(3),
    "rejection_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_items" (
    "id" UUID NOT NULL,
    "deposit_id" UUID NOT NULL,
    "waste_type_id" UUID NOT NULL,
    "weight_kg" DECIMAL(12,3) NOT NULL,
    "points_per_kg_snapshot" DECIMAL(14,2) NOT NULL,
    "subtotal_points" DECIMAL(16,2) NOT NULL,

    CONSTRAINT "deposit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_ledger" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "entry_type" "ledger_entry_type" NOT NULL,
    "points" DECIMAL(16,2) NOT NULL,
    "source_type" "ledger_source_type" NOT NULL,
    "source_id" UUID NOT NULL,
    "reversal_of_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redemptions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "points" DECIMAL(16,2) NOT NULL,
    "redemption_type" VARCHAR(120) NOT NULL,
    "status" "redemption_status" NOT NULL DEFAULT 'COMPLETED',
    "notes" VARCHAR(500),
    "created_by" UUID NOT NULL,
    "cancelled_by" UUID,
    "cancellation_reason" VARCHAR(500),
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" VARCHAR(120) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID NOT NULL,
    "reason" VARCHAR(500),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profiles_organization_id_is_active_idx" ON "profiles"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "members_public_token_key" ON "members"("public_token");

-- CreateIndex
CREATE INDEX "members_organization_id_full_name_idx" ON "members"("organization_id", "full_name");

-- CreateIndex
CREATE INDEX "members_organization_id_rt_is_active_idx" ON "members"("organization_id", "rt", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "members_organization_id_member_number_key" ON "members"("organization_id", "member_number");

-- CreateIndex
CREATE INDEX "waste_types_organization_id_category_is_active_idx" ON "waste_types"("organization_id", "category", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "waste_types_organization_id_name_key" ON "waste_types"("organization_id", "name");

-- CreateIndex
CREATE INDEX "impact_factors_waste_type_id_is_active_idx" ON "impact_factors"("waste_type_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_receipt_token_key" ON "deposits"("receipt_token");

-- CreateIndex
CREATE INDEX "deposits_organization_id_status_created_at_idx" ON "deposits"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "deposits_organization_id_member_id_created_at_idx" ON "deposits"("organization_id", "member_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "deposits_organization_id_client_uuid_key" ON "deposits"("organization_id", "client_uuid");

-- CreateIndex
CREATE INDEX "deposit_items_waste_type_id_idx" ON "deposit_items"("waste_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_items_deposit_id_waste_type_id_key" ON "deposit_items"("deposit_id", "waste_type_id");

-- CreateIndex
CREATE INDEX "point_ledger_organization_id_member_id_created_at_idx" ON "point_ledger"("organization_id", "member_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "point_ledger_organization_id_source_type_source_id_entry_ty_key" ON "point_ledger"("organization_id", "source_type", "source_id", "entry_type");

-- CreateIndex
CREATE UNIQUE INDEX "point_ledger_reversal_of_id_key" ON "point_ledger"("reversal_of_id");

-- CreateIndex
CREATE INDEX "redemptions_organization_id_member_id_created_at_idx" ON "redemptions"("organization_id", "member_id", "created_at");

-- CreateIndex
CREATE INDEX "redemptions_organization_id_status_created_at_idx" ON "redemptions"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_entity_type_entity_id_idx" ON "audit_logs"("organization_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_types" ADD CONSTRAINT "waste_types_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impact_factors" ADD CONSTRAINT "impact_factors_waste_type_id_fkey" FOREIGN KEY ("waste_type_id") REFERENCES "waste_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_items" ADD CONSTRAINT "deposit_items_deposit_id_fkey" FOREIGN KEY ("deposit_id") REFERENCES "deposits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_items" ADD CONSTRAINT "deposit_items_waste_type_id_fkey" FOREIGN KEY ("waste_type_id") REFERENCES "waste_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "point_ledger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Supabase auth owns the user lifecycle. Keep this migration usable in a
-- regular PostgreSQL shadow database where auth.users does not exist.
DO $$
BEGIN
    IF to_regclass('auth.users') IS NOT NULL THEN
        ALTER TABLE "profiles"
            ADD CONSTRAINT "profiles_auth_user_fkey"
            FOREIGN KEY ("id") REFERENCES auth.users("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Domain invariants. Monetary-like point values are decimal and ledger points
-- are signed so a balance is always SUM(point_ledger.points).
ALTER TABLE "waste_types"
    ADD CONSTRAINT "waste_types_points_per_kg_positive"
    CHECK ("points_per_kg" > 0);

ALTER TABLE "impact_factors"
    ADD CONSTRAINT "impact_factors_factor_value_positive"
    CHECK ("factor_value" > 0);

ALTER TABLE "deposit_items"
    ADD CONSTRAINT "deposit_items_weight_positive"
        CHECK ("weight_kg" > 0),
    ADD CONSTRAINT "deposit_items_points_snapshot_positive"
        CHECK ("points_per_kg_snapshot" > 0),
    ADD CONSTRAINT "deposit_items_subtotal_positive"
        CHECK ("subtotal_points" > 0),
    ADD CONSTRAINT "deposit_items_subtotal_matches_snapshot"
        CHECK ("subtotal_points" = ROUND("weight_kg" * "points_per_kg_snapshot", 2));

ALTER TABLE "deposits"
    ADD CONSTRAINT "deposits_status_fields_valid"
    CHECK (
        ("status" = 'DRAFT' AND "verified_by" IS NULL AND "verified_at" IS NULL AND "rejection_reason" IS NULL)
        OR
        ("status" = 'VERIFIED' AND "verified_by" IS NOT NULL AND "verified_at" IS NOT NULL AND "rejection_reason" IS NULL)
        OR
        ("status" = 'REJECTED' AND "verified_by" IS NOT NULL AND "verified_at" IS NOT NULL AND NULLIF(BTRIM("rejection_reason"), '') IS NOT NULL)
    );

ALTER TABLE "point_ledger"
    ADD CONSTRAINT "point_ledger_entry_sign_valid"
    CHECK (
        ("entry_type" = 'CREDIT' AND "points" > 0 AND "reversal_of_id" IS NULL)
        OR
        ("entry_type" = 'DEBIT' AND "points" < 0 AND "reversal_of_id" IS NULL)
        OR
        ("entry_type" = 'REVERSAL' AND "points" <> 0 AND "reversal_of_id" IS NOT NULL)
    );

ALTER TABLE "redemptions"
    ADD CONSTRAINT "redemptions_points_positive"
        CHECK ("points" > 0),
    ADD CONSTRAINT "redemptions_status_fields_valid"
        CHECK (
            ("status" = 'COMPLETED' AND "cancelled_by" IS NULL AND "cancelled_at" IS NULL AND "cancellation_reason" IS NULL)
            OR
            ("status" = 'CANCELLED' AND "cancelled_by" IS NOT NULL AND "cancelled_at" IS NOT NULL AND NULLIF(BTRIM("cancellation_reason"), '') IS NOT NULL)
        );

-- Validate organization ownership even when writes use a service connection
-- that bypasses RLS.
CREATE OR REPLACE FUNCTION public.validate_deposit_tenant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.members
        WHERE id = NEW.member_id AND organization_id = NEW.organization_id
    ) THEN
        RAISE EXCEPTION 'Deposit member belongs to a different organization';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.created_by AND organization_id = NEW.organization_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Deposit creator is not active in this organization';
    END IF;

    IF NEW.verified_by IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.verified_by AND organization_id = NEW.organization_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Deposit verifier is not active in this organization';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "deposits_validate_tenant"
BEFORE INSERT OR UPDATE ON "deposits"
FOR EACH ROW EXECUTE FUNCTION public.validate_deposit_tenant();

CREATE OR REPLACE FUNCTION public.validate_deposit_item_tenant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.deposits d
        JOIN public.waste_types w ON w.id = NEW.waste_type_id
        WHERE d.id = NEW.deposit_id
          AND d.organization_id = w.organization_id
    ) THEN
        RAISE EXCEPTION 'Deposit item waste type belongs to a different organization';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "deposit_items_validate_tenant"
BEFORE INSERT OR UPDATE ON "deposit_items"
FOR EACH ROW EXECUTE FUNCTION public.validate_deposit_item_tenant();

CREATE OR REPLACE FUNCTION public.validate_ledger_entry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    original_entry public.point_ledger%ROWTYPE;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.members
        WHERE id = NEW.member_id AND organization_id = NEW.organization_id
    ) THEN
        RAISE EXCEPTION 'Ledger member belongs to a different organization';
    END IF;

    IF NEW.entry_type = 'REVERSAL' THEN
        SELECT * INTO original_entry
        FROM public.point_ledger
        WHERE id = NEW.reversal_of_id;

        IF NOT FOUND
           OR original_entry.organization_id <> NEW.organization_id
           OR original_entry.member_id <> NEW.member_id
           OR original_entry.entry_type = 'REVERSAL'
           OR NEW.points <> -original_entry.points THEN
            RAISE EXCEPTION 'Invalid ledger reversal';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "point_ledger_validate_entry"
BEFORE INSERT ON "point_ledger"
FOR EACH ROW EXECUTE FUNCTION public.validate_ledger_entry();

CREATE OR REPLACE FUNCTION public.validate_redemption_tenant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.members
        WHERE id = NEW.member_id AND organization_id = NEW.organization_id
    ) THEN
        RAISE EXCEPTION 'Redemption member belongs to a different organization';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.created_by AND organization_id = NEW.organization_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Redemption creator is not active in this organization';
    END IF;

    IF NEW.cancelled_by IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = NEW.cancelled_by AND organization_id = NEW.organization_id AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Redemption canceller is not active in this organization';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "redemptions_validate_tenant"
BEFORE INSERT OR UPDATE ON "redemptions"
FOR EACH ROW EXECUTE FUNCTION public.validate_redemption_tenant();

-- Verified/rejected deposits and the financial/audit trail are append-only.
CREATE OR REPLACE FUNCTION public.prevent_final_deposit_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF OLD.status <> 'DRAFT' THEN
        RAISE EXCEPTION 'Finalized deposits are immutable; create a ledger reversal instead';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "deposits_prevent_final_mutation"
BEFORE UPDATE OR DELETE ON "deposits"
FOR EACH ROW EXECUTE FUNCTION public.prevent_final_deposit_mutation();

CREATE OR REPLACE FUNCTION public.prevent_append_only_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER "point_ledger_append_only"
BEFORE UPDATE OR DELETE ON "point_ledger"
FOR EACH ROW EXECUTE FUNCTION public.prevent_append_only_mutation();

CREATE TRIGGER "audit_logs_append_only"
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION public.prevent_append_only_mutation();

-- Resolve tenant identity from Supabase's request claims without depending on
-- auth.uid(), keeping shadow database migrations portable.
CREATE OR REPLACE FUNCTION public.request_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT p.organization_id
    FROM public.profiles p
    WHERE p.id = public.request_user_id()
      AND p.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT p.role
    FROM public.profiles p
    WHERE p.id = public.request_user_id()
      AND p.is_active = true;
$$;

REVOKE ALL ON FUNCTION public.current_organization_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "waste_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "impact_factors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deposits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deposit_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "point_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "redemptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select_own"
ON "organizations" FOR SELECT TO authenticated
USING (id = public.current_organization_id());

CREATE POLICY "organizations_update_privileged"
ON "organizations" FOR UPDATE TO authenticated
USING (
    id = public.current_organization_id()
    AND public.current_user_role() IN ('ADMIN', 'COORDINATOR')
)
WITH CHECK (id = public.current_organization_id());

CREATE POLICY "profiles_select_own_tenant"
ON "profiles" FOR SELECT TO authenticated
USING (organization_id = public.current_organization_id());

CREATE POLICY "profiles_manage_by_admin"
ON "profiles" FOR ALL TO authenticated
USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'ADMIN'
)
WITH CHECK (
    organization_id = public.current_organization_id()
    AND public.current_user_role() = 'ADMIN'
);

CREATE POLICY "members_tenant_access"
ON "members" FOR ALL TO authenticated
USING (organization_id = public.current_organization_id())
WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "waste_types_tenant_access"
ON "waste_types" FOR ALL TO authenticated
USING (organization_id = public.current_organization_id())
WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "impact_factors_tenant_access"
ON "impact_factors" FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.waste_types w
        WHERE w.id = impact_factors.waste_type_id
          AND w.organization_id = public.current_organization_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.waste_types w
        WHERE w.id = impact_factors.waste_type_id
          AND w.organization_id = public.current_organization_id()
    )
);

CREATE POLICY "deposits_tenant_access"
ON "deposits" FOR ALL TO authenticated
USING (organization_id = public.current_organization_id())
WITH CHECK (organization_id = public.current_organization_id());

CREATE POLICY "deposit_items_tenant_access"
ON "deposit_items" FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.deposits d
        WHERE d.id = deposit_items.deposit_id
          AND d.organization_id = public.current_organization_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.deposits d
        WHERE d.id = deposit_items.deposit_id
          AND d.organization_id = public.current_organization_id()
    )
);

CREATE POLICY "point_ledger_select_own_tenant"
ON "point_ledger" FOR SELECT TO authenticated
USING (organization_id = public.current_organization_id());

CREATE POLICY "redemptions_select_own_tenant"
ON "redemptions" FOR SELECT TO authenticated
USING (organization_id = public.current_organization_id());

CREATE POLICY "audit_logs_select_privileged"
ON "audit_logs" FOR SELECT TO authenticated
USING (
    organization_id = public.current_organization_id()
    AND public.current_user_role() IN ('ADMIN', 'COORDINATOR')
);
