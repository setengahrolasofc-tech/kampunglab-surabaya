# Setup, deploy, dan kunci rahasia (Rev. 4)

## 1. Database
1. Proyek Supabase baru atau yang sudah ada. Migrasi lama (`2026103*`–`20261101*`) sudah diterapkan di proyek `kampunglab-surabaya`; **jangan dijalankan ulang**.
2. Terapkan migrasi baru: `npx supabase link --project-ref <ref>` lalu `npx supabase db push` (hanya `20261103090000_rev4_core.sql` yang baru).
   Alternatif: tempel isi berkas itu di SQL Editor. Berkas membuat tabel, enum, RLS, fungsi RPC, parameter awal, 154 kelurahan, dan bucket privat `berkas`.
3. Tabel alur lama tidak dihapus dan tidak dipakai. Edge Function `private-attachments` yang lama boleh dihapus dari dashboard.
4. Pengujian migrasi di PostgreSQL biasa (tanpa Supabase): `PSQL="psql -U postgres" bash supabase/tests/run-local.sh`.

## 2. Authentication (dashboard Supabase)
- **Site URL** = alamat produksi; **Redirect URLs** menyertakan `<domain>/auth/callback` dan `http://localhost:3000/auth/callback`.
- **Email OTP**: ubah template *Confirm signup* dan *Reset password* agar menampilkan `{{ .Token }}` (bukan tautan) dan atur panjang OTP **6 digit** (`OTP_LENGTH` di `src/lib/auth/validation.mjs`). Contoh isi: `<p>Kode verifikasi KampungLab: <strong>{{ .Token }}</strong></p>`.
- Pasang **SMTP kustom** (layanan email bawaan Supabase sangat dibatasi). Aktifkan *Leaked password protection* bila tersedia.
- Login Google tidak dipakai di Rev. 4; boleh dinonaktifkan.

## 3. Variabel lingkungan (`.env.local` dan Vercel)
Lihat `.env.example`. Yang **server-only** dan rahasia: `SUPABASE_SERVICE_ROLE_KEY`, `BRIDA_INVITE_CODE`, `IP_HASH_SALT`. Jangan beri awalan `NEXT_PUBLIC_`, jangan commit.
Tanpa `SUPABASE_SERVICE_ROLE_KEY` fitur berikut menampilkan pesan "belum dikonfigurasi": survei warga publik, pendaftaran BRIDA, minat pilot, unggah SK saat daftar.

## 4. Akun awal
```bash
cp .env.example .env.local        # isi kunci, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (min. 12 karakter)
npm run seed:admin                # 1 Super Admin BRIDA
# opsional, HANYA untuk dev/staging:
ALLOW_DEMO_SEED=1 npm run seed:demo
```
Akun demo (password = `SEED_DEMO_PASSWORD`): `inovator@demo.kampunglab.test`, `inovator2@demo.kampunglab.test` (Inovator),
`lurah.airlangga@demo.kampunglab.test` (Kelurahan Airlangga, mandat UTAMA), `staf.airlangga@demo.kampunglab.test` (mandat CADANGAN),
`lurah.mojo@demo.kampunglab.test` (Kelurahan Mojo, **menunggu mandat**). Kelurahan Kertajaya sengaja tanpa akun untuk menguji `WAITING_KELURAHAN_MANDATE`.
Staf BRIDA berikutnya mendaftar sendiri di `/daftar` dengan `BRIDA_INVITE_CODE`.

## 5. Vercel
Node 24.x, region Singapore (sin1), isi variabel di atas (Production + Preview), deploy, lalu perbarui Site URL/Redirect URLs.

## 6. Penutupan uji otomatis (opsional)
Uji ditutup saat ada yang membuka halaman terkait. Agar tepat waktu: aktifkan ekstensi `pg_cron` dan jadwalkan `select public.sync_due_tests();` tiap 15 menit.

## 7. Batasan yang perlu diketahui
- Verifikasi di lingkungan pengembangan ini: migrasi + alur lengkap diuji di PostgreSQL 16 dengan tiruan skema Supabase, unit test domain, lint, typecheck, build, dan smoke test HTTP.
  **Belum** dijalankan: aplikasi terhadap proyek Supabase sungguhan (PostgREST, Storage, OTP email) dan uji browser end-to-end. Lihat daftar risiko di `docs/TAHAP_BUILD.md`.
- Master kelurahan belum divalidasi terhadap data resmi Pemkot Surabaya.
