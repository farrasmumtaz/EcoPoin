# EcoPoin

[![CI](https://github.com/farrasmumtaz/EcoPoin/actions/workflows/ci.yml/badge.svg)](https://github.com/farrasmumtaz/EcoPoin/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

EcoPoin adalah platform web untuk mengubah catatan transaksi bank sampah yang datar dan tercampur menjadi profil nasabah, saldo, buku tabungan digital, riwayat aktivitas, serta rekap individu dan unit yang dapat ditelusuri.

Produk dirancang untuk mendukung dua pola adopsi:

- bank sampah yang masih manual dapat mencatat transaksi langsung di EcoPoin;
- bank sampah yang sudah komputerisasi dapat mengimpor CSV/XLSX tanpa mengganti sistem operasionalnya secara paksa.

> Status produk: provisional berdasarkan wawancara lapangan pertama dari lima rekaman. Scope belum memasuki feature freeze.

## Dasar Riset

Wawancara dilakukan kepada pengurus Bank Sampah Induk Kota Bandung di bawah DLH pada 18 Agustus 2026 

Temuan utama:
- transaksi sudah dicatat di laptop dan nota sudah dicetak;
- buku tabungan warga masih manual dan sering ditulis dua kali karena risiko hilang;
- catatan harian individu dan unit tercampur;
- pengurus tidak mengetahui nasabah atau unit yang masih aktif;
- nasabah dapat menerima tunai langsung atau memasukkan hasil setoran ke tabungan;
- terdapat saldo dan proses penarikan nyata;
- perbedaan persepsi jenis/kondisi sampah menyebabkan perbedaan harga;
- permintaan penjemputan masih manual;
- sampah organik ditangani unit kelembagaan terpisah.

Karena itu EcoPoin tidak lagi diposisikan hanya sebagai aplikasi pencatatan setoran atau sistem poin.

## Masalah yang Diselesaikan

Data transaksi yang tidak terhubung kuat dengan entitas nasabah menyebabkan pengurus hanya mengetahui total bulanan. Pengurus belum dapat menjawab secara cepat:

- kapan seorang nasabah terakhir menabung;
- berapa saldo dan mutasi yang membentuk saldo tersebut;
- siapa yang masih aktif atau mulai pasif;
- berapa setoran setiap unit per bulan;
- transaksi mana yang tunai langsung dan mana yang masuk tabungan;
- harga versi mana yang digunakan pada transaksi lama;
- apakah saldo sistem cocok dengan buku fisik atau data sebelumnya.

## Posisi Produk

EcoPoin merupakan **customer, savings, and activity intelligence layer for waste banks**.

EcoPoin bukan:

- aplikasi yang memaksa semua bank sampah mengganti sistem lama;
- sistem poin dan penukaran hadiah;
- marketplace sampah;
- aplikasi optimasi rute armada;
- modul pengolahan sampah organik;
- klasifikasi sampah otomatis berbasis AI.

## Alur Utama

```text
Nasabah individu/unit
        |
        v
Klasifikasi jenis dan kondisi sampah
        |
        v
Penimbangan per jenis
        |
        v
Harga aktif + snapshot -> subtotal -> total
        |
        v
Finalisasi transaksi
        |
        +--------------------------+
        |                          |
        v                          v
DIRECT_CASH                    SAVINGS
catat pembayaran              kredit ledger
saldo tidak bertambah         saldo bertambah
        |                          |
        +------------+-------------+
                     v
              nota + history
                     |
                     v
       buku tabungan digital / QR
```

Penarikan tabungan menggunakan alur terpisah:

```text
REQUESTED -> APPROVED -> PAID -> debit ledger
         \-> REJECTED
```

## Fitur MVP

### P0 - Wajib

- Autentikasi pengurus, RBAC, dan isolasi data organisasi.
- Profil nasabah bertipe `INDIVIDUAL` atau `UNIT`.
- Relasi individu-unit tanpa mencampur kepemilikan transaksi.
- Riwayat, saldo, statistik, terakhir menabung, dan status aktif.
- Katalog jenis sampah, kategori material, kondisi, satuan, serta riwayat harga.
- Pencatatan transaksi multi-item.
- Impor CSV dengan template, preview, validasi, dan idempotency.
- Pilihan `DIRECT_CASH` atau `SAVINGS`.
- Ledger rupiah append-only.
- Opening balance untuk migrasi data lama.
- Penarikan saldo dengan alur persetujuan dan audit.
- Nota transaksi dan cetak ulang.
- Dashboard keaktifan dan rekap per unit.
- Audit log dan rekonsiliasi saldo.

### P1 - Jika waktu memungkinkan

- Katalog sampah publik bergambar.
- Pengingat nasabah yang mendekati status tidak aktif.
- Ekspor laporan lanjutan.
- Adjustment saldo terbatas dengan approval dan audit.

### Tidak termasuk MVP

- GPS, routing, dan optimasi empat armada.
- Marketplace atau payment gateway.
- Aplikasi mobile native.
- Gamifikasi, poin, badge, dan redemption.
- Modul pengolahan organik.
- AI/computer vision untuk klasifikasi sampah.
- Integrasi otomatis dengan platform pihak ketiga.

## Aturan Bisnis Kritis

- Pengurus, bukan nasabah, mencatat atau mengimpor transaksi.
- Harga transaksi disimpan sebagai snapshot.
- Perubahan daftar harga tidak mengubah transaksi lama.
- `DIRECT_CASH` tidak menambah saldo.
- `SAVINGS` menghasilkan tepat satu kredit ledger.
- Saldo dihitung dari agregasi ledger, bukan kolom yang diedit langsung.
- Penarikan `PAID` menghasilkan tepat satu debit ledger.
- Saldo negatif ditolak.
- Transaksi dan mutasi finansial yang selesai tidak dihapus.
- Koreksi menggunakan `VOID`, `REVERSAL`, dan transaksi pengganti.
- Individu dan unit harus dapat direkap secara terpisah.
- Mutasi kritis harus atomik, idempotent, dan memiliki audit trail.

## Model Ledger

Jenis mutasi minimum:

```text
DEPOSIT
WITHDRAWAL
OPENING_BALANCE
REVERSAL
ADJUSTMENT
```

Perhitungan saldo:

```text
balance = SUM(credit) - SUM(debit)
```

Contoh:

| Tanggal | Jenis | Referensi | Kredit | Debit | Saldo |
| --- | --- | --- | ---: | ---: | ---: |
| 18 Agustus | Setoran | TRX-001 | Rp50.000 | - | Rp50.000 |
| 25 Agustus | Setoran | TRX-015 | Rp30.000 | - | Rp80.000 |
| 28 Agustus | Penarikan | WDR-003 | - | Rp25.000 | Rp55.000 |

## Katalog dan Harga

Daftar harga lapangan berlaku per 1 Agustus 2026 dan tertulis dapat berubah sewaktu-waktu. Foto sumber memperlihatkan lebih dari satu kolom harga, termasuk kolom `DITABUNG` dan kolom berlabel `U/LASM` yang maknanya masih harus dikonfirmasi.

Implementasi harus menggunakan harga berversi:

```text
waste_type
price_scheme
price_per_kg
effective_from
effective_until
```

Contoh lapangan, bukan konstanta aplikasi:

| Jenis | U/LASM | Ditabung |
| --- | ---: | ---: |
| Ember campur | Rp1.000/kg | Rp1.700/kg |
| PET bersih | Rp3.000/kg | Rp5.000/kg |
| PET kotor | Rp2.300/kg | Rp2.500/kg |
| PET warna | Rp500/kg | Rp800/kg |
| PP/plastik bening | Rp600/kg | Rp1.000/kg |

## Domain Model

Entitas utama yang direkomendasikan:

```text
organizations
profiles
members
member_relationships
waste_types
waste_price_versions
transactions
transaction_items
ledger_entries
withdrawals
receipts
import_batches
pickup_requests
audit_logs
```

Relasi ringkas:

```text
organization
  +-- profiles
  +-- members (INDIVIDUAL | UNIT)
  |     +-- transactions
  |     +-- ledger_entries
  |     +-- withdrawals
  +-- waste_types
        +-- waste_price_versions
```

## Status Domain

### Transaction

```text
DRAFT -> FINALIZED -> COMPLETED
  |          |
  +----------+-> CANCELLED
COMPLETED -> VOIDED + replacement transaction
```

### Withdrawal

```text
REQUESTED -> APPROVED -> PAID
         \-> REJECTED
```

## Arsitektur

```text
Browser
   |
   v
ep-fe - Next.js App Router
   |
   | HTTPS / JSON / secure cookie
   v
ep-be - Next.js API
   |
   +--> Supabase Auth
   +--> Supabase PostgreSQL + RLS
   +--> Supabase Storage
```

Repository memisahkan frontend dan backend sebagai deployment unit:

```text
.
â”œâ”€â”€ .github/workflows/ci.yml
â”œâ”€â”€ compose.yml
â”œâ”€â”€ ep-fe/
â”‚   â”œâ”€â”€ src/app/
â”‚   â””â”€â”€ Dockerfile
â””â”€â”€ ep-be/
    â”œâ”€â”€ prisma/
    â”œâ”€â”€ src/app/
    â””â”€â”€ Dockerfile
```

## Teknologi

| Area | Teknologi |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Form dan validasi | React Hook Form, Zod |
| Backend/API | Next.js App Router, Route Handlers, Server Actions |
| Database | Supabase PostgreSQL, Prisma ORM |
| Auth dan storage | Supabase Auth, Supabase Storage |
| Security | RLS, JOSE, bcryptjs, CORS allowlist, security headers, rate limiting |
| Delivery | Docker Compose, GitHub Actions, Vercel |

## Keamanan Minimum

- HTTPS di production.
- Session/JWT divalidasi di server dan dikirim melalui HttpOnly secure cookie.
- CORS menggunakan allowlist origin, bukan wildcard untuk credentialed request.
- Security headers: CSP, HSTS, `X-Content-Type-Options`, dan frame protection.
- RBAC dan RLS berdasarkan `organization_id`.
- Seluruh nominal, harga, saldo, dan role dihitung/divalidasi ulang di server.
- Ledger menggunakan database transaction, unique constraint, dan idempotency key.
- Penarikan melakukan pemeriksaan saldo ulang dalam transaksi database.
- Token publik disimpan dalam bentuk hash dan dapat dicabut.
- Upload CSV/XLSX dan gambar dibatasi MIME type, ukuran, ekstensi, serta storage path.
- Secret dan service-role key tidak pernah dikirim ke browser.
- Audit log tidak menyimpan password, token mentah, atau secret.

## Menjalankan Secara Lokal

### Prasyarat

- Node.js `24.12.0`
- npm `11.6.2`
- Project Supabase dengan PostgreSQL yang dapat diakses

### Instalasi

```bash
git clone https://github.com/farrasmumtaz/EcoPoin.git
cd EcoPoin

cd ep-fe
npm ci

cd ../ep-be
npm ci
```

### Environment backend

Buat `ep-be/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:6543/postgres
DIRECT_URL=postgresql://user:password@host:5432/postgres?sslmode=require
FRONTEND_URL=http://localhost:3000
```

### Environment frontend

Buat `ep-fe/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`SUPABASE_SERVICE_ROLE_KEY` hanya boleh tersedia di backend. Jangan gunakan prefix `NEXT_PUBLIC_` untuk secret.

### Migrasi database

```bash
cd ep-be
npx prisma migrate deploy
npx prisma generate
npx prisma migrate status
```

### Development server

Frontend:

```bash
cd ep-fe
npm run dev
```

Backend:

```bash
cd ep-be
npm run dev -- --port 3001
```

### Docker

```bash
cp .env.docker.example .env
docker compose config
docker compose up --build -d
docker compose ps
```

| Service | URL host | Port container |
| --- | --- | --- |
| Frontend | `http://localhost:3100` | `3000` |
| Backend | `http://localhost:3101` | `3001` |

## API

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Login pengurus |
| `POST` | `/api/auth/logout` | Logout dan menghapus sesi cookie |
| `GET` | `/api/auth/me` | Memeriksa sesi pengguna aktif |
| `GET` | `/api/profile` | Profil pengguna dan organisasi |
| `PATCH` | `/api/profile` | Memperbarui profil; data organisasi khusus admin |
| `GET` | `/api/members` | Cari individu/unit dan status aktif |
| `POST` | `/api/members` | Membuat profil individu/unit dan nomor unik |
| `GET` | `/api/members/:id` | Detail profil dan relasi unit |
| `PATCH` | `/api/members/:id` | Memperbarui profil atau relasi unit |
| `DELETE` | `/api/members/:id` | Menonaktifkan profil tanpa menghapus history |
| `GET` | `/api/members/:id/summary` | Detail, transaksi, mutasi, dan saldo nasabah |
| `GET` | `/api/waste-types` | Katalog jenis sampah |
| `POST` | `/api/waste-types` | Membuat jenis sampah dan dua kondisi harga |
| `GET` | `/api/waste-types/:id` | Detail jenis sampah dan harga aktif |
| `PATCH` | `/api/waste-types/:id` | Memperbarui master dan membuat versi harga baru |
| `DELETE` | `/api/waste-types/:id` | Menonaktifkan jenis sampah tanpa menghapus histori |
| `GET` | `/api/transactions` | Daftar transaksi (filter status/nasabah/tanggal) |
| `GET` | `/api/transactions/:id` | Detail transaksi dan item |
| `POST` | `/api/transactions` | Membuat transaksi draft multi-item secara idempotent |
| `POST` | `/api/transactions/import` | Preview dan konfirmasi impor setoran CSV secara idempotent |
| `PATCH` | `/api/transactions/:id` | Memperbarui transaksi selama masih draft |
| `POST` | `/api/transactions/:id/finalize` | Mengunci item dan total rupiah |
| `POST` | `/api/transactions/:id/complete` | Menyelesaikan `DIRECT_CASH` atau `SAVINGS` |
| `POST` | `/api/transactions/:id/cancel` | Membatalkan draft/finalized + alasan |
| `GET` | `/api/ledger` | Melihat mutasi ledger terfilter |
| `GET` | `/api/withdrawals` | Daftar penarikan |
| `POST` | `/api/withdrawals` | Mengajukan penarikan (`REQUESTED`) |
| `POST` | `/api/withdrawals/:id/approve` | Menyetujui penarikan |
| `POST` | `/api/withdrawals/:id/pay` | Membayar dan membuat debit atomik |
| `POST` | `/api/withdrawals/:id/reject` | Menolak penarikan + alasan |
| `GET` | `/api/dashboard` | Ringkasan transaksi, pencairan, dan komposisi sampah |
| `GET` | `/api/reports/transactions` | Laporan terfilter untuk tabel, CSV, dan PDF |
| `GET` | `/api/public/receipts/:token` | Nota transaksi publik tanpa akun nasabah |

Impor saat ini mendukung CSV hingga 500 baris per batch. XLSX, permintaan
penjemputan, dan buku tabungan publik tidak termasuk scope aplikasi.

Filter daftar nasabah yang tersedia: `search`, `type`, `unitId`, `isActive`,
`page`, dan `limit`. Nomor nasabah dibuat oleh backend. Field `picName` wajib
untuk tipe `UNIT`, sedangkan `unitIds` hanya digunakan untuk menghubungkan
profil `INDIVIDUAL` ke satu atau beberapa unit. Saldo dan histori tersedia
melalui `/api/members/:id/summary`. Pembuatan draft, perubahan item,
finalisasi, pencairan, pembatalan, dan nota sudah terhubung dari frontend ke
backend.

## Status Implementasi

Fondasi repository sebelumnya dibangun untuk sistem poin dan telah direkonsiliasi ke domain rupiah berdasarkan PRD v3.0.

- [x] Fondasi PostgreSQL, constraint, index, trigger, dan RLS.
- [x] Autentikasi pengurus dan identitas organisasi.
- [x] Docker Compose, health check, dan CI GitHub Actions.
- [x] Master awal jenis sampah.
- [x] Migrasi `points_per_kg` menjadi harga rupiah berversi untuk kondisi `SORTED` dan `UNSORTED`.
- [x] Profil `INDIVIDUAL` dan `UNIT`, relasi unit, filter, dan soft-delete.
- [x] Transaksi draft multi-item, edit, finalisasi, `DIRECT_CASH`, `SAVINGS`, dan pembatalan.
- [x] Ledger rupiah untuk kredit setoran dan debit penarikan; endpoint `OPENING_BALANCE`, `ADJUSTMENT`, dan reversal belum tersedia.
- [x] Penarikan tabungan (`REQUESTED -> APPROVED -> PAID` / `REJECTED`).
- [x] Impor CSV dengan template, preview validasi, dan idempotency per batch/baris.
- [x] Nota transaksi publik dan cetak ulang melalui token unik.
- [x] Dashboard operasional, komposisi sampah, transaksi terbaru, dan nasabah aktif.
- [x] Laporan transaksi dengan filter, ekspor CSV, dan cetak PDF.
- [x] Profil pengguna serta organisasi dan sidebar dinamis.

## Quality Gate

```bash
cd ep-fe
npm run lint
npm run type-check
npm run build

cd ../ep-be
npm run lint
npm run type-check
npm run build
```

CI harus menjalankan reproducible install, lint, type-check, test, production build, migration validation, dan Docker image build.

## Strategi Branch

Alur integrasi tim:

```text
branch anggota -> pull request ke dev -> testing/review -> pull request dev ke main
```

Setiap anggota membuat branch dari `dev` terbaru:

```bash
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c feat/nama-fitur

# implementasi dan dokumentasi
git add .
git commit -m "feat(scope): deskripsi perubahan"
git push -u origin feat/nama-fitur
```

Branch anggota tidak langsung masuk ke `main`. Setelah CI dan review pada pull
request menuju `dev` berhasil, perubahan digabungkan ke `dev`. Branch `main`
hanya menerima pull request dari `dev` untuk versi yang sudah diuji bersama.

## Validasi Sebelum Feature Freeze

1. Konfirmasi arti kolom `U/LASM` pada daftar harga.
2. Konfirmasi apakah harga berbeda karena metode tunai/tabungan atau alasan lain.
3. Konfirmasi aturan masa tunggu penarikan satu minggu.
4. Konfirmasi definisi nasabah dan unit aktif.
5. Periksa format file pencatatan laptop untuk desain importer.
6. Konfirmasi apakah unit mempunyai satu rekening atau beberapa rekening anggota.
7. Baca empat rekaman wawancara lain sebelum mengunci scope.

## Tim

EcoPoin dikembangkan oleh tim mahasiswa untuk kategori Web Development ITechno Cup 2026.
