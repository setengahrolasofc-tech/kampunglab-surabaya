# Pusat notifikasi dalam aplikasi

Milestone 1 November 2026. Implementasi parsial FR-17 untuk alur yang sudah tersedia dalam mode DEMO. Tidak menetapkan D-02, D-03, D-07, D-13, D-17/D-18 atau D-22.

## Yang tersedia

- `/notifikasi` memerlukan akun masuk. Filter Belum dibaca/Semua, jumlah pembaruan, pagination 20 baris, waktu Asia/Jakarta (WIB), tombol muat ulang, kondisi kosong dan gagal muat.
- Dashboard menampilkan jumlah belum dibaca dan tautan. Header memakai tautan statis; tidak membaca sesi atau jumlah notifikasi pada halaman publik.
- Tombol **Buka pembaruan** mengirim Server Action, memeriksa ulang akses, menyimpan tanda baca, lalu membuka halaman asal. Membaca daftar, prefetch, dan GET tidak menandai baca. Tidak ada tombol menyetujui keputusan dari notifikasi.
- Antrean yang berpindah tahap hilang dari petugas tingkat sebelumnya. Pemegang mandat utama baru dapat melihat antrean yang masih menunggu. Hak yang dicabut/kedaluwarsa dan pembagian panel yang dijeda diperiksa dari database setiap pembacaan/pembukaan.

| Sumber | Penerima | Tujuan |
|---|---|---|
| Salinan menunggu RT/RW/kelurahan | Mandat utama aktif pada tingkat/wilayah yang sesuai, selain pengaju | Rincian salinan |
| Catatan RT dan keputusan/revisi/penolakan/konflik | Pengaju | Rincian salinan |
| Permintaan fisik pending | Mandat utama kelurahan sesuai wilayah, selain pengaju | Permintaan fisik |
| Tindakan pemeriksa fisik | Pengaju | Riwayat permintaan fisik |
| Penugasan panel aktif | Reviewer dengan peran, penugasan, pembagian, dan akses aktif | Penugasan sendiri |
| Nilai/laporan konflik panel tersimpan | Pengaju dan mandat utama kelurahan yang boleh melihat ringkasan | Ringkasan panel |
| Perubahan pembagian/susunan panel, kebutuhan pengganti karena konflik | Admin program aktif | Metadata koordinasi panel |
| Penetapan/pencabutan reviewer | Pengaju; pencabutan juga untuk reviewer dengan peran masih berlaku | Ringkasan pengaju atau riwayat penugasan sendiri |
| Penetapan/pencabutan peran dan mandat akun | Pemilik akun | Dashboard akses |

Tindakan oleh akun yang sama umumnya tidak menimbulkan pembaruan untuk dirinya. Penetapan akses disebut **dicatat**, sehingga penetapan untuk masa mendatang tidak diklaim sudah aktif. Notifikasi tidak memberikan peran atau memperluas akses asal. Admin hanya melihat metadata koordinasi; notifikasi tidak memuat nilai, suara, alasan, nama/judul proposal, isi dokumen atau lampiran. Akun kelurahan yang pernah ditugaskan sebagai reviewer pada panel yang sama tidak mendapat pembaruan hasil reviewer lain melalui mandat kelurahannya.

## Penyimpanan dan batas teknis

Migrasi `20261101022903_in_app_notification_inbox.sql` sudah diterapkan. Versi ini berasal dari waktu penerapan native, lebih awal daripada dua migrasi upstream `20261101030000/30001`. Modul ini hanya bergantung pada schema identitas/pemeriksaan/fisik/panel 30–31 Oktober, sehingga urutan replay menurut nama file tetap sah. Total 20 file migrasi/20 entri cloud.

