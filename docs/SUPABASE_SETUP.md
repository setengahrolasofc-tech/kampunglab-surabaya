# Konfigurasi Supabase KampungLab

## Target yang dipilih pengguna

| Properti | Nilai |
|---|---|
| Koneksi akun | SetengahRolasOfc |
| Organisasi | setengahrolasofc-tech's Org |
| Nama proyek | kampunglab-surabaya |
| Project ref | zxfaotlqldfrlccahebw |
| Region | Singapore, ap-southeast-1 |
| URL API | https://zxfaotlqldfrlccahebw.supabase.co |
| Dashboard | https://supabase.com/dashboard/project/zxfaotlqldfrlccahebw |

Proyek dibuat dan diperiksa pada 30 Oktober 2026. Status yang dikembalikan Supabase: `ACTIVE_HEALTHY`. Inspeksi awal schema `public` menemukan nol tabel aplikasi. Ini bukan penilaian kelayakan operasional seluruh sistem.

## Konfigurasi lokal Windows

Hentikan server lokal dengan Ctrl+C. Dari root folder proyek, setelah mengambil perubahan GitHub dan memasang dependency:

```powershell
Copy-Item .env.example .env.local
```

Jika `.env.local` sudah ada, edit file tersebut; jangan menimpanya tanpa memeriksa isinya.

Isi dua variabel berikut di `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://zxfaotlqldfrlccahebw.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Ganti placeholder key dengan **publishable key** aktif dari dialog **Connect** atau halaman **Settings > API Keys** di dashboard proyek. Gunakan nilai berawalan `sb_publishable_`. Jangan memakai secret key, password database, atau legacy `service_role`/`anon` JWT key. Nilai key tidak dicatat dalam dokumen ini atau contoh environment di Git.

File environment berada di root proyek, sejajar dengan `package.json`, bukan di `src/`. `.env.local` tetap diabaikan Git. Key publik bukan pemberi hak admin; keamanan baris dan berkas tetap memerlukan policy yang benar ketika schema dibuat.

Kemudian jalankan:

```powershell
npm run check:supabase
npm run dev
```

Pemeriksaan koneksi membaca endpoint Auth JWKS dan Auth Settings dengan publishable key. Tidak ada data/tabel yang diubah, tidak ada signup, dan tidak ada secret key yang dibutuhkan. Respons JWKS boleh memiliki array kosong jika proyek tidak menggunakan signing key asimetris.

Saat pemeriksaan awal, endpoint root metadata Data API `/rest/v1/` menolak key publik dengan respons `Secret API key required`. Karena itu, script memakai endpoint Auth yang memang publik, bukan menaikkan privilege atau membuka schema hanya untuk pemeriksaan. Script ini tidak membuktikan query Data API, login, refresh sesi, RLS, atau akses Storage berfungsi. Pengujian data dilakukan nanti terhadap schema dan policy yang benar-benar telah dibuat.

## Kode yang tersedia

- `src/lib/supabase/config.mjs`: validasi URL hosted dan key publik tanpa mencetak nilainya.
- `src/lib/supabase/public.ts`: factory SDK tanpa sesi untuk pembacaan publik di masa depan. Belum digunakan halaman, belum menjalankan query, dan bukan client login.
- `scripts/check-supabase.mjs`: pemeriksaan koneksi hanya-baca dari CLI.
- `tests/supabase-config.test.mjs`: pengujian konfigurasi kosong, URL tidak aman, dan penolakan privileged key.

Halaman informasi tetap dapat dibangun tanpa file environment karena client baru dibuat ketika fungsi dipanggil. Sebelum mengimplementasikan login SSR, buat client berbasis cookie dan refresh proxy sesuai dokumentasi terkini; jangan memakai client publik stateless untuk autentikasi.

## Batas tahap ini

Belum dibuat: schema aplikasi, migrasi, policy RLS/Storage, bucket berkas, akun warga/petugas, UI login, mandat jabatan, atau konfigurasi Vercel. Hindari membuat tabel/profile palsu hanya untuk menunjukkan koneksi sukses. Selesaikan keputusan `D-18` pada PRD sebelum mengunci model autentikasi/mandat.

Untuk Vercel nanti, isi dua variabel publik tersebut pada environment yang tepat sebelum build. Secret berprivilege, bila benar-benar dibutuhkan, harus tetap server-only. Jangan otomatis memakai database ini untuk seluruh preview dengan data warga nyata.

## Referensi primer

- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase JWT dan JWKS](https://supabase.com/docs/guides/auth/jwts)
- [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Auth - endpoint Settings](https://github.com/supabase/auth#endpoints)
- [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables)
