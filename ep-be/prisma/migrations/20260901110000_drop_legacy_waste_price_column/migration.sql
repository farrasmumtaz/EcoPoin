-- Prices are versioned in waste_price_versions; the legacy denormalized column
-- is no longer read by the application.
ALTER TABLE "waste_types" DROP COLUMN IF EXISTS "points_per_kg";
