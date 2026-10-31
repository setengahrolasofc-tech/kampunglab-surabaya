# Profil wilayah dan draf inovasi

Pengguna menyetujui milestone ini pada 31 Oktober 2026: profil wilayah, Pengajuan Saya, formulir empat langkah, simpan/edit draf pribadi, dan placeholder berlabel DEMO. Persetujuan akses layanan tidak mengesahkan seluruh keputusan D-xx. Pengiriman final, unggah berkas, review, duplikasi, plafon, dan pembiayaan operasional tetap belum aktif.

## Mencoba di laptop

1. Hentikan server lama, `git pull --ff-only`, lalu `npm run dev` pada folder proyek. Environment yang ada tetap digunakan; migrasi sudah diterapkan pada proyek Supabase yang sama.
2. Masuk dengan akun pribadi dan buka `/profil/wilayah`. Pilih kelurahan → RW → RT lalu simpan.
3. Tersedia satu hierarki **DEMO Kelurahan KampungLab / DEMO RW 01 / DEMO RT 01** dan empat tema **DEMO — Tema 1–4**. Semuanya placeholder latihan, bukan wilayah atau tema resmi program. Tidak ada petugas fiktif yang ditetapkan.
4. Buka `/pengajuan`, klik **Buat draf pengajuan**, isi empat langkah. Tombol **Simpan draf** menyimpan seluruh langkah, termasuk bagian yang masih kosong. **Simpan dan lanjut** juga menyimpan posisi langkah berikutnya.
5. Kembali ke daftar, buka draf lagi, dan periksa semua isian, wilayah, daftar tim, rincian RAB, serta pernyataan keaslian.

## Yang perlu diuji manusia

- Sebelum domisili diisi, pembuatan draf diarahkan untuk melengkapi profil. Dropdown RW mengikuti kelurahan; RT mengikuti RW. Mengubah induk mereset pilihan anak.
- Ubah domisili setelah membuat draf: wilayah draf lama harus tetap sama; draf baru mengambil domisili yang terbaru.
- Isian kosong diperbolehkan dalam draf. Angka negatif/format harga salah, tahap/bentuk tidak dikenal, serta rencana perawatan di luar 6–12 bulan ditolak bila diisi. Pesan tidak menghapus masukan di formulir.
- Tim dapat ditambah/dihapus, maksimal 20 baris; daftar itu tidak memberi hak edit akun anggota. RAB maksimal 50 baris; batas ini adalah kapasitas teknis prototipe, bukan kebijakan plafon dana.
- Harga dalam rupiah bulat tanpa pemisah. Volume maksimal tiga desimal; koma dinormalisasi ke titik saat disimpan. Subtotal dihitung tepat dengan bilangan bulat berskala, tanpa pembulatan kebijakan tersembunyi. Total rencana = subtotal kebutuhan + dana tak terduga + honor. Estimasi perawatan dicatat terpisah dan tidak ditambahkan otomatis.
- Buka satu draf di dua tab. Simpan tab pertama, lalu tab kedua dengan revisi lama. Tab kedua harus menolak menimpa dan mempertahankan isian lokal. Buat salinan perubahan sebelum memuat ulang.
- Perubahan yang belum disimpan diberi indikator. Browser memperingatkan saat halaman ditutup; tautan kembali ke daftar meminta penyimpanan lebih dahulu. Verifikasi dialog, fokus, dan navigasi dengan keyboard.
- Checklist langkah 4 hanya memeriksa isian pokok, bukan menyatakan kelayakan dana atau persetujuan program. Ringkasan menampilkan data yang sedang diisi; tombol simpan menyimpan semuanya.
- Dengan akun B, coba URL draf akun A: data tidak tersedia. Akun admin juga tidak otomatis memperoleh akses membaca draf warga. Keluar akun lalu buka editor: harus menuju Masuk.
- Periksa mobile 320/768 px, label, focus ring, error lintas langkah, status pending, tombol tambah/hapus baris, dan pesan setelah reload. Coding agent tidak menjalankan browser/DOM atau mengklaim UAT visual lulus.

