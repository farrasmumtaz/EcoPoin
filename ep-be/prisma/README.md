# EcoPoin database foundation

The initial migration creates the complete MVP data model and enables tenant
isolation for Supabase authenticated users.

## Apply

Use a direct PostgreSQL connection for migrations, not a transaction-pooler
URL. Set `DIRECT_URL` to the Supabase direct/session connection; Prisma falls
back to `DATABASE_URL` when it is not set. Apply committed migrations with:

```bash
npx prisma migrate deploy
npx prisma generate
```

Then run `prisma/verify-foundation.sql` in the Supabase SQL editor. Do not run
the verification script through the application connection because some
catalog fields may be hidden from restricted roles.

## Identity provisioning

Every authenticated operator must have both:

1. a row in `auth.users`;
2. a `profiles` row whose `id` equals `auth.users.id`.

The profile role and organization must match the user's protected
`app_metadata`:

```json
{
  "organization_id": "organization-uuid",
  "role": "ADMIN"
}
```

Provision these values only from a trusted server process using the Supabase
service-role key. Never allow a browser client to update `app_metadata`.

## Ledger convention

`ledger_entries.amount_rupiah` is signed:

- `DEPOSIT` / `OPENING_BALANCE`: positive;
- `WITHDRAWAL`: negative;
- `REVERSAL`: the exact negation of the referenced entry;
- `ADJUSTMENT`: either sign, per the correction being made.

Therefore a member balance is always:

```sql
SELECT COALESCE(SUM(amount_rupiah), 0)
FROM ledger_entries
WHERE organization_id = $1 AND member_id = $2;
```

The database prevents duplicate source entries, multiple reversals of the same
entry, mutation of ledger/audit rows, and edits to completed or cancelled
transactions.

## Public receipts

There is intentionally no anonymous RLS policy on `members` or `transactions`.
Public receipt/member-token endpoints must run on the backend, validate the
random token, and return a privacy-filtered response.
