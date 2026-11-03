# Panel Kecil DEMO: penugasan dan nilai individual

Pembaruan 31 Oktober 2026. Kode, schema, dan layanan unduhan telah diperbarui. **Tes fungsional dan UAT ditunda atas permintaan pengguna.** Lint, TypeScript, build, metadata/grant dan keberhasilan deployment bukan bukti alur runtime lulus. Tidak ada panel, reviewer, suara, dokumen, atau fixture QA yang dibuat saat pembangunan ini.

## Scope dan keputusan yang masih terbuka

Handbook hlm. 5–6 menyebut tiga kursi (BRIDA/OPD, akademisi, praktisi), rubrik 25/25/20/15/15, skor minimum 70/100, dan minimal 2 dari 3 setuju. PRD D-03 belum menetapkan formula skor panel, hubungan skor dengan suara, kelengkapan penilaian, atau revisi panel. Implementasi menyimpan **nilai serta suara individual**, tanpa rata-rata/median/konsensus, label lolos, keputusan akhir, status persetujuan program, atau dana. Nilai 69 dengan suara setuju dan 70 dengan suara tidak setuju tidak ditafsirkan menjadi hasil akhir; keduanya data individual yang perlu kebijakan D-03.

Fitur hanya untuk salinan `mode=demo`, `status=waiting_evaluation`, `evaluation_path=demo_small`. Mikro dan evaluatornya tetap D-02. Menengah/OPD, revisi panel, tata cara koreksi nilai, dan keputusan akhir belum dibuka. Admin program menjadi koordinator penugasan **DEMO**, bukan pengesahan kewenangan operasional atau verifikasi institusi otomatis. Satu orang hanya pernah ditugaskan sekali per panel dan nilai terkirim dikunci adalah aturan latihan konservatif [U]. D-17/D-18 tetap terbuka untuk tata kelola nyata.

## Alur

1. Pengaju mengirim salinan DEMO seperti sebelumnya. RT/RW memberi rekomendasi, kelurahan menyiapkan jalur Kecil DEMO. Pemilihan jalur sendiri belum membuka proposal kepada reviewer.
2. Pengaju membuka tautan panel dari salinan atau `/simulasi/[id]/panel`, memberi alasan dan mencentang persetujuan baru. Naskah `demo-panel-v1` mencakup salinan inovasi/PRD/RAB, pendukung terkunci dan riwayat rekomendasi kepada reviewer yang ditugaskan. Scan surat fisik tidak ikut. Persetujuan kirim awal hanya menyebut RT/RW/kelurahan sehingga tidak dianggap otomatis mencakup panel.
3. Admin membuka `/admin/panel`. Daftar hanya menampilkan referensi DEMO, wilayah, pembagian dan jumlah kursi, tanpa judul/isi proposal atau suara. Detail administrasi menyediakan penetapan/pencabutan dan riwayat koordinasi; hasil nilai tidak dikembalikan oleh operasi administrasi.
4. Cari akun terkonfirmasi lewat email lengkap. Kandidat wajib punya peran `reviewer` yang berlaku dari Admin, berbeda dari pengaju, tidak pernah memberi rekomendasi/konfirmasi substansi atau melaporkan konflik pada putaran ini, dan belum pernah ditugaskan pada panel ini. Admin memeriksa identitas, unsur kursi, independensi, referensi penugasan serta alasan. Label BRIDA/OPD/akademisi/praktisi bukan bukti asal institusi.
5. Tiga kursi aktif unik. Satu akun hanya satu penugasan sepanjang riwayat panel/putaran tersebut. Untuk mengganti, cabut dengan alasan dan pilih orang lain; penugasan/hasil sebelumnya tidak dihapus. Mencabut peran reviewer juga menghentikan akses meskipun kursi masih tercatat aktif. Memberikan kembali peran dapat membuka kembali assignment yang belum dicabut, sehingga cabut assignment bila penugasannya memang berakhir.
6. Reviewer membuka **Penugasan panel saya** dari dashboard atau `/panel`, lalu `/panel/penugasan/[id]`. Peran saja tidak membuka kasus lain. Proposal berasal dari salinan beku dan lampiran pendukung dari manifest putaran, bukan draf terbaru. Riwayat rekomendasi tersedia, tetapi scan fisik dan suara reviewer lain tidak dibuka.
7. Reviewer mendeklarasikan konflik. Jika tidak ada konflik, isi lima skor integer, suara setuju/tidak setuju manual, alasan, dan deklarasi bahwa nilai DEMO terkunci dan belum menyetujui program/dana. Tidak perlu menunggu seluruh kursi terisi untuk menyimpan nilai individual; jumlah kursi/hasil tidak disebut sebagai panel selesai atau sah.
8. Mengirim konflik menyimpan alasan tanpa skor/suara, menutup assignment dan akses proposal reviewer, serta menyisakan bukti laporan miliknya. Ini bukan suara penolakan. Admin perlu menugaskan pengganti independen.
9. Pengaju dan pemegang mandat utama kelurahan sesuai wilayah dapat melihat nilai individual terkirim/riwayat. Reviewer tidak melihat nilai orang lain. Akun yang juga punya mandat kelurahan tetap tidak memperoleh ringkasan nilai orang lain pada panel tempat ia pernah ditugaskan; gunakan halaman penugasan sendiri. Admin koordinasi tetap tidak membaca nilai meskipun merangkap reviewer.
10. Pengaju dapat menjeda pembagian, memberi alasan, lalu mengaktifkan kembali dengan persetujuan baru. Jeda menutup pembacaan proposal/unduhan dan kirim nilai panel, tanpa menghapus assignment/nilai. Reviewer masih dapat membaca bukti nilai/laporan sendiri selama peran dan akun pengaju berlaku. Mengaktifkan lagi membuka kembali assignment aktif yang memenuhi syarat. Jeda tidak mencabut akses biasa RT/RW/kelurahan ke salinan.

