# Panduan Deploy: Vercel + Supabase

Panduan ini memakai kondisi proyek terbaru: database Supabase `kampunglab-surabaya` (project ref `zxfaotlqldfrlccahebw`, region Singapore) dan aplikasi Next.js dengan akun, admin, draf, serta alur pemeriksaan DEMO. Urutan: periksa database, atur Auth, deploy Vercel, uji.

## A. Database (Supabase)

Menurut `docs/PROJECT_STATUS.md`, dua puluh migrasi di `supabase/migrations` sudah diterapkan ke project ini. **Jangan dijalankan ulang.** Periksa dulu:

- Dashboard Supabase > **Database > Migrations**: harus ada dua puluh entri, dari `20261030134536_identity_and_office_mandates` sampai `20261101030001_prototype_territory_and_legacy_budget_integration`, termasuk `20261101022903_in_app_notification_inbox`. Migrasi notifikasi hanya bergantung pada schema 30–31 Oktober; urutan versi native sebelum dua migrasi upstream 030000/030001 tetap sah.
- Atau lewat CLI: `npx supabase login`, `npx supabase link --project-ref zxfaotlqldfrlccahebw`, `npx supabase migration list`.

Jika kamu memakai project Supabase baru/kosong, terapkan semua file migrasi berurutan menurut nama file (`npx supabase db push`). Empat migrasi unggahan sebelumnya sudah direkonsiliasi sebagai applied pada proyek ini; jangan jalankan ulang isi SQL-nya. Script `supabase/repairs` adalah catatan pemeliharaan sekali pakai untuk proyek lama, bukan bagian urutan deploy baru. Rincian urutan serta batas verifikasinya ada di `docs/INTEGRATION_REPAIR.md`.

Admin pertama, tema DEMO, dan wilayah DEMO sudah ada menurut status proyek. Petugas RT/RW/kelurahan ditetapkan lewat halaman `/admin` (cari akun terkonfirmasi dengan email lengkap, lalu beri mandat); tidak perlu SQL manual.

## B. Pengaturan Auth Supabase

Dashboard > **Authentication**:

- **URL Configuration > Site URL:** alamat produksi Vercel, misalnya `https://kampunglab-surabaya.vercel.app`.
- **Redirect URLs:** `https://<domain-vercel>/auth/callback`, `http://localhost:3000/auth/callback`, dan untuk preview `https://*-<nama-tim>.vercel.app/auth/callback`.
- **Kode OTP:** kode daftar/pemulihan dari paket akun memerlukan template `{{ .Token }}` serta panjang OTP yang sama dengan aplikasi. Ikuti `docs/OTP_SETUP.md`; pengaturan ini belum diubah/diverifikasi pada milestone kelurahan.
- **Email:** layanan email bawaan Supabase sangat dibatasi jumlah kirimnya. Cukup untuk uji kecil, tidak untuk demo dengan banyak peserta. Pasang **SMTP kustom** (Authentication > SMTP Settings), misalnya Resend atau Brevo.
- Aktifkan **Leaked password protection** bila tersedia di paketmu (peringatan advisor ini masih tercatat di status proyek).

## C. Aplikasi (Vercel)

1. Dorong kode ke GitHub. Pastikan `.env.local` tidak ikut (sudah di `.gitignore`).
2. vercel.com > **Add New > Project**, pilih repo. Framework Next.js terdeteksi otomatis.
3. **Environment Variables** (Production, Preview, Development):

   | Nama | Nilai |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://zxfaotlqldfrlccahebw.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`) dari Supabase > Project Settings > API |
   | `NEXT_PUBLIC_APP_URL` | Alamat produksi, misalnya `https://kampunglab-surabaya.vercel.app` |

   Jangan pernah memasukkan `service_role`, secret key, atau password database. Variabel `NEXT_PUBLIC_*` ditanam saat build; bila alamat baru diketahui setelah deploy pertama, perbarui lalu **Redeploy**.
