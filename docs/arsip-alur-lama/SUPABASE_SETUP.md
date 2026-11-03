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

Proyek dibuat pada 30 Oktober 2026 dengan status `ACTIVE_HEALTHY`. Schema awal kosong; milestone akun kemudian menambahkan profiles, territories, offices, office_mandates, platform_role_grants, serta audit privat. Lihat desain identitas dan status proyek untuk perkembangan terkini.

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
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Ganti placeholder key dengan **publishable key** aktif dari dialog **Connect** atau halaman **Settings > API Keys** di dashboard proyek. Gunakan nilai berawalan `sb_publishable_`. Jangan memakai secret key, password database, atau legacy `service_role`/`anon` JWT key. Nilai key tidak dicatat dalam dokumen ini atau contoh environment di Git.

File environment berada di root proyek, sejajar dengan `package.json`, bukan di `src/`. `.env.local` tetap diabaikan Git. Key publik bukan pemberi hak admin. Untuk localhost:3000, NEXT_PUBLIC_APP_URL memiliki default yang sama; isi secara eksplisit saat port atau domain berubah.

Pada deployment, atur NEXT_PUBLIC_APP_URL ke origin HTTPS yang benar dan izinkan callback `/auth/callback` pada pengaturan redirect Supabase. Jangan memakai nilai Host dari pengunjung untuk membuat tautan email. Pendaftaran tetap memakai konfirmasi sesuai konfigurasi Auth; tahap ini tidak mematikan konfirmasi atau mengubah provider email. Google OAuth belum dikonfigurasi.

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

Halaman informasi tetap dapat dibangun tanpa file environment karena client baru dibuat ketika fungsi dipanggil. Login kini menggunakan `src/lib/supabase/server.ts` dan `src/proxy.ts` untuk cookie/refresh. Client publik stateless tetap bukan client login. Akses dashboard dan mutasi memeriksa identitas lewat getUser; hak tambahan dibaca dari database, bukan user_metadata.

## Batas tahap ini

Sudah dibuat: schema identitas/mandat, migrasi, RLS, dan UI akun. Belum dibuat: schema pengajuan, penilaian, dana, uji warga; bucket/policy Storage; UI admin untuk mandat; Google OAuth; konfigurasi Vercel. Model identitas D-18 telah disetujui pengguna; rincian lifecycle dan penugasan tim lainnya tetap perlu pembahasan.

Untuk Vercel nanti, isi dua variabel publik tersebut pada environment yang tepat sebelum build. Secret berprivilege, bila benar-benar dibutuhkan, harus tetap server-only. Jangan otomatis memakai database ini untuk seluruh preview dengan data warga nyata.

## Referensi primer

- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase JWT dan JWKS](https://supabase.com/docs/guides/auth/jwts)
- [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Auth - endpoint Settings](https://github.com/supabase/auth#endpoints)
- [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables)
