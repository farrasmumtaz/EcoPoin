-- PRD v3.0: distinguish individual and unit profiles while preserving all
-- existing members and their transaction ownership.
CREATE TYPE "member_type" AS ENUM ('INDIVIDUAL', 'UNIT');

ALTER TABLE "organizations"
ADD COLUMN "activity_threshold_days" INTEGER NOT NULL DEFAULT 90;

ALTER TABLE "members"
ADD COLUMN "type" "member_type" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN "pic_name" VARCHAR(160),
ADD COLUMN "pic_phone" VARCHAR(32),
ADD COLUMN "last_activity_at" TIMESTAMPTZ(3),
ALTER COLUMN "rt" DROP NOT NULL;

ALTER TABLE "organizations"
ADD CONSTRAINT "organizations_activity_threshold_days_check"
CHECK ("activity_threshold_days" BETWEEN 1 AND 3650);

ALTER TABLE "members"
ADD CONSTRAINT "members_profile_shape_check"
CHECK (
  ("type" = 'INDIVIDUAL' AND "pic_name" IS NULL AND "pic_phone" IS NULL)
  OR
  ("type" = 'UNIT' AND "pic_name" IS NOT NULL)
);

DROP INDEX "members_organization_id_full_name_idx";
DROP INDEX "members_organization_id_rt_is_active_idx";

CREATE INDEX "members_organization_id_type_is_active_full_name_idx"
ON "members"("organization_id", "type", "is_active", "full_name");

CREATE INDEX "members_organization_id_last_activity_at_idx"
ON "members"("organization_id", "last_activity_at");

CREATE TABLE "member_relationships" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID NOT NULL,
  "individual_id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "member_relationships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "member_relationships_distinct_members_check"
    CHECK ("individual_id" <> "unit_id")
);

CREATE UNIQUE INDEX "member_relationships_organization_id_individual_id_unit_id_key"
ON "member_relationships"("organization_id", "individual_id", "unit_id");

CREATE INDEX "member_relationships_organization_id_unit_id_is_active_idx"
ON "member_relationships"("organization_id", "unit_id", "is_active");

CREATE INDEX "member_relationships_organization_id_individual_id_is_active_idx"
ON "member_relationships"("organization_id", "individual_id", "is_active");

ALTER TABLE "member_relationships"
ADD CONSTRAINT "member_relationships_organization_id_fkey"
FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "member_relationships"
ADD CONSTRAINT "member_relationships_individual_id_fkey"
FOREIGN KEY ("individual_id") REFERENCES "members"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "member_relationships"
ADD CONSTRAINT "member_relationships_unit_id_fkey"
FOREIGN KEY ("unit_id") REFERENCES "members"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION public.validate_member_relationship()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.members
    WHERE id = NEW.individual_id
      AND organization_id = NEW.organization_id
      AND type = 'INDIVIDUAL'
  ) THEN
    RAISE EXCEPTION 'individual must belong to the tenant and have INDIVIDUAL type';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.members
    WHERE id = NEW.unit_id
      AND organization_id = NEW.organization_id
      AND type = 'UNIT'
  ) THEN
    RAISE EXCEPTION 'unit must belong to the tenant and have UNIT type';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "member_relationships_validate_members"
BEFORE INSERT OR UPDATE ON "member_relationships"
FOR EACH ROW EXECUTE FUNCTION public.validate_member_relationship();

ALTER TABLE "member_relationships" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_relationships_tenant_access"
ON "member_relationships" FOR ALL TO authenticated
USING (organization_id = public.current_organization_id())
WITH CHECK (organization_id = public.current_organization_id());
