# EcoPoin Backend

Next.js App Router API untuk autentikasi, master warga, jenis sampah, dan transaksi setoran EcoPoin. Autentikasi menggunakan Supabase Auth melalui cookie HTTP-only; data aplikasi dikelola dengan Prisma dan PostgreSQL Supabase.

## Menjalankan aplikasi

```powershell
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## Environment

Salin `.env.example` menjadi `.env`. Jangan commit `.env` atau service-role key.

## Kontrak transaksi setoran

Semua request memakai cookie hasil `POST /api/auth/login` (`withCredentials: true` pada Axios).

| Method | Path | Fungsi |
| --- | --- | --- |
| `POST` | `/api/transactions` | Membuat draft idempotent |
| `GET` | `/api/transactions` | Daftar/filter transaksi |
| `GET` | `/api/transactions/:id` | Detail transaksi |
| `PATCH` | `/api/transactions/:id` | Mengubah draft |
| `POST` | `/api/transactions/:id/finalize` | Mengunci draft |
| `POST` | `/api/transactions/:id/complete` | Menyelesaikan tunai/tabungan |
| `POST` | `/api/transactions/:id/cancel` | Membatalkan draft/finalized |

```json
{
  "memberId": "UUID_WARGA",
  "clientRequestId": "UUID_UNIK_DARI_CLIENT",
  "source": "DIRECT_ENTRY",
  "notes": "Setoran mingguan",
  "items": [
    {
      "wasteTypeId": "UUID_JENIS_SAMPAH",
      "condition": "SORTED",
      "weightKg": 4.25
    }
  ]
}
```

Kategori material tersedia sebagai `PLASTIC`, `PAPER`, `METAL`, `GLASS`, dan `OTHER`. Setiap jenis memiliki harga `SORTED` dan `UNSORTED` yang berversi. Harga tidak diterima dari frontend; transaksi memilih versi aktif sesuai kondisi lalu menyimpan snapshot rupiah/kg. Penyelesaian memakai `{ "payoutMethod": "DIRECT_CASH" }` atau `{ "payoutMethod": "SAVINGS" }`; hanya `SAVINGS` yang menghasilkan kredit ledger.

Urutan status valid: `DRAFT -> FINALIZED -> COMPLETED`. Draft/finalized dapat dibatalkan menjadi `CANCELLED`. Filter daftar: `memberId`, `status`, `dateFrom`, `dateTo`, `page`, dan `limit`.

## Quality check

```powershell
npm run lint
npm run type-check
npm run build
```
