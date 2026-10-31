# Alur pemeriksaan DEMO

Pembaruan 31 Oktober 2026. Pengguna meminta melanjutkan pembangunan dan menunda tes alur. Fitur ini dibangun sebagai latihan alur yang jelas berlabel DEMO. Belum layak dianggap pengajuan atau keputusan program resmi.

## Perilaku yang dibangun

| Status tersimpan | Petugas yang bertindak | Tindakan berikutnya |
| --- | --- | --- |
| `waiting_rt` | Mandat utama RT sesuai wilayah | Rekomendasikan ke RW, minta revisi, tolak, atau laporkan konflik |
| `waiting_rw` | Mandat utama RW sesuai wilayah | Rekomendasikan ke kelurahan, minta revisi, tolak, atau laporkan konflik |
| `waiting_kelurahan` | Mandat utama kelurahan sesuai wilayah | Baca salinan dan riwayat; keputusan akhir belum tersedia |
| `revision_requested` | Pengaju | Edit dan simpan draf; kirim salinan revisi yang berbeda dari salinan sebelumnya |
| `rejected` | Tidak ada keputusan lanjutan pada putaran ini | Alasan dan salinan tetap dapat dibaca sesuai akses |

Semua tindakan RT/RW memerlukan alasan 3–4.000 karakter serta deklarasi konflik. Rekomendasi lanjut memerlukan seluruh checklist tahap tersebut. RT memeriksa domisili dan masalah; RW mencatat tinjauan manual kelayakan, duplikasi, dan kewajaran RAB. Checkbox mencatat pernyataan manusia, tanpa mengklaim algoritme duplikasi, kelayakan plafon, atau keputusan pendanaan sudah tersedia. Penunjukan fasilitator dan aktivasi alur uji belum dibangun.

Permintaan revisi menutup pemeriksaan putaran lama. Dari langkah 4 draf, pengaju mengonfirmasi pembagian salinan baru kepada petugas sesuai tahap. Versi tersimpan harus lebih baru dan isi berbeda; kirim ulang membuat referensi DEMO baru dengan `attempt` berikutnya dan `previous_simulation_id`. Seluruh putaran revisi DEMO mulai lagi di RT, termasuk bila wilayah berubah. Ini **aturan latihan sementara**, bukan keputusan operasional D-07.

Laporan konflik tidak memindahkan antrean. Akun yang melaporkan konflik, termasuk lewat catatan awal RT, atau pernah merekomendasikan putaran tersebut tidak dapat membuat keputusan substansi berikutnya. Admin berwenang perlu menyiapkan mandat utama petugas lain yang independen; tidak ada pembatalan konflik, eskalasi, sanksi, atau aktivasi cadangan otomatis. Kebijakan operasional D-17/D-18 tetap terbuka.

## Penyimpanan dan akses

- Migrasi `20261031045110_demo_review_decisions_and_revision_rounds.sql` telah diterapkan melalui koneksi proyek yang dipilih. Tipe dihasilkan dari schema nyata. Tidak ada petugas/mandat atau keputusan contoh yang dibuat dalam milestone ini.
- `innovation_simulations` tetap menyimpan isi salinan, dengan putaran, induk revisi, tahap yang telah dicapai, dan versi alur. Salinan satu putaran tidak dapat diubah melalui aplikasi; hanya status/versi alurnya yang berubah lewat RPC.
- `simulation_review_events` menyimpan aktor, nama tampilan, jabatan, mandat, tahap, alasan, checklist, status sebelum/sesudah, request ID, dan waktu. Atribusi diperoleh dari sesi dan mandat database, bukan field browser. Riwayat tidak dapat diedit melalui aplikasi.
- Tabel riwayat baru tidak memberikan SELECT/INSERT/UPDATE/DELETE kepada authenticated/anon, serta memiliki RLS deny-all. RPC `simulation_workflow` operasi `details` mengembalikan field riwayat yang diperlukan setelah memeriksa hak atas salinan induk. Tidak ada endpoint daftar riwayat bebas.
- Pemilik membaca putarannya sendiri. RT terkait dapat membaca salinan; RW baru memperoleh akses setelah rekomendasi RT; kelurahan setelah rekomendasi RW. Hak mengikuti mandat utama aktif saat permintaan, bukan hak permanen karena pernah memeriksa. Admin tanpa mandat terkait tidak memperoleh akses isi otomatis.
- Antrean `/antrean/rt`, `/antrean/rw`, dan `/antrean/kelurahan` menampilkan status menunggu tingkat tersebut, sesuai wilayah mandat utama, 20 per halaman. Tautan dashboard mengikuti kemampuan akun. Pemilik tidak memeriksa dirinya sendiri.
- Akun pengaju nonaktif tetap disembunyikan dari petugas. Cadangan/delegasi belum diaktifkan. Riwayat lama tidak dihapus otomatis; retensi D-13 tetap terbuka.
- Penulisan memakai lock perubahan mandat admin, lock salinan, pemeriksaan sesi/scope setelah menunggu, dan versi alur. Permintaan persis sama mengembalikan hasil sebelumnya; request ID yang sama dengan isi berbeda mengembalikan konflik. Dua keputusan pada versi lama tidak boleh saling menimpa.
- Audit privat mencatat metadata perubahan tanpa menyalin dokumen/alasan. Riwayat putaran/catatan masih dimuat seluruhnya pada prototipe; pagination riwayat untuk volume besar belum tersedia.

## Batas verifikasi

Lint, TypeScript, dan build diperiksa terpisah dari tes fungsional. Tes unit/SQL/HTTP untuk keputusan, transisi RT/RW, konflik, konkurensi, kirim ulang revisi, dan akses kelurahan **belum dijalankan** atas permintaan pengguna. Hasil tes milestone sebelumnya tidak membuktikan alur yang baru ditambahkan sudah lulus. UAT browser juga masih ditunda; lihat `SIMULATION_UAT.md`.

Metadata database memperlihatkan RLS aktif pada 10 tabel public aplikasi dan tidak ada grant SELECT authenticated ke tabel riwayat baru. Pembacaan metadata/advisor bukan pengujian akses dengan sesi petugas. Peringatan lama [proteksi password bocor](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) masih ada. Tidak ada klaim siap produksi atau deployment Vercel.
