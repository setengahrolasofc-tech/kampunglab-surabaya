# Monitoring dan laporan admin DEMO

Milestone 1 November 2026. Implementasi parsial FR-20, dengan indikator koordinasi mandat dari FR-19. Ini laporan internal admin, bukan statistik publik atau pengesahan kesiapan program.

## Perilaku yang dibangun

- `/admin/monitoring`, ditautkan dari halaman admin. Memerlukan akun pribadi terkonfirmasi, sesi database hidup, dan peran admin program yang masih berlaku. RPC memeriksa ulang sesi/peran; menyembunyikan tautan saja bukan pengamanan.
- Filter kelurahan, tema, dan status dari master yang benar-benar ada. Filter yang rusak, berulang, atau tidak tersedia ditolak; bukan diam-diam diganti menjadi laporan global. Tema nonaktif tetap dapat dipilih untuk riwayat.
- Kartu jumlah draf disimulasikan, putaran terkait, antrean RT/RW/kelurahan, dan antrean ≥24 jam. Rekap status, tema, serta kelurahan, dengan pagination 20 kelompok kelurahan dan urutan stabil nama/kode/UUID.
- Tanggal WIB, waktu pengambilan, waktu masuk serta usia antrean tertua dalam jam penuh. Ukuran ≥24 jam memakai waktu masuk tingkat saat ini, bukan waktu draf dibuat, dan bukan bukti reminder terkirim atau pelanggaran SLA.
- Indikator antrean tanpa petugas utama yang memenuhi syarat menurut catatan: jabatan aktif, wilayah/tingkat sesuai, mandat utama berlaku, akun aktif, bukan pengaju sendiri, tanpa penghalang review/konflik yang tersimpan. Tidak memverifikasi independensi di luar sistem atau mengaktifkan cadangan/delegasi otomatis.
- Jumlah permintaan fisik pending dan panel Kecil belum dibagikan/aktif/dijeda, hanya untuk draf yang lolos filter. Pembagian aktif tidak berarti reviewer lengkap, hasil lolos, atau persetujuan dana.
- `/admin/monitoring/ekspor` mengunduh CSV UTF-8 dengan BOM, mengulang pemeriksaan sesi/peran dan menerapkan filter yang sama. Seluruh kelompok kelurahan diekspor, bukan hanya halaman yang sedang terlihat. Snapshot diambil ulang saat unduh; dapat berbeda dari halaman jika ada perubahan sumber.

## Definisi hitung dan privasi

1. Sumber hanya `innovation_simulations.mode='demo'` milik akun pengaju terkonfirmasi yang tidak dinonaktifkan/dihapus. Artefak QA nonaktif tidak masuk capaian program. Draf yang belum pernah dikirim ke simulasi tidak masuk laporan ini.
2. Pilih satu putaran terakhir per `draft_id` **sebelum** filter: attempt menurun, lalu waktu kirim dan UUID untuk urutan deterministik. Draf yang sudah kirim ulang tidak tetap dihitung sebagai perlu revisi karena putaran lamanya masih menyimpan status itu.
3. Kelurahan, status, dan tema mengikuti salinan putaran terakhir, bukan draf pribadi yang bisa berubah. Tema diambil dari snapshot `document.innovation.theme_id`, lalu dicocokkan dengan master; tidak menampilkan isi JSON mentah.
4. Jumlah draf bukan klaim jumlah inovasi unik terverifikasi: draf berbeda dapat memuat inovasi serupa, sedangkan aturan duplikasi D-06 masih terbuka.
5. Jumlah putaran terkait mencakup seluruh putaran tersimpan milik draf yang lolos filter pada putaran terakhir. Putaran lama dapat mempunyai tema/wilayah/status berbeda. Label ini tidak diklaim sebagai jumlah historis yang masing-masing memenuhi filter terbaru.
6. Tidak mengembalikan ID draf/salinan/pengaju, judul, nama warga, kontak, isi proposal/RAB, alasan keputusan, nilai/suara reviewer, atau tautan lampiran. Admin laporan tidak mendapat pembaca proposal baru. Rekap panel hanya status pembagian; pemisahan akses reviewer tetap dipertahankan.
7. Statistik publik belum diterbitkan. Agregat internal berukuran kecil ini tidak boleh dianggap sudah memenuhi kebijakan agregasi publik/retensi D-13.

