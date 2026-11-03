# Integrasi perubahan upstream 2 November 2026

Tiga commit unggahan sampai `e21fc9a` digabung dengan modul draf program tanpa menghapus pekerjaan teman. Pemeriksaan berikut hanya sumber dan metadata; tes alur tetap ditunda atas instruksi pengguna.

## Kondisi database yang ditemukan

Riwayat awal berisi 23 migrasi, termasuk draf program `20261101040331`, tetapi belum mencatat `20261101040000_form_required_documents` dan `20261101050000_delegated_mandate_assignment`. Kedua SQL tersebut ternyata sudah dijalankan di cloud di luar riwayat native. Ini diketahui dari pencocokan enam hash sumber fungsi yang dinormalisasi spasinya, security definer/invoker, volatility, search_path kosong, pemilik, grant anon/authenticated dan constraint jenis notifikasi.

Script `supabase/repairs/2026-11-02_uploaded_migration_history.sql` memeriksa kontrak tersebut di dalam transaksi dan lock administrasi, lalu hanya menambah dua entri riwayat yang belum ada. Script tidak menjalankan ulang DDL, membuat mandat, mengirim notifikasi atau menulis data bisnis. Setelah perbaikan terdapat 25 entri/file migrasi. Tipe TypeScript dihasilkan ulang dari schema nyata. Script repair bukan bagian deploy database baru; jalankan urutan file migrasi biasa untuk proyek kosong. Replay penuh belum diuji.

## Perubahan upstream yang dipertahankan

- Dokumen per bentuk: prototipe, produk dan teknologi memakai PRD/RAB/surat pernyataan; program memakai RAB/surat pernyataan. Pilihan gagasan tidak tersedia di editor terbaru. Surat gabungan keaslian/pertanggungjawaban dan pemeriksaan AI meterai ikut dipertahankan.
- `/mandat/[id]` dan notifikasi tugas penetapan: RW utama untuk RT bawahannya, kelurahan utama untuk RW bawahannya, admin program untuk kelurahan. Operasi memakai pemeriksaan sesi/hak, lock administrasi, target terkonfirmasi, larangan menetapkan diri sendiri dan audit mandat.
- Penetapan tersebut membuat **mandat utama dengan akhir kosong**, bukan aktivasi cadangan/delegasi sementara. Nama RPC `delegated_mandate` tidak mengubah sifat mandat yang dibuat.

Pencocokan implementasi bukan pengesahan kebijakan baru. Handbook/PRD masih menyebut lima bentuk termasuk gagasan; pengurangan bentuk, kebutuhan dokumen/meterai dan kewenangan penetapan berjenjang perlu keputusan program yang eksplisit. Jangan mengubah catatan handbook agar tampak telah menyetujui implementasi tersebut. D-18 masih mencakup pembatasan kewenangan operasional; model akun pribadi/jabatan yang sebelumnya disetujui tetap berlaku.

## Batas verifikasi dan pekerjaan berikutnya

Lint, typecheck Next.js/Edge dan build dilakukan pada gabungan kode. Metadata bukan bukti izin runtime atau hasil klik sudah lulus. Tidak memanggil workflow sebagai pengguna, menjalankan unit/SQL skenario/HTTP/browser/UAT, mengaktifkan QA, mengunggah berkas atau membuat mandat. Tidak deploy Vercel/Edge ulang.

Sebelum operasional, periksa draf gagasan lama, perubahan bentuk dengan slot lama, surat gabungan/tanda tangan/meterai, fallback AI serta konsistensi unggah dan submit. Untuk penetapan berjenjang, periksa scope lintas wilayah, sesi dicabut saat lock, konflik mandat bersamaan/retry, verifikasi bukti kewenangan, batas akhir mandat dan pemulihan wilayah dengan pemegang mandat nonaktif. Perhitungan tugas saat ini menggunakan domisili yang diklaim profil, bukan jumlah warga terverifikasi; pemeriksaan adanya mandat tidak memastikan akun pemegang masih aktif.

Security advisor tetap hanya melaporkan [proteksi password bocor belum aktif](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Kebijakan D-02/D-03, formula kelulusan dan parameter operasional tetap belum ditetapkan oleh modul draf program.
