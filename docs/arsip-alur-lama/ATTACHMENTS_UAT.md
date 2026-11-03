# Lampiran privat DEMO

Pembaruan 31 Oktober 2026. Lampiran draf, salinan berkas saat kirim, unduhan privat, arsip, dan pemulihan arsip telah dibangun. **Tes alur unggah/unduh dan UAT ditunda atas permintaan pengguna.** Keberhasilan migrasi, deployment fungsi, atau kompilasi tidak membuktikan alur berkas sudah lulus.

## Penggunaan

1. Buka draf sendiri, pilih tema DEMO aktif dan hierarki wilayah DEMO, lalu simpan. Klik **Kelola lampiran privat**. Bila ada perubahan draf belum disimpan, simpan dahulu; halaman berkas terpisah menjaga input editor tidak tertimpa.
2. Unggah PDF/JPEG/PNG/WebP berukuran 1 byte sampai 3 MiB dengan nama maksimal 160 karakter. Berkas diperiksa di backend berdasarkan penanda format/struktur awal-akhir dan ekstensi yang sesuai. Pemeriksaan ini bukan pemindaian antivirus atau pengesahan isi dokumen.
3. Batas sementara DEMO: 10 berkas aktif per draf, 50 per akun, dan 30 reservasi baru dalam jendela 24 jam. Retry permintaan yang sama tidak memakai reservasi baru; permintaan sama dengan nama/isi/metadata berbeda menghasilkan konflik. Batas ini belum menetapkan kebijakan operasional D-23.
4. Unggahan harus berstatus **siap** sebelum dapat ikut dikirim. Bila respons jaringan hilang, periksa daftar di tab baru. Untuk reservasi tertunda yang sudah terlihat, pilih ulang berkas asli pada formulir ulangi; atau lepas reservasi dari draf. Unggahan pendukung tertunda memblokir pengiriman simulasi; pending surat fisik tidak memblokirnya.
5. Kembali ke langkah 4. Semua lampiran **pendukung** siap pada draf ikut salinan simulasi setelah persetujuan berbagi isi dan berkas kepada petugas berwenang. Daftar berkas dipotret atomik dengan versi lampiran; perubahan bersamaan menyebabkan konflik versi atau masuk versi berikutnya.
6. Petugas membuka salinan sesuai mandat dan tahap. Lampiran diunduh melalui `/lampiran/[id]?simulasi=[id]`, dengan pemeriksaan akun/sesi/mandat terkini. Tidak ada tautan bucket publik, signed URL berumur panjang, atau preview inline.
7. **Lepas dari draf** mengarsipkan berkas secara privat. Tidak menghapus berkas pada salinan terkirim. Berkas siap dalam arsip dapat dipulihkan ke draf yang sama selama batas berkas dan pilihan DEMO memenuhi syarat; pemulihan tidak mengubah isi berkas atau salinan lama.
8. Revisi dapat mengubah isi draf atau daftar lampiran. Kirim ulang menghasilkan putaran baru dari RT. Mengembalikan daftar berkas tepat seperti putaran sebelumnya tanpa perubahan dokumen tidak memenuhi syarat revisi. Deteksi perubahan materiil operasional D-07 belum ditetapkan.

## Penyimpanan dan otorisasi

