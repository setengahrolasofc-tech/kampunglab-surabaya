# Simulasi pengiriman dan catatan awal RT

Milestone 31 Oktober 2026 meneruskan prototipe menjadi **simulasi DEMO**: satu salinan draf tersimpan, antrean pembacaan RT sesuai mandat, dan catatan pemeriksaan awal. Ini tidak mengaktifkan pengiriman resmi, keputusan setuju/revisi/tolak, perpindahan ke RW, penilaian panel, lampiran, duplikasi, atau persetujuan dana. Keputusan D-xx yang belum disepakati tetap belum disahkan.

## Alur pengaju

1. Tarik kode terbaru dan jalankan server. Buka `/pengajuan`, lengkapi data inovasi/tim, PRD, RAB, dan pernyataan karya sendiri.
2. Gunakan tema DEMO aktif dan hierarki wilayah yang kode kelurahan/RW/RT-nya berawalan DEMO. Pilihan yang disediakan milestone sebelumnya sudah memenuhi syarat latihan ini.
3. Simpan seluruh langkah. Pada langkah 4, baca penjelasan berbagi salinan kepada petugas RT, centang persetujuan, lalu klik **Kirim simulasi ke antrean RT**. Tombol dinonaktifkan selama ada perubahan belum disimpan, isian pokok belum lengkap, atau pengiriman sedang berjalan. Persetujuan diulang setelah revisi draf berubah.
4. Halaman `/simulasi/[id]` menampilkan referensi berawalan DEMO, revisi asal, waktu, isi salinan, status menunggu RT, dan catatan petugas. Referensi itu bukan nomor pengajuan resmi.
5. Edit draf asal lalu simpan. Salinan yang dibagikan tetap versi sebelumnya; draf live tidak dapat dibaca petugas. Simulasi hanya satu salinan per draf pada tahap ini; pengiriman ulang/amendment menunggu desain versi dan keputusan D-07.
6. Jika belum ada mandat utama RT aktif yang dapat memeriksa, halaman menjelaskan kebutuhan penetapan. Pengaju yang sekaligus pemegang RT tidak dihitung sebagai pemeriksa bagi dirinya sendiri. Proses tidak melewati RT otomatis.

## Menyiapkan UAT RT dengan dua akun

- Gunakan akun pribadi pengaju dan akun pribadi kedua untuk petugas uji. Keduanya mendaftar/mengonfirmasi email sendiri. Admin program tidak otomatis menjadi petugas RT.
- Admin membuka pengelolaan wilayah/jabatan, membuat jabatan **DEMO** untuk RT DEMO yang sesuai, lalu memberi akun kedua **mandat utama** pada jabatan tersebut. Isi referensi penetapan uji yang jelas berlabel DEMO, verifikasi identitas, dan pilih masa berlaku yang sesuai. Jangan memasukkan pejabat atau SK palsu sebagai penetapan resmi.
- Akun kedua membuka **Antrean simulasi RT** dari dashboard atau `/antrean/rt`. Hanya salinan pengaju lain dalam RT mandat utamanya yang terlihat. Cadangan/delegasi belum diberi aktivasi otomatis karena kebijakan D-18 belum lengkap.
- Buka salinan, deklarasikan hubungan keluarga/konflik, catat pemeriksaan domisili dan masalah bila sudah dilakukan, serta tulis catatan. Saat melaporkan konflik, checklist positif tidak diisi. Catatan dapat menjelaskan kebutuhan petugas pengganti; tidak ada eskalasi otomatis atau keputusan substansi.
- Pengaju membuka kembali salinan untuk membaca catatan. Nama tampilan, jabatan, mandat, aktor, dan waktu dicatat saat penulisan; perubahan pemegang jabatan tidak memindahkan atribusi catatan lama.
- Cabut/habiskan mandat RT di admin, lalu coba menulis dari halaman lama akun kedua. Permintaan baru harus ditolak. Pengaju tetap dapat membaca catatan historis miliknya.

## UAT manusia lain

