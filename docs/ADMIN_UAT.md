# Admin dan pengelolaan akses

## Membuka halaman

1. Di terminal proyek: hentikan server lama, `git pull --ff-only`, `npm ci`, lalu `npm run dev`.
2. Pertahankan `.env.local`. Tidak perlu SQL manual atau secret key aplikasi.
3. Masuk dengan akun pemilik yang sudah ditetapkan. Dashboard menampilkan **Buka pengelolaan admin**, menuju `/admin`.

## Pengujian manusia

Gunakan akun kedua milik penguji dan wilayah berawalan **DEMO** untuk uji. Jangan memasukkan nama pejabat atau nomor SK palsu seolah data resmi. Data yang dibuat melalui UI tersimpan; fixture SQL otomatis menggunakan rollback dan tidak perlu diulang secara manual.

- Cari email lengkap akun kedua yang sudah mengonfirmasi email. Pastikan identitas penerima sesuai; email tidak lengkap/salah atau akun belum terkonfirmasi harus ditolak/diberi status tidak ditemukan.
- Tetapkan reviewer/fasilitator memakai dasar penetapan uji yang jelas berlabel DEMO, masa berlaku WIB, dan konfirmasi pemeriksaan. Setelah simpan, riwayat bertambah dan dashboard akun kedua menampilkan peran ketika periodenya berlaku.
- Tanpa mencentang pemeriksaan atau dengan akhir sebelum mulai, form menampilkan kesalahan. Data tidak tersimpan; periksa fokus/label/pesan error dengan keyboard.
- Buat DEMO kelurahan, DEMO RW di bawahnya, DEMO RT di bawah RW. RT langsung di bawah kelurahan harus ditolak. Tambahkan jabatan yang sesuai wilayah itu.
- Berikan mandat utama/cadangan/delegasi pada akun kedua. Delegasi tanpa akhir dan periode yang bertumpuk harus ditolak. Verifikasi referensi, jenis, dan masa mandat pada riwayat akun.
- Cabut penetapan dengan alasan; pastikan riwayat tetap ada dengan status dicabut, aktor dan alasan tercatat, serta akses/peran aktif akun kedua hilang setelah permintaan baru.
- Admin tidak dapat mengubah akses program_admin miliknya sendiri. Gunakan admin aktif lain untuk penggantian administratif yang benar.
- Pada akun warga tanpa penetapan admin, buka `/admin` langsung: harus kembali ke dashboard dengan pemberitahuan akses diperlukan. Setelah keluar akun, `/admin` harus menuju Masuk.
- Uji tampilan 320/768 px, formulir panjang, select wilayah, keyboard, status pending, penyimpanan ulang, dan navigasi sesudah redirect. Verifikasi ini dilakukan manusia; coding agent tidak memakai browser/DOM.

## Pengujian otomatis

- `npm test`: validasi tanggal WIB, jenis peran/mandat, referensi, konfirmasi pemeriksaan, alasan, dan identitas; field pemberi hak dari browser diabaikan.
- `supabase/tests/admin_access.sql`: pengujian database sebagai pengguna sintetis dalam BEGIN/ROLLBACK. Mencakup warga/anon ditolak, wrapper privat tidak membypass izin, pencarian, hierarki, pemberian, tumpang tindih, pencabutan, proteksi admin sendiri, audit, session mismatch/expired, serta hak admin yang dicabut.
- `scripts/verify-admin-http.mjs`: HTTP non-browser pada build produksi. Memakai file privat `AUTH_TEST_FIXTURE_FILE` berisi id/email/password akun sintetis `@example.invalid`. Jalankan `npm run test:admin:http -- --citizen` saat fixture warga, lalu `npm run test:admin:http` saat fixture memiliki penetapan admin uji dari pengelola terpercaya. Jangan memberi script kredensial pemilik/warga nyata. Script memeriksa cookie SSR, guard/actions, pencarian, penolakan mutasi, RPC bertoken, RLS profil, dan token sesi yang sudah keluar; mutasi positif diuji dengan rollback SQL.
- Jalankan lint, typecheck, dan build sebelum pengujian HTTP. Jangan menguji build yang masih ditulis oleh proses build lain. Hasil aktual dicatat di PROJECT_STATUS.md.

## Batas saat ini

Pembuatan akun oleh admin, undangan email, unggah SK, permohonan peran, impor data wilayah resmi, pagination skala kota, notifikasi penetapan, serta persetujuan bisnis pengajuan belum tersedia. Pemberian label reviewer/fasilitator bukan hak membaca semua pengajuan. Pengelolaan program ini tidak memberikan akses ke akun infrastruktur GitHub/Supabase/Vercel.