CSV mengutip setiap sel, menggandakan tanda kutip, mengganti karakter kontrol, dan menetralkan awalan formula `=`, `+`, `-`, `@` termasuk setelah whitespace. Nilai master tetap diperlakukan sebagai data tidak tepercaya. Header attachment, private/no-store, nosniff, sandbox, dan noindex dipasang. Tidak mengekspor data finansial/uji yang belum mempunyai modul; angka nol hanya digunakan untuk hasil hitung sumber yang memang sudah tersedia.

## Database dan deployment

Migrasi `20261101023914_admin_demo_monitoring_and_aggregate_reports.sql` sudah diterapkan. Tidak menambah tabel, mengubah alur keputusan, grant tabel, atau menulis data bisnis. Total 21 migrasi dan 20 tabel public dengan RLS. Versi native berada sebelum migrasi upstream 030000/030001; dependensinya hanya schema 30–31 Oktober sehingga urutan replay tetap sah.

Wrapper publik `program_monitoring` adalah security invoker authenticated-only; implementasi privat security definer memakai search_path kosong dan guard sesi/admin. Operasi report/export hanya membaca agregat. Semua filter dipakai sebagai nilai SQL, tanpa SQL dinamis. Halaman dynamic dan proxy `/admin/:path*` sudah mencakup rute ekspor. Tidak memerlukan environment/dependency baru atau deployment ulang Edge.

## Verifikasi dan pemeriksaan nanti

Lint, TypeScript Next.js/Edge, dan build produksi diperiksa. Metadata memastikan wrapper invoker, helper privat, izin eksekusi anon ditutup, search_path kosong, dan 20/20 tabel public dengan RLS. Hash kedua fungsi dicocokkan dengan migrasi. Security advisor hanya peringatan lama proteksi password bocor belum aktif; lihat [panduan Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Atas arahan pengguna, tes unit, SQL skenario, HTTP, browser dan UAT tetap ditunda. Tidak membuat/mengaktifkan fixture QA, mandat, pengajuan, panel, atau transaksi. Keberhasilan migrasi/build tidak membuktikan cabang runtime laporan/CSV sudah lulus. Vercel belum dideploy/diverifikasi pada milestone ini.

- [ ] Anon/warga/petugas tanpa admin tidak dapat membaca RPC atau ekspor; pencabutan/kedaluwarsa peran/sesi berlaku pada request berikutnya.
- [ ] Dua putaran satu draf dihitung sebagai satu draf, putaran lama tidak mengisi status lama setelah kirim ulang. Draf baru yang belum disimulasikan tidak dihitung.
- [ ] Filter status/tema/wilayah diterapkan pada putaran terbaru; jumlah putaran terkait tetap mengikuti definisi di atas. Akun dinonaktifkan dan QA tidak masuk.
- [ ] Semua kelompok menjumlah ke total draf, keadaan kosong, data tanpa tema master, pagination, dan perubahan bersamaan ditangani.
- [ ] Usia antrean tidak memakai umur pengajuan awal; batas tepat 24 jam dan WIB sesuai waktu snapshot. Revisi/evaluasi tidak disamakan dengan antrean RT/RW/kelurahan.
- [ ] Kelayakan petugas mencakup mandat berakhir/cabut, jabatan nonaktif, akun dinonaktifkan, pengaju sendiri dan konflik/rekomendasi sebelumnya.
- [ ] CSV mencakup seluruh kelurahan terfilter; quote/koma/newline/awalan formula, Unicode, dan master berbahaya tidak mengubah struktur atau menjalankan formula.
- [ ] Tidak ada PII/proposal/nilai/file dalam halaman, respons RPC, CSV, atau cache publik. Keyboard dan tabel layar kecil diperiksa manusia.

Daftar pekerjaan seluruh PRD ada di [PRD_BACKLOG.md](PRD_BACKLOG.md).
