# Status Proyek KampungLab Surabaya

Tanggal pembaruan: 31 Oktober 2026.

## Milestone saat ini: pemeriksaan kelurahan dan rencana evaluasi DEMO

Tersedia:

- Next.js App Router, TypeScript, dan Tailwind CSS.
- Halaman pengantar berbahasa Indonesia dan halaman panduan alur.
- Navigasi yang menuju halaman/section yang benar-benar tersedia.
- Layout responsif dasar, skip link, metadata, dan halaman 404.
- PRD sistem, petunjuk AI, npm lockfile, dan instruksi menjalankan secara lokal.
- Script lint, typecheck, dan build.
- Proyek Supabase `kampunglab-surabaya` pada koneksi SetengahRolasOfc, organisasi `setengahrolasofc-tech's Org`, region Singapore.
- Template environment tanpa key asli, factory SDK publik stateless yang belum dipakai halaman, script pemeriksaan koneksi, dan tes validasi konfigurasi.
- Model akun pribadi + mandat jabatan disetujui pengguna (bagian D-18).
- Daftar/masuk email-password, callback PKCE, permintaan reset password, ubah password, dan keluar akun. Perubahan upstream menambahkan UI OTP daftar/pemulihan, aturan password, klaim domisili saat daftar, dan pemicu OAuth Google. Integrasi sumber dipertahankan; template email/panjang OTP/provider Google belum diubah atau diverifikasi pada milestone kelurahan. Klaim domisili Auth tidak dipakai sebagai hak akses atau pengganti `profiles.domicile_rt_id`.
- Dashboard terlindungi, profil sendiri, nama tampilan dapat diubah, serta daftar mandat/peran aktif dari database.
- Sepuluh tabel public dengan RLS (profiles, territories, offices, office_mandates, platform_role_grants, innovation_themes, innovation_drafts, innovation_simulations, simulation_rt_notes, simulation_review_events), audit privat, dan sembilan migrasi yang sudah diterapkan. Tipe TypeScript dihasilkan dari schema nyata.
- Pembatasan penulisan kolom profil, audit privat, dan exclusion constraints untuk periode mandat.
- Admin pertama ditetapkan atas instruksi eksplisit pemilik setelah identitas akun dicocokkan dengan dashboard dan email terkonfirmasi di Auth. Tidak ada bootstrap otomatis dari pendaftar pertama atau user_metadata.
- Halaman `/admin`: cari akun terkonfirmasi lewat email lengkap, tetapkan/cabut peran program dan mandat jabatan, buat wilayah/jabatan, lihat riwayat akun dan 30 audit perubahan akses terbaru.
- RPC admin memeriksa hak dari database, status akun, masa berlaku, dan sesi yang masih hidup. Mutasi mengunci transaksi lalu memeriksa ulang izin; pemberi hak tidak diambil dari form.
- Audit aman menyimpan whitelist sebelum/sesudah tanpa email/password/isi SK. Tabel peran/mandat tetap tanpa izin tulis langsung melalui Data API. Migration administrasi sudah diterapkan dan tipe diperbarui dari schema nyata.
- Domisili kelurahan/RW/RT melalui `/profil/wilayah`, FK jenis RT, serta pemilihan wilayah berurutan. Domisili menjadi isian awal draf baru dan tidak mengganti wilayah draf lama otomatis.
- `/pengajuan`: daftar draf sendiri dengan pagination 20 per halaman, pembuatan idempoten, dan editor empat langkah di `/pengajuan/[id]`.
- Draf data inovasi/tim, PRD, rincian RAB, pernyataan keaslian, serta ringkasan; seluruh langkah disimpan bersama. Draf kosong/parsial diperbolehkan, format isian tetap divalidasi dan input tidak dihapus saat gagal.
- Perhitungan subtotal/total RAB tepat untuk volume sampai tiga desimal; estimasi perawatan dicatat terpisah. Tidak ada validasi kelayakan dana, plafon operasional, atau pembulatan kebijakan yang disahkan.
- Revisi atomik mencegah overwrite dari tab/perangkat lain. Draf hanya dibaca pemilik dengan akun dan sesi valid; admin tidak otomatis dapat membaca draf warga. Tidak ada izin tulis langsung ke tabel draf.
- Audit draf privat hanya berisi aktor, ID, revisi, langkah, tindakan, dan waktu; tidak menyalin isi PRD/RAB atau nama tim.
- Empat tema bernomor DEMO dan satu hierarki wilayah DEMO ditambahkan atas persetujuan prototipe. Semuanya berlabel jelas; tidak ada klaim sebagai master resmi dan tidak ada petugas fiktif ditetapkan.
- Pengiriman salinan simulasi DEMO per putaran draf dari langkah 4, dengan persetujuan berbagi yang eksplisit kepada RT/RW/kelurahan sesuai tahap. Isian pokok, versi sumber, tema DEMO aktif, dan kode hierarki DEMO diperiksa ulang di database. Retry mengembalikan salinan yang sama.
- `/simulasi/[id]` menampilkan salinan isi saat dikirim, referensi berawalan DEMO, revisi sumber, putaran, status terkini, catatan awal, dan riwayat tindakan beralasan. Edit draf tidak mengubah salinan yang dibagikan.
- `/antrean/rt`, `/antrean/rw`, dan `/antrean/kelurahan` menyediakan antrean sesuai tingkat, status menunggu, dan wilayah mandat utama aktif dengan pagination 20 per halaman. Cadangan/delegasi, admin global tanpa mandat, dan RT wilayah lain tidak mendapat akses isi otomatis. Pengaju tidak dapat memeriksa simulasinya sendiri.
- Catatan awal RT mencatat deklarasi konflik, pemeriksaan domisili/masalah, teks, aktor, jabatan, mandat, dan waktu. Atribusi diisi database dan penulisan diserialkan dengan perubahan mandat admin. Catatan tidak menyetujui, menolak, atau memindahkan pengajuan.
- Keputusan RT/RW DEMO mencakup rekomendasi satu tahap, permintaan revisi, penolakan beralasan, dan laporan konflik. Kelurahan memeriksa rekomendasi/kelengkapan setelah rekomendasi RW, dapat meminta revisi/menolak/melaporkan konflik, dan menyiapkan jalur evaluasi Mikro/Kecil DEMO; belum membuat keputusan akhir program/panel/dana. Tindakan mencatat checklist manual, atribusi, mandat, waktu, status sebelum/sesudah, dan request ID.
- Jalur evaluasi dipilih manual oleh pemegang mandat utama kelurahan yang independen dengan checklist dan deklarasi simulasi wajib. Database mensyaratkan rekomendasi RT/RW putaran yang sama. Jalur, alasan, deklarasi, aktor, mandat, dan waktu tersimpan di riwayat; pengaju melihat rencana pada salinan. Tab Rencana evaluasi DEMO tersedia pada antrean kelurahan, dengan pagination dan scope wilayah. Tidak menghitung skor, menunjuk evaluator/panel, atau menyetujui dana.
- Migrasi kelurahan `20261031111312_demo_kelurahan_intake_and_evaluation_paths.sql` diterapkan tanpa perubahan RLS/grant. Hash sumber fungsi lama dicocokkan sebelum penggantian untuk mencegah overwrite perubahan bersamaan.
- Kirim ulang atas permintaan revisi membuat referensi dan putaran baru dari draf yang telah berubah. Salinan lama tetap tersimpan; aturan DEMO memulai pemeriksaan lagi dari RT, tanpa menetapkan D-07 operasional. Tautan riwayat putaran tersedia untuk pemilik.
- Petugas yang melaporkan konflik atau sudah merekomendasikan putaran yang sama tidak dapat mengambil keputusan substansi berikutnya. Pengelola menyiapkan petugas independen; tidak ada eskalasi/cadangan otomatis dan D-17/D-18 tetap terbuka.
- Riwayat tindakan baru ditutup dari akses tabel langsung (termasuk SELECT authenticated), dengan RLS deny-all. Pembacaan melalui RPC details memeriksa hak atas salinan induk terlebih dahulu. Mutasi memeriksa versi alur, lock salinan, serta lock perubahan mandat; replay dengan isi berbeda dikembalikan sebagai konflik.
- Ketiadaan petugas utama yang memenuhi syarat ditampilkan pada salinan; tidak ada pelompatan tahap. Akun pengaju yang dinonaktifkan tidak dibuka datanya kepada petugas. Riwayat disimpan, tanpa menetapkan retensi operasional D-13.
- Halaman `/dokumen` dengan 14 template dokumen Word (`public/templates`) dan panduan deploy `docs/DEPLOY.md`. Template berstatus usulan, belum divalidasi BRIDA/OPD.

