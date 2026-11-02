# KampungLab Surabaya

Platform tata kelola inovasi kampung (Handbook Rev. 4). Next.js (App Router) + TypeScript + Tailwind + Supabase.
Website **tidak** menyimpan atau mentransfer uang; hanya mencatat bukti transfer.

**Status build: Tahap (a) selesai** (skema DB, RLS, seed). Aplikasi baru berisi beranda sementara. Lihat `docs/PLAN.md` dan `ASSUMPTIONS.md`.

## Menjalankan di lokal
Prasyarat: Node 24, Docker, [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
npm install
supabase start                      # menjalankan Postgres/Auth/Storage lokal
supabase db reset                   # menerapkan migrasi 001-004 (+ seed.sql)
cp .env.example .env.local          # isi URL & key dari output `supabase status`
npm run seed:accounts               # Super Admin + akun contoh tiap peran
npm run dev                         # http://localhost:3000
```

### Menguji skema (tahap a)
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/stage_a_smoke.sql
```
Keluaran akhir yang diharapkan: `stage_a_smoke: SEMUA LULUS`.

### Akun contoh (hasil `npm run seed:accounts`)
| Peran | Email | Kata sandi | Catatan |
|---|---|---|---|
| BRIDA_ADMIN (Super Admin) | `superadmin@kampunglab.local` | `GantiPasswordIni123!` | ubah lewat `.env.local` |
| INNOVATOR | `inovator@kampunglab.local` | `Inovator123!` | |
| KELURAHAN | `lurah.gubeng@kampunglab.local` | `Lurah12345!` | MENUNGGU_MANDAT sampai diberi mandat (tahap c) |

## Produksi
Terapkan migrasi berurutan (`supabase db push`). **Verifikasi daftar kelurahan** di migrasi 004, isi `BRIDA_INVITE_CODE` dan `IP_HASH_SALT`, dan jangan pernah mengekspos `SUPABASE_SERVICE_ROLE_KEY` ke browser.
