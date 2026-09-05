CREATE TYPE "waste_category_v2" AS ENUM ('PLASTIC', 'PAPER', 'METAL', 'GLASS', 'OTHER');
CREATE TYPE "waste_condition" AS ENUM ('SORTED', 'UNSORTED');

ALTER TABLE "waste_types"
ALTER COLUMN "category" TYPE "waste_category_v2"
USING (
  CASE
    WHEN lower("name") ~ '(plastik|pet|pp|hd)' THEN 'PLASTIC'
    WHEN lower("name") ~ '(kertas|duplek|koran|arsip)' THEN 'PAPER'
    WHEN lower("name") ~ '(logam|besi|aluminium|kaleng|tembaga)' THEN 'METAL'
    WHEN lower("name") ~ '(kaca|beling|botol bir)' THEN 'GLASS'
    ELSE 'OTHER'
  END
)::"waste_category_v2";

DROP TYPE "waste_category";
ALTER TYPE "waste_category_v2" RENAME TO "waste_category";

DROP INDEX IF EXISTS "waste_price_versions_organization_id_waste_type_id_effective_from_idx";

ALTER TABLE "waste_price_versions"
ADD COLUMN "condition" "waste_condition" NOT NULL DEFAULT 'SORTED';

-- Preserve the former single price as the initial price for both conditions.
INSERT INTO "waste_price_versions" (
  "id", "organization_id", "waste_type_id", "price_per_kg", "condition",
  "effective_from", "effective_until", "created_by", "created_at"
)
SELECT
  gen_random_uuid(), "organization_id", "waste_type_id", "price_per_kg", 'UNSORTED',
  "effective_from", "effective_until", "created_by", "created_at"
FROM "waste_price_versions"
WHERE "condition" = 'SORTED';

CREATE INDEX "waste_price_versions_organization_id_waste_type_id_condition_effective_from_idx"
ON "waste_price_versions"("organization_id", "waste_type_id", "condition", "effective_from");

ALTER TABLE "transaction_items"
ADD COLUMN "condition" "waste_condition" NOT NULL DEFAULT 'SORTED';

DROP INDEX IF EXISTS "transaction_items_transaction_id_waste_type_id_key";
CREATE UNIQUE INDEX "transaction_items_transaction_id_waste_type_id_condition_key"
ON "transaction_items"("transaction_id", "waste_type_id", "condition");