- Migrasi `20261031120235_private_demo_attachments_and_frozen_manifests.sql` dan `20261031121110_restore_archived_demo_attachments.sql` telah diterapkan pada proyek yang dipilih. Setelah penambahan panel Kecil DEMO, ada 19 tabel public aplikasi dengan RLS dan 19 migrasi. Tipe aplikasi dihasilkan dari schema nyata.
- Bucket `kampunglab-private-demo` bersifat private, dengan batas ukuran/MIME yang sama. Policy restrictive menolak akses objek langsung untuk anon/authenticated, bahkan bila kelak muncul policy permisif lain. Blob diakses hanya oleh backend yang lebih dahulu memeriksa izin pengguna.
- `draft_attachments` menyimpan metadata tetap, digest SHA-256, pemilik, sumber draf, request ID, status pending/ready, waktu arsip, klasifikasi `supporting`/`physical_rt`/`physical_rw`, serta konteks salinan/jam antrean untuk surat fisik. `simulation_attachment_links` membekukan daftar berkas untuk setiap putaran. Kedua tabel menolak CRUD langsung untuk anon/authenticated; RPC mengembalikan whitelist sesuai akses.
- RPC `attachment_workflow` memeriksa sesi hidup dan kepemilikan draf. Pembacaan berkas pendukung petugas memerlukan tautan pada salinan yang memang boleh dibaca melalui mandat/tahapnya, atau konteks permintaan fisik dengan persetujuan pengaju dan mandat kelurahan terkait. Reviewer panel dapat membaca pendukung terkunci pada penugasan aktif dengan peran reviewer berlaku, pembagian pengaju aktif, dan akun pengaju aktif, memakai `?panel=[assignment-id]`. Scope umum salinan tidak diperluas; panel tidak membuka surat fisik. Surat fisik hanya dibuka melalui permintaan fisik yang masih boleh dibaca; endpoint unduhan memakai `?fisik=[request-id]`. Admin global tanpa mandat terkait tidak memperoleh akses isi otomatis.
- Edge Function `private-attachments` telah dideploy. Handler selalu memverifikasi JWT pengguna dengan Auth.getUser, lalu RPC memeriksa sesi database. `verify_jwt=false` hanya menonaktifkan pemeriksaan gateway lama; otentikasi dilakukan handler agar mendukung model key/JWT saat ini. Tidak ada cabang berkas yang berjalan sebelum verifikasi pengguna.
- Client backend memakai key otomatis milik lingkungan Edge Function, dengan prioritas `SUPABASE_SECRET_KEYS`/`SUPABASE_PUBLISHABLE_KEYS` dan fallback variabel legacy. Nilai key tidak dibaca melalui alat, dicatat, dikembalikan, atau ditaruh di environment publik Next.js. Laptop tetap memakai dua variabel Supabase publik yang sudah ada.
- Hanya service role dapat menjalankan finalisasi `attachment_service`. Fungsi juga memeriksa identitas/sesi aktor yang telah diverifikasi Edge, pemilik draf, status arsip, serta metadata objek Storage. Pengguna biasa dapat mereservasi metadata pending, tetapi tidak dapat menandainya siap atau menulis blob langsung untuk melewati validasi backend.
- Jalur blob memakai UUID, bukan nama berkas. Penulisan tidak menimpa objek lama. Retry yang kehilangan respons membandingkan digest objek yang sudah ada sebelum menyelesaikan status.
- Unduhan memeriksa akses sebelum dan sesudah membaca objek, memeriksa ukuran/digest/format, lalu mengirim sebagai attachment dengan cache private/no-store dan nosniff. Tidak ada kunci admin pada browser atau environment publik Next.js.
- Lock draf dan penghitung `attachment_revision` memisahkan versi berkas dari versi JSON editor. Trigger salinan mengunci versi dan hanya menyalin pendukung siap; pending pendukung memblokir. Tambah/lepas/pulihkan surat fisik tidak mengubah `attachment_revision` pendukung. Tambah/lepas/pulihkan sesudah pengiriman tidak mengubah tautan salinan lama.
- Audit privat menyimpan metadata tindakan tanpa nama/isi berkas. Penyelesaian upload oleh backend juga mencatat aktor yang sesi/identitasnya diperiksa. Tidak ada unggahan QA atau data peserta yang dibuat pada milestone ini.

## Retensi dan batas scope

Pelepasan hanya mengarsipkan. Blob dan metadata, termasuk unggahan tertunda/ditinggalkan, tidak dihapus fisik otomatis. Arsip berkas siap masih dapat diunduh pemilik. Retensi/pembersihan fisik memerlukan kebijakan D-13 dan mekanisme operasional tersendiri; jangan menganggap tombol Lepas sebagai penghapusan permanen. Reservasi tertunda yang diarsipkan tidak dibagikan kepada petugas.

Lampiran mencakup pendukung salinan DEMO dan surat fisik DEMO dengan klasifikasi terpisah. Jalur fisik, privasi, batas 7 hari awal, dan konfirmasi manual dijelaskan di PHYSICAL_UAT.md. Pengajuan resmi, unggah SK, validasi plafon/duplikasi, bukti transfer, video, foto publik tersanitasi, serta bukti uji warga belum dibangun. Mengunggah surat rekomendasi di sini tidak otomatis membuat keputusan atau melewati RT/RW.

## Pemeriksaan untuk nanti

- Unggah sah, file kosong/terlalu besar, ekstensi yang menyamar, MIME browser palsu, dan berkas terpotong.
- Retry persis sama, retry dengan berkas berbeda, respons hilang, serta reservasi pending yang dilepas/dilanjutkan.
- Batas per draf/per akun/per 24 jam dan dua unggahan/pemulihan serentak.
- Lampiran hanya berubah di draf; salinan lama mempertahankan nama/isi/daftar. Kirim ulang setelah perubahan berkas dan konflik versi.
- Pemilik lain/admin tanpa mandat tidak membaca; RT/RW/kelurahan sesuai tahap dapat membaca; mandat dicabut/sesi keluar/pengaju nonaktif ditolak.
- Akses langsung Data API, Storage, serta finalisasi service dari anon/authenticated ditolak.
- Arsip/pulihkan, navigasi tanpa kehilangan teks, status pending/error, input berkas ulang, keyboard, dan ukuran layar 320/768 px.

Lint, typecheck Next.js dan Edge, build, metadata bucket/grant/RLS, serta deployment fungsi dilaporkan terpisah dari daftar tes di atas. Peringatan lama [proteksi password bocor belum aktif](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) tetap ada; bukan temuan baru lampiran.

Pemeriksaan TypeScript Edge menggunakan SDK yang dipin dan deklarasi Deno minimal lokal; Deno CLI tidak dijalankan. Deployment fungsi memaketkan source pada runtime Supabase, tanpa menjalankan skenario unggah/unduh pengguna.

Perbaikan 1 November 2026 menghapus ketergantungan pada awalan kode wilayah DEMO untuk unggah/kirim. Mode simulasi dan tema demo tetap berlaku; klaim domisili tidak menjadi mandat. Tiga dokumen bertemplate kini diperiksa relasi kepemilikan, sumber draf, status siap dan arsipnya pada transaksi submit database. Scope baca privat tetap sama. Rincian ada di INTEGRATION_REPAIR.md; tes skenario tetap belum dijalankan.