Belum diimplementasikan:

- Aktivasi/verifikasi provider Google dan konfigurasi OTP/email, unggah SK, workflow permohonan peran/undangan, pagination/import skala kota, serta master wilayah resmi. Form administratif tersedia; verifikasi dasar kewenangan tetap dilakukan manusia.
- Pengiriman resmi/nomor pengajuan resmi, amendment operasional, duplikasi otomatis, unggah lampiran, keputusan akhir kelurahan/panel. Salinan, keputusan RT/RW, dan kirim ulang revisi yang tersedia hanya simulasi DEMO; bukan pengesahan kebijakan D-xx.
- Schema modul pengajuan terkirim/dana/uji, policy Storage, dan bucket berkas. Schema draf sudah tersedia.
- Pencatatan dana, checkpoint, misi, consent, serta bukti uji.
- Passport/QR, LPJ, distribusi, etalase data, minat pilot, dan banding.
- Scheduler, email, dan audit operasional.
- Jalur dokumen fisik: keputusan pengguna 31 Okt 2026 bahwa setelah 7 hari tanpa keputusan RT/RW inovator dapat memakai dokumen bertanda tangan yang dikonfirmasi kelurahan, tanpa kenaikan otomatis (PRD FR-04/FR-17/D-22). Belum dibangun pada alur DEMO; membutuhkan bucket privat dan perubahan RPC `simulation_workflow`.
- Hosting/deployment Vercel.