## Integritas dan akses

- Migrasi nyata `20261031131247_demo_small_panel_assignments_and_individual_scores.sql` dan `20261031132000_demo_panel_separation_for_dual_roles.sql` diterapkan. Empat tabel baru: `simulation_panel_cases`, `simulation_panel_assignments`, `simulation_panel_entries`, `simulation_panel_events`. Semuanya RLS deny-all dan tanpa CRUD anon/authenticated; tidak ada SELECT langsung untuk membaca nilai orang lain.
- `panel_workflow` adalah wrapper invoker ke implementasi privat definer dengan search_path kosong. Semua operasi memeriksa sesi database hidup dan identitas terkonfirmasi; akses sensitif memakai peran/grant/assignment/mandat terkini, bukan user_metadata atau pilihan peran form.
- Mutasi memakai advisory lock yang sama dengan administrasi akses dan keputusan berjenjang, lalu lock salinan/case/assignment. Versi case menghindari overwrite saat perubahan pembagian, penggantian atau konflik bersamaan. Nilai individual reviewer berbeda tidak mengubah versi case dan tidak saling menimpa.
- Request ID stabil mendukung retry identik; nonce sama dengan isi berbeda menghasilkan konflik. Satu entry per assignment, total dijumlahkan oleh kolom generated database, batas aspek dan jenis entry dibatasi constraint. Tidak ada operasi edit nilai. Nilai assignment dicabut tetap tampil sebagai riwayat berlabel, tanpa dipakai sebagai hasil kursi pengganti.
- Penulisan skor/laporan menambah penghalang independensi untuk keputusan substansi berikutnya pada putaran sama. Riwayat konflik/rekomendasi dari alur berjenjang dan fisik juga dipertimbangkan saat menugaskan.
- Akun berperan ganda berpotensi membaca suara orang lain jika hanya memeriksa mandat kelurahan. Tambahan guard operasi details menolak ringkasan itu bila akun punya riwayat assignment pada panel yang sama; operasi assignment hanya mengembalikan entry miliknya. Cara membuktikan nantinya: beri satu akun peran reviewer + mandat kelurahan pada fixture, lalu coba kedua operasi dan SELECT langsung sebagai akun tersebut. Skenario ini **belum dijalankan**.
- Unduhan `/lampiran/[id]?panel=[assignment-id]` hanya untuk pendukung yang terhubung pada salinan assignment. Handler memverifikasi pengguna, RPC memeriksa sesi/scope sebelum dan sesudah blob dibaca, digest/format tetap diperiksa. Case dijeda, assignment dicabut/konflik, peran berakhir, sesi keluar, atau pengaju nonaktif menghentikan akses dokumen. Scope global `simulation_can_access` tidak diperluas.
- Audit privat generic menyimpan ID/aktor/jenis mutasi. Event koordinasi menyimpan alasan, referensi, kursi/target bila perlu, atribusi dan waktu; tidak menyimpan email kandidat. Tidak ada hard delete atau pengesahan retensi D-13.
- Seluruh daftar/history memakai pagination 20 per halaman. Kursi aktif maksimum tiga ditampilkan terpisah. Halaman hasil dan riwayat menggabungkan paginasi dengan halaman tertinggi dari jumlah entry/event/penugasan lama.

