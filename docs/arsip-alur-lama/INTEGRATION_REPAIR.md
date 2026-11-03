# Perbaikan integrasi 1 November 2026

Basis GitHub: `efab2cdee392cb6fba27ba4997251bda807e354e`, setelah sembilan commit upstream. Target database tetap project `zxfaotlqldfrlccahebw` pada koneksi SetengahRolasOfc. Seluruh perubahan upstream dipertahankan.

## Wilayah dan pengiriman

Sebelumnya `link_domicile` membentuk kode kelurahan `SBY-*`, RW `RW-*` dan RT `RT-*`, sedangkan pemeriksaan unggah dan submit hanya menerima kode `DEMO*`. Pengaju yang memakai domisili tersebut dapat menyimpan draf tetapi tertahan saat unggah/kirim.

Migrasi `20261101030001_prototype_territory_and_legacy_budget_integration.sql` memeriksa hierarki nyata yang tersedia di tabel: RT memiliki induk RW, RW memiliki induk kelurahan, dan kelurahan tidak berinduk. Awalan kode tidak menentukan kelayakan simulasi. Tema aktif `is_demo` dan mode salinan DEMO tetap wajib. Kepemilikan, sesi, snapshot, versi, kuota, mandat, pembaca dokumen dan RLS tidak diperluas.

Tiga dokumen PRD/RAB/keaslian juga diperiksa di dalam transaksi submit, setelah penguncian draf: tiga ID berkas berbeda, dimiliki pengaju pada draf yang sama, supporting, ready, dan belum diarsipkan. Sebelumnya relasi berkas hanya diperiksa pada Server Action; pemanggil RPC langsung atau perubahan serentak dapat melewati pemeriksaan aplikasi. Pemeriksaan status AI masih bersifat bantuan yang tersimpan dalam dokumen draf, bukan bukti autentikasi/tanda tangan atau keputusan kelayakan. Petugas harus memeriksa isi dokumen.

Daftar wilayah upstream masih contoh menurut dokumentasinya. RW/RT yang dibuat dari klaim warga bukan verifikasi resmi domisili, tidak membuat kantor/mandat, dan tidak memberikan hak petugas. Batas pemuatan 1000 wilayah serta kebutuhan pagination/master resmi masih perlu ditangani sebelum skala kota.

## Perlindungan RAB lama

`migrateLegacyBudget` sebelumnya dijalankan ketika editor dibuka, membuang array rincian dan membulatkan subtotal ke bawah. Menyimpan perubahan lain dapat menulis ulang data yang sudah diratakan tersebut.

- Konversi otomatis dihapus. Validator mempertahankan rincian dan pernyataan keaslian lama; ringkasan tetap dihitung dengan aritmetika presisi tiga desimal.
- Draf yang sudah memiliki rincian mendapat editor komponen. Draf baru tanpa rincian tetap memakai slot dokumen dan subtotal seperti perubahan upstream.
- Sedikitnya satu baris dipertahankan pada draf warisan. Pengguna dapat menambah/mengubah/menghapus komponen lain secara eksplisit, tetapi tidak mengosongkan semua rincian melalui konversi otomatis. Belum ada konversi eksplisit ke mode subtotal tunggal.
- Tombol angka AI tidak menimpa rincian/subtotal warisan; dana tambahan dan perawatan dapat diambil setelah pengguna memilih tombol tersebut. Selisih subtotal dibandingkan dengan jumlah baris yang presisi.
- Database memeriksa versi serta mengunci baris draf sebelum membandingkan rincian lama/baru. Penyimpanan yang menghapus seluruh rincian lama ditolak dengan `BUDGET_DETAILS_REQUIRED`, termasuk tab yang masih menjalankan bundle lama.
- Kesiapan kirim menghitung subtotal dari baris lama ketika tersedia, memeriksa kelengkapan tiap baris, dan tidak mewajibkan duplikasi subtotal manual untuk draf warisan.

Perbaikan melindungi penyimpanan berikutnya. Tidak ada klaim bahwa rincian yang mungkin hilang sebelum perbaikan sudah dipulihkan. Pemulihan kasus seperti itu memerlukan pemeriksaan snapshot/backup sumber yang benar-benar tersedia.

## Rekonsiliasi migrasi

