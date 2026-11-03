# Draf surat rekomendasi fisik terisi otomatis

Milestone 1 November 2026. Pelengkap FR-04 untuk jalur fisik **DEMO** yang sudah ada; tidak menetapkan kewenangan operasional pemeriksa, D-17/D-18/D-19, atau mengaktifkan pengajuan resmi.

## Alur yang dibangun

1. Pemilik membuka `/simulasi/[id]/dokumen-fisik` setelah batas waktu antrean RT/RW terpenuhi.
2. Tautan pratinjau mengarah ke `/simulasi/[id]/dokumen-fisik/surat`. Halaman menampilkan data sumber, isian yang belum tersedia, pemeriksaan manual, dan tombol Word.
3. `/simulasi/[id]/dokumen-fisik/surat/unduh` menghasilkan DOCX privat di memori. Nama file berlabel DRAF-DEMO dan memuat UUID salinan; tidak memakai judul/nama akun sebagai nama file.
4. Pengaju melengkapi bagian manual di Word/kertas, meminta pemeriksaan/tanda tangan/stempel, lalu mengunggah scan/foto melalui jalur fisik yang sudah ada. Format unggah tetap PDF/JPEG/PNG/WebP maksimal 3 MiB; file Word adalah bahan cetak, bukan berkas bukti unggah.

Template kosong tetap tersedia sebagai alternatif. Contoh 7 hari yang tertulis pada template kosong perlu disesuaikan dengan batas antrean sebenarnya bila admin mengubah konfigurasi. Draf otomatis memakai nilai database saat disiapkan.

## Pemetaan data

| Isian | Sumber |
|---|---|
| Referensi DEMO, judul, putaran, revisi draf, versi alur | Salinan `innovation_simulations` yang sudah dikirim |
| RT/RW/kelurahan | ID wilayah pada salinan, lalu nama/kode master saat request; hubungan hierarki diperiksa |
| Nama tampilan akun | `profiles.display_name` milik pengaju saat request, bukan klaim identitas resmi |
| Masalah, penerima manfaat, perkiraan jumlah | Isian teks `document.prd` dari snapshot salinan; tidak mengambil draf terbaru atau mengekstrak PRD unggahan |
| Tahap, masuk antrean, batas hari, versi pengaturan, waktu kelayakan/waktu server | RPC `physical_workflow` operasi context |

Judul/referensi yang kosong dan master wilayah yang tidak lengkap menghentikan penyusunan. Isian PRD yang kosong ditandai perlu dilengkapi manual, tanpa mengarang uraian/jumlah. Jika ada isian teks PRD, teks penuh yang tersedia dalam batas schema diletakkan sebagai lampiran Word terpisah. Nama akun dan label master dimuat ulang saat unduh; nilainya dapat berbeda dari pratinjau bila profil/master berubah di antaranya. Sumber putaran tetap sama dan diperiksa versinya.

## Bagian manual dan batas dokumen

- Versi template `demo-physical-letter-v1`, ukuran A4, teks biasa, tabel identitas, footer referensi/DEMO, dan lampiran isian bila tersedia.
- Nomor surat resmi, nama pemohon sesuai dokumen, identitas pemeriksa, seluruh checklist, keputusan, alasan, tanggal penandatanganan, tanda tangan dan stempel dimulai kosong. Tidak memilih Setuju, menempel tanda tangan, atau menyatakan pemeriksaan sudah dilakukan.
- Nama tampilan akun bukan verifikasi identitas; uraian pengaju bukan hasil verifikasi. Keputusan kertas tetap memerlukan konfirmasi manual dalam aplikasi. Konflik membutuhkan pemeriksa independen sesuai alur DEMO yang sudah ada.
- DOCX dapat diedit pemilik. Metadata/label pada file bukan bukti keaslian atau TTE, dan tidak mengunci isi hasil scan. Pemeriksa tetap memeriksa kesesuaian isi/konteks dan mengonfirmasi rekomendasi.
- Download/preview tidak mengubah status, menulis rekomendasi, membuat permintaan fisik, atau mengarsipkan surat otomatis. File yang sudah diunduh tidak dapat dicabut dari laptop; akses berikutnya dan pengajuan bukti tetap diperiksa pada server.

## Akses dan implementasi

