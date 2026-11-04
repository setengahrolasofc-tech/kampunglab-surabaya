# Masuk dengan Google dan akses Kelurahan

## Alur akun
- **Inovator / Warga**: masuk dengan email + password atau tombol Google (di bawah "atau"). Akun baru dari Google otomatis Inovator.
- **Kelurahan**: pilih tab "Kelurahan" di halaman Masuk, lalu masuk (email atau Google) dan kirim **permintaan akses** di `/minta-akses` (kecamatan, kelurahan, NIP, jabatan, WA). Akun berubah menjadi Kelurahan berstatus `MENUNGGU_MANDAT`: hanya melihat `/menunggu-verifikasi`, tempat SK/surat tugas diunggah. Semua fitur Kelurahan terbuka setelah Admin BRIDA memberi mandat di `/admin/mandat`. Pendaftar yang memilih "Minta akses Kelurahan" di `/daftar` melewati jalur yang sama.
- Akun yang sudah punya pengajuan inovasi tidak bisa dialihkan menjadi Kelurahan (pencegah benturan kepentingan); pakai email lain.
- **Admin BRIDA**: tidak bisa mendaftar. Hanya akun yang dipilih lewat `npm run seed:admin` (isi `SEED_ADMIN_EMAIL`). Bila admin itu ingin masuk dengan Google, login Google sekali dengan email yang sama lalu jalankan seed lagi: skrip mengangkat akun yang sudah ada. Variabel `BRIDA_INVITE_CODE` tidak dipakai lagi.

## Menyalakan Google di Supabase
1. Google Cloud Console → APIs & Services → Credentials → **OAuth client ID** (Web application).
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Sign In / Providers → **Google**: aktifkan, tempel Client ID dan Client Secret.
3. Supabase → Authentication → URL Configuration:
   - Site URL = nilai `NEXT_PUBLIC_APP_URL` (mis. `https://kampunglab.example`).
   - Redirect URLs: tambahkan `https://<domain-anda>/auth/callback` dan `http://localhost:3000/auth/callback`.
4. Terapkan migrasi `20261104060000_google_login_and_kelurahan_access.sql` (`npx supabase db push`).

Catatan: Supabase menautkan identitas Google ke akun email yang sama bila emailnya sudah terverifikasi, jadi pemilik akun email+password yang masuk dengan Google memakai akun yang sama.

## Uji manual
1. `/masuk` → tombol "Lanjutkan dengan Google" ada di bawah tombol Masuk, dipisah tulisan "atau".
2. Tab Inovator / Warga → Google → mendarat di `/dashboard`.
3. Tab Kelurahan → Google → mendarat di `/minta-akses` → isi data → `/menunggu-verifikasi` (status Menunggu mandat; `/kelurahan` mengarah ke sini).
4. Masuk sebagai Admin BRIDA → `/admin/mandat` → Beri Mandat → akun Kelurahan itu kini membuka `/kelurahan` dan menerima notifikasi.
5. `/daftar` tidak lagi menampilkan pilihan Staf BRIDA.

## Diuji dan belum diuji
Diuji (PostgreSQL 16 lokal, `npm run test:db`): akun Google baru selalu Inovator walau metadata mencoba menaikkan peran, nama Google terpakai, alur minta akses → menunggu mandat → mandat BRIDA, penolakan untuk akun yang punya pengajuan, Admin, dan pengunjung anonim. Uji unit `tests/domain.test.mjs`.
Belum diuji: tombol Google ke Google sungguhan (butuh Client ID Anda), tampilan di browser, `npm run typecheck/lint/build` (registry npm tidak terjangkau dari lingkungan saya; Vercel build adalah pemeriksa tipenya).
