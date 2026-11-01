# Pengaturan OTP email, domisili daftar, dan Google

Dokumen ini menjelaskan yang perlu diatur di Supabase agar halaman Masuk/Daftar/Lupa password memakai kode OTP email. Kode aplikasi sudah siap, tetapi **tanpa pengaturan ini email yang terkirim masih berisi tautan, bukan kode**.

## 1. Template email (wajib)

Di dashboard Supabase, Authentication → Email Templates, ubah dua template agar menampilkan kode:

- **Confirm signup**: ganti tautan `{{ .ConfirmationURL }}` dengan `{{ .Token }}`.
- **Reset password**: ganti tautan `{{ .ConfirmationURL }}` dengan `{{ .Token }}`.

Contoh isi: `<p>Kode verifikasi KampungLab: <strong>{{ .Token }}</strong></p>`.

## 2. Panjang kode

Aplikasi menunggu kode **6 digit** (`OTP_LENGTH` di `src/lib/auth/validation.mjs`). Periksa panjang kode email di pengaturan Auth proyek. Bila proyekmu memakai panjang lain (misalnya 8), ubah pengaturan Supabase menjadi 6 atau ubah `OTP_LENGTH`; keduanya harus sama. Dokumentasi Supabase menyebut batas kirim ulang bawaan 60 detik dan masa berlaku 1 jam; tombol Kirim ulang di aplikasi mengikuti jeda 60 detik.

## 3. Alur di aplikasi

- **Daftar**: isi form → `signUp` (Supabase mengirim kode) → masukkan kode → `verifyOtp` bertipe `email` → sesi dibuat → dashboard.
- **Lupa password**: email → `resetPasswordForEmail` (kode dikirim) → masukkan kode → `verifyOtp` bertipe `recovery` → diarahkan ke `/ubah-kata-sandi` untuk membuat password baru. Respons langkah pertama sama untuk email terdaftar maupun tidak.
- Tautan lama (`/auth/callback`) tetap berfungsi sebagai cadangan.

## 4. Domisili saat daftar

Alamat, kecamatan, kelurahan, RW, dan RT disimpan di metadata akun Auth (`domicile_address`, `domicile_kecamatan`, `domicile_kelurahan`, `domicile_rw`, `domicile_rt`). Catatan penting:

- Ini **klaim warga yang belum diverifikasi**. Tidak dipakai untuk hak akses atau antrean RT/RW.
- Daftar kecamatan/kelurahan di `src/lib/auth/surabaya-areas.mjs` adalah data contoh yang belum dicocokkan dengan master resmi; RW dan RT diketik manual oleh warga (angka 1–999; nol di depan dibuang otomatis, jadi `03` disimpan sebagai `3`) tanpa dicocokkan ke daftar.
- Setelah verifikasi OTP daftar (dan setelah form Google), klaim ditautkan lewat fungsi `link_domicile` (migrasi `20261101010000`): kelurahan dicari berdasarkan kecamatan + nama (153 kelurahan contoh di-seed ke `territories`, kodenya memuat kecamatan), lalu RW dan RT dicari lewat angka di ujung nama/kode ("RW 03", "DEMO-RW-01", dan "3" sama-sama dibaca 3). RW/RT yang belum ada dibuat otomatis sebagai satuan wilayah (tanpa hak akses). Kelurahan di luar daftar membuat `domicile_rt_id` kosong.
- Karena RW/RT dibuat dari klaim warga, isian ngawur (misalnya RW 999) ikut membuat baris wilayah. `getDraftContext` memuat maksimal 1000 baris `territories`; bila jumlahnya melewati itu, halaman pengajuan menolak dimuat dan pemuatan wilayah perlu dibuat bertahap.
- Domisili diubah dari `/profil` dengan form yang sama; `/profil/wilayah` mengarah ke sana.

## 5. Masuk dengan Google (opsional)

Tombol memanggil `signInWithOAuth` dengan tujuan `/auth/callback`. Aktifkan provider Google di Authentication → Providers, isi Client ID/Secret dari Google Cloud, dan pastikan `NEXT_PUBLIC_APP_URL` serta daftar Redirect URL Supabase memuat origin aplikasi. Bila provider belum aktif, pengguna melihat pesan "belum dapat diproses". Akun Google yang belum punya data domisili otomatis diarahkan ke `/lengkapi-profil` setelah masuk, mengisi nama lengkap, alamat, kecamatan, kelurahan, RW, dan RT (disimpan di metadata Auth seperti pendaftar email), baru bisa membuka dashboard dan halaman lain. Gerbang ini berlaku untuk akun yang punya identitas Google; pendaftar email lama tidak terpengaruh. Ini pengumpulan data, bukan kontrol keamanan, karena metadata bisa diubah pengguna sendiri dan domisili tetap klaim yang belum diverifikasi.

## 6. Verifikasi

Catatan paket upstream menyebut `npm test` (30 tes lulus, termasuk aturan password, domisili, dan OTP). Tes tersebut **tidak dijalankan ulang pada milestone kelurahan**, sesuai permintaan penundaan tes alur. Lint, TypeScript, dan build produksi hasil gabungan sudah lulus. Konfigurasi template/panjang OTP/provider Google, pengiriman email/OTP sungguhan, dan uji browser belum diperiksa atau diubah pada milestone ini. Saat tes dilanjutkan, periksa daftar, penerimaan kode, verifikasi, keluar, pemulihan password, dan kirim ulang dengan akun sendiri.

## 7. Kelola akun di /profil

Migrasi `20261101000000_profile_account_management.sql` (fungsi `set_profile_domicile` dan `delete_own_account`) sudah tersedia pada proyek yang dipilih; riwayatnya direkonsiliasi 1 November 2026. Jangan menjalankan ulang isinya pada proyek tersebut. Fungsi/alur belum diuji secara fungsional.

Template email siap pakai ada di `docs/email-templates/` (tiga file HTML, semuanya menampilkan `{{ .Token }}`):

- `confirm-signup.html` → Authentication → Email Templates → **Confirm signup**
- `reset-password.html` → **Reset password**
- `magic-link.html` → **Magic Link**: dipakai sebagai kode verifikasi ganti password (`signInWithOtp` tanpa membuat akun baru, lalu `verifyOtp`). Kode selalu diperiksa server; mekanisme `reauthenticate` Supabase sengaja tidak dipakai karena nonce-nya hanya diperiksa bila sesi lebih tua dari 24 jam.

Hapus akun = soft delete: profil dianonimkan, domisili dilepas, identitas dan sesi dihapus, `auth.users` diberi `deleted_at`, email diganti alamat `.invalid`. Draf dan pengajuan tidak dihapus karena kebijakan retensi (D-13) belum diputuskan. Akun dengan mandat/peran aktif ditolak sampai dicabut pengelola. Akun Google tidak bisa ganti password dari halaman ini. Ganti email tidak tersedia. Fungsi SQL dan alur email belum diuji terhadap database/Supabase sungguhan.