Tidak ada angka statistik, transaksi, akun jabatan, atau hasil uji fiktif yang disajikan sebagai data nyata.

## Verifikasi

Pengguna meminta tes alur ditunda pada 31 Oktober 2026. Untuk milestone pemeriksaan kelurahan ini, hanya lint, TypeScript, kompilasi produksi, serta metadata schema/advisor yang diperiksa. Tes unit, SQL skenario, HTTP, dan UAT keputusan/revisi/pemilihan jalur/akses kelurahan **belum dijalankan**. Tidak ada akun atau mandat QA yang diaktifkan kembali. Keberadaan kode/script dan keberhasilan migrasi tidak membuktikan alur fungsional lulus.

- Lint: lulus (`npm run lint`).
- Typecheck: lulus (`npm run typecheck`).
- Build produksi: lulus (`npm run build`), halaman informasi berhasil diprerender.
- Metadata/advisor database: RLS aktif pada 10 tabel public, tabel riwayat baru tanpa SELECT authenticated, dan peringatan lama proteksi password bocor tetap ada. Ini pembacaan metadata, bukan tes skenario akses petugas.

### Catatan historis milestone sebelumnya

Hasil berikut berasal dari fondasi akun/admin/draf/salinan awal sebelum fitur keputusan RT/RW dan putaran revisi. Hasil ini tidak menjadi bukti kelulusan fitur baru; script lama perlu disesuaikan sebelum regresi berikutnya.

