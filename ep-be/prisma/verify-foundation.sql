-- Read-only post-migration checks for the Supabase SQL editor.

WITH expected(table_name) AS (
    VALUES
        ('organizations'),
        ('profiles'),
        ('members'),
        ('waste_types'),
        ('impact_factors'),
        ('deposits'),
        ('deposit_items'),
        ('point_ledger'),
        ('redemptions'),
        ('audit_logs')
)
SELECT
    expected.table_name,
    to_regclass('public.' || expected.table_name) IS NOT NULL AS exists
FROM expected
ORDER BY expected.table_name;

SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
      'organizations', 'profiles', 'members', 'waste_types',
      'impact_factors', 'deposits', 'deposit_items', 'point_ledger',
      'redemptions', 'audit_logs'
  )
ORDER BY c.relname;

SELECT
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
      'organizations', 'profiles', 'members', 'waste_types',
      'impact_factors', 'deposits', 'deposit_items', 'point_ledger',
      'redemptions', 'audit_logs'
  )
ORDER BY tablename, policyname;

SELECT
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid IN (
      'public.deposits'::regclass,
      'public.deposit_items'::regclass,
      'public.point_ledger'::regclass,
      'public.redemptions'::regclass
  )
ORDER BY table_name::text, constraint_name;
