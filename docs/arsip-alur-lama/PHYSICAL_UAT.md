# Jalur rekomendasi fisik DEMO

Pembaruan 31 Oktober 2026. Fitur sudah dibangun, migrasi diterapkan, dan layanan berkas diperbarui. **Tes fungsional dan UAT ditunda atas permintaan pengguna.** Lint, TypeScript Next.js/Edge, kompilasi produksi, metadata database, dan deployment fungsi dilaporkan terpisah; semuanya tidak membuktikan alur pengguna telah lulus.

## Batas kebijakan

Keputusan pengguna: setelah 7 hari tanpa keputusan RT/RW, inovator boleh memakai surat rekomendasi fisik; hitungan dimulai ulang setiap masuk tingkat dan tidak ada kenaikan otomatis. Pihak yang berwenang mengonfirmasi operasional masih belum final pada FR-04. Implementasi ini memakai **mandat utama kelurahan yang independen untuk DEMO**, dengan label jelas di halaman pengaju/petugas. Tidak menetapkan kewenangan nyata, pengajuan resmi, atau persetujuan program/dana.

Rentang konfigurasi admin 1–30 hari dan batas 5 permintaan baru/salinan/24 jam adalah batas teknis latihan. Klasifikasi, kuota berkas, retensi D-13, konflik/pengganti D-17/D-18, dan kewenangan nyata tetap memerlukan kebijakan operasional.

## Cara memakai

1. Pengaju mengirim salinan DEMO melalui langkah 4 draf. Halaman `/simulasi/[id]` menampilkan jam mulai antrean RT/RW, batas hari, tanggal pembukaan, dan waktu informasi diperiksa dalam WIB. Muat ulang untuk memperbarui; jam browser tidak menentukan kelayakan.
2. Setelah batas tercapai, buka **Ajukan lewat dokumen fisik**, lalu pratinjau dan unduh draf RT/RW terisi otomatis. Lengkapi bagian manual, minta pemeriksaan/keputusan serta tanda tangan/stempel pihak berwenang. Template kosong tetap tersedia; contoh 7 hari di dalamnya perlu disesuaikan bila konfigurasi berubah. Draf berstatus usulan DEMO. Rincian fitur 1 November 2026 dan UAT yang belum dijalankan ada di `PHYSICAL_LETTER_UAT.md`.
3. Ikuti tautan unggah khusus. Berkas PDF/JPEG/PNG/WebP maksimal 3 MiB diberi klasifikasi `physical_rt` atau `physical_rw`, ID salinan dan waktu masuk antrean. Surat tidak ikut snapshot pendukung biasa. Unggah lewat pengelola berkas umum tetap diklasifikasikan `supporting` dan tidak dapat dipilih sebagai surat fisik.
4. Kembali dan muat ulang halaman jalur fisik. Pilih surat siap sesuai konteks, isi penjelasan, lalu setujui pembagian salinan lengkap, PRD, RAB, lampiran pendukung terkunci, dan surat terpilih kepada pemeriksa kelurahan. Hanya satu permintaan pending per tahap. Pengiriman tidak memindahkan antrean.
5. Pemegang mandat utama kelurahan aktif pada wilayah yang sama membuka `/antrean/dokumen-fisik`. Admin global/cadangan/delegasi tanpa mandat utama tidak memperoleh isi otomatis. Pengaju tidak dapat memeriksa permintaannya sendiri.
6. Pemeriksa mendeklarasikan konflik dan membaca salinan/berkas. Konfirmasi wajib memeriksa tanda tangan/stempel/identitas, mengonfirmasi ke RT/RW, dan mencocokkan isi serta seluruh pemeriksaan substansi tahap terkait. Alasan mencatat hasil/cara/waktu konfirmasi. Konfirmasi mencatat rekomendasi RT/RW bermetode fisik, dengan aktor dan jabatan kelurahan sebenarnya, lalu meneruskan satu tahap saja.
7. Penolakan dokumen mewajibkan alasan, menutup permintaan, dan mempertahankan status/jam antrean. Pengaju dapat menyiapkan surat baru atau memakai surat siap yang masih sesuai dan mengirim permintaan baru. Laporan konflik tidak menutup permintaan atau memindahkan antrean; diperlukan petugas independen lain.
8. Pengaju dapat menarik permintaan pending. Ketika keputusan digital mengubah tahap, pending ditutup sebagai obsolete. Akses khusus kelurahan ke permintaan ditarik/obsolete dicabut; pemilik tetap melihat riwayat. Permintaan diterima/ditolak tetap dapat dibaca pemegang mandat kelurahan terkini pada wilayah yang sama selama akun pengaju aktif.

## Jam, konfigurasi, dan konkurensi