- Audit dependency produksi sebelumnya: `npm audit --omit=dev` melaporkan 0 kerentanan; tidak dijalankan ulang pada milestone keputusan.
- Tes unit: 26/26 lulus (`npm test`), mencakup konfigurasi, Auth/redirect/masa mandat, administrasi/WIB, draf parsial, aritmetika RAB, kelengkapan simulasi, deklarasi konflik, dan pengabaian field aktor/mandat palsu.
- Pemeriksaan koneksi HTTP: lulus untuk Auth JWKS dan Auth Settings (`npm run check:supabase`), memakai publishable key tanpa sesi pengguna.
- SQL isolasi/constraint: `supabase/tests/identity_access.sql` lulus dan fixture di-rollback; promosi mandiri, akses lintas pengguna, perubahan ownership, audit, serta mandat tumpang-tindih ditolak.
- SQL administrasi: `supabase/tests/admin_access.sql` lulus dengan seluruh fixture di-rollback. Warga/anon dan wrapper bypass ditolak; pemberian/pencabutan, hierarki, benturan periode, audit, self-admin, session mismatch/expired, serta akses admin yang dicabut diperiksa.
- SQL draf: `supabase/tests/innovation_drafts.sql` lulus dan seluruh fixture di-rollback. Domisili, idempotensi, revisi, format JSON, hierarki, akses lintas akun/admin, sesi salah/kedaluwarsa, status terlarang, mutasi langsung, dan audit privat diperiksa.
- SQL simulasi: `supabase/tests/simulation_workflow.sql` lulus dan seluruh fixture di-rollback. Salinan/idempotensi, revisi lama, non-DEMO, scope wilayah, akses RT utama, penolakan admin/cadangan/self-review, masa mandat berakhir/dicabut, pengaju nonaktif, catatan positif, konflik, atribusi, replay, mutasi langsung, dan audit diperiksa. Tidak ada mandat RT QA yang ditetapkan secara persisten.
- Konflik revisi dikembalikan sebagai HTTP 409 (`PT409`), bukan kegagalan transaksi 500; sudah diverifikasi melalui SDK bertoken. Penyimpanan memiliki batas tunggu RPC dan pesan tanpa klaim palsu bahwa data pasti gagal tersimpan ketika jaringan terputus.
- HTTP non-browser: 11 skenario lulus pada hasil build, termasuk login/cookie SSR, guard dashboard, edit profil, cache private/no-store, penolakan Origin asing, query Data API bertoken, blok promosi mandiri, logout, dan callback aman.
- HTTP admin non-browser: 4 skenario warga dan 12 skenario admin lulus. Termasuk guard halaman/aksi langsung, pencarian email, halaman target/riwayat, penolakan role palsu/perubahan admin sendiri, RPC bertoken, RLS profil yang tetap membatasi diri sendiri, serta token sesi yang sudah keluar kehilangan hak admin. Penulisan positif admin diuji melalui rollback SQL, bukan dengan data warga nyata.
- HTTP draf non-browser: 16 skenario lulus pada build produksi. Profil wilayah, editor, simpan seluruh dokumen, langkah lanjut yang tersimpan, normalisasi angka, list/reopen, idempotensi, konflik revisi melalui HTTP, dua simpan SDK serentak dengan tepat satu pemenang, penolakan eskalasi status, 404, dan logout diperiksa. Percobaan awal berhenti karena timeout pada kasus stale save; setelah penanganan konflik HTTP 409 dan batas tunggu diperjelas, pengujian lengkap lulus. Penyebab timeout jaringan awal tidak dipastikan sebagai masalah SDK retry.
- HTTP simulasi non-browser: 14 skenario pengaju lulus, termasuk halaman/aksi, persetujuan berbagi, revisi sumber, pengiriman idempoten, salinan yang tidak berubah setelah draf diedit, petunjuk RT belum tersedia, penolakan catatan oleh pengaju, 404, dan logout. Jalur petugas positif diuji melalui SQL rollback; antarmuka petugas dengan login kedua belum diuji lewat HTTP/browser.
- Browser/UAT manusia: pengguna mengonfirmasi beranda, email konfirmasi masuk, dan memperlihatkan dashboard pribadinya. Edit profil/keluar-masuk/recovery secara manual belum dikonfirmasi; pengguna meminta langsung lanjut admin. UAT admin, responsif, keyboard, dan alur bisnis masih perlu dilakukan manusia.
- UAT visual/interaksi profil wilayah dan empat langkah draf masih perlu dilakukan manusia; pengujian HTTP tidak membuktikan perilaku klik/hidrasi, dialog perubahan belum disimpan, atau aksesibilitas keyboard sudah lulus.
- UAT simulasi dan catatan RT dengan dua akun, hidrasi, persetujuan berbagi, serta aksesibilitas keyboard masih perlu dilakukan manusia melalui SIMULATION_UAT.md.
- Database kini memiliki sepuluh tabel public aplikasi dengan RLS aktif. Pembacaan metadata milestone keputusan memastikan grant SELECT authenticated untuk tabel riwayat tindakan baru tidak tersedia; bukan tes RLS dengan login petugas. Root metadata Data API tetap membutuhkan privilege tambahan; query tabel menggunakan sesi pengguna telah diuji tanpa secret key.
- Security advisors setelah migrasi kelurahan: hanya peringatan proteksi password bocor belum aktif. Performance advisors terakhir pada milestone catatan awal: 12 index belum digunakan; tidak diperiksa ulang pada milestone keputusan. Tautan remediasi ada di AUTH_UAT.md.
- Email konfirmasi nyata diterima dan sesi dashboard pemilik terlihat pada screenshot; detail pembukaan callback tidak diperiksa langsung. Recovery nyata, Google, refresh token dalam browser setelah kedaluwarsa, serta UAT admin belum diverifikasi.
- Deployment Vercel: belum dilakukan.

## Milestone berikutnya

