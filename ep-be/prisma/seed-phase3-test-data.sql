-- Phase 3 (finalize, settle, ledger, withdrawal, passbook) test data for the
-- rupiah domain (PRD v3.0).
--
-- Seeds:
--   1. an active STANDARD price version for one waste type, since the
--      rupiah pivot removed the old flat waste_types.points_per_kg column;
--   2. one DRAFT transaction + item, ready for
--      POST /api/transactions/:id/finalize (then /settle);
--   3. one REQUESTED withdrawal, ready for POST /api/withdrawals/:id/approve
--      (then /pay) - note /pay will correctly fail with INSUFFICIENT_BALANCE
--      unless the transaction above has already been settled as SAVINGS.
--
-- Run this in the Supabase SQL editor (same place you'd run
-- verify-foundation.sql) — NOT through the app's own DB connection, same
-- caveat as that script. Safe to re-run: it skips whatever sentinel rows
-- already exist.
DO $$
DECLARE
  v_org_id UUID;
  v_member_id UUID;
  v_waste_type_id UUID;
  v_profile_id UUID;
  v_open_price_id UUID;
  v_price NUMERIC(14,2);
  v_transaction_id UUID;
  v_withdrawal_id UUID;
  v_sentinel_client_uuid UUID := '00000000-0000-0000-0000-000000000001';
  v_withdrawal_marker VARCHAR(500) := 'Seeded test withdrawal';
BEGIN
  SELECT id INTO v_org_id FROM organizations ORDER BY created_at LIMIT 1;
  SELECT id INTO v_member_id FROM members
    WHERE organization_id = v_org_id AND is_active = true ORDER BY created_at LIMIT 1;
  SELECT id INTO v_waste_type_id FROM waste_types
    WHERE organization_id = v_org_id AND is_active = true ORDER BY created_at LIMIT 1;
  SELECT id INTO v_profile_id FROM profiles
    WHERE organization_id = v_org_id AND is_active = true ORDER BY created_at LIMIT 1;

  IF v_org_id IS NULL OR v_member_id IS NULL OR v_waste_type_id IS NULL OR v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Need at least one organization, one active member, one active waste type and one active profile in the DB before this can seed test data.';
  END IF;

  -- 1. Active STANDARD price for the chosen waste type.
  SELECT id, price_per_kg INTO v_open_price_id, v_price FROM waste_price_versions
    WHERE waste_type_id = v_waste_type_id AND price_scheme = 'STANDARD' AND effective_until IS NULL;

  IF v_open_price_id IS NULL THEN
    v_price := 1700.00; -- Rp1.700/kg, "Ditabung" example from root README's field price list
    INSERT INTO waste_price_versions (id, waste_type_id, price_scheme, price_per_kg, effective_from)
    VALUES (gen_random_uuid(), v_waste_type_id, 'STANDARD', v_price, now());
    RAISE NOTICE 'Seeded STANDARD price version for waste type % at Rp%/kg', v_waste_type_id, v_price;
  END IF;

  -- 2. Sentinel DRAFT transaction.
  IF NOT EXISTS (SELECT 1 FROM transactions WHERE client_uuid = v_sentinel_client_uuid) THEN
    v_transaction_id := gen_random_uuid();

    INSERT INTO transactions
      (id, organization_id, member_id, status, receipt_token, client_uuid, photo_path, created_by, updated_at)
    VALUES
      (v_transaction_id, v_org_id, v_member_id, 'DRAFT', gen_random_uuid(), v_sentinel_client_uuid, NULL, v_profile_id, now());

    INSERT INTO transaction_items
      (id, transaction_id, waste_type_id, weight_kg, price_per_kg_snapshot, subtotal_rupiah)
    VALUES
      (gen_random_uuid(), v_transaction_id, v_waste_type_id, 5.000, v_price, ROUND(5.000 * v_price, 2));

    RAISE NOTICE 'Seeded DRAFT transaction % for member % — use this id in POST /api/transactions/%/finalize', v_transaction_id, v_member_id, v_transaction_id;
  ELSE
    SELECT id INTO v_transaction_id FROM transactions WHERE client_uuid = v_sentinel_client_uuid;
    RAISE NOTICE 'Sentinel transaction already exists (%), skipping.', v_transaction_id;
  END IF;

  -- 3. Sentinel REQUESTED withdrawal. The id is a real gen_random_uuid() (not
  -- a hardcoded literal) because withdrawalIdSchema validates strict UUID v4
  -- on every /api/withdrawals/:id route - a fixed low-entropy literal like
  -- 00000000-...-002 fails that check. Idempotency is tracked via the notes
  -- marker instead of a fixed id.
  SELECT id INTO v_withdrawal_id FROM withdrawals
    WHERE member_id = v_member_id AND notes = v_withdrawal_marker;

  IF v_withdrawal_id IS NULL THEN
    v_withdrawal_id := gen_random_uuid();
    INSERT INTO withdrawals
      (id, organization_id, member_id, amount_rupiah, status, notes, created_by)
    VALUES
      (v_withdrawal_id, v_org_id, v_member_id, 5000.00, 'REQUESTED', v_withdrawal_marker, v_profile_id);

    RAISE NOTICE 'Seeded REQUESTED withdrawal % for member % — use this id in POST /api/withdrawals/%/approve', v_withdrawal_id, v_member_id, v_withdrawal_id;
  ELSE
    RAISE NOTICE 'Sentinel withdrawal already exists (%), skipping.', v_withdrawal_id;
  END IF;
END $$;
