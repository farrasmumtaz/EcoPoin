# EcoPoin

[![CI](https://github.com/farrasmumtaz/EcoPoin/actions/workflows/ci.yml/badge.svg)](https://github.com/farrasmumtaz/EcoPoin/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

EcoPoin adalah platform web untuk mendigitalkan operasional bank sampah tingkat RW: pencatatan setoran, verifikasi, ledger poin, penukaran, laporan, dan estimasi dampak lingkungan. Warga dapat melihat struk, saldo, dan riwayat melalui tautan publik atau QR tanpa registrasi dan tanpa memasang aplikasi.

Proyek ini dikembangkan oleh tim beranggotakan tiga orang untuk kategori Web Development ITechno Cup 2026, dengan target MVP pada 3 September 2026.

> Status: tahap fondasi teknis. Struktur aplikasi, CI, dan container development sudah tersedia; fitur bisnis pada bagian roadmap masih dalam pengembangan.

## Masalah yang Diselesaikan

Operasional bank sampah RW masih sering bergantung pada buku tulis dan rekap manual. Dampaknya:

- data setoran rawan hilang, salah catat, dan sulit ditelusuri;
- warga harus menghubungi pengurus untuk mengetahui saldo;
- laporan bulanan memerlukan rekap manual berulang;
- dampak lingkungan program sulit dibuktikan menggunakan data;
- perubahan nilai poin dan koreksi transaksi sulit diaudit.

EcoPoin memindahkan proses tersebut ke transaksi terstruktur dengan prinsip auditability: saldo dihitung dari ledger, setoran terverifikasi tidak diedit langsung, dan koreksi dilakukan melalui reversal.

## Target Pengguna

| Pengguna | Kebutuhan utama | Akses |
| --- | --- | --- |
| Pengurus/operator | Mengelola warga, jenis sampah, setoran, verifikasi, dan penukaran | Dashboard terlindungi |
| Ketua/koordinator | Memantau aktivitas, saldo, laporan, dan dampak | Dashboard terlindungi |
| Warga/nasabah | Melihat struk, saldo, dan riwayat tanpa membuat akun | Tautan publik bertoken/QR |
| Pemangku kepentingan RW | Mengevaluasi hasil dan dampak program | Laporan pengurus |

## Fitur MVP

- Autentikasi dan proteksi dashboard pengurus.
- Manajemen warga/nasabah dan token akses publik.
- Master jenis sampah, nilai poin per kilogram, dan faktor dampak.
- Setoran multi-item dengan foto bukti dan snapshot nilai poin.
- Alur status `DRAFT -> VERIFIED` atau `DRAFT -> REJECTED` dengan audit trail.
- Ledger kredit, debit, dan reversal sebagai sumber saldo.
- Penukaran poin dengan pencegahan saldo negatif.
- Struk publik, QR, dan pesan WhatsApp melalui `wa.me`.
- Dashboard KPI, tren setoran, komposisi sampah, dan leaderboard RT.
- Laporan CSV serta metodologi estimasi dampak yang dapat ditelusuri.

### Pembeda Utama

- Warga tidak diwajibkan membuat akun atau memasang aplikasi.
- Struk dan saldo dapat dibuka dari WhatsApp melalui token acak yang dapat dirotasi.
- Ledger append-only menjaga saldo tetap dapat direkonsiliasi.
- Faktor dampak menyimpan rumus, satuan, sumber, dan tanggal akses.
- Model data disiapkan dengan `organization_id` sebagai fondasi ekspansi multi-tenant.

## Scope MVP

MVP berfokus pada satu bank sampah RW. Hal berikut belum termasuk scope:

- aplikasi mobile native;
- marketplace, payment gateway, penjemputan, atau integrasi logistik;
- klasifikasi sampah otomatis menggunakan AI/computer vision;
- WhatsApp Business API;
- multi-tenancy lengkap untuk kampus dan perusahaan;
- gamifikasi kompleks seperti level, badge, dan misi harian.

## Arsitektur

```text
Browser
   |
   v
ep-fe (Next.js App Router, port 3000)
   |
   | HTTPS / JSON
   v
ep-be (Next.js Route Handlers/Server Actions, port 3001)
   |
   +--> Supabase Auth
   +--> Supabase PostgreSQL + RLS
   +--> Supabase Storage
```

Repository memisahkan frontend dan backend sebagai dua deployment unit, tetapi keduanya menggunakan Next.js dan TypeScript.

```text
.
├── .github/workflows/ci.yml  # Quality gate dan container build
├── compose.yml               # Orkestrasi container FE dan BE
├── ep-fe/                    # Next.js frontend
│   ├── src/app/
│   └── Dockerfile
└── ep-be/                    # Next.js backend/API
    ├── prisma/
    ├── src/app/
    └── Dockerfile
```

## Teknologi

| Area | Teknologi |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Form dan validasi | React Hook Form, Zod |
| Backend/API | Next.js App Router, Route Handlers, Server Actions |
| Database | Supabase PostgreSQL, Prisma ORM |
| Auth dan storage | Supabase Auth, Supabase Storage |
| Security | Supabase RLS, JOSE, bcryptjs, server-side validation |
| Delivery | Docker Compose, GitHub Actions, Vercel |

## Menjalankan Secara Lokal

### Prasyarat

- Node.js `24.12.0`
- npm `11.6.2`
- project Supabase dengan PostgreSQL yang dapat diakses

### 1. Clone repository

```bash
git clone https://github.com/farrasmumtaz/EcoPoin.git
cd EcoPoin
```

### 2. Instal dependency

```bash
cd ep-fe
npm ci

cd ../ep-be
npm ci
```

### 3. Konfigurasi environment

Buat `ep-be/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:6543/postgres
```

Buat `ep-fe/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`SUPABASE_SERVICE_ROLE_KEY` hanya boleh tersedia di backend. Jangan gunakan prefix `NEXT_PUBLIC_` untuk secret apa pun.

### 4. Jalankan aplikasi

Terminal frontend:

```bash
cd ep-fe
npm run dev
```

Terminal backend:

```bash
cd ep-be
npm run dev -- --port 3001
```

Akses frontend di `http://localhost:3000` dan backend di `http://localhost:3001`.

## Menjalankan dengan Docker

Salin konfigurasi environment:

```bash
cp .env.docker.example .env
```

Isi kredensial Supabase pada `.env`, lalu jalankan:

```bash
docker compose config
docker compose up --build -d
docker compose ps
```

Port default Docker:

| Service | URL host | Port container |
| --- | --- | --- |
| Frontend | `http://localhost:3100` | `3000` |
| Backend | `http://localhost:3101` | `3001` |

Operasi umum:

```bash
docker compose logs -f
docker compose down
```

## Quality Gate

GitHub Actions berjalan pada push dan pull request ke `main` atau `develop`. Setiap aplikasi melewati:

1. reproducible install dengan `npm ci`;
2. ESLint;
3. TypeScript type-check;
4. test jika script tersedia;
5. production build;
6. Docker image build.

Validasi lokal sebelum push:

```bash
cd ep-fe && npm run lint && npx tsc --noEmit && npm run build
cd ../ep-be && npm run lint && npx tsc --noEmit && npm run build
```

## Aturan Bisnis Kritis

- Setoran `DRAFT` tidak memengaruhi saldo, laporan, leaderboard, atau dampak.
- Setoran `VERIFIED` menghasilkan tepat satu kredit ledger.
- Setoran `REJECTED` tidak menghasilkan poin.
- Saldo dihitung dari agregasi ledger dan tidak dapat diedit langsung.
- Penukaran ditolak jika saldo tidak mencukupi.
- Harga dan faktor transaksi disimpan sebagai snapshot.
- Statistik dan dampak hanya menggunakan setoran terverifikasi.
- Mutasi kritis harus idempotent dan dijalankan secara atomik.

## Keamanan dan Privasi

- RLS mengisolasi data berdasarkan `organization_id`.
- Token publik menggunakan nilai acak yang tidak dapat ditebak dan dapat dicabut.
- Nomor WhatsApp dan data sensitif tidak ditampilkan penuh pada halaman publik.
- Service role key tidak pernah dikirim ke browser.
- Validasi, otorisasi, dan perhitungan poin dilakukan ulang di server.
- Foto dibatasi berdasarkan MIME type, ukuran, dan storage path organisasi.
- Audit log tidak menyimpan password, token publik, atau secret.

## Kontribusi

Gunakan feature branch dari `develop` dan ajukan pull request setelah quality gate lokal lulus.

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feature/nama-fitur

# setelah implementasi
git add .
git commit -m "feat(scope): deskripsi perubahan"
git push -u origin feature/nama-fitur
```

Alur merge:

```text
feature/* -> develop -> main
```

Direct push dan force push ke `main` tidak diperbolehkan.

## SDGs

- **SDG 11 - Sustainable Cities and Communities:** membantu komunitas mengelola sampah secara transparan dan berbasis data.
- **SDG 9 - Industry, Innovation and Infrastructure:** memperluas adopsi infrastruktur digital pada layanan komunitas tingkat RW/RT.

EcoPoin selaras dengan subtema **Smart Sustainable Digital Solution for Inclusive Society** melalui akses warga yang ringan, transparansi operasional, dan pengukuran dampak yang dapat ditelusuri.

## Tim

EcoPoin dikembangkan oleh tim mahasiswa beranggotakan tiga orang untuk ITechno Cup 2026.