Tes alur dan UAT ditunda sesuai instruksi pengguna. Pembangunan berikutnya mengikuti kebutuhan yang tidak memerlukan pengesahan kebijakan tertunda. Sebelum operasional, periksa keputusan/konkurensi/isolasi akses RT-RW-kelurahan dan kirim ulang revisi, serta tuntaskan aturan RAB, duplikasi, lampiran, revisi/konflik, evaluasi akhir, dan master resmi. Rincian implementasi DEMO ada di DEMO_REVIEW_WORKFLOW.md. Target Supabase: project ref `zxfaotlqldfrlccahebw`.

Hak akses jabatan berhubungan dengan identitas, mandat, wilayah, waktu berlaku, dan objek yang diproses. KampungLab tidak melakukan transfer uang; persetujuan dan realisasi dana dipisahkan ketika modul tersebut dibangun.

## Pembersihan QA

Fixture SQL seluruhnya di-rollback. Akun sintetis HTTP dari milestone sebelumnya dipakai ulang untuk pengujian warga dan admin; tidak dibuat akun HTTP tambahan. Grant admin QA bersifat sementara dan dicabut setelah pemeriksaan. Akun kemudian dinonaktifkan/soft-delete, password acaknya diganti, dan seluruh sesi tersisanya dibuat kedaluwarsa. File kredensial QA lokal dihapus setelah pemeriksaan. Penghapusan permanen sebelumnya tertahan karena konfirmasi bawaan Supabase dua kali kedaluwarsa; baris akun/profil QA berlabel `Synthetic HTTP QA (disabled)`, penetapan QA yang sudah dicabut, dan jejak pseudonimnya tetap tersimpan sebagai riwayat. Pengelola dapat menghapus permanen lewat jalur administrasi berwenang saat konfirmasi tersedia; jangan menganggap baris ini sebagai warga program.

Milestone draf menggunakan kembali akun sintetis yang sama tanpa hak admin. Satu draf QA dipakai ulang selama pengujian, lalu isinya dikosongkan dan diberi judul `DEMO QA (disabled)`. Domisili fixture dibersihkan, akun kembali dinonaktifkan, 0 grant QA aktif, dan 0 sesi QA belum kedaluwarsa; file kredensial privat dihapus. Baris draf privat serta audit minimalnya tetap menjadi artefak QA nonaktif, bukan pengajuan warga atau data program. Admin pemilik tetap aktif. Data master DEMO adalah fixture prototipe yang sengaja tersedia untuk UAT, berbeda dari akun/draf QA nonaktif.

Milestone simulasi memakai akun QA yang sama tanpa menambahkan akun atau mandat RT persisten. Satu salinan QA dibuat lewat HTTP, lalu isinya diganti dengan data sintetis berlabel `DEMO QA (disabled)` melalui pemeliharaan database yang diaudit. Akun dan sesi kembali dinonaktifkan, domisili/draf dibersihkan, 0 mandat QA aktif, dan file kredensial dihapus. Salinan QA dari pengaju nonaktif tidak tampil dalam antrean petugas. Seluruh petugas, catatan positif, dan wilayah khusus pada pengujian SQL di-rollback; tidak ada pejabat fiktif atau keputusan program yang ditetapkan. Admin pemilik tetap aktif.

Milestone keputusan RT/RW hanya menerapkan schema/kode. Tidak menjalankan skenario fungsional, membuat fixture baru, mengaktifkan QA, menetapkan mandat, atau membuat keputusan simulasi pada data tersimpan. Metadata menunjukkan tidak ada salinan dari pengaju aktif pada saat migrasi; artefak QA nonaktif sebelumnya tetap terpisah dari data program.

Milestone kelurahan menambahkan kode/schema pemeriksaan administrasi, revisi/penolakan/konflik, dan pilihan jalur evaluasi DEMO. Tidak menjalankan skenario fungsional atau mengaktifkan fixture/mandat QA. RLS seluruh tabel public tetap aktif dan riwayat tindakan tetap tanpa SELECT authenticated, berdasarkan metadata database setelah migrasi. Ini bukan bukti tes akses dengan sesi petugas.

Saat integrasi ditemukan tiga commit upstream berisi template dokumen, pembaruan kebijakan jalur fisik 7 hari, dan alur akun/OTP. Seluruh perubahan dipertahankan dan digabung sebelum lint/typecheck/build hasil akhir. Tes fungsional tetap ditunda; fitur unggah/jalur fisik 7 hari tidak ikut dibangun dalam milestone kelurahan.
