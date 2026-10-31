# Simulasi dan antrean pemeriksaan

Pembaruan 31 Oktober 2026. **Tes alur baru dan UAT ditunda atas permintaan pengguna.** Panduan ini merupakan petunjuk penggunaan dan daftar pemeriksaan untuk nanti, bukan laporan lulus. Batas teknis/status ada di [aturan alur DEMO](DEMO_REVIEW_WORKFLOW.md) dan [status proyek](PROJECT_STATUS.md).

## Menggunakan alur yang dibangun

1. Jalankan kode terbaru. Di `/pengajuan`, lengkapi tema DEMO aktif dan hierarki wilayah dengan kode kelurahan/RW/RT berawalan DEMO, data inovasi/tim, PRD, RAB, dan pernyataan keaslian.
2. Simpan semua perubahan, buka langkah 4, lalu konfirmasikan pembagian salinan DEMO kepada petugas berwenang sesuai tahap. Kirim simulasi; referensinya berawalan DEMO dan bukan nomor resmi.
3. Petugas utama RT membuka `/antrean/rt`, membaca salinan, mengisi deklarasi, memilih tindakan, checklist, dan alasan. Rekomendasi meneruskan ke RW; revisi/penolakan wajib alasan. Catatan awal tanpa keputusan juga tetap tersedia.
4. Sesudah rekomendasi RT, petugas utama RW membuka `/antrean/rw`. Tinjauan kelayakan, duplikasi, dan RAB dilakukan manusia; tidak ada validasi dana atau pencarian duplikasi otomatis. Rekomendasi diteruskan ke kelurahan.
5. Kelurahan membuka `/antrean/kelurahan` untuk membaca salinan beserta rekomendasi. Keputusan akhir program/panel/dana belum dibuka.
6. Bila diminta revisi, pengaju membaca alasan, mengubah dan menyimpan draf, lalu kirim salinan revisi dari langkah 4. Isi harus berubah. Referensi/putaran baru dimulai dari RT untuk DEMO; salinan dan riwayat sebelumnya tetap tersimpan. Ini bukan pengesahan aturan operasional D-07.
7. Pengaju melihat status putaran terbaru di Pengajuan Saya dan dapat mengikuti tautan putaran sebelumnya/berikutnya. Draf live tetap pribadi; perubahan draf tidak mengubah isi salinan yang sedang ditinjau.

## Menyiapkan akun untuk pemeriksaan nanti

- Gunakan akun pribadi terkonfirmasi yang berbeda untuk pengaju dan petugas. Penetapan mandat dilakukan admin yang berwenang pada wilayah/jabatan DEMO yang sesuai, dengan referensi latihan dan masa berlaku yang jelas. Jangan membuat SK atau pejabat palsu sebagai penetapan resmi.
- Untuk alur lengkap, gunakan pemeriksa RT dan RW yang berbeda. Pengaju tidak memeriksa dirinya sendiri; akun yang sudah merekomendasikan putaran yang sama tidak memutuskan tahap berikutnya. Akun admin program tidak otomatis menjadi pemeriksa.
- Petugas memerlukan mandat **utama** aktif pada wilayah dan tingkat yang tepat. Cadangan/delegasi belum mendapat aktivasi otomatis. Tautan antrean dashboard mengikuti kemampuan tersebut.
- Konflik harus dicatat tanpa keputusan substansi. Pengelola menyiapkan petugas pengganti independen melalui pengelolaan mandat; tidak ada pelompatan, pembatalan konflik, atau sanksi otomatis. Kebijakan D-17/D-18 tetap terbuka.

## Pemeriksaan yang belum dijalankan untuk fitur keputusan

| Area | Yang perlu diperiksa nanti |
| --- | --- |
| RT → RW → kelurahan | Satu tahap per rekomendasi, checklist wajib, alasan dan atribusi tersimpan, kelurahan tidak punya aksi final |
| Revisi/penolakan | Alasan terlihat pengaju; hanya revisi dapat dikirim ulang; isi lama tetap; putaran baru mulai RT |
| Idempotensi/konkurensi | Retry persis sama tidak menggandakan; request berubah dan versi lama ditolak; dua keputusan tidak saling menimpa |
| Scope akses | Warga lain/admin tanpa mandat/RT lain/cadangan/delegasi ditolak; RW/kelurahan belum membaca sebelum tahapnya |
| Waktu dan sesi | Halaman lama setelah mandat dicabut/habis, sesi keluar, atau akun nonaktif tidak membuka akses baru |
| Konflik/independensi | Laporan tidak memindahkan antrean; pelapor dan pemeriksa tahap sebelumnya tidak memutuskan substansi |
| Tampilan/interaksi | Login akun terpisah, hidrasi form, input tetap setelah error, status pending, keyboard, layar 320/768 px |

Tidak ada tes unit/SQL/HTTP untuk keputusan atau kirim ulang revisi yang dijalankan pada milestone ini. Tes milestone sebelumnya (26 unit, SQL rollback, 14 skenario HTTP pengaju) hanya mencakup keadaan sebelum perluasan alur; jangan menafsirkannya sebagai tes alur baru. Script/fixture lama masih disimpan sebagai riwayat dan perlu penyesuaian sebelum regresi penuh.

Lint, TypeScript, build, serta pembacaan metadata/advisor dilaporkan terpisah. Riwayat keputusan baru tidak dapat dibaca langsung dari tabel oleh authenticated; RPC details memeriksa sesi/scope salinan sebelum mengembalikan riwayat. RLS dan kompilasi bukan bukti pengujian akses dengan akun petugas sudah lulus.

Mode tetap DEMO. Tidak ada pengajuan resmi, lampiran, panel, persetujuan/realisasi dana, email pengingat, atau tanda tangan elektronik resmi.