- `queue_entered_at` dicatat database saat insert atau perubahan status, termasuk masuk RW setelah rekomendasi RT. Catatan/konflik dan penolakan dokumen fisik tidak mengulang jam. Kirim ulang revisi adalah salinan baru dari RT seperti alur DEMO sebelumnya.
- `/admin/jalur-fisik` hanya untuk admin program aktif, default 7 × 24 jam per tahap. Nilai 1–30 dengan alasan dicatat sebagai versi baru; history 20 terbaru. Perubahan berlaku pada kelayakan **permintaan baru**, termasuk antrean yang sudah menunggu, tanpa mengganti waktu masuk. Permintaan terkirim mempertahankan versi, batas hari dan tanggal eligible saat dibuat. Tidak mengubah keputusan/permintaan otomatis karena konfigurasi.
- Payload mengirim versi alur dan versi pengaturan; server memeriksa ulang sesi, hak, jam, konteks berkas, dan status. Perubahan dua tab menghasilkan konflik, bukan overwrite. Request ID stabil mendukung retry identik; ID sama dengan isi berbeda menghasilkan konflik. Input terkontrol dipertahankan saat server mengembalikan kesalahan.
- Mutasi memakai lock transaksi yang sama dengan administrasi mandat dan keputusan digital, kemudian lock salinan/permintaan. Keputusan bersamaan tidak boleh menghasilkan dua perpindahan tahap. Akun yang sudah merekomendasikan atau melaporkan konflik pada putaran sama diblokir dari keputusan substansi berikutnya, termasuk konfirmasi fisik dan kelurahan digital. Tidak mengaktifkan mandat cadangan otomatis.
- Jam antrean lama dibackfill dari rekomendasi terakhir yang memasuki status saat ini, atau waktu pengiriman. Tidak ada modifikasi jam/konfigurasi untuk menguji atau mempercepat proses pada pembangunan ini.

## Privasi dan penyimpanan

- Migrasi nyata `20261031124904_demo_physical_recommendation_workflow.sql`: tiga tabel tambahan, seluruhnya RLS deny-all dan tanpa CRUD anon/authenticated. `physical_workflow` memakai wrapper invoker dan fungsi privat definer dengan search_path kosong serta verifikasi sesi/hak. Tidak memperluas helper global akses salinan.
- Permintaan menyimpan persetujuan, referensi surat tetap, tahap dan versi jam/pengaturan. Isi salinan inovasi tetap memakai snapshot putaran. Pendukung permintaan berasal dari manifest salinan tersebut, bukan draf terbaru.
- Surat tetap di bucket private yang sama; metadata/digest tidak dapat ditulis ulang. Klasifikasi mencegah surat fisik disalin menjadi pendukung putaran berikutnya. Pending surat fisik tidak menghambat pengiriman pendukung dan perubahan surat tidak menaikkan versi pendukung.
- Unduhan surat/pengganti konteks pendukung melalui `/lampiran/[id]?fisik=[request-id]`; backend memeriksa sesi, scope wilayah, status permintaan, akun pengaju dan relasi berkas sebelum/sesudah membaca blob. Pemilik tetap membaca arsip sendiri. Tidak ada URL publik/signed URL berumur panjang.
- Riwayat salinan menampilkan label rekomendasi manual dan aktor/jabatan sebenarnya. RT/RW tidak otomatis memperoleh scan surat fisik. Dokumen/isi permintaan tidak masuk etalase/passport. Etalase/passport sendiri belum dibangun.
- Lepas/pulihkan berkas tidak menulis ulang blob atau mengganti surat yang telah dirujuk permintaan. Penarikan mencabut akses khusus, bukan menghapus data atau akses biasa ke salinan yang sudah dicapai. Belum ada penghapusan fisik otomatis; retensi D-13 tetap terbuka.
- Edge `private-attachments` saat ini versi 4 ACTIVE setelah penambahan konteks panel, `verify_jwt=false` dengan verifikasi pengguna Auth.getUser dan sesi database di handler/RPC seperti milestone berkas sebelumnya. Tidak ada key backend baru pada Next.js/laptop atau repository.

## Skenario pemeriksaan untuk nanti

Belum dijalankan. Gunakan fixture terpisah yang di-rollback atau lingkungan latihan, bukan dokumen warga nyata. Jangan mengubah clock produksi untuk mencoba batas hari.

- Tepat sebelum/pada/sesudah batas, waktu browser palsu, pergantian RT ke RW, konflik/catatan, revisi, konfigurasi naik/turun, permintaan sebelum perubahan konfigurasi, dan dua admin menyimpan bersamaan.
- Unggah khusus sebelum waktunya, salah tahap/putaran/draf, supporting yang disamarkan sebagai surat, pending, surat diarsipkan/dipulihkan, retry setelah tahap berubah, serta format/ukuran/digest berkas.
- Persetujuan wajib, salinan/pendukung yang dibagikan tepat, surat tetap setelah draf berubah, satu pending per tahap, pagination riwayat, kuota 5/24 jam, retry identik/berbeda dan respons jaringan hilang.
- Konfirmasi dengan setiap checklist kurang, penolakan beralasan tanpa reset jam, konflik tanpa substansi, pengaju memeriksa sendiri, bekas pemberi rekomendasi/conflict, pergantian/cabut/kedaluwarsa mandat, sesi keluar, pengaju nonaktif, lintas wilayah/admin/cadangan/delegasi.
- Dua pemeriksa serentak, keputusan digital versus konfirmasi fisik, withdraw versus konfirmasi, pending obsolete otomatis, dan tepat satu review event/perpindahan.
- Baca/unduh sebelum/sesudah withdraw/obsolete; riwayat accepted/rejected mengikuti mandat terkini. Raw Data API/Storage/finalisasi dan fungsi privat tidak boleh menjadi jalur bypass.
- Keyboard, pembaca layar, layar kecil, hidrasi formulir, error tanpa kehilangan alasan, tautan template/unggah/kembali, dan informasi waktu yang perlu dimuat ulang.

Security advisor setelah migrasi hanya mencatat peringatan lama [proteksi password bocor belum aktif](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Tidak ada fixture, surat fisik, atau keputusan baru yang dibuat pada milestone ini.
