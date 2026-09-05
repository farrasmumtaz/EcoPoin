ALTER TABLE "public"."transactions"
  ADD COLUMN IF NOT EXISTS "receipt_number" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "member_name_snapshot" VARCHAR(160);

CREATE UNIQUE INDEX IF NOT EXISTS "transactions_receipt_number_key"
  ON "public"."transactions"("receipt_number");

-- The application trigger intentionally protects completed transactions.
-- Disable user triggers only for this controlled snapshot backfill.
ALTER TABLE "public"."transactions" DISABLE TRIGGER USER;

UPDATE "public"."transactions" AS transaction
SET
  "receipt_number" = 'ECP-' || TO_CHAR(transaction."created_at" AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(transaction."id"::text, '-', '') FROM 1 FOR 8)),
  "member_name_snapshot" = member."full_name"
FROM "public"."members" AS member
WHERE transaction."member_id" = member."id"
  AND transaction."status" = 'COMPLETED';

ALTER TABLE "public"."transactions" ENABLE TRIGGER USER;