Preview/download memerlukan akun melalui `requireUser`, sesi hidup yang diperiksa RPC, dan kepemilikan salinan. Mandat/admin/reviewer tanpa kepemilikan tidak memperoleh fitur ini. Hanya antrean RT/RW yang eligible menurut waktu/database dapat memakai draf terisi; template kosong tetap publik seperti sebelumnya.

Request download membawa satu nilai untuk tahap, versi alur, versi pengaturan, dan timestamp masuk antrean; semuanya dicocokkan ke konteks database. Timestamp dikirim utuh sampai mikrodetik. Setelah DOCX selesai dibuat, context diperiksa ulang untuk sesi/pemilik/kelayakan dan kecocokan versi. Link lama setelah tahap/antrean/konfigurasi berubah ditolak. Judul, nama, isi surat dan tujuan file tidak diterima dari query.

Route memakai Node.js, `docx@9.15.1` dipin beserta lockfile, dan `Packer.toBuffer`. Data dimasukkan sebagai plain TextRun, bukan HTML/OOXML mentah atau instruksi template. Tidak mengambil gambar/font/tanda tangan jarak jauh dan tidak memakai makro. Hasil hanya berada di memori respons; tidak ditulis ke `public`, Storage, atau repository. Header attachment, private/no-store, nosniff, noindex, sandbox dan no-referrer dipasang; proxy `/simulasi/:path*` mencakup kedua rute.

Tidak ada migrasi, grant atau fungsi database baru. Total schema tetap 21 migrasi dan 20 tabel public ber-RLS menurut milestone sebelumnya. Edge tidak dideploy ulang. Instal dependency lokal dengan `npm ci`; environment tetap memakai konfigurasi aplikasi yang sudah ada.

## Verifikasi

- Lint, TypeScript Next.js/Edge, dan build produksi diperiksa.
- `npm audit --omit=dev` melaporkan 0 kerentanan pada dependency produksi saat milestone ini.
- Metadata cloud mencocokkan signature RPC dan kolom profil/master yang dipakai; tidak menjalankan skenario aplikasi atau menulis data bisnis.
- Pemeriksaan tipe menemukan urutan `.abortSignal()` harus sebelum `.single()` pada SDK terpasang, serta judul/referensi salinan yang nullable. Keduanya sudah ditangani: urutan builder diperbaiki dan sumber kosong ditolak sebelum membuat surat.

Tes unit, SQL skenario, HTTP, browser dan UAT tetap ditunda atas arahan pengguna. Belum menjalankan generator dengan fixture, mengunduh surat pengguna, membuka/render Word/PDF, mencetak surat, atau memverifikasi tata letak/interaksi secara visual. Tidak membuat akun/mandat/permintaan/keputusan/unggahan QA, dan tidak mengubah batas hari/clock agar jalur terbuka. Build tidak membuktikan hasil Word maupun alur izin sudah lulus. Vercel belum dideploy pada milestone ini.

Daftar pemeriksaan untuk tahap pengujian:

- [ ] Pemilik tepat setelah batas antrean dapat melihat/unduh; sebelum batas, akun lain, admin tanpa kepemilikan, sesi dicabut, akun nonaktif dan tahap non-RT/RW ditolak.
- [ ] Link lama setelah pindah tahap, kirim ulang, perubahan versi atau pengaturan ditolak; pencabutan sesi/perubahan antrean saat packing juga diperiksa.
- [ ] Parameter hilang/berulang, UUID/angka/timestamp tidak valid, perubahan query, serta mikrodetik timestamp ditangani aman.
- [ ] Nama/label wilayah/snapshot dan isian kosong tampil jujur. Edit draf terbaru tidak menulis ulang salinan. Sumber tanpa judul/referensi atau hierarki master tidak lengkap gagal aman.
- [ ] DOCX terbuka di Word/LibreOffice tanpa perbaikan, karakter Indonesia/Unicode/XML/newline terbaca, teks panjang/tabel/page break/footer tidak terpotong, checkbox dan ruang tanda tangan kosong.
- [ ] Isi dokumen hanya memuat field yang dipetakan, tanpa email/HP/NIK/rekening, nilai reviewer, tautan berkas, atau identitas pemeriksa yang dikarang.
- [ ] Keyboard/ponsel/tautan kembali, download gagal, cache privat, serta unggah scan hasil cetak melalui workflow lama diperiksa manusia.

Sisa pekerjaan lintas PRD diperbarui di [PRD_BACKLOG.md](PRD_BACKLOG.md).