- Pengiriman tanpa persetujuan, dengan isian kurang, revisi sumber lama, tema non-DEMO/nonaktif, atau wilayah di luar hierarki DEMO harus ditolak.
- Klik ulang/retry setelah pengiriman harus kembali ke salinan yang sama, bukan membuat salinan ganda.
- Akun warga lain, admin tanpa mandat RT terkait, petugas RT lain, cadangan/delegasi, serta pengguna tanpa sesi tidak boleh membaca salinan.
- Pengaju yang juga mempunyai mandat utama RT tetap tidak dapat menulis catatan bagi salinannya sendiri.
- Periksa judul/isi yang berubah di draf asal; salinan harus mempertahankan isi pada revisi yang dikirim.
- Periksa catatan: pengiriman ulang request yang sama tidak menggandakan baris. Jika isi berubah tetapi request yang sama sudah diterima, aplikasi memberi konflik dan mempertahankan teks lokal; buka riwayat di tab baru sebelum melanjutkan.
- Uji mobile 320/768 px, keyboard, checkbox persetujuan, error, status pending, ringkasan panjang, dan catatan multiline. Coding agent tidak mengoperasikan browser/DOM; pengujian HTTP tidak membuktikan hidrasi atau interaksi visual sudah lulus.

## Model akses dan data

- `innovation_simulations` berisi mode DEMO, referensi, pemilik, ID/revisi draf, dokumen yang disalin, hierarki wilayah, dan waktu. Status hanya `waiting_rt`; tidak ada operasi persetujuan atau dana.
- `simulation_rt_notes` hanya menambahkan catatan pemeriksaan awal. Aktor, jabatan, mandat, dan nama tampilan diisi database dari sesi/penugasan terkini, bukan dari field browser.
- Tabel public memiliki RLS dan hanya diberi SELECT kepada authenticated. INSERT/UPDATE/DELETE langsung ditolak. Pemilik dan RT yang saat ini berwenang dapat membaca salinan/riwayat; admin global tidak mendapat akses isi secara otomatis.
- Snapshot serta catatan tidak dapat ditimpa melalui aplikasi. Draf tetap pribadi dan terpisah. Pemeliharaan database berwenang tetap diaudit sebagai tindakan koneksi database, tanpa mengatasnamakan pengguna.
- RPC public adalah SECURITY INVOKER; implementasi definer ada di private dengan search_path kosong, EXECUTE terbatas, validasi sesi/akun, ownership, jenis mandat, jabatan aktif, wilayah, dan waktu berlaku. Penulisan catatan memakai lock transaksi yang sama dengan perubahan akses admin lalu memeriksa ulang kewenangan.
- Sesi yang tidak berlaku gagal membuka data. Saat akun pengaju dinonaktifkan, salinan serta catatannya tidak dibuka kepada petugas; baris/audit tidak dihapus otomatis. Ini pembatasan privasi prototipe, bukan penetapan retensi operasional D-13.
- Audit privat hanya merekam aktor, role koneksi, objek, tindakan, dan waktu; isi dokumen/catatan tidak diduplikasi ke audit. Tidak ada wallet, notifikasi email otomatis, atau tanda tangan elektronik resmi.
- Daftar antrean dipaginasi 20 per halaman. Riwayat catatan ditampilkan seluruhnya pada prototipe; pemuatan bertahap untuk volume besar masih pekerjaan lanjutan.

## Verifikasi

- `npm test`: kelengkapan minimum simulasi, format draf, deklarasi konflik, catatan, dan pengabaian field aktor/mandat palsu.
- `supabase/tests/simulation_workflow.sql`: data sintetis dengan BEGIN/ROLLBACK. Mencakup submit idempoten, revisi stale, snapshot tidak berubah, non-DEMO ditolak, scope RT, admin/cadangan ditolak, self-review, mandat berakhir/dicabut, akun pengaju nonaktif, catatan positif, deklarasi konflik, atribusi, replay request, mutasi langsung dan audit.
- `scripts/verify-simulation-http.mjs`: hasil build produksi tanpa browser memakai file privat `AUTH_TEST_FIXTURE_FILE` untuk akun sintetis `@example.invalid`. ID katalog DEMO dan kredensial fixture tidak ditaruh di Git. Script menyiapkan draf lengkap, mengirim melalui Server Action, membaca snapshot/list, mengubah draf sumber, serta menguji penolakan dan logout. Bila semua draf fixture sudah memiliki simulasi, script membuat draf latihan baru agar pengujian dapat diulang tanpa menimpa snapshot lama.
- Jalur positif petugas/catatan telah diuji pada SQL rollback; UAT antarmuka petugas dengan akun kedua tetap perlu dilakukan manusia. Akun HTTP uji tidak diberi mandat RT atau hak admin.
- Hasil aktual dan pembersihan akun/draf/simulasi QA dicatat di PROJECT_STATUS.md. Lint, typecheck, serta build produksi tetap diwajibkan.
