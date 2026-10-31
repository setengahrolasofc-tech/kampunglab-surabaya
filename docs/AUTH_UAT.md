# Verifikasi dan UAT akun

## Menjalankan lokal

1. Hentikan server lama, `git pull --ff-only`, lalu `npm ci`.
2. Pertahankan `.env.local` yang berisi URL dan publishable key proyek. Opsional untuk port standar: `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
3. Jalankan `npm run dev` dan buka `/masuk`. Jika memakai port lain, sesuaikan APP_URL dan redirect allowlist Supabase.

## UAT manusia

Pemilik telah mengonfirmasi email masuk dan memperlihatkan dashboard berisi profil akun sendiri. Screenshot itu membuktikan sesi dashboard berhasil, bukan seluruh skenario di bawah. Pengguna memilih lanjut ke admin sebelum mengonfirmasi tes edit nama, keluar/masuk ulang, dan recovery.

- Buka `/daftar`, isi nama, email milik sendiri, kata sandi minimal 8 karakter, dan konfirmasi.
- Buka email konfirmasi di browser yang sama dengan browser pendaftaran. Periksa folder spam. Jika email tidak datang, periksa konfigurasi pengiriman dan batas provider; keberhasilan response signup bukan bukti email terkirim.
- Setelah konfirmasi, pastikan dashboard menampilkan profil sendiri serta tidak memberikan mandat atau admin otomatis.
- Keluar, lalu masuk kembali dengan email/password. Email/password salah harus memberikan pesan umum, bukan data pengguna lain.
- Edit nama tampilan; setelah tersimpan, dashboard menampilkan pemberitahuan sukses dan nama baru tetap ada saat reload.
- Coba `/dashboard` pada jendela privat tanpa sesi: harus diarahkan ke Masuk.
- Uji pemulihan kata sandi memakai email sendiri. Setelah link dibuka pada browser peminta, ganti password lalu uji masuk dengan password baru.
- Uji tautan kedaluwarsa/browser berbeda; tampil pesan yang dapat ditindaklanjuti. Konfirmasi mungkin telah berhasil di Supabase meskipun pertukaran sesi PKCE gagal, sehingga pengguna bisa mencoba masuk biasa.
- Periksa mobile 320/768 px, keyboard, label, pesan error, status pending, dan tombol Keluar. Browser/visual belum diverifikasi oleh coding agent.

## Bukti otomatis

- `npm test`: validasi isian, penolakan nilai role/ID dari form, pencegahan open redirect, origin terpercaya, serta batas waktu mandat.
- `supabase/tests/identity_access.sql`: tes sebagai pengelola DB dengan data sintetis dan ROLLBACK; memeriksa isolasi profil/mandat, blok promosi/mandat mandiri, proteksi audit/kolom, interval mandat, dan hierarki wilayah. Jangan menghapus ROLLBACK untuk menjadikan fixture sebagai data program.
- `scripts/verify-auth-http.mjs`: tes HTTP non-browser pada hasil build. Membutuhkan akun sintetis email berakhiran `@example.invalid` yang sudah dikonfirmasi khusus fixture melalui jalur pengelola terpercaya. File JSON privat di luar Git berisi `id`, `email`, `password`, lalu ditunjuk oleh `AUTH_TEST_FIXTURE_FILE`. Jalankan `npm run build`, kemudian `npm run test:auth:http`. Script memakai transport Server Action dari versi Next.js terpasang, mengubah nama fixture, mencoba mutasi terlarang, dan keluar akun. Jangan jalankan dengan akun warga sungguhan. Pengelola wajib menghapus fixture dan sesi/jejak QA terkait setelah selesai. Tes ini tidak mengirim email.
- Tes HTTP memeriksa guard dashboard, validasi server, login dan cookie SSR, cache private/no-store, edit profil, penolakan Origin asing, Data API dengan token pengguna, blok promosi mandiri, logout, serta callback yang tidak meneruskan tujuan eksternal.

Hasil pemeriksaan aktual dicatat pada PROJECT_STATUS.md. Lulus tes transport atau fixture confirmed tidak membuktikan email konfirmasi dan pemulihan benar-benar sampai ke kotak masuk.

Pada pemeriksaan 30 Oktober 2026, semua 11 skenario HTTP lulus. Akun fixture kemudian dinonaktifkan dan soft-delete; semua sesi tersisa kedaluwarsa. Penghapusan permanen tertahan oleh konfirmasi native Supabase yang kedaluwarsa, sehingga akun/profil `Synthetic HTTP QA (disabled)` masih ada sebagai artefak QA nonaktif. Lihat PROJECT_STATUS.md untuk status pembersihan; tidak ada data fixture yang disebut sebagai partisipasi warga nyata.

## Catatan sebelum pilot nyata

- Admin pertama sudah ditetapkan setelah pencocokan akun dan instruksi pemilik; pendaftar pertama tetap tidak otomatis admin.
- UI pemberian/pencabutan peran/mandat, wilayah/jabatan, dan audit tersedia pada `/admin`. Lihat ADMIN_UAT.md. Unggah SK, wilayah resmi, Google OAuth, SMTP khusus, dan deployment Vercel belum tersedia.
- Security advisor melaporkan **Leaked Password Protection Disabled**. Periksa opsi dan ketersediaannya pada [panduan password Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) sebelum pilot nyata. Tidak ada perubahan plan berbayar dilakukan otomatis.
- Index FK tertentu belum dipakai karena belum ada trafik/modul penugasan. Index dipertahankan untuk relasi FK; tinjau lagi setelah beban nyata, sesuai [panduan unused indexes](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
- Fungsi definer trigger berada di schema private, search_path dikunci, dan EXECUTE tidak diberikan ke pengguna aplikasi. Tabel mandat/role tetap tidak dapat ditulis langsung oleh authenticated. RPC admin memeriksa akun, sesi, dan penetapan aktif sebelum setiap akses; implementasi privileged-nya ada di private dengan guard internal, wrapper public memakai invoker.