4. **Settings > General > Node.js Version:** `24.x` (sesuai `engines`).
5. **Settings > Functions > Function Region:** **Singapore (sin1)**, dekat dengan database. Bawaan Vercel (AS) membuat setiap halaman lambat.
6. Klik **Deploy**, lalu kembali ke bagian B dan isi alamat produksi di Site URL dan Redirect URLs.

## D. Uji setelah deploy

1. Daftar akun baru, buka email konfirmasi (tautannya harus menuju alamat Vercel, bukan localhost), masuk.
2. Dari dashboard: isi domisili di `/profil/wilayah`, buat draf di `/pengajuan`, isi empat langkah, kirim salinan simulasi DEMO.
3. Beri mandat RT/RW/kelurahan ke akun uji lewat `/admin`, masuk dengan akun itu, dan periksa `/antrean/rt`.
4. Dari komputer lokal (dengan `.env.local`): `npm run check:supabase`, lalu skenario HTTP di `docs/AUTH_UAT.md`, `ADMIN_UAT.md`, `DRAFTS_UAT.md`, dan `SIMULATION_UAT.md`, `PHYSICAL_UAT.md`, serta `PANEL_UAT.md`. Tes alur tetap ditunda sampai pengguna memintanya; daftar ini panduan tahap verifikasi nanti.

## E. Batasan yang perlu diketahui

- **Alur pemeriksaan masih DEMO.** Nomor pengajuan resmi, keputusan akhir kelurahan/panel, dana, uji warga, passport, dan banding belum dibangun (lihat `docs/PROJECT_STATUS.md`). Jangan dipresentasikan sebagai pengajuan resmi.
- **Lampiran privat DEMO tersedia.** Bucket dan Edge Function `private-attachments` sudah dibuat/deploy pada proyek yang dipilih; tidak perlu key backend pada environment Next.js. Untuk proyek lain, migrasi saja belum cukup: fungsi di `supabase/functions/private-attachments` juga perlu dideploy dengan konfigurasi auth `supabase/config.toml`. Ikuti ATTACHMENTS_UAT.md. Jalur dokumen fisik DEMO dibangun dengan batas awal 7 hari per tingkat, permintaan berkas terpisah, dan konfirmasi manual. Edge saat ini versi 4 ACTIVE; lihat PHYSICAL_UAT.md. Tidak perlu menjalankan ulang migrasi atau mengubah batas hari untuk membukanya lebih awal.
- **Notifikasi dalam aplikasi tersedia di `/notifikasi`.** Tidak membutuhkan environment baru; gunakan database yang sudah menerima migrasi inbox. Hak baca mengikuti sumber dan mandat/penugasan terkini. Email, pengingat 24 jam dan scheduler belum ada; lihat NOTIFICATIONS_UAT.md.
- **Proyek Supabase gratis dijeda bila tidak aktif sekitar seminggu.** Aktifkan kembali dan buka web sehari sebelum demo/pitch.
- **Tema dan wilayah DEMO** berlabel DEMO; master resmi harus disiapkan pengelola program.
- Regenerasi tipe setelah mengubah schema: `npx supabase gen types typescript --project-id zxfaotlqldfrlccahebw > src/lib/supabase/database.types.ts`.

## F. Masalah umum

| Gejala | Penyebab biasa |
|---|---|
| Daftar tetapi tidak ada email | Batas email bawaan Supabase; pasang SMTP kustom. |
| Tautan email menuju `localhost` | Site URL/Redirect URL Supabase belum diganti ke alamat Vercel. |
| Setelah login kembali ke halaman masuk | `NEXT_PUBLIC_APP_URL` salah atau belum redeploy setelah diubah. |
| Dropdown tema/wilayah kosong | Migrasi draf belum diterapkan di project yang dipakai. |
| Antrean kosong untuk petugas | Mandat utama aktif belum diberikan di wilayah yang tepat lewat `/admin`. |
| Halaman lambat | Function Region Vercel belum `sin1`. |
