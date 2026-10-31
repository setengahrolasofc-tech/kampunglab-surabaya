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
- Antrean RT/RW/kelurahan tetap memakai `profiles.domicile_rt_id` dari tabel `territories` (diisi lewat `/profil/wilayah`). Menghubungkan klaim daftar ke wilayah resmi memerlukan master wilayah Surabaya di database dan migrasi tersendiri, belum dibuat di paket ini.

## 5. Masuk dengan Google (opsional)

Tombol memanggil `signInWithOAuth` dengan tujuan `/auth/callback`. Aktifkan provider Google di Authentication → Providers, isi Client ID/Secret dari Google Cloud, dan pastikan `NEXT_PUBLIC_APP_URL` serta daftar Redirect URL Supabase memuat origin aplikasi. Bila provider belum aktif, pengguna melihat pesan "belum dapat diproses". Akun Google tidak mengisi domisili saat masuk; pengguna mengisinya di `/profil/wilayah`.

## 6. Verifikasi

Catatan paket upstream menyebut `npm test` (30 tes lulus, termasuk aturan password, domisili, dan OTP). Tes tersebut **tidak dijalankan ulang pada milestone kelurahan**, sesuai permintaan penundaan tes alur. Lint, TypeScript, dan build produksi hasil gabungan sudah lulus. Konfigurasi template/panjang OTP/provider Google, pengiriman email/OTP sungguhan, dan uji browser belum diperiksa atau diubah pada milestone ini. Saat tes dilanjutkan, periksa daftar, penerimaan kode, verifikasi, keluar, pemulihan password, dan kirim ulang dengan akun sendiri.