## Verifikasi yang sudah dilakukan

- Migrasi dan pencocokan hash source fungsi terhadap file yang disimpan.
- Pembacaan metadata: 19 tabel public, RLS empat tabel baru aktif, privilege CRUD authenticated dan SELECT anon tertutup, RPC tidak executable anon. Tipe dihasilkan dari schema nyata. Terdapat 14 migrasi setelah guard akun peran ganda.
- Deployment Edge `private-attachments` versi 4 ACTIVE. `verify_jwt=false` tetap dengan Auth.getUser di handler dan verifikasi sesi/hak database; tidak mematikan otentikasi aplikasi. Tidak ada secret baru pada laptop/Next.js/repository. Pemeriksaan TypeScript Edge memakai SDK yang dipin dan deklarasi Deno minimal; Deno CLI tidak dijalankan.
- Lint, typecheck Next.js/Edge dan build dilaporkan pada PROJECT_STATUS.md. Tidak menjalankan tes unit/SQL skenario/HTTP/browser/UAT. Metadata nol kasus/nilai membuktikan tidak ada fixture panel, bukan keberhasilan alur.
- Security advisor tetap hanya peringatan lama [proteksi password bocor belum aktif](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Performance advisor tidak dijalankan ulang.

## Skenario nanti — belum dijalankan

- Sharing sebelum/sesudah tahap Kecil, Mikro/putaran lain ditolak, persetujuan wajib, pause/resume/nonce/dua tab, data sumber tidak berubah, supporting versus scan fisik.
- Candidate email lengkap/tidak ditemukan, peran kedaluwarsa/dicabut, akun nonaktif, pengaju, pemberi rekomendasi fisik/digital, pelapor konflik, kursi sudah terisi dan orang yang pernah ditugaskan.
- Dua admin mengisi kursi sama/berbeda, role dicabut saat assign/score/download, pause versus submit, revoke versus submit, dua entry sama dan retry setelah respons hilang.
- Skor setiap maksimum, kosong/negatif/desimal/melebihi batas, 69/70/100, suara manual yang berbeda dari skor, alasan/deklarasi wajib, total server dan entry terkunci.
- Laporan konflik tanpa nilai/suara, kursi terbuka, pengganti independen, history nilai yang dicabut, receipt sendiri saat dokumen ditutup, penolakan edit/impersonasi aktor.
- Isolasi antar-reviewer, lintas case/wilayah, role-only, admin-only, pemegang mandat kelurahan + assignment reviewer, dan akses langsung Data API/Storage/helper/finalisasi.
- Pagination, SSR/hidrasi, keyboard/pembaca layar, layar 320/768 px, error tidak menghilangkan alasan/skor, serta unduh saat scope berubah.

Gunakan fixture sintetis terpisah yang dibersihkan/di-rollback pada tahap pengujian nanti. Jangan memakai identitas institusi atau dokumen warga sebagai data latihan tanpa penetapan yang sesuai.