- Tidak membuat salinan kotak masuk per penerima, trigger pengiriman, atau backfill. Kandidat dibentuk dari sumber yang ada saat daftar dibaca. Peristiwa sebelum fitur dipasang dapat muncul sebagai belum dibaca. Filter Semua berarti seluruh pembaruan yang **masih boleh diakses**, bukan arsip permanen lintas jabatan.
- `notification_receipts` hanya berisi akun, jenis, UUID sumber, waktu peristiwa dan waktu baca. Kunci `(user_id, kind, source_id)` mencegah tanda baca ganda. Waktu peristiwa yang berubah menjadi belum dibaca lagi. Tidak menyalin judul, email, isi, nilai, maupun URL berkas. Belum menetapkan retensi/penghapusan fisik D-13.
- RLS deny-all dan pencabutan CRUD langsung untuk anon/authenticated. Kandidat privat tidak dapat dipanggil langsung oleh kedua peran. RPC publik `notification_workflow` adalah invoker, hanya authenticated; helper definer privat memakai search_path kosong dan memeriksa sesi hidup di database.
- Operasi `open` memakai lock administrasi mandat/alur yang sama, memeriksa sesi ulang, mencari sumber sesuai hak terkini, dan membandingkan timestamp sumber. Identitas penerima serta tujuan tidak diterima dari form. Tujuan berasal dari database dan dibatasi lagi ke rute internal yang dikenal oleh Server Action.
- Timestamp PostgreSQL dikirim utuh sampai mikrodetik untuk membedakan putaran antrean; tampilan WIB tidak dipakai untuk validasi versi. Percobaan ulang tanda baca untuk sumber/versi yang sama aman. Jika koneksi terputus setelah commit, daftar dapat sudah menandai baca meskipun navigasi belum selesai; pengguna dapat membuka lagi lewat filter Semua.
- Halaman protected dynamic dan proxy private/no-store. Tidak ada polling, Realtime, push, email, atau penjadwalan. Memuat daftar memperbarui isi/jumlah; tidak ada janji pembaruan seketika antar-tab.

## Batas verifikasi

Lint, tipe Next.js/Edge, build produksi, serta metadata RLS/grant dan advisor diperiksa. Metadata menunjukkan 20 tabel public dengan RLS, tabel tanda baca tanpa CRUD aplikasi, wrapper invoker authenticated-only, helper kandidat privat, dan search_path kosong. Hash tiga fungsi dicocokkan dengan migrasi. Security advisor hanya melaporkan peringatan lama proteksi password bocor belum aktif; lihat [panduan Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Sesuai arahan pengguna, tes unit, SQL skenario, HTTP, browser, dan UAT belum dijalankan. Tidak membuat akun, mandat, permintaan, panel, tanda baca, atau fixture QA. Keberhasilan build/migrasi tidak membuktikan alur pengguna lulus. Tidak deploy ulang Edge; sumber berkas tidak berubah. Deployment Vercel belum diverifikasi.

Pemeriksaan untuk tahap pengujian nanti:

- [ ] Warga hanya menerima peristiwa miliknya; anon, akun lain, sesi hilang/kedaluwarsa, dan akun dinonaktifkan tidak bisa membaca atau menandai sumber.
- [ ] Antrean memakai mandat utama aktif, wilayah dan tingkat tepat. Cadangan/delegasi/admin tanpa mandat tidak memperoleh isi; pergantian mandat mencabut akses lama.
- [ ] Pindah tahap/revisi memperbarui daftar dan jumlah, termasuk saat sumber berubah sebelum tombol dibuka. Dua tab/retry tidak menggandakan receipt.
- [ ] Permintaan fisik ditarik/obsolete hilang dari pemeriksa, riwayat pengaju tetap tersedia.
- [ ] Reviewer hanya melihat tugasnya saat pembagian aktif. Jeda/pencabutan/peran berakhir memutus akses; akun peran ganda tidak melihat hasil reviewer lain. Admin hanya mendapat metadata koordinasi.
- [ ] GET/prefetch tidak menandai baca; buka melalui POST menandai satu sumber/versi. Timestamp mikrodetik, manipulasi jenis/UUID/waktu/tujuan, dan akses tabel/RPC langsung ditangani aman.
- [ ] Filter, pagination, keadaan kosong/gagal, navigasi keyboard, lebar layar kecil, serta tanggal WIB sesuai tampilan.

Email satu kali setelah 24 jam, status job/audit pengiriman, provider/scheduler D-22, dan pembaruan modul dana/uji/passport tetap belum dibangun. Tidak ada kenaikan tahap atau persetujuan otomatis.