## Desain dan batas akses

- `profiles.domicile_rt_id` berelasi dengan wilayah jenis RT melalui FK komposit. Nama tampilan tetap dikelola oleh alur profil sebelumnya.
- `innovation_themes` hanya dibaca pengguna login. Pengelolaan tema resmi masih melalui pengelola terpercaya; tidak ada empat nama resmi yang dikarang AI.
- `innovation_drafts` menyimpan dokumen terstruktur, pemilik, request ID pembuatan, revisi, langkah terakhir, dan waktu simpan. Draf bukan nomor pengajuan atau versi dokumen terkirim. Status hanya `draft` pada milestone ini.
- Seluruh tabel public memakai RLS. Hanya pemilik dengan akun/sesi valid yang dapat membaca draf. Tidak ada grant INSERT/UPDATE/DELETE langsung untuk pengguna aplikasi, termasuk admin program.
- RPC public memakai SECURITY INVOKER; implementasi privileged di private memeriksa auth.uid(), akun terkonfirmasi, status blokir, session_id, ownership, tipe data, tema aktif, hierarki, dan revisi di dalam transaksi.
- Pembuatan bersifat idempoten per pemilik + request ID. Penyimpanan memeriksa revisi secara atomik. Permintaan dari tab/perangkat lain dengan revisi lama gagal dengan HTTP 409 (`PT409`); tidak ada overwrite otomatis. Kode status mengikuti [dokumentasi PostgREST](https://docs.postgrest.org/en/stable/references/errors.html#raise-errors-with-http-status-codes).
- Audit privat hanya menyimpan aktor, role koneksi database, ID draf, tindakan, revisi, langkah, dan waktu. Pemeliharaan melalui pengelola database dicatat tanpa mengatasnamakan pengguna. Isi PRD, RAB, anggota tim, serta domisili tidak disalin ke audit. Tabel audit tidak dapat dibaca/diubah melalui aplikasi.
- Katalog formulir dibatasi 1.000 wilayah pada prototipe; jika lebih, aplikasi menampilkan kesalahan, bukan daftar terpotong tanpa pemberitahuan. Pemuatan bertahap untuk skala seluruh kota masih pekerjaan lanjutan. Daftar draf memiliki pagination 20 per halaman.
- Google, kolaborasi akun tim, lampiran/Storage, kirim final, konflik kepentingan, rubrik, plafon dan persetujuan anggaran tetap mengikuti keputusan PRD yang belum disahkan.

## Verifikasi otomatis

- `npm test`: draf kosong, field yang diizinkan, input tidak valid, checklist, hitungan pecahan dan nilai besar, serta pemisahan biaya perawatan.
- `supabase/tests/innovation_drafts.sql`: fixture sintetis dengan BEGIN/ROLLBACK; mencakup domisili, pembuatan idempoten, simpan, konflik revisi, penolakan data cacat, ownership lintas akun/admin, sesi salah/kedaluwarsa, penolakan mutasi langsung, dan proteksi audit.
- `scripts/verify-drafts-http.mjs`: produksi HTTP + SDK tanpa browser, memakai akun sintetis `@example.invalid`. File privat `AUTH_TEST_FIXTURE_FILE` berisi id/email/password dan ID katalog DEMO. Script mengubah domisili dan membuat draf QA privat, memeriksa penyimpanan semua langkah, reopen/list, stale save, dua simpan serentak, status terlarang, dan logout. Jangan menjalankan dengan kredensial warga nyata. Setelah tes, nonaktifkan fixture/sesi dan bersihkan isi draf QA melalui jalur pengelola terpercaya.
- Script lint, typecheck, dan build tetap diperlukan. Hasil aktual, advisori, dan pembersihan QA dicatat di PROJECT_STATUS.md.