Audit menemukan 18 file lokal tetapi 14 entri cloud; fungsi empat migrasi tambahan sudah diterapkan manual. `supabase/repairs/2026-11-01_uploaded_migration_history.sql` hanya mencatat status applied setelah sepuluh definisi fungsi final cocok melalui checksum tanpa perbedaan spasi, seluruh seed kelurahan cocok, dan perubahan nama yang terkait sudah terjadi. Definisi intermediate yang digantikan migrasi berikutnya dicocokkan terhadap hasil akhir urutan empat file. Tidak menjalankan ulang CREATE FUNCTION, seed, atau UPDATE bisnis. Kolom statements pada empat record hasil repair dibiarkan kosong seperti perbaikan status metadata; file repository tetap sumber SQL untuk database baru.

Platform memberi migrasi integrasi versi `20261101020443`, sementara predecessor unggahan sudah memakai `20261101030000`, yang lebih besar. Menyimpan timestamp platform apa adanya akan menempatkan integrasi sebelum dependensinya saat replay dari nol. Perbaikan metadata berpengaman memindahkan versi integrasi ke `20261101030001` (satu detik setelah predecessor), mempertahankan SQL yang telah diterapkan. Script historisnya `2026-11-01_integration_migration_order.sql`.

Karena SQL predecessor manual berbeda pemformatan dari file unggahan, precondition checksum integrasi dinormalisasi terhadap spasi. Hanya empat ekspresi guard berubah; definisi fungsi hasil integrasi tetap byte-identik. `2026-11-01_integration_replay_guard.sql` merekonsiliasi SQL tercatat dengan file akhir setelah checksum SQL lama/baru cocok. Metadata cloud dan file akhir memiliki checksum yang sama. Pemeriksaan statis mencocokkan 4/4 predecessor berurutan.

Total akhir **19 file migrasi dan 19 record cloud**. Script di `supabase/repairs` adalah catatan pemeliharaan sekali pakai untuk proyek yang sudah diperiksa, dengan guard terhadap drift. Jangan memasukkannya ke urutan migrasi database baru atau menjalankannya ulang setelah schema berubah. Database baru memakai file di `supabase/migrations` berurutan. Replay menyeluruh pada database kosong belum dijalankan.

## Kejelasan mode

Banner simulasi DEMO tersedia di header seluruh halaman, referensi database ditampilkan lengkap termasuk awalan DEMO, dan pilihan jalur evaluasi ditandai DEMO. Nama kecamatan/kelurahan yang terlihat nyata tidak mengubah salinan menjadi pengajuan resmi. Keputusan akhir panel, pendanaan dan seluruh kebijakan operasional yang tertunda tetap belum disahkan.

## Verifikasi dan batasnya

- Lint, typecheck Next.js/Edge dan build produksi dilaporkan di PROJECT_STATUS.md. Warning `prd` tidak dipakai dari audit sebelumnya telah dihapus.
- Metadata diperiksa: RLS 19 tabel public tetap aktif; dua helper baru tidak executable anon/authenticated; guard mode, manifest berkas, dan RAB terpasang; awalan kode wilayah tidak lagi menjadi syarat; source SQL migrasi sama dengan history akhir.
- Regresi sumber untuk rincian dan pecahan RAB diperbarui. **Tes unit, SQL skenario, HTTP, browser dan UAT tetap belum dijalankan atas instruksi pengguna.** Tidak membuat fixture, akun, mandat, unggahan atau keputusan QA.
- Edge `private-attachments` tetap versi 4 yang telah aktif. Source Edge tidak berubah sehingga tidak memerlukan redeploy; perilaku RPC database yang dipanggilnya diperbarui. Vercel tidak dideploy pada perbaikan ini.
- Tidak mengaktifkan provider Google/email/AI atau membaca/menambahkan key backend. API AI tetap bergantung konfigurasi server yang belum diuji; hasil `tidak_diperiksa` bukan pemeriksaan AI yang lulus.
- Security advisor tetap hanya peringatan lama [proteksi password bocor belum aktif](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Pemeriksaan nanti: alur unggah/kirim pada wilayah `SBY/RW/RT` dan DEMO, hirarki tidak sah, scope dokumen lintas pemilik/draf, tiga slot memakai ID sama, arsip bersamaan dengan submit, tab lama mengosongkan rincian, edit/hapus baris secara eksplisit, volume pecahan, retry/konflik versi, akses petugas lintas wilayah, serta migrasi bersih dan interaksi keyboard/layar kecil. Keberhasilan kompilasi atau metadata tidak menggantikan daftar skenario tersebut.
