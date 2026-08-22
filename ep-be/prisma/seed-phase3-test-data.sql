-- Phase 3 (verifikasi, ledger, redemption, passbook) test data.
--
-- Inserts ONE draft deposit against whatever member/waste type/org already
-- exists in the database, so you have something to call
-- POST /api/deposits/:id/verify (or /reject) against in Postman without
-- waiting on the real Setoran creation flow (that's still pending a team
-- decision - see claude/ecopoin-phase2-backend-status.md in the project).
--
-- Run this in the Supabase SQL editor (same place you'd run
-- verify-foundation.sql) — NOT through the app's own DB connection, same
-- caveat as that script. Safe to re-run: it skips insertion if the sentinel
-- deposit already exists.
DO $$
DECLARE
  v_org_id UUID;
  v_member_id UUID;
  v_waste_type_id UUID;
  v_profile_id UUID;
  v_price NUMERIC(14,2);
  v_deposit_id UUID;
  v_sentinel_client_uuid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  IF EXISTS (SELECT 1 FROM deposits WHERE client_uuid = v_sentinel_client_uuid) THEN
    RAISE NOTICE 'Sentinel test deposit already exists, skipping. Look it up with: SELECT id, status FROM deposits WHERE client_uuid = ''00000000-0000-0000-0000-000000000001'';';
    RETURN;
  END IF;

  SELECT id INTO v_org_id FROM organizations ORDER BY created_at LIMIT 1;
  SELECT id INTO v_member_id FROM members
    WHERE organization_id = v_org_id AND is_active = true ORDER BY created_at LIMIT 1;
  SELECT id, points_per_kg INTO v_waste_type_id, v_price FROM waste_types
    WHERE organization_id = v_org_id AND is_active = true ORDER BY created_at LIMIT 1;
  SELECT id INTO v_profile_id FROM profiles
    WHERE organization_id = v_org_id AND is_active = true ORDER BY created_at LIMIT 1;

  IF v_org_id IS NULL OR v_member_id IS NULL OR v_waste_type_id IS NULL OR v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Need at least one organization, one active member, one active waste type and one active profile in the DB before this can seed a test deposit.';
  END IF;

  v_deposit_id := gen_random_uuid();

  INSERT INTO deposits
    (id, organization_id, member_id, status, receipt_token, client_uuid, photo_path, created_by, updated_at)
  VALUES
    (v_deposit_id, v_org_id, v_member_id, 'DRAFT', gen_random_uuid(), v_sentinel_client_uuid, NULL, v_profile_id, now());

  INSERT INTO deposit_items
    (id, deposit_id, waste_type_id, weight_kg, points_per_kg_snapshot, subtotal_points)
  VALUES
    (gen_random_uuid(), v_deposit_id, v_waste_type_id, 5.000, v_price, ROUND(5.000 * v_price, 2));

  RAISE NOTICE 'Seeded draft deposit % for member % — use this id in POST /api/deposits/%/verify', v_deposit_id, v_member_id, v_deposit_id;
END $$;
