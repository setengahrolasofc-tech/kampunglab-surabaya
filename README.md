# KampungLab Surabaya (Handbook Rev. 4)

Website pengajuan, pendanaan bertahap, uji warga, dan Rapor Bukti Inovasi untuk Inovboyo 2.0 – Surabaya Innovathon.
**Website tidak menyimpan atau memindahkan uang**: Kelurahan mentransfer di luar aplikasi; website hanya mencatat bukti.

- Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4 + Supabase (Auth, Postgres, Storage, RLS). Palet "Teal Blue & co." (Bab 8.4) dan logo (Bab 8.5).
- Tiga role login: `INNOVATOR`, `KELURAHAN` (wajib mandat dari BRIDA), `BRIDA_ADMIN` (kode undangan). Warga penguji mengisi survei bawaan tanpa akun.
- Status pengajuan dikendalikan state machine **di database** (tabel transisi + trigger + RPC), bukan hanya di UI.

## Mulai cepat
```bash
npm ci
cp .env.example .env.local     # isi kunci Supabase (lihat docs/SETUP_DEPLOY.md)
npx supabase db push           # terapkan 20261103090000_rev4_core.sql
npm run seed:admin             # 1 Super Admin BRIDA
npm run dev                    # http://localhost:3000
```
Akun contoh per role: `docs/SETUP_DEPLOY.md` §4 (`npm run seed:demo`). Panduan uji per tahap: `docs/TAHAP_BUILD.md`.

## Perintah
| Perintah | Fungsi |
|---|---|
| `npm run typecheck` / `npm run lint` / `npm run build` | Tipe, lint, build produksi |
| `npm test` | Uji logika domain (plafon, 30-30-40, ambang kelayakan, survei, state machine, kesamaan TS↔SQL) |
| `npm run test:db` | Migrasi + alur end-to-end di PostgreSQL biasa (`PSQL="psql -U postgres"`) |

## Struktur
```
supabase/migrations/20261103090000_rev4_core.sql   skema, RLS, RPC, seed (sumber kebenaran aturan)
supabase/tests/                                    uji SQL end-to-end + tiruan Supabase
src/lib/domain/                                    aturan murni (format, workflow, plafon, survei)
src/lib/{auth,supabase}/                           sesi per role, klien Supabase (server/publik/browser/admin)
src/app/{admin,kelurahan,dashboard}/               dashboard tiga role (+ actions.ts server action)
src/app/{papan-masalah,etalase,rapor,uji,verifikasi}/  halaman publik (uji = survei warga via QR)
docs/                                              SETUP_DEPLOY, TAHAP_BUILD, arsip-alur-lama
ASSUMPTIONS.md                                     asumsi dan keputusan yang perlu Anda tinjau
```

## Keamanan singkat
RLS aktif di semua tabel; penulisan sensitif hanya lewat RPC `security definer`; kolom yang boleh diubah pengguna dibatasi di tingkat grant;
`service_role` hanya di server untuk lima keperluan sempit (lihat `ASSUMPTIONS.md`). Jangan commit `.env.local`.
