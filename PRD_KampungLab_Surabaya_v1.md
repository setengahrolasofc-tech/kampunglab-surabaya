# PRD Sistem Website KampungLab Surabaya

**Versi:** 1.0 | **Tanggal:** 30 Oktober 2026 | **Bahasa produk:** Indonesia

**Status:** draf kebutuhan produk untuk pengembangan prototipe; belum merupakan persetujuan kebijakan program.

**Pemilik keputusan produk:** penggagas KampungLab Surabaya. Kebijakan operasional pemerintah harus divalidasi pengelola program/BRIDA/OPD.

**Stack pilihan pengguna:** Next.js, Tailwind CSS, Supabase, GitHub, dan deployment Vercel. Versi paket dipilih setelah memeriksa lingkungan dan dokumentasi saat implementasi.

## 0. Sumber, batas kepastian, dan cara membaca

Sumber utama adalah **Handbook KampungLab Surabaya(1).pdf**, 15 halaman, versi draf untuk Inovboyo 2.0 - Surabaya Innovathon 2026. Dokumen dibaca berurutan dari halaman 1 sampai 15. Salinan sumber proyek dan lampiran yang dibaca memiliki isi byte identik.

Penomoran halaman di PRD ini mengikuti tulisan `Page X of 15` pada handbook. PRD tidak memverifikasi handbook sebagai kebijakan resmi Pemerintah Kota Surabaya dan tidak menambahkan klaim hukum mengenai pengelolaan dana publik.

### 0.1 Label dasar kebutuhan

| Label | Makna | Cara memperlakukan |
|---|---|---|
| **[H]** | Tertulis dalam handbook | Pertahankan maknanya; lihat halaman sumber |
| **[U]** | Usulan desain produk/teknis untuk membuat handbook dapat diimplementasikan | Boleh dirancang, tetapi jangan disebut sebagai aturan asli atau persetujuan pengguna |
| **[D-xx]** | Keputusan yang belum jelas atau belum tersedia | Tercatat pada bagian 16; jangan diam-diam mengunci aturan bisnisnya |
| **P0** | Wajib untuk prototipe fungsional inti | Harus benar-benar berfungsi, termasuk penyimpanan dan pembatasan akses |
| **P1** | Penguatan operasional sebelum pilot dengan pengguna nyata | Penundaan harus ditampilkan di laporan scope, bukan dianggap selesai |
| **P2** | Pengembangan setelah pilot | Tidak menghalangi alur inti Mikro/Kecil |

Nilai usulan dalam handbook tetap berstatus usulan meskipun diberi label [H]. Contoh: plafon Rp5 juta dan porsi 30/50/20 adalah fakta tentang isi handbook, **bukan bukti besaran resmi program**.

### 0.2 Aturan untuk AI pengembang

1. Bedakan **PRD platform ini** dari **PRD inovasi warga** yang diisi di wizard. Keduanya bukan dokumen yang sama.
2. Periksa repository, petunjuk proyek, skema database, dan konfigurasi yang benar-benar tersedia. Nama tabel dan rute di sini adalah rancangan; jangan menganggapnya sudah ada.
3. Dahulukan kebutuhan pengguna terbaru. Jika PRD dan handbook bertentangan, tunjukkan konflik serta dampaknya; jangan memilih diam-diam.
4. Kerjakan bagian yang tidak bergantung pada keputusan tertunda. Tanyakan keputusan penghambat hanya ketika implementasi tahap tersebut memerlukannya.
5. Untuk demo, nilai kebijakan yang belum disetujui boleh dipakai hanya sebagai konfigurasi **simulasi** yang berlabel jelas. Mode operasional nyata tidak boleh memakai kebijakan kosong sebagai persetujuan otomatis.
6. Jangan membuat payment gateway, saldo, dompet, escrow, transfer bank otomatis, atau keputusan pendanaan otomatis.
7. Jangan membuat AI penilai, blockchain, chatbot, integrasi Dukcapil, atau integrasi sistem pemerintah tanpa permintaan terpisah.
8. Setiap status, metrik, dan statistik demo harus berasal dari data tersimpan atau diberi label simulasi. Jangan memakai angka palsu seolah data operasional.
9. Jangan menyatakan fitur selesai hanya karena tampilannya ada. Verifikasi proses simpan, aturan transisi, validasi, dan akses data.
10. Pembuatan PRD ini tidak mengubah akun, membuat proyek cloud, menjalankan migrasi, atau memberi izin penggunaan kredensial tertentu. Identifikasi target GitHub/Supabase/Vercel saat pekerjaan implementasi dimulai.

## 1. Ringkasan produk

### 1.1 Pernyataan produk

**KampungLab Surabaya adalah website tata kelola inovasi warga yang membawa usulan dari verifikasi berjenjang, pembangunan, dan uji warga sampai bukti hasil yang dapat diperiksa melalui Evidence Passport ber-QR. Sistem mencatat persetujuan dan realisasi dana bertahap; uang tetap ditransfer di luar platform oleh pihak berwenang.** [H, hlm. 1-2, 6-9]

Alur utama: warga mengajukan inovasi beserta PRD dan RAB; RT memeriksa domisili dan masalah; RW memeriksa kelayakan serta menunjuk fasilitator; kelurahan memutus Mikro atau meneruskan Kecil ke panel; dana awal dicatat; inovator membangun; warga menguji; fasilitator memverifikasi; passport diterbitkan; pihak berwenang meninjau pencairan lanjutan; inovasi didistribusikan gratis kepada penerima program dan ditampilkan di etalase.

### 1.2 Masalah yang ditangani

- Proposal belum cukup membuktikan bahwa inovasi berguna dan bekerja di lingkungan warga.
- Rekomendasi, bukti lapangan, anggaran, serta keputusan berpotensi terpisah dan sulit ditelusuri.
- Pencairan penuh sebelum pembuktian meningkatkan risiko dana tidak menghasilkan manfaat.
- Rating saja dapat bias; penyelesaian tugas dan bukti perilaku perlu ikut terlihat.
- Inovasi yang selesai dipresentasikan belum tentu memiliki dokumentasi yang bisa dipakai untuk replikasi.

Daftar ini merupakan perumusan masalah dari tujuan handbook, bukan hasil survei lapangan. [U berdasarkan hlm. 1-2, 9-10]

### 1.3 Tujuan produk

1. Menyediakan satu jalur pengajuan dan keputusan yang dapat ditelusuri sampai aktor dan waktunya.
2. Mengunci ukuran keberhasilan sebelum hasil uji diketahui.
3. Memisahkan kelayakan pencairan, persetujuan pencairan, dan bukti transfer aktual.
4. Menghasilkan bukti yang transparan sekaligus melindungi identitas penguji.
5. Menyediakan etalase inovasi teruji dan kanal minat pilot.
6. Membedakan kegagalan eksperimen yang jujur dari dugaan penyalahgunaan.

### 1.4 Ukuran keberhasilan

| Ukuran | Definisi | Target |
|---|---|---|
| Pengajuan lengkap | Pengajuan terkirim dengan seluruh data wajib dan RAB valid / seluruh pengajuan terkirim | Belum ditetapkan; dikumpulkan saat pilot |
| Waktu keputusan per tingkat | Waktu aktif antrean sampai keputusan; masa revisi dipisahkan | Baseline pilot; 24 jam adalah pemicu pengingat, bukan janji keputusan |
| Ketertelusuran keputusan | Keputusan yang memiliki aktor, mandat, waktu, versi, dan alasan yang diwajibkan | 100% sebagai kriteria penerimaan sistem [U] |
| Kelengkapan pembuktian dana lanjutan | Persetujuan tahap 2 yang memenuhi semua gerbang bukti dan dokumen | 100% sebagai kriteria penerimaan sistem [U] |
| Completion rate uji | Penguji valid yang menyelesaikan seluruh tugas wajib / penguji valid yang masuk denominator | Lihat definisi bagian 11 dan D-10 |
| Inovasi lolos ambang | Misi dengan seluruh kriteria wajib tercapai / misi yang selesai dievaluasi | Tidak ditentukan sebelumnya |
| Penarikan consent | Permintaan yang diproses dan tampilan publik sudah diperbarui | SLA perlu ditentukan, D-13 |

## 2. Cakupan rilis

### 2.1 Prototipe fungsional inti, P0

Mengikuti arahan pilot handbook: buka tingkat **Mikro dan Kecil**. [H, hlm. 7]

- Autentikasi, profil wilayah, pengajuan peran, dan penugasan jabatan yang diverifikasi admin.
- Wizard pengajuan empat langkah, PRD inovasi, RAB, pernyataan keaslian, dan lampiran.
- Verifikasi RT, RW, kelurahan, konflik kepentingan, revisi, dan alasan penolakan.
- Penilaian panel Kecil, rubrik, deklarasi konflik, dan pencatatan suara.
- Pencatatan tiga tahap dana, persetujuan berwenang, bukti transfer di luar platform.
- Pembangunan, checkpoint, dan pencatatan tenggat/perpanjangan.
- Misi uji, QR/poster, consent, verifikasi peserta, checklist, bukti, rating, feedback.
- Verifikasi hasil oleh fasilitator, metrik uji, Evidence Passport, dan pemeriksaan QR.
- LPJ, panduan perawatan, bukti distribusi/serah terima, etalase, minat pilot.
- Banding dasar, notifikasi dalam aplikasi, audit aktivitas, dan parameter program.
- Tampilan responsif; semua data demonstrasi sintetis dan diberi label.

P0 tetap membutuhkan keputusan tertentu sebelum alur bersangkutan bisa dipakai nyata. Aplikasi demo boleh menyimulasikan penandatanganan, dana, dan kebijakan yang tertunda dengan label yang terbaca.

### 2.2 Penguatan sebelum pilot nyata, P1

- Email pengingat yang benar-benar terkirim dengan retry dan pencatatan kegagalan; bukan tombol atau log palsu.
- Delegasi dan serah terima jabatan lengkap dengan dokumen serta masa berlaku.
- Penanganan penguji di bawah 17 tahun dengan verifikasi persetujuan wali yang disepakati.
- Penarikan consent, penghapusan/anonimisasi, penanganan cache, dan retensi yang disepakati.
- Audit acak, penggantian fasilitator, flag anomali, peninjauan dugaan manipulasi.
- Perpanjangan, penghentian, pemulihan, pengembalian/pengalihan dana secara administratif.
- Pengiriman email, monitoring, backup/restore, aksesibilitas, serta pengujian keamanan yang siap untuk data nyata.
- Mekanisme tanda tangan digital sesuai kebijakan pengelola.
- Reward/sertifikat digital berbasis penyelesaian tugas, setelah bentuk dan penerbitnya diputuskan.

Fitur privasi dan kontrol akses dasar tetap P0. Menunda kesiapan operasional fitur di atas berarti prototipe **belum boleh diklaim siap untuk seluruh peserta nyata**.

### 2.3 Setelah pilot, P2

- Tingkat Menengah dengan persetujuan OPD tambahan.
- Analitik lanjutan, dukungan lintas program, integrasi resmi sistem daerah jika disepakati.
- Deteksi kemiripan semantik atau anomali lebih lanjut setelah kebutuhan dan dasar pemrosesan jelas.

### 2.4 Di luar cakupan

Dompet, crowdfunding, marketplace berbayar untuk penerima program, payment gateway, penyaluran uang otomatis, penggantian keputusan pejabat, penerbitan sertifikasi resmi tanpa kewenangan, dan penilaian kelayakan otomatis oleh AI.

## 3. Aktor, wilayah, dan hak akses

Hak akses ditentukan oleh kombinasi **identitas, peran aktif, wilayah, penugasan, kepemilikan, tahap proses, masa berlaku mandat, dan deklarasi konflik**. Memiliki peran RT tidak berarti dapat memproses seluruh RT di Surabaya. [U]

| Aktor | Hak utama | Pembatasan utama |
|---|---|---|
| Publik | Beranda, panduan, etalase, passport publik, pemeriksaan QR | Tidak membaca proposal belum terbit, data penguji asli, SK, rekening, atau bukti transfer mentah |
| Inovator | Mengelola draf sendiri, mengirim, merevisi sesuai permintaan, mencatat progres/LPJ, membuat misi, melihat hasil, mengajukan banding | Tidak memutus pengajuan sendiri, memverifikasi penguji, mengubah feedback, atau menandai transfer sendiri sebagai terkonfirmasi |
| Warga penguji | Membaca misi, mendaftar, mengatur privasi, mengirim bukti dan feedback sendiri, menarik consent | Tidak melihat identitas asli peserta lain atau memvalidasi bukti sendiri |
| Ketua RT/petugas sah | Meninjau domisili dan masalah nyata untuk wilayah penugasannya | Tidak melewati RW; tidak memproses keluarga sendiri |
| Ketua RW/petugas sah | Meninjau kelayakan lokal, duplikasi, RAB, menunjuk fasilitator | Hanya usulan yang sudah melewati RT secara sah atau jalur konflik yang tercatat |
| Kelurahan/petugas sah | Meninjau rekomendasi, menentukan tingkat, memutus Mikro, meneruskan Kecil, mengelola pencatatan dana sesuai mandat | Tidak mengganti penilaian panel Kecil dengan persetujuannya sendiri |
| Reviewer panel | Menilai pengajuan yang ditugaskan, mengisi rubrik, memberi suara dan alasan | Tidak menilai jika konflik; tidak melihat atau mengubah suara atas nama reviewer lain |
| Fasilitator kampung | Memverifikasi penguji dan bukti misi yang ditugaskan, memverifikasi hasil akhir | Tidak otomatis mendapat akses ke seluruh dokumen keuangan, usulan lain, atau seluruh warga |
| Admin OPD/BRIDA | Akun jabatan, mandat, parameter, audit, pengelolaan banding, laporan program | Tidak boleh menghapus jejak keputusan atau mengedit hasil terverifikasi diam-diam |
| OPD/industri berminat pilot | Melihat informasi publik dan mengirim minat pilot | Minat bukan persetujuan pendanaan atau akses otomatis ke data pribadi |
| Akun cadangan | Menjalankan mandat cadangan yang masih berlaku | Hak dan keadaan aktivasinya harus ditentukan; tidak menjadi superadmin otomatis, D-18 |

Sumber peran: [H, hlm. 3-4, 11-13]. Perincian pembatasan merupakan [U] untuk menjaga prinsip handbook.

### 3.1 Akun jabatan dan identitas petugas

[H] Setiap tingkat mempunyai satu akun utama dan satu akun cadangan. Jabatan dapat didelegasikan melalui surat tugas dan masa berlaku. Serah terima berdasarkan SK/surat tugas; admin dapat menonaktifkan atau mengganti. Tindakan delegasi berbunyi “oleh [petugas] atas nama [jabatan]”; kepala tingkat menerima notifikasi keputusan. [hlm. 3-4]

[U, D-18: model disetujui pengguna 30 Oktober 2026] Implementasikan **jabatan sebagai entitas permanen** dan petugas sebagai identitas login individual yang mempunyai mandat utama/cadangan/delegasi. Ini menjaga atribusi saat pergantian pemegang jabatan. Jangan menyelesaikannya dengan berbagi satu password antarpersonel.

Pemilihan peran saat pendaftaran adalah **permohonan peran**, bukan pemberian hak istimewa otomatis. Unggah SK saja tidak cukup; admin harus memverifikasi mandat, wilayah, dan tanggal berlaku.

### 3.2 Konflik kepentingan

- RT/RW mendeklarasikan hubungan keluarga sebelum keputusan. Jika konflik, ia tidak boleh memproses; pengajuan diarahkan ke tingkat di atas dengan alasan dan jejak audit. Ini adalah pengecualian sah atas alur berjenjang. [H, hlm. 4]
- Reviewer mendeklarasikan konflik dan mundur bila mempunyai relasi dengan inovator. Reviewer pengganti ditugaskan; pengunduran diri bukan suara setuju. [H, hlm. 4-5; perincian pengganti U]
- Konflik tidak dihitung sebagai persetujuan maupun alasan menolak otomatis.
- Bentuk relasi yang dilarang dan kasus konflik kelurahan/fasilitator masih D-17.

## 4. Parameter program dan kebijakan versi

Semua angka berikut merupakan **nilai usulan handbook**. Admin mengatur parameter per program/periode. Simpan versi kebijakan pada pengajuan agar perubahan konfigurasi tidak mengubah aturan usulan lama secara retroaktif tanpa keputusan tercatat. [H, hlm. 1, 13, 15; versioning U]

| Parameter | Nilai dalam handbook | Catatan |
|---|---|---|
| Mikro | Plafon Rp5.000.000; bangun maksimal 30 hari | Keputusan akhir kelurahan |
| Kecil | Plafon Rp25.000.000; bangun maksimal 60 hari | Panel 3 orang |
| Menengah | Plafon Rp50.000.000; bangun maksimal 90 hari | Panel dan OPD; nonaktif di pilot |
| Dana tahap 1 | Maksimal 30% | Dasar nominal masih D-04 |
| Dana tahap 2 | 50% | Jangan dianggap selalu otomatis cair |
| Dana tahap 3 | 20%, ditahan sampai bukti distribusi | Rekonsiliasi bila tahap 1 kurang dari 30% masih D-04 |
| Dana tak terduga | Maksimal 10% | Basis perhitungan diusulkan total RAB yang diajukan, D-04 |
| Honor inovator | Maksimal 15% | Hindari item ganda untuk mengakali batas |
| Masa perawatan | 6-12 bulan | Awal masa dan dukungan setelahnya masih D-15 |
| Perpanjangan bangun | Satu kali; maksimal 50% durasi awal; tanpa tambahan dana | Otoritas dan pembulatan hari masih D-08 |
| Pengingat antrean | Satu email setelah 1 x 24 jam tanpa keputusan | Ke akun utama dan cadangan; bukan auto-approval |
| Verifikasi penguji | Dalam 24 jam | Target fasilitator, bukan auto-verifikasi |
| Panel | 3 orang: BRIDA/OPD, akademisi, praktisi | Usulan; perlu validasi pengelola |
| Suara panel | Minimal 2 dari 3 setuju | Hubungan dengan skor belum lengkap, D-03 |
| Rubrik | 25 + 25 + 20 + 15 + 15 = 100 | Ambang minimal 70/100 |
| Banding | Maksimal 5 hari kerja sejak keputusan terbit | Kalender kerja dan awal hitung D-12 |
| Audit acak penguji | Sampel 10-20% | Angka pilihan dan pembulatan D-14 |
| Penguji berelasi dekat | Dibatasi | Besaran tidak disebut; jangan membuat persentase sendiri |
| Tema inovasi | Empat tema Inovboyo | Empat nama lengkap tidak tersedia dalam handbook, D-01 |

### 4.1 Aturan konfigurasi

- Tidak boleh ada nilai negatif, plafon nol untuk tingkat aktif, atau porsi pendanaan yang membuat total melebihi anggaran disetujui.
- Parameter kosong yang menentukan kelulusan harus menghasilkan “kebijakan belum dikonfigurasi”, bukan default lulus.
- Admin mencatat alasan, tanggal berlaku, dan versi perubahan.
- Perubahan nilai pada pengajuan berjalan memerlukan mekanisme perubahan terpisah dan peninjauan dampak terhadap RAB, ambang, atau tenggat.
- Konfigurasi demo dipisahkan dari konfigurasi operasional. UI menyebut “simulasi pencairan” jika memakai data demo.

## 5. Arsitektur informasi dan halaman

Rute berikut **usulan navigasi**, bukan rute yang sudah ada atau kontrak API. AI harus menyesuaikan setelah memeriksa repository. Bahasa URL boleh konsisten Indonesia; pola passport mempertahankan format handbook.

### 5.1 Publik

| Halaman | Rute usulan | Konten/aksi penting |
|---|---|---|
| Beranda | `/` | Pengertian, tiga pesan kunci, alur 10 tahap, statistik tersanitasi, Masuk/Daftar, Etalase, Tanya CS |
| Etalase Inovasi | `/inovasi` | Pencarian, filter tema, kampung, status bukti; hanya data layak terbit |
| Detail inovasi | `/inovasi/[slug]` | Masalah, solusi, dampak, ringkasan dana, tautan passport |
| Detail Evidence Passport | `/passport/[id]?h=[hash]` | Identitas penerbit, versi, hasil uji, feedback, rekomendasi, ringkasan dana, minat pilot |
| Verifikasi QR | `/verifikasi` | Input/scan tautan QR, hasil cocok/tidak cocok/tidak ditemukan/diganti/dicabut |
| Panduan dan FAQ | `/panduan` | Alur, plafon usulan, dokumen, privasi, konflik, banding, kontak CS |
| Masuk/Daftar | `/masuk`, `/daftar` | Email/Google, permohonan peran, informasi persetujuan mandat |
| Misi dari QR | `/misi/[id]` | Informasi misi publik dan tombol ikut; QR ini berbeda dari QR passport |

### 5.2 Inovator

Dashboard; daftar pengajuan; wizard Pengajuan Baru; Status Pengajuan dengan timeline; Misi Uji dan QR/poster; Laporan Kemajuan; Laporan Pertanggungjawaban; Dana; Distribusi dan Perawatan; Banding; Profil; Notifikasi.

Dashboard menampilkan nomor usulan, posisi antrean, revisi yang perlu dikerjakan, nominal **terkonfirmasi**, tenggat, serta aksi berikutnya. Jangan mencampur nominal “disetujui” dengan nominal “telah cair”.

### 5.3 Penguji

Halaman Misi; Consent dan Identitas; status verifikasi fasilitator; Checklist Harian; Unggah Bukti; Rating dan Feedback; riwayat misi; Profil dan Privasi; reward/sertifikat jika fitur telah tersedia.

### 5.4 Petugas dan pengelola

Antrean Pengajuan per tingkat; Detail Verifikasi; Antrean dan Penilaian Panel; daftar penugasan fasilitator; Verifikasi Penguji; Verifikasi Uji Akhir; Persetujuan Pencairan; Kelola Akun Jabatan; Banding; Audit; Laporan Program; Pengaturan Program.

Setiap pengguna melihat navigasi sesuai mandat aktif. Pengalihan dashboard tidak menggantikan pemeriksaan otorisasi pada server/database.

Sumber fungsi halaman: [H, hlm. 11-13]. Pemisahan beberapa halaman tambahan merupakan [U] agar tugas pengguna tidak bercampur.

## 6. Alur pengguna utama

### 6.1 Inovator

1. Masuk, melengkapi domisili dan profil.
2. Membuat draf; mengisi empat langkah wizard.
3. Meninjau ringkasan dan mengirim; memperoleh nomor pengajuan.
4. Memantau RT, RW, kelurahan, dan panel bila Kecil.
5. Jika revisi diminta, membaca catatan, memperbaiki, lalu mengirim versi baru.
6. Jika disetujui, melihat keputusan dan menunggu pencatatan transfer tahap 1.
7. Mengunggah bukti penerimaan; petugas berwenang mengonfirmasi realisasi.
8. Membangun, mengirim checkpoint beserta nota/foto/demo.
9. Menyiapkan misi dari rencana uji yang telah disetujui; membagikan QR umum.
10. Memantau uji tanpa dapat mengubah data penguji atau feedback.
11. Menyusun LPJ sesuai tahap, menerima hasil verifikasi dan passport.
12. Mengajukan peninjauan dana lanjutan; persetujuan dan realisasi dicatat terpisah.
13. Mendokumentasikan distribusi gratis, panduan, kontak suku cadang, dan pelatihan.
14. Melanjutkan perawatan dan melihat halaman etalase setelah syarat publikasi dipenuhi.

### 6.2 Petugas verifikasi

Menerima notifikasi; membuka antrean wilayah/penugasannya; mendeklarasikan konflik; meninjau versi dokumen; mengisi daftar periksa; memilih keputusan yang sah; memberi alasan/catatan; sistem menyimpan keputusan, memperbarui antrean secara atomik, dan memberi notifikasi.

### 6.3 Warga penguji

Scan QR misi; membaca tugas, durasi, risiko, dan privasi; masuk/mendaftar sesuai metode yang disepakati; memberi tiga consent serta deklarasi relasi; memilih tampilan nama/foto; menunggu verifikasi fasilitator; menjalankan tugas; mengirim bukti; menyelesaikan semua tugas; mengirim rating 1-5 dan feedback; mengatur privasi atau menarik consent bila dikehendaki.

### 6.4 Fasilitator

Menerima penugasan RW; memverifikasi identitas terbatas dan relasi peserta dalam 24 jam; memantau kelengkapan bukti; meninjau anomali; memeriksa hasil; menandatangani persetujuan terhadap versi hasil tertentu; menindaklanjuti audit jika ditugaskan.

## 7. Kebutuhan fungsional

ID `FR-xx` adalah identitas modul. Butir di dalamnya tetap merupakan persyaratan yang harus dapat diuji. Prioritas menyatakan fase pembangunan, bukan alasan untuk menghilangkan aturan handbook.

### FR-01. Autentikasi, profil, dan mandat - P0/P1

**Sumber:** [H, hlm. 3-4, 11-13].

- Mendukung masuk melalui email dan Google. Metode email terperinci serta konfigurasi provider diputuskan sebelum implementasi auth, D-18.
- Menyimpan identitas pengguna dan domisili terstruktur: kelurahan, RW, RT, dengan relasi hierarkis yang valid.
- Mengizinkan permohonan peran; hak RT/RW/kelurahan/reviewer/fasilitator/admin hanya diberikan melalui penetapan berwenang.
- Mandat jabatan memuat pengguna, jabatan, wilayah, jenis utama/cadangan/delegasi, dokumen, pemberi mandat, mulai, akhir, status.
- Penonaktifan atau habisnya mandat langsung mencegah aksi baru pada endpoint sensitif; jangan hanya menunggu menu UI menghilang.
- Riwayat tindakan petugas lama tidak berpindah identitas kepada petugas baru.
- Satu orang dapat mempunyai lebih dari satu peran hanya jika kebijakan mengizinkan; konflik pada usulan tertentu tetap diperiksa. [U, D-18]

**Hasil minimum:** warga yang mendaftar sebagai “RT” belum dapat membuka antrean RT sebelum mandat disetujui.

### FR-02. Wizard pengajuan empat langkah - P0

**Sumber:** [H, hlm. 4, 8].

**Langkah 1 - Data inovasi**

- Nama, tema, bentuk, tahap inovasi, Tim Inovasi, wilayah, ringkasan solusi.
- Bentuk dari handbook: gagasan, produk, prototipe, program, teknologi.
- Tahap inovasi dari handbook: inisiatif, uji coba, penerapan.
- Pisahkan tahap kematangan inovasi ini dari status proses pengajuan; “penerapan” tidak berarti sudah disetujui program.
- Tim memuat nama dan peran. Kewenangan kolaborasi akun tim belum ditentukan; jangan memberikan hak edit kepada semua anggota otomatis. D-18.
- Empat tema merupakan master data; nama lengkap belum tersedia. Contoh “Agribis dan Teknologi Terbarukan” pada cerita Bu Rina tidak cukup untuk mengarang tiga tema lainnya.

**Langkah 2 - PRD inovasi**

Masalah; bukti masalah; penerima manfaat; jumlah penerima; solusi; fitur; ukuran sukses beserta ambang; metode dan rencana uji; tim/peran; risiko dan mitigasi. Ukuran sukses tidak boleh hanya berupa kalimat “bermanfaat” tanpa cara ukur.

**Langkah 3 - RAB**

Item, kategori, uraian, satuan, volume, harga satuan, subtotal, tahap penggunaan, total, dana tak terduga, honor inovator, rencana biaya perawatan 6-12 bulan. Pembiayaan perawatan dimasukkan sesuai keputusan D-04 agar tidak dihitung ganda.

**Langkah 4 - Keaslian dan kirim**

Pernyataan karya sendiri; lampiran yang diperlukan; hasil cek nama/kemiripan; ringkasan data; checklist kelengkapan; konfirmasi pengiriman.

PRD dan RAB adalah dokumen wajib, tetapi handbook tidak memastikan apakah semuanya harus diunggah sebagai berkas terpisah. Usulan: data terstruktur wizard menjadi versi dokumen resmi aplikasi dan dapat diringkas/diunduh; jika pengelola mewajibkan template bertanda tangan, tambahkan lampiran tersebut melalui konfigurasi dokumen. Jangan memaksa pengguna mengetik dan mengunggah isi identik tanpa alasan. [U, D-23]

**Perilaku umum [U]:** simpan draf, lanjutkan kemudian, indikator penyimpanan, validasi per langkah, dan tinjau semua kesalahan tanpa kehilangan input. Estimasi pengisian 30-60 menit dari handbook adalah informasi, bukan timer yang membatalkan draf.

**Implementasi prototipe 31 Oktober 2026 [U, khusus DEMO]:** draf tersimpan disalin ke RT; RT/RW dapat mencatat rekomendasi lanjut, revisi, penolakan, atau konflik dengan alasan. Kelurahan hanya membaca salinan yang sudah direkomendasikan RW. Kirim ulang atas permintaan revisi menghasilkan putaran baru dari RT; seluruh salinan/riwayat lama tetap tersimpan. Petugas yang memberi rekomendasi sebelumnya atau melaporkan konflik tidak mengambil keputusan substansi berikutnya dalam putaran yang sama. Ini aturan latihan sementara, bukan pengesahan D-07/D-17/D-18, pengiriman resmi, keputusan kelurahan/panel/dana, atau aktivasi cadangan/delegasi. Pengguna meminta tes alur ditunda; implementasi baru belum diverifikasi secara fungsional. Rincian ada di `docs/DEMO_REVIEW_WORKFLOW.md` dan `docs/SIMULATION_UAT.md`.

### FR-03. Validasi dan versi pengajuan - P0

**Sumber:** [H, hlm. 4-5, 7-8].

- Validasi ulang seluruh data pada server saat kirim, sekalipun browser telah memvalidasi.
- Cegah pengiriman jika data wajib tidak lengkap, hierarki domisili tidak valid, plafon terlampaui, komponen biaya melanggar batas, atau rencana uji tidak terukur.
- Buat nomor pengajuan unik dan satu versi dokumen terkirim yang dapat diaudit.
- Draf dapat diedit pemilik; versi yang sedang ditinjau tidak dapat ditimpa diam-diam.
- Cek duplikasi nama otomatis; temuan menampilkan kandidat etalase dan alasan kemiripan. **Kemiripan bukan vonis plagiarisme.** Status blok/peringatan masih D-06.
- Pengiriman berulang akibat klik ganda atau retry tidak menciptakan dua pengajuan untuk operasi yang sama. [U]
- Perubahan materiil setelah persetujuan, misalnya anggaran atau ambang uji, harus melalui perubahan yang tercatat dan peninjauan ulang sesuai D-07.

**Gerbang kelayakan substantif [H, hlm. 7-8]:** masalah nyata diverifikasi RT/RW; penerima manfaat dan jumlahnya jelas; rencana uji serta ambang terukur sejak awal; RAB wajar dan tidak menduplikasi inovasi terbukti; skor minimal 70/100 menurut evaluator yang ditetapkan.

**Yang tidak dibiayai [H, hlm. 8]:** riset tanpa penerima manfaat atau tanpa rencana uji; eksperimen berisiko keselamatan tanpa tinjauan ahli; duplikasi inovasi yang sudah terbukti; kegiatan komersial murni atau pembelian aset pribadi; karya yang tidak asli. Form menyediakan deklarasi dan tempat bukti/tinjauan ahli bila relevan. Penilaian substansi oleh pihak berwenang, bukan sekadar pencarian kata atau putusan AI.

### FR-04. Verifikasi RT, RW, kelurahan - P0

**Sumber:** [H, hlm. 4-5].

| Tingkat | Daftar periksa wajib | Aksi |
|---|---|---|
| RT | Domisili dan masalah nyata; deklarasi keluarga | Setuju, Minta revisi, Tolak; deklarasi konflik |
| RW | Kelayakan lokal, duplikasi, kewajaran RAB; fasilitator | Setuju, Minta revisi, Tolak; deklarasi konflik |
| Kelurahan | Rekomendasi sebelumnya, tingkat, kelengkapan | Putus Mikro atau teruskan Kecil; revisi/tolak sesuai kebijakan peninjauan |

- Rekomendasi dibuat di dalam sistem, bertanggal/waktu; tidak mewajibkan surat rekomendasi terpisah.
- Pengecualian (keputusan pengguna, 31 Okt 2026): bila RT atau RW belum memutuskan setelah 7 hari (parameter yang dapat diatur Admin), tombol "Ajukan lewat dokumen fisik" terbuka untuk inovator. Inovator mencetak surat rekomendasi (template tersedia, versi terisi otomatis diusulkan), meminta tanda tangan dan stempel, lalu mengunggah scan/foto. Kelurahan mengonfirmasi ke RT/RW; konfirmasi sah dicatat sebagai keputusan Setuju bermetode `fisik` dan pengajuan lanjut ke tingkat berikutnya. Dokumen disimpan privat dan tidak tampil di etalase/passport; yang tampil hanya label rekomendasi manual. Siapa yang mengonfirmasi (usulan: kelurahan) belum final. Status implementasi: belum dibangun pada alur DEMO; membutuhkan bucket privat dan perubahan alur keputusan.
- Tolak wajib alasan terlihat inovator. Revisi wajib catatan yang dapat ditindaklanjuti.
- Persetujuan memindahkan antrean ke tingkat berikutnya; tidak melompat kecuali konflik yang sah.
- Masa revisi tidak dihitung sebagai waktu aktif tingkat tersebut.
- Saat kirim ulang, simpan asal revisi. Usulan: kembali ke tingkat yang meminta revisi; perubahan materiil dapat memerlukan verifikasi ulang tingkat sebelumnya. D-07.
- RW harus mempunyai penunjukan fasilitator yang sah sebelum alur uji aktif; waktu wajib penunjukan perlu disepakati.
- Tidak ada kenaikan tingkat otomatis karena menunggu lama atau melewati 24 jam.

### FR-05. Panel kelayakan dan OPD - P0 untuk Kecil; P2 untuk Menengah

**Sumber:** [H, hlm. 5-6, 8, 15].

- Tiga kursi reviewer: unsur BRIDA/OPD, akademisi, praktisi; penugasan dan penggantian tercatat.
- Reviewer wajib deklarasi konflik sebelum menilai.
- Form penilaian mempunyai lima aspek:

| Aspek | Poin maksimum |
|---|---:|
| Masalah nyata dan terverifikasi | 25 |
| Penerima manfaat jelas dan memadai | 25 |
| Kelayakan solusi dan kemampuan tim | 20 |
| Ukuran bukti terukur | 15 |
| RAB wajar dan tidak duplikat | 15 |
| **Total** | **100** |

- Ambang lolos dalam handbook adalah 70/100 dan minimal dua dari tiga suara setuju.
- Skor, suara, alasan, waktu, dan versi yang dinilai tercatat serta terlihat inovator sesuai aturan transparansi.
- **Belum ditetapkan:** apakah skor akhir adalah rata-rata tiga reviewer, median, atau nilai konsensus; apakah setiap pemberi suara setuju harus memberi minimal 70; kapan penilaian dianggap lengkap. D-03.
- Mikro tidak melewati panel tetapi handbook tetap menyebut syarat skor 70 untuk pengajuan yang lolos; evaluator Mikro perlu diputuskan. D-02.
- Untuk Menengah, persetujuan OPD merupakan gerbang tambahan; jangan mengaktifkannya pada pilot tanpa alur dan mandatnya.

### FR-06. Rencana dana, persetujuan, dan realisasi - P0

**Sumber:** [H, hlm. 6-9].

- Simpan nominal diajukan, nominal disetujui, rencana tiap tahap, persetujuan tiap tahap, dan realisasi aktual secara terpisah.
- Dana tahap 1 hanya dapat disetujui setelah verifikasi berjenjang dan panel bila diperlukan.
- Inovator dapat mengunggah bukti transfer/penerimaan sebagaimana handbook. **Usulan:** petugas berwenang mengonfirmasi sebelum realisasi masuk angka “dana cair”.
- Sumber dana/pembayar, tanggal, nominal, nomor referensi administratif bila tersedia, dan lampiran privat dicatat; rekening tidak ditampilkan publik.
- Tahap 2 hanya dapat disetujui bila ambang bukti tercapai, LPJ tahap terkait lengkap, dan pihak berwenang menyetujui: kelurahan untuk Mikro, panel untuk Kecil.
- Tahap 3 memerlukan bukti distribusi. Otoritas final dan kelengkapan finalnya masih D-05.
- Kelayakan sistem hanya membuka proses peninjauan; tidak otomatis menjadi persetujuan atau status cair.
- Realisasi yang diunggah tidak boleh otomatis dianggap benar hanya karena file ada.
- Cegah jumlah kumulatif melebihi anggaran disetujui atau persetujuan tahap. Koreksi nominal menyimpan alasan dan jejak perubahan.
- Sistem menyediakan pencatatan penghentian dan pengembalian/pengalihan dana, tanpa memindahkan uang.
- Penggunaan di luar RAB/pemalsuan adalah dugaan yang ditinjau manusia; keputusan sanksi dan daftar hitam membutuhkan otoritas, alasan, bukti, serta hak banding. Jangan blacklist otomatis karena flag anomali. [U berdasarkan prinsip hlm. 9]

### FR-07. Pembangunan, checkpoint, dan perpanjangan - P0/P1

**Sumber:** [H, hlm. 6-7].

- Tampilkan tanggal mulai, tenggat awal, tenggat efektif, serta checkpoint pertengahan.
- Laporan checkpoint: progres naratif, capaian dibanding rencana, penggunaan dana sementara, nota/foto/demo, hambatan.
- Jika checkpoint tidak menunjukkan kemajuan menurut peninjau berwenang, proses dana lanjutan ditahan dengan alasan.
- Durasi acuan: Mikro 30 hari, Kecil 60 hari, Menengah 90 hari; seluruhnya parameter usulan.
- Perpanjangan maksimal satu kali, tambahan maksimal 50% durasi awal, tanpa dana tambahan.
- Usulan meminta perpanjangan sebelum tenggat; otoritas, start timer, dan hari kalender/kerja masih D-08.
- Lewat tenggat tanpa perpanjangan menghambat persetujuan pencairan berikutnya. Pencatatan keputusan dan penanganan sisa dana dilakukan petugas; sistem tidak mengirim uang atau membuat sanksi secara otomatis.

### FR-08. Penyusunan misi uji dan QR/poster - P0

**Sumber:** [H, hlm. 4, 6, 12].

- Misi terhubung dengan pengajuan disetujui dan fasilitator yang ditunjuk.
- Isi: nama misi, tujuan, penerima/penguji sasaran, wilayah, jadwal/durasi, kuota, tugas harian, bukti yang diminta, risiko, ambang sukses, indikator wajib/tambahan.
- Rencana misi merujuk ambang yang telah dinilai sejak awal; tidak boleh diturunkan setelah melihat hasil tanpa perubahan resmi.
- Sistem menghasilkan QR pendaftaran misi dan poster berisi identitas misi, ringkasan tugas, periode, serta tautan yang dapat diketik.
- QR misi tidak memuat nomor HP, token akses privat, atau data penguji.
- Misi memiliki draf, dibuka, ditutup, sedang diverifikasi, selesai; misi ditutup tidak menerima peserta/bukti baru kecuali dibuka ulang dengan alasan.
- Jumlah misi per inovasi, penggabungan hasil lintas misi, dan aturan pengulangan uji masih D-09.

### FR-09. Pendaftaran penguji, consent, dan privasi - P0/P1

**Sumber:** [H, hlm. 6, 10-12].

- Halaman misi menjelaskan tugas, durasi, pengelola, risiko, data yang dikumpulkan, dan privasi sebelum ikut.
- Pilihan tampilan nama: lengkap, inisial, anonim; pilihan foto: tampil atau diburamkan.
- **Anonim di publik berbeda dari anonim bagi fasilitator:** nama, HP, kampung hanya tersedia terbatas untuk verifikasi sesuai kebutuhan.
- Tiga kotak persetujuan wajib disediakan dan tidak dicentang otomatis. Isi naskahnya belum tertulis; usulan: partisipasi/tugas dan risiko, pemrosesan data verifikasi, publikasi hasil sesuai pilihan. Teks final masih D-11.
- Penguji di bawah 17 tahun memerlukan persetujuan wali. Jangan menyamakan semua pelajar dengan di bawah 17 tahun. Mekanisme pembuktian wali masih D-11.
- Peserta mendeklarasikan relasi dengan inovator; batas penguji berelasi ditentukan admin setelah kebijakan disepakati, D-14.
- Fasilitator memeriksa nama, HP, kampung dalam 24 jam; lewat waktu tidak menjadikannya terverifikasi otomatis.
- Simpan versi naskah consent, pilihan privasi, waktu persetujuan, status wali jika relevan, serta waktu penarikan.
- Penguji dapat menarik consent dan meminta penghapusan data. Akses submit berikutnya dihentikan; tampilan publik dianonimkan; rincian dampak metrik, retensi, dan versi passport mengikuti D-13.
- Jika belum ada mekanisme wali yang disepakati, mode demo boleh memakai data sintetis; pilot nyata tidak menerima peserta di bawah 17 tahun melalui alur yang belum selesai.

### FR-10. Checklist, bukti tugas, rating, feedback - P0

**Sumber:** [H, hlm. 6, 9-10, 12].

- Hanya peserta terverifikasi dengan consent aktif dapat mengerjakan tugas yang diizinkan.
- Tugas mempunyai instruksi, jadwal, jenis bukti, dan status; bukti menyimpan waktu unggah server. Foto dengan timestamp kamera bukan bukti tunggal kebenaran waktu kejadian.
- Status tugas membedakan belum dikirim, terkirim, perlu perbaikan, diverifikasi, atau ditolak. Ini usulan untuk membedakan klaim selesai dari bukti valid.
- Sistem mencegah duplikasi submission peserta/tugas yang sama; revisi bukti menjadi versi baru.
- Rating integer 1-5 dan feedback terbuka setelah seluruh tugas wajib selesai; apakah selesai berarti terkirim atau diverifikasi perlu D-10.
- Feedback negatif tidak boleh dihapus atau diedit oleh inovator.
- Penanganan konten yang memuat data pribadi/kekerasan verbal memakai moderasi transparan; tidak boleh dipakai untuk menghilangkan kritik. Simpan alasan dan jejak, D-16.
- Reward/sertifikat bergantung pada penyelesaian tugas, bukan besarnya rating. Mekanisme dan bentuknya D-20.
- Indikator perilaku dan bukti tugas ditampilkan sebagai hasil utama; rating menjadi pelengkap, bukan satu-satunya bukti.

### FR-11. Verifikasi akhir dan validitas uji - P0/P1

**Sumber:** [H, hlm. 6, 9-10, 13].

- Fasilitator meninjau peserta, tugas, bukti, hubungan dengan inovator, serta temuan anomali.
- Sistem menghitung metrik dari data yang memenuhi definisi; fasilitator tidak mengetik angka akhir bebas untuk menggantikan perhitungan.
- Hasil menunjukkan setiap indikator, ambang, nilai aktual, jumlah data valid, dan status tercapai/belum tercapai/tidak cukup data.
- Fasilitator memberi verifikasi akhir dan tanda tangan digital terhadap versi hasil tertentu, bukan seluruh data yang dapat berubah sewaktu-waktu.
- Jenis tanda tangan belum ditentukan; acknowledgement akun demo tidak boleh diberi klaim TTE tersertifikasi. D-19.
- Jika data dianulir setelah audit, catat siapa, alasan, bukti, perubahan denominator/metrik, serta dampak pada kelayakan dana dan passport.
- Gagal ambang dengan penggunaan dana sesuai RAB dicatat sebagai kegagalan uji/pelajaran, tidak otomatis sebagai pelanggaran atau blacklist.

### FR-12. Evidence Passport dan pemeriksaan QR - P0

**Sumber:** [H, hlm. 6-7, 9-11].

Passport harus memuat:

1. Identitas inovasi, nomor pengajuan, versi, penerbit, dan waktu terbit.
2. Jumlah penguji valid, completion rate, skor kepuasan beserta dasar hitung.
3. Hasil per indikator dan ambang yang ditentukan sebelum uji.
4. Kutipan dan akses feedback warga, termasuk kritik, dengan privasi yang sesuai.
5. Perbandingan sebelum-sesudah, waktu, dan foto yang telah disanitasi.
6. Status verifikasi fasilitator dan rujukan versi hasil.
7. Riwayat rekomendasi RT/RW/kelurahan dan keputusan panel yang relevan.
8. Laporan penggunaan dana dan bukti distribusi yang tersedia pada versi tersebut.
9. Status bukti: terverifikasi, gagal memenuhi ambang, belum cukup data, dikoreksi/diganti, atau dicabut sesuai kebijakan.

**Usulan teknis yang perlu dipertahankan sebagai kebutuhan integritas:**

- Terbitkan versi/snapshot yang dapat diaudit; perubahan berarti versi baru, bukan menimpa diam-diam.
- QR menggunakan pola handbook `/passport/{id}?h={hash}`. Pemilihan `id` per versi atau identitas passport ditetapkan di desain teknis.
- Hash saja bukan bukti bahwa penerbitnya tepercaya. Verifier harus membandingkan dengan rekaman versi resmi pada server; mekanisme autentikasi penerbit seperti HMAC/tanda tangan dapat dipilih saat desain keamanan. Jangan hanya menghitung hash dari parameter yang dikirim pengunjung.
- Token/hash tidak memberi hak akses ke dokumen privat.
- Hasil pemeriksaan membedakan: cocok dengan versi terbit; hash tidak cocok; tidak ditemukan; versi telah diganti; passport dicabut; status publik disanitasi ulang karena privasi.
- Snapshot harus dirancang minim data pribadi. Penghapusan/penarikan consent harus dapat memperbarui representasi publik dan menutup akses ke versi lama yang mengandung identitas; immutable tidak berarti mempertahankan foto asli di URL publik selamanya. D-13.
- Penerbitan passport mendokumentasikan hasil, **bukan pernyataan otomatis semua ambang lolos**.
- Ringkasan pendanaan/distribusi dapat berkembang sesudah passport pertama. Tampilkan “belum tersedia pada versi ini”, kemudian terbitkan versi berikutnya saat syarat perubahan dipenuhi.

### FR-13. LPJ, distribusi gratis, dan perawatan - P0

**Sumber:** [H, hlm. 7-10, 12].

- LPJ mencatat realisasi vs RAB per item/tahap, nota/foto, hasil uji, alasan selisih, dan kelengkapan.
- LPJ dapat ditinjau, diminta perbaikan, dan dinyatakan lengkap oleh pihak berwenang.
- Pisahkan LPJ yang cukup untuk tahap 2 dari kelengkapan distribusi/final tahap 3 agar tidak terjadi syarat melingkar. Ini usulan penyelesaian D-05.
- Bukti serah terima/distribusi mencatat jumlah penerima, tanggal, barang/layanan, dokumentasi, dan konfirmasi penerimaan sesuai kebijakan.
- Panduan perawatan, kontak suku cadang, dan dokumentasi pelatihan pengelola lokal wajib tersedia.
- Penerima program tidak membayar perolehan, pemasangan, dan pemakaian selama masa perawatan 6-12 bulan.
- Kekayaan intelektual tetap pada inovator; komersialisasi kepada pihak lain diperbolehkan, tetapi penerima program tidak boleh ditagih untuk produk yang sama.
- Batas waktu masa perawatan dan cakupan biaya setelah periode tersebut belum ditentukan, D-15; jangan membuat paywall otomatis.

### FR-14. Etalase, pencarian, dan publikasi - P0

**Sumber:** [H, hlm. 3, 7, 9-11].

- Etalase dapat dibaca tanpa akun; pencarian nama/ringkasan; filter tema, kampung, status bukti.
- Tampilan menekankan hasil dan bukti, bukan peringkat popularitas yang tidak ada di handbook.
- Halaman menampilkan masalah, solusi, penerima manfaat agregat, dampak, passport, dan ringkasan penggunaan dana tersanitasi.
- Tidak mempublikasikan draft, rekening, NIK, HP penguji, alamat rinci, SK, tanda tangan mentah, atau nota yang memuat informasi sensitif.
- Waktu publikasi masih ambigu: aktor publik aktif setelah tahap 7, sementara etalase disebut tahap 10. D-16 menentukan apakah passport dapat publik lebih awal dan etalase setelah distribusi.
- Kegagalan uji tidak boleh diklaim sukses. Bentuk publikasi pelajaran dari inovasi gagal diputuskan dalam D-16.

### FR-15. Minat Pilot dan kontak CS - P0

**Sumber:** [H, hlm. 7, 11].

- OPD/industri dapat menandai minat terhadap inovasi melalui halaman publik.
- Usulan formulir: nama, organisasi, kontak, jenis minat, pesan, consent kontak. Metode verifikasi organisasi dan autentikasi masih D-21.
- Status minimal: diterima, ditinjau, ditindaklanjuti, ditutup; pengelola menerima notifikasi.
- Mencegah spam/duplikasi dasar; tidak menampilkan email/HP peminat di publik.
- Minat pilot tidak otomatis memberikan dana, akses proposal privat, atau persetujuan pemilik inovasi.
- Tombol Tanya CS mengarah ke kontak yang disetujui pemilik produk. Jangan mengarang nomor WhatsApp/email resmi.

### FR-16. Banding tiga langkah - P0/P1

**Sumber:** [H, hlm. 11, 15].

- Inovator mengajukan keberatan tertulis dan lampiran dalam lima hari kerja setelah keputusan terbit.
- Banding terhubung ke keputusan spesifik, bukan hanya pengajuan secara umum.
- Reviewer cadangan yang tidak terlibat keputusan awal ditugaskan meninjau ulang.
- Pengelola program menetapkan putusan final dengan alasan dan waktu; hasil tampil pada status pengajuan serta passport jika relevan.
- Apabila putusan berubah, simpan keputusan lama dan keputusan pengganti serta titik alur yang dibuka kembali.
- Kalender hari kerja, keputusan apa yang dapat dibantah, jumlah banding, dan efek banding terhadap tenggat/funding masih D-12.
- Kegagalan menyediakan reviewer independen menghasilkan status belum ditugaskan; jangan memakai reviewer awal sebagai cadangan otomatis.

### FR-17. Notifikasi, pengingat, dan waktu tunggu - P0/P1

**Sumber:** [H, hlm. 3, 5, 9].

| Peristiwa | Penerima | Kanal |
|---|---|---|
| Antrean baru | Pemegang jabatan dan delegasi sah jika ada | Dalam aplikasi; email sesuai konfigurasi |
| 24 jam belum ada keputusan | Akun utama dan cadangan tingkat tersebut | Email satu kali; tercatat dalam audit |
| Setuju/Revisi/Tolak | Inovator; kepala tingkat bila keputusan oleh delegasi | Dalam aplikasi; email sesuai konfigurasi |
| Penguji baru | Fasilitator yang ditugaskan | Dalam aplikasi; pengingat operasional bila disetujui |
| Hasil verifikasi peserta | Penguji | Dalam aplikasi |
| Checkpoint/tenggat | Inovator dan peninjau relevan | Jadwal yang ditetapkan program [U] |
| Keputusan dana/banding | Inovator dan pihak berwenang terkait | Dalam aplikasi; email sesuai konfigurasi |

- Pekerjaan pengingat berjalan dari server/scheduler, tidak bergantung pada pengguna membuka dashboard.
- Gunakan satu identitas per pengingat antrean agar retry job tidak mengirim email ganda.
- Catat dijadwalkan, dicoba, berhasil, gagal; jangan menyebut “terkirim” bila baru masuk antrean.
- Batas 24 jam adalah waktu berlalu, bukan jam kerja, sesuai teks handbook. Aturan waktu ulang saat kirim ulang revisi masih D-07.
- Timeline inovator menunjukkan masuk antrean, lama menunggu, revisi, dan status pengingat. Angka 24 jam tidak disajikan sebagai batas auto-approval.
- Diputuskan pengguna (31 Okt 2026): tidak ada eskalasi atau kenaikan tingkat otomatis. Setelah 7 hari tanpa keputusan RT/RW hanya terbuka jalur dokumen fisik (FR-04) yang dijalankan inovator. Hitungan 7 hari per tingkat, dimulai ulang setiap pengajuan masuk antrean tingkat itu (waktu revisi tidak dihitung). D-22 tersisa untuk provider email/scheduler.

### FR-18. Audit aktivitas dan validitas data - P0/P1

**Sumber:** [H, hlm. 3-4, 9-10, 13].

- Audit keputusan, perubahan status, penugasan/delegasi, perubahan kebijakan, realisasi dana, consent, penarikan, publikasi, pemeriksaan anomali, sanksi, banding, dan pengingat.
- Rekam aktor individual, jabatan/mandat saat tindakan, wilayah, objek/versi, aksi, waktu server, alasan, dan ringkasan perubahan yang aman.
- Pengguna biasa tidak dapat mengubah atau menghapus audit. Admin tidak diberi tombol menghapus keputusan untuk menyembunyikan riwayat.
- Hindari menyimpan salinan data pribadi lengkap, secret, token, atau file sensitif di log. Integritas log bukan alasan menyimpan PII tanpa batas.
- Deteksi berbasis aturan memberi flag untuk rating seragam, waktu isi berdekatan, nomor/perangkat sama bila pengumpulan sah, dan kemiripan teks.
- Flag bukan bukti penipuan. Kasus rumah tangga berbagi HP atau peserta mengisi bersama harus dapat ditinjau manusia.
- Audit acak mengonfirmasi ulang sampel 10-20%; pilih nilai, pembulatan, pencatatan sampling, dan kontak terbatas sesuai D-14.
- Dukung rotasi fasilitator dan riwayat penugasan agar verifikasi tidak bergantung pada satu petugas terus-menerus. Jadwal, pengganti, dan independensi auditor ditetapkan pengelola; rotasi tidak menghapus atribusi verifikasi sebelumnya.
- Jika manipulasi dikonfirmasi, data dapat dianulir dan fasilitator diganti melalui keputusan tercatat; publikasi dan metrik diperbarui menurut versi.

### FR-19. Pengaturan, master data, akun jabatan - P0/P1

**Sumber:** [H, hlm. 3-4, 13, 15].

- Admin mengelola program/periode, tingkat aktif, plafon, durasi, ambang, template dokumen, rubrik, parameter consent, notifikasi, dan master wilayah/tema.
- Admin mengelola satu penugasan utama dan satu cadangan per jabatan/tingkat yang relevan, beserta delegasi dan serah terima.
- Perubahan peran, wilayah, dan SK membutuhkan audit dan waktu berlaku.
- Data wilayah resmi diimpor dari sumber yang disepakati, bukan dibuat AI seolah seluruh RT/RW Surabaya valid.
- Jika belum ada petugas aktif pada tingkat tujuan, usulan tetap tertahan dengan alasan dan tugas penetapan kepada admin; jangan melompati tahap.
- Sediakan indikator “program belum siap operasional” jika parameter kritis atau petugas wajib belum tersedia.

### FR-20. Dashboard dan laporan program - P0/P1

**Sumber:** [H, hlm. 11-13].

- Inovator: pengajuan, tahap, revisi, tenggat, dana disetujui/realisasi, uji, LPJ, banding.
- Petugas: antrean wilayah, usia antrean, konflik, pekerjaan yang perlu keputusan.
- Fasilitator: peserta menunggu, target 24 jam, progres tugas, bukti perlu tindak lanjut.
- Admin: usulan per wilayah/tema/status, hasil uji, realisasi dana, pengingat gagal, banding, audit.
- Bedakan jumlah pengajuan, jumlah inovasi, jumlah misi, peserta unik, dan partisipasi agar tidak terjadi penghitungan ganda.
- Laporan tidak menjumlahkan dana rencana dengan realisasi sebagai “dana cair”. Export hanya mencakup field yang diizinkan aktor.
- Statistik publik agregat dan memperhatikan risiko identifikasi kelompok kecil. Batas agregasi untuk data nyata D-13.

## 8. Model proses dan transisi status

Nama status berikut adalah **usulan desain domain**, bukan enum database yang sudah tersedia. Pisahkan beberapa status; satu kolom `status` tidak cukup untuk menjelaskan pengajuan, dana, hasil uji, dan publikasi sekaligus.

### 8.1 Pengajuan dan persetujuan

| Dari | Peristiwa/aktor | Syarat | Ke |
|---|---|---|---|
| DRAF | Inovator kirim | Lengkap dan valid, versi disimpan | MENUNGGU_RT |
| MENUNGGU_RT | RT setuju | Mandat wilayah valid, tanpa konflik | MENUNGGU_RW |
| MENUNGGU_RW | RW setuju | Pemeriksaan lengkap | MENUNGGU_KELURAHAN |
| MENUNGGU_KELURAHAN | Kelurahan putus Mikro | Syarat kelayakan Mikro terpenuhi, D-02 | DISETUJUI |
| MENUNGGU_KELURAHAN | Kelurahan teruskan Kecil | Rekomendasi valid, panel ditetapkan | MENUNGGU_PANEL |
| MENUNGGU_PANEL | Keputusan panel | Skor/suara sah menurut D-03 | DISETUJUI atau DITOLAK |
| Antrean RT/RW/Kelurahan | Minta revisi | Catatan wajib | PERLU_REVISI |
| PERLU_REVISI | Inovator kirim ulang | Versi baru; aturan D-07 | Kembali ke antrean yang tepat |
| Antrean berwenang | Tolak | Alasan wajib | DITOLAK |
| Antrean RT/RW | Deklarasi konflik | Tidak melakukan keputusan substansi | Tingkat atas, dengan rute pengecualian tercatat |
| DITOLAK/keputusan yang dapat dibantah | Inovator banding | Dalam tenggat dan jenis yang diperbolehkan | Subproses banding; keputusan asal tetap tersimpan |
| Keputusan selesai | Putusan banding mengubah hasil | Pengelola berwenang | Keputusan pengganti dan antrean tindak lanjut |

Menengah di masa depan menambah `MENUNGGU_OPD` setelah panel sebelum disetujui. Panel tidak otomatis memperoleh aksi revisi di luar aturan yang disepakati; D-03.

### 8.2 Pelaksanaan

`BELUM_MULAI` -> `MEMBANGUN` -> `CHECKPOINT_DITINJAU` -> `SIAP_UJI` -> `UJI_BERJALAN` -> `HASIL_DITINJAU` -> `HASIL_DIVERIFIKASI` -> `DISTRIBUSI` -> `PERAWATAN` -> `SELESAI`.

Ini urutan konseptual. Checkpoint, status hasil gagal, penghentian, dan perpanjangan dicatat terpisah. “Hasil diverifikasi” tidak berarti “lolos ambang”. Awal bangun dan syarat masuk uji masih D-08/D-09.

### 8.3 Setiap tahap dana

| Status | Arti |
|---|---|
| BELUM_LAYAK | Ada syarat yang belum terpenuhi |
| LAYAK_DITINJAU | Gerbang otomatis terpenuhi; belum ada keputusan berwenang |
| MENUNGGU_PERSETUJUAN | Dokumen masuk antrean peninjauan |
| DISETUJUI | Otoritas mengizinkan nominal tertentu; uang belum tentu ditransfer |
| BUKTI_DIAJUKAN | Bukti penerimaan/transfer diunggah; belum dikonfirmasi |
| REALISASI_TERKONFIRMASI | Petugas mengonfirmasi transfer yang terjadi di luar platform |
| DITAHAN/DITOLAK | Ada alasan administratif/substantif; tidak menghapus sejarah |

Status pengembalian/pengalihan merupakan catatan terpisah dengan nominal dan bukti. Satu bukti tidak boleh dicatat dua kali sebagai dua realisasi.

### 8.4 Peserta, tugas, dan hasil

| Domain | Status konseptual |
|---|---|
| Peserta | MENUNGGU_VERIFIKASI, TERVERIFIKASI, DITOLAK, MENGUNDURKAN_DIRI, DATA_DIANULIR |
| Consent | BELUM_SETUJU, AKTIF, DITARIK; status wali bila diperlukan |
| Bukti tugas | BELUM_DIKIRIM, TERKIRIM, PERLU_PERBAIKAN, DIVERIFIKASI, DITOLAK |
| Hasil uji | BELUM_CUKUP_DATA, AMBANG_TERCAPAI, AMBANG_BELUM_TERCAPAI, PERLU_TINJAU_ULANG |
| Verifikasi hasil | BELUM_DIVERIFIKASI, DIVERIFIKASI, DICABUT/DIKOREKSI |

### 8.5 Passport, publikasi, dan banding

| Domain | Status konseptual |
|---|---|
| Passport | DRAF, TERBIT, DIGANTI_VERSI_BARU, DICABUT |
| Publikasi | PRIVAT, SIAP_DITINJAU, PUBLIK, DITARIK_DARI_PUBLIK |
| Banding | DIAJUKAN, PEMERIKSAAN_TENGGAT, MENUNGGU_REVIEWER_CADANGAN, DITINJAU, MENUNGGU_PUTUSAN, DIPUTUS |

### 8.6 Invarian lintas proses

1. Tidak ada transisi keputusan tanpa aktor berwenang dan versi dokumen yang ditinjau.
2. Persetujuan berjenjang tidak muncul dari scheduler, klik ganda, manipulasi request, atau perubahan peran di browser.
3. Hanya satu keputusan final yang berlaku untuk satu langkah dan versi pada saat yang sama; perubahan lewat koreksi/banding menjaga riwayat.
4. Penolakan dan permintaan revisi selalu beralasan.
5. Ambang tidak berubah diam-diam setelah uji dimulai.
6. Dana terkonfirmasi tidak melebihi anggaran dan persetujuan yang berlaku.
7. Tidak ada dana lanjutan yang disetujui hanya karena passport ada; hasil dan semua gerbang tetap diperiksa.
8. Tanda tangan, penilaian, dan passport menunjuk versi yang jelas.
9. Privasi berlaku juga pada file unduhan, thumbnail, API, export, cache, dan versi lama.
10. Kegagalan uji, bukti kurang, manipulasi, dan pelanggaran anggaran adalah keadaan berbeda.

## 9. Aturan waktu dan perubahan

- Simpan waktu kejadian dari server; tampilkan ke pengguna dalam zona Asia/Jakarta. [U]
- Pengingat antrean: jatuh setelah 24 jam aktif tanpa keputusan. Waktu inovator merevisi dipisahkan.
- Jangan menyebut “sisa 24 jam untuk keputusan” sebagai SLA resmi, sebab handbook hanya menetapkan pengingat.
- Simpan masuk antrean, mulai revisi, kirim ulang, keputusan, dan pengingat per siklus.
- Usulan awal bangun adalah realisasi tahap 1 terkonfirmasi; ini belum ditetapkan handbook dan perlu D-08.
- Tanggal checkpoint diturunkan dari durasi yang disetujui; pembulatan dan penjadwalan ulang saat perpanjangan perlu diputuskan.
- Banding lima hari kerja memerlukan kalender yang eksplisit. Jangan hanya menambahkan lima hari kalender.
- Perubahan penugasan atau kebijakan tidak boleh menghapus lama antrean sebelumnya.
- Misi tertutup, mandat berakhir, keputusan baru, atau consent ditarik harus menggagalkan request lama yang datang terlambat bila sudah tidak sah.

## 10. Data konseptual dan klasifikasi

Bagian ini merupakan **rancangan entitas**, bukan konfirmasi skema Supabase yang telah ada. AI harus menyusun ERD, constraints, dan migrasi setelah memeriksa kondisi proyek. Nama implementasi boleh berbeda jika pemetaan dijelaskan.

| Entitas konseptual | Data inti | Hubungan/kebutuhan |
|---|---|---|
| Pengguna/profil | ID, identitas, kontak terbatas | Terhubung identitas auth; data publik terpisah |
| Wilayah | Kelurahan, RW, RT | Hierarki dan kode unik dalam induknya |
| Jabatan | Jenis, wilayah, status | Bertahan walaupun pemegang berganti |
| Mandat jabatan | Petugas, jabatan, jenis, periode, SK | Utama/cadangan/delegasi; tidak tumpang tindih tanpa aturan |
| Program/periode | Nama, status, wilayah cakupan | Mengikat pengajuan dan konfigurasi |
| Versi kebijakan | Plafon, durasi, porsi, rubrik, aturan | Snapshot pengajuan; riwayat perubahan |
| Tema/master opsi | Nama dan status | Jangan mengarang empat tema resmi |
| Pengajuan/inovasi | Nomor, pemilik, wilayah, tingkat, posisi | Satu identitas stabil; dokumen berversi |
| Versi pengajuan | Data inovasi, PRD, rencana uji, risiko | Dokumen yang benar-benar dinilai |
| Tim inovasi | Nama anggota, peran, relasi akun bila ada | Kewenangan kolaborasi belum ditentukan |
| Item RAB | Versi, kategori, jumlah, harga, tahap | Total dihitung, batas kategori divalidasi |
| Dokumen/lampiran | Jenis, pemilik objek, file, hash, visibilitas | Referensi privat; versi dan lifecycle |
| Langkah review/rekomendasi | Tingkat, aktor, mandat, checklist, keputusan | Versi pengajuan, alasan, timestamp |
| Konflik kepentingan | Aktor, relasi, objek, penanganan | Mencegah keputusan oleh pihak konflik |
| Penugasan panel | Kursi, reviewer, deklarasi, status | Minimal tiga kursi sah sesuai konfigurasi |
| Nilai dan suara panel | Skor aspek, total, suara, catatan | Unik per reviewer/versi/putaran |
| Rencana/persetujuan dana | Tahap, nominal, syarat, otoritas | Terpisah dari transfer nyata |
| Realisasi/pengembalian dana | Nominal, tanggal, bukti, pengonfirmasi | Tidak ada fungsi transfer uang |
| Checkpoint/perpanjangan | Progres, bukti, keputusan, tanggal | Batas satu perpanjangan dan tambahan durasi |
| Penugasan fasilitator | Pengajuan/misi, petugas, masa, penunjuk | Ruang lingkup akses terbatas |
| Misi dan tugas | Jadwal, kuota, indikator, instruksi | Terhubung rencana uji yang disetujui |
| Partisipasi penguji | Peserta, misi, verifikasi, relasi | Maksimal satu partisipasi aktif per orang/misi [U] |
| Consent/permintaan privasi | Versi teks, pilihan, waktu, wali | Penarikan dan penghapusan dapat ditelusuri |
| Bukti tugas | Partisipasi, tugas, file/log, status | Versi bukti, waktu server, pemeriksa |
| Rating/feedback | Partisipasi, rating, teks | Tidak dapat dihapus inovator; sanitasi publik |
| Evaluasi/verifikasi hasil | Metrik, denominator, ambang, versi, penanda tangan | Reproduksibel dari data valid |
| Passport/versi | Snapshot, hash/token, terbit, status, penerbit | Referensi hasil, pendanaan, distribusi |
| LPJ/distribusi/perawatan | Realisasi per item, bukti, penerima agregat | Pisahkan prasyarat tahap 2 dan final |
| Minat pilot | Inovasi, organisasi, kontak, pesan, status | Privat bagi pengelola yang diberi mandat |
| Banding | Keputusan asal, alasan, lampiran, peninjau, putusan | Reviewer cadangan independen |
| Notifikasi/pengiriman | Penerima, peristiwa, kanal, status, retry | Deduplikasi pengingat dan pencatatan gagal |
| Audit/temuan | Aktor, mandat, objek, aksi, alasan, waktu | Akses terbatas; tidak menyimpan secret |

### 10.1 Pemetaan publik dan privat

| Kelompok data | Publik | Akses internal terbatas |
|---|---|---|
| Identitas inovasi | Judul, tema, ringkasan, kampung yang aman | Proposal lengkap sebelum publikasi |
| Penguji | Nama sesuai pilihan, atau inisial/anonim | Nama asli, HP, wilayah untuk fasilitator/petugas berwenang |
| Foto | Derivatif yang disetujui, blur bila dipilih | File asli pada akses privat sesuai kebutuhan |
| Dana | Tahap, nominal disetujui/terkonfirmasi, penggunaan tersanitasi | Rekening, bukti transfer/nota mentah, rincian sensitif |
| Mandat | Peran/jabatan penerbit yang perlu ditampilkan | SK dan dokumen identitas petugas |
| Feedback | Isi yang telah disanitasi; kritik tetap ada | Konten asal bila retensi diizinkan dan dibutuhkan moderasi |
| Consent/wali | Tidak dipublikasikan | Rekaman persetujuan dan bukti wali yang dibatasi |
| Minat pilot | Tidak menampilkan kontak peminat | Kontak organisasi/peminat dan tindak lanjut |
| Audit | Riwayat rekomendasi/keputusan relevan yang aman | Log teknis dan akses sensitif untuk auditor |

Jangan mengumpulkan NIK, lokasi GPS rinci, fingerprint perangkat, atau foto KTP secara default. Jika diperlukan di masa depan, pemilik program harus menetapkan tujuan, dasar pemrosesan, kontrol, dan retensinya terlebih dahulu. [U]

## 11. Perhitungan dan gerbang yang harus eksplisit

### 11.1 Anggaran

- `subtotal item = volume × harga satuan`.
- `total RAB = jumlah seluruh subtotal`, termasuk kategori cadangan/honor/perawatan yang memang masuk anggaran; jangan dijumlahkan dua kali.
- Gunakan representasi nominal yang tidak menghasilkan kesalahan pecahan biner. Untuk rupiah utuh, bilangan bulat adalah usulan yang sesuai. [U]
- `total RAB <= plafon tingkat`.
- Usulan basis batas: `tak terduga <= 10% × total RAB` dan `honor inovator <= 15% × total RAB`; pengelola harus menyetujui basis D-04.
- `jumlah realisasi bruto per tahap <= nominal persetujuan tahap`; koreksi/refund dibukukan terpisah agar saldo neto tidak menutupi transfer bruto berlebih.

**Contoh dari handbook:** Mikro dengan RAB Rp5 juta, tahap 1 30% = Rp1,5 juta. Jika skema 30/50/20 disetujui, tahap 2 Rp2,5 juta dan tahap 3 Rp1 juta. Ini ilustrasi, bukan transaksi aktual. [hlm. 13-14]

**Edge case penting:** jika RAB Mikro Rp2 juta, 30% dari plafon Rp5 juta adalah Rp1,5 juta, tetapi 30% dari RAB hanya Rp600 ribu. Handbook menyebut plafon pada tahap awal, sehingga basis harus diputuskan. Usulan aman: porsi mengacu anggaran **disetujui**, tidak pernah membuat total transfer melebihi anggaran. D-04.

Jika tahap 1 hanya 20%, porsi 50% + 20% menghasilkan total 90%. Sistem tidak boleh diam-diam memberikan sisa 10% pada tahap tertentu. Rencana tahap disahkan eksplisit atau sisa tidak dicairkan sesuai keputusan D-04.

### 11.2 Skor panel

Per reviewer: jumlah skor aspek harus 0-100 dan tiap aspek tidak melebihi bobotnya. Ambang 70 dan suara minimal 2/3 keduanya dicatat. Formula agregasi, kelengkapan seluruh reviewer, serta hubungan skor dengan suara harus mengikuti keputusan D-03, bukan asumsi AI.

### 11.3 Metrik uji

| Metrik | Definisi usulan |
|---|---|
| Penguji terdaftar | Semua partisipasi yang mendaftar, tampilkan terpisah dari valid |
| Penguji valid | Peserta yang lolos verifikasi dan memenuhi kebijakan consent/relasi/audit |
| Completion rate | Penguji valid yang seluruh tugas wajibnya selesai sah / penguji valid dalam cohort yang ditetapkan × 100% |
| Kepuasan | Rata-rata rating final valid, ditampilkan bersama jumlah responden dan skala 1-5 |
| Capaian indikator | Nilai aktual dibanding operator dan ambang yang telah disetujui |
| Sebelum-sesudah | Pasangan pengukuran dengan unit, metode, waktu, dan sampel yang sebanding |

- Denominator nol menghasilkan “belum ada data”, bukan 0% atau 100% yang menyesatkan.
- Nilai kepuasan tidak diisi 5 saat belum ada rating.
- Penguji keluar, data dianulir, tugas tidak wajib, bukti ditolak, dan hasil yang consent-nya ditarik memerlukan perlakuan eksplisit, D-10/D-13.
- Tampilkan jumlah peserta keluar/dianulir terpisah sejauh tidak membocorkan identitas.
- Jangan menciptakan ambang universal “rating minimal 4” atau “minimal 30 penguji”. Angka sekitar 30 penguji dan 3-5 hari dalam cerita Bu Rina adalah contoh, bukan aturan umum.
- Untuk beberapa indikator wajib, usulan gerbang adalah seluruh indikator wajib tercapai dan data minimum terpenuhi; pemilik program mengesahkan metode dalam D-10.

### 11.4 Gerbang dana lanjutan

`layak ditinjau tahap 2 = hasil terverifikasi AND ambang wajib terpenuhi AND LPJ tahap terkait lengkap AND tidak ada penahanan yang sah`.

`persetujuan tahap 2 = layak ditinjau AND keputusan otoritas yang berlaku`.

`realisasi tahap 2 = transfer eksternal terjadi AND bukti/nominal dikonfirmasi petugas`.

Gerbang di atas adalah penjabaran produk [U] atas tiga syarat handbook. Perhitungan kelayakan tidak mengambil alih keputusan pejabat.

## 12. Arah teknis dan keamanan

Ini batas desain teknis yang diusulkan, bukan kode, daftar API yang sudah tersedia, atau janji kemampuan akun gratis tertentu.

### 12.1 Komponen

| Komponen | Tanggung jawab |
|---|---|
| Next.js | Halaman publik dan dashboard, validasi server, orkestrasi aksi aplikasi |
| Tailwind CSS | Sistem tampilan responsif dan komponen konsisten |
| Supabase Auth | Identitas login dan sesi; akses jabatan tetap model domain aplikasi |
| Supabase Postgres | Data, relasi, constraints, riwayat, dan kebijakan akses baris |
| Supabase Storage | Lampiran privat dan aset publik tersanitasi yang dipisahkan |
| GitHub | Source code, review perubahan, dokumentasi, dan lockfile |
| Vercel | Deployment aplikasi sesuai konfigurasi dan batas akun yang diverifikasi saat setup |
| Scheduler + email | Pengingat server, antrean pengiriman, retry; provider belum dipilih, D-22 |

Tidak perlu membuat microservices atau backend terpisah sebelum ada kebutuhan yang terbukti. Struktur folder, library form, validasi, QR, PDF, dan testing dipilih setelah memeriksa project; jangan menebak dependency sudah terpasang. [U]

### 12.2 Kontrol akses

- Otorisasi pada setiap aksi server berdasarkan pemilik/wilayah/penugasan/tahap/mandat; penolakan sebagai perilaku default.
- Tabel pada schema yang diekspos menggunakan RLS dan grant yang benar. Policy bukan sekadar “pengguna sudah login”. [T1]
- Dokumen dan media privat menggunakan kontrol Storage; URL publik tidak dipakai untuk SK, rekening, atau bukti mentah. [T2]
- Publishable key boleh untuk komponen publik; secret key dan legacy service-role key tidak masuk browser, repository, atau variabel publik. Akses berprivilege memerlukan otorisasi server eksplisit. [T3]
- Keputusan jabatan tidak boleh mempercayai pilihan role di form atau metadata profil yang dapat diubah pengguna.
- API, download, export, preview, dan akses file diperiksa dengan aturan yang sama. Menyembunyikan tombol saja tidak cukup. [T4]
- Saat mandat dicabut, endpoint sensitif memeriksa penugasan terkini; cache/session claim lama tidak boleh mempertahankan hak keputusan.

Ringkasan T1-T4 berasal dari dokumentasi primer pada bagian 19. Penerapan wilayah, mandat, dan tahapan adalah usulan desain khusus KampungLab.

### 12.3 Integritas dan konkurensi

- Keputusan dan perpindahan antrean harus berada dalam transaksi yang konsisten.
- Dua petugas yang memproses langkah yang sama tidak boleh sama-sama menciptakan keputusan aktif atau pencairan ganda. Gunakan constraints/locking/version check sesuai desain yang diuji.
- Gunakan deduplikasi untuk kirim pengajuan, keputusan, feedback final, pengingat, serta pencatatan bukti transfer.
- Jangan percaya nominal, skor, total, status, atau waktu dari browser tanpa validasi server.
- Aksi menggunakan versi lama harus ditolak dengan pesan bahwa data berubah dan perlu dimuat ulang.
- Perubahan langsung terhadap data terverifikasi dibatasi; koreksi menciptakan riwayat dan dampaknya dihitung ulang.

### 12.4 Unggahan dan privasi media

- Usulan awal file dokumen PDF dan gambar JPG/PNG/WebP; daftar tipe, ukuran maksimum, dan kebutuhan video diputuskan D-23.
- Validasi jenis/ukuran di server; nama file tidak dipercaya sebagai bukti MIME.
- Tolak konten executable dan akses lintas pemilik; sediakan lifecycle file yang gagal/ditinggalkan.
- Pilihan foto blur menghasilkan file turunan untuk publik. Jangan mengirim file asli ke browser lalu hanya memberi efek blur CSS.
- Hilangkan metadata sensitif dari versi publik bila relevan; nota/bukti transfer disensor sebelum dipublikasikan.
- Penarikan publikasi harus mempertimbangkan cache dan link versi terdahulu; jangan hanya menghilangkan kartu di etalase.

### 12.5 Lingkungan, akun, dan operasi

- Pisahkan data demo/development dari data operasional; deployment preview tidak boleh tanpa sengaja memakai database produksi.
- Jangan hardcode ID proyek, URL, atau secret. Periksa akun, project, repository, dan deployment target yang dipilih pengguna saat setup.
- Satu pemilik resource untuk prototipe tidak berarti password harus dibagi. Aturan kolaborasi/plan layanan diverifikasi saat setup; PRD tidak mengasumsikan dua akun otomatis bisa deploy.
- Secret ditempatkan di konfigurasi environment yang sesuai; dokumentasikan nama variabel tanpa nilainya.
- Perubahan schema harus bisa dilacak dalam migrasi; lakukan pemeriksaan terhadap schema yang ada sebelum mengubahnya.
- Siapkan backup dan prosedur pemulihan yang benar-benar diuji sebelum data nyata; retensi dan sasaran pemulihan ditentukan pengelola.
- Jangan mengklaim tanda tangan tersertifikasi, integrasi bank, audit independen, atau keamanan produksi bila baru ada simulasi.

## 13. Kebutuhan nonfungsional dan UI/UX

### 13.1 UX

- Bahasa Indonesia sederhana; istilah RT/RW/kelurahan, PRD, RAB, LPJ, dan passport diberi penjelasan singkat.
- Prioritaskan penggunaan mobile karena warga masuk dari QR; desktop tetap nyaman untuk review dan RAB.
- Wizard panjang dapat disimpan dan dilanjutkan. Label, contoh pengisian, validasi dekat field, dan ringkasan kesalahan tersedia.
- Aksi berikutnya jelas: “Perbaiki pengajuan”, “Menunggu keputusan RW”, “Unggah bukti penerimaan”, bukan kode status teknis.
- Tampilkan tanggal/jam serta konteks status; jangan mengandalkan warna saja.
- Aksi keputusan menampilkan ringkasan objek, versi, konsekuensi, dan alasan yang diperlukan sebelum dikirim.
- Tabel anggaran mobile tetap dapat dibaca; jangan memaksa semua kolom ke lebar sempit tanpa alternatif.
- Rating negatif dan status gagal ditampilkan netral, tidak disembunyikan untuk membuat program tampak sukses.
- Brand, logo, palet, font, dan nada visual belum disediakan; AI tidak boleh menyebut palet buatannya sebagai identitas resmi. D-24.

### 13.2 Aksesibilitas dan kualitas

Usulan target desain: WCAG 2.2 AA untuk alur inti, dukungan keyboard, focus terlihat, label dan error terasosiasi, kontras terbaca, serta alternatif tautan teks untuk QR. Ini target produk [U], bukan klaim hasil audit aksesibilitas.

Semua halaman memiliki kondisi loading, kosong, gagal, akses ditolak, data kedaluwarsa, dan sukses yang relevan. Refresh tidak menghapus data yang telah disimpan.

### 13.3 Kinerja dan keandalan

- Pagination untuk antrean dan etalase; filter tidak mengambil seluruh data pribadi ke client.
- Optimasi gambar publik dan unggahan jaringan lambat; kegagalan upload memberi jalan coba ulang tanpa kehilangan isian.
- Scheduler dan email berjalan independen dari sesi browser.
- Kegagalan email tidak mengulang keputusan atau membatalkan pengajuan yang sudah tersimpan; status pengirimannya dapat dicoba ulang.
- Profil beban, waktu respons, jumlah pengguna bersamaan, SLA, dan budget layanan belum tersedia. Tetapkan target setelah uji data pilot, bukan menjanjikan angka tanpa pengukuran.
- Log error tidak mengungkap secret/PII. Pesan pengguna cukup jelas dan ada reference kejadian bagi pengelola.

## 14. Tahapan implementasi dan keluaran AI

Tidak ada estimasi hari yang dipaksakan sebelum repository, tim, dan keputusan penghambat diperiksa.

| Tahap | Pekerjaan | Bukti selesai |
|---|---|---|
| 0. Pemeriksaan konteks | Baca PRD/handbook, cek repo/schema/akun target, petakan gap D-xx | Ringkasan pemahaman, keputusan penghambat, inventaris kondisi aktual |
| 1. Desain sistem | ERD, matriks akses, state machine, konfigurasi, struktur halaman | Desain tertulis yang konsisten; tidak ada tabel/API yang diklaim sudah ada tanpa bukti |
| 2. Fondasi | Auth, profil wilayah, mandat dasar, RLS/Storage, audit, master demo | Uji akses positif dan negatif; data demo berlabel |
| 3. Pengajuan dan review | Wizard, RAB, versi, RT/RW/kelurahan, konflik, panel Kecil | Skenario Mikro/Kecil dan revisi bekerja end-to-end secara non-browser |
| 4. Dana awal dan pembangunan | Persetujuan/realisasi, bukti, checkpoint, tenggat | Status disetujui berbeda dari cair; batas dana teruji |
| 5. Uji warga | Misi, QR, consent, peserta, bukti, rating/feedback, fasilitator | Akses dan metrik teruji; feedback negatif terlindungi |
| 6. Pembuktian dan lanjutan | Passport/QR, LPJ, tahap 2/3, distribusi, etalase, minat pilot | Versi dan QR teruji; dana lanjutan mematuhi gerbang |
| 7. Operasi | Banding, email, delegasi lengkap, privasi, audit acak, laporan | Kebijakan disepakati dan mekanisme operasional benar-benar bekerja |
| 8. Kesiapan rilis | Build, pengujian, review keamanan, UAT pengguna, konfigurasi deploy | Laporan verifikasi jujur dan checklist UAT; target deployment teridentifikasi |

**Urutan rilis:** desain boleh mencakup keseluruhan, tetapi implementasi dilakukan bertahap. Jangan membuat semua dashboard sebagai mockup lalu menyatakan sistem selesai.

**Keluaran setiap tahap:** perubahan yang dibuat dan alasannya; file/migrasi yang berubah; pengujian yang benar-benar dijalankan dan hasil; batasan; keputusan tertunda; langkah berikutnya. Jangan melaporkan browser/UAT/deployment yang tidak dijalankan sebagai lulus.

**Usulan pembagian kerja berdua:** satu pemilik keputusan produk dan konfigurasi resource; pekerjaan kode dibagi berdasarkan modul melalui branch/review. Akses project dan aturan deployment dipastikan saat setup, tanpa menganggap semua layanan harus memiliki email yang sama.

## 15. Kriteria penerimaan dan verifikasi

Kriteria berikut menjadi dasar unit/integration/database/API tests serta UAT manusia. Untuk tahap awal, gunakan data sintetis. Hasil UAT visual/interaksi dilaporkan terpisah dari pemeriksaan otomatis non-browser.

| ID | Skenario | Hasil yang wajib |
|---|---|---|
| AC-01 | Pengunjung membuka etalase | Tidak perlu login; tidak menerima field privat melalui HTML/API |
| AC-02 | Warga memilih role RT saat daftar | Belum memperoleh akses RT sebelum mandat admin valid |
| AC-03 | RT wilayah A mengakses pengajuan wilayah B melalui request langsung | Ditolak pada server/database |
| AC-04 | Mandat delegasi kedaluwarsa/cabut, sesi lama masih ada | Aksi keputusan baru ditolak; riwayat lama tetap terbaca sesuai hak |
| AC-05 | RAB tepat plafon dan kategori valid | Boleh dikirim setelah seluruh syarat lain lengkap |
| AC-06 | RAB melampaui plafon Rp1 | Pengiriman ditolak; data input tetap dapat diperbaiki |
| AC-07 | Honor atau dana tak terduga melebihi batas yang disetujui | Validasi server menolak dengan pesan kategori dan nilai |
| AC-08 | Dokumen wajib atau indikator terukur kosong | Tidak bisa kirim; field bermasalah ditunjukkan |
| AC-09 | Klik kirim dua kali/retry jaringan | Satu pengajuan, satu nomor, satu versi aktif |
| AC-10 | Alur Mikro normal | RT -> RW -> kelurahan; tidak diwajibkan panel; evaluasi Mikro sesuai D-02 |
| AC-11 | Alur Kecil normal | Melewati RT/RW/kelurahan dan panel; tidak dapat disetujui kelurahan sendirian |
| AC-12 | RT menolak tanpa alasan | Ditolak server; belum tercatat sebagai keputusan final |
| AC-13 | RW meminta revisi dan inovator memperbaiki | Catatan terlihat, versi lama tetap ada, waktu revisi tidak menambah waktu aktif reviewer |
| AC-14 | RT/RW menyatakan konflik keluarga | Tidak dapat memberi keputusan substansi; pengecualian ke atas tercatat |
| AC-15 | Dua petugas memutus langkah sama bersamaan | Hanya satu hasil aktif sah; pihak lain menerima konflik versi/status |
| AC-16 | Antrean lewat 24 jam tanpa keputusan | Satu pengingat ke utama/cadangan; usulan tidak naik otomatis |
| AC-17 | Job pengingat dijalankan ulang | Tidak mengirim email ganda untuk pengingat antrean yang sama |
| AC-17A | Pengajuan di antrean RT/RW kurang dari 7 hari | Tombol dokumen fisik tidak muncul; permintaan langsung ke server ditolak |
| AC-17B | Pengajuan di antrean RT/RW 7 hari atau lebih | Tombol dan unggah tersedia; status tidak naik otomatis |
| AC-17C | Kelurahan menolak dokumen fisik | Alasan terlihat inovator; antrean tetap; unggah ulang diperbolehkan |
| AC-18 | Reviewer konflik kepentingan | Tidak dapat memberi nilai/suara; pengganti diperlukan |
| AC-19 | Skor panel 69 vs 70; suara 1/3 vs 2/3 | Hasil sesuai aturan D-03 yang eksplisit; skor tidak menggantikan jumlah suara |
| AC-20 | Dokumen belum memenuhi kelayakan Mikro | Tidak lolos hanya karena Mikro tanpa panel |
| AC-21 | Tahap 1 disetujui tetapi belum ada bukti terkonfirmasi | Dashboard menampilkan disetujui, bukan sudah cair |
| AC-22 | Inovator mengunggah bukti transfer | Status menunggu konfirmasi; tidak otomatis menambah dana cair |
| AC-23 | Realisasi melampaui nominal disetujui/kumulatif | Ditolak atau masuk koreksi berwenang; tidak tercatat sebagai transfer sah biasa |
| AC-24 | Tahap 1 kurang dari 30% | Total rencana eksplisit; sisa tidak dialokasikan diam-diam |
| AC-25 | Checkpoint tidak menunjukkan kemajuan | Proses dana lanjutan tertahan dengan alasan; tidak menjadi blacklist otomatis |
| AC-26 | Perpanjangan kedua atau lebih dari 50% | Ditolak sesuai kebijakan; tidak menambah anggaran |
| AC-27 | Misi dibuat sesudah persetujuan | Ambang mengacu versi yang disetujui; tidak dapat diturunkan tanpa proses perubahan |
| AC-28 | QR misi dipindai | Membuka misi yang benar; tidak mengandung data peserta/akses privat |
| AC-29 | Consent tidak lengkap | Tidak dapat mengirim pendaftaran peserta |
| AC-30 | Penguji berusia di bawah 17 tanpa persetujuan wali sah | Tidak diaktifkan sebagai penguji nyata |
| AC-31 | Peserta memilih anonim dan foto blur | Publik tidak menerima nama asli atau file foto asli lewat UI, API, maupun URL |
| AC-32 | Fasilitator belum memverifikasi peserta setelah 24 jam | Peserta tetap menunggu; tidak terverifikasi otomatis |
| AC-33 | Peserta mencoba membaca bukti privat peserta lain | Ditolak |
| AC-34 | Tugas wajib belum selesai | Rating/feedback akhir belum dibuka sesuai definisi D-10 |
| AC-35 | Inovator mencoba menghapus feedback negatif | Ditolak; feedback tetap ada sesuai pilihan privasi |
| AC-36 | Belum ada peserta/rating valid | Tampil belum ada data; tidak ada pembagian nol atau rating fiktif |
| AC-37 | Bukti dinyatakan tidak valid | Metrik dihitung ulang sesuai definisi dan alasan tersimpan |
| AC-38 | Fasilitator memverifikasi hasil | Terhubung ke versi metrik/bukti tertentu dan identitas penanda tangan |
| AC-39 | Passport dengan hash sah, salah, id hilang, versi diganti, dicabut | Kelima kondisi dibedakan dan tidak ada false valid |
| AC-40 | Data hasil terbit diperbaiki | Versi baru tercatat; versi lama tidak ditimpa diam-diam |
| AC-41 | Passport terbit tetapi ambang gagal/LPJ belum lengkap | Tahap 2 tidak dapat disetujui |
| AC-42 | Ambang dan LPJ memenuhi syarat, belum ada keputusan otoritas | Hanya layak ditinjau; belum disetujui/cair |
| AC-43 | Bukti distribusi belum ada | Tahap 3 tidak dapat diproses sebagai layak final |
| AC-44 | Inovasi gagal uji, penggunaan dana sesuai RAB | Dicatat sebagai gagal/pelajaran; tidak otomatis fraud |
| AC-45 | Penguji menarik consent setelah passport publik | Akses publik disanitasi, file privat terlindungi, versi/QR ditangani sesuai D-13 |
| AC-46 | Banding pada batas lima hari kerja | Dihitung dengan kalender D-12; reviewer awal tidak otomatis jadi peninjau ulang |
| AC-47 | Admin mengubah plafon | Pengajuan lama tetap merujuk kebijakan sebelumnya, kecuali perubahan resmi tercatat |
| AC-48 | Tidak ada RT aktif pada wilayah tujuan | Tetap tertahan; admin diberi tugas penetapan, bukan melompat ke RW |
| AC-49 | Peminat pilot mengirim formulir | Minat tersimpan dan notifikasi muncul; tidak otomatis memberi akses/dana |
| AC-50 | Upload file tak diizinkan atau akses URL SK oleh publik | Upload/akses ditolak sesuai kebijakan |
| AC-51 | Pengiriman email gagal | Keputusan tetap tersimpan; pengiriman ditandai gagal dan dapat retry tanpa duplikasi keputusan |
| AC-52 | Statistik dana | Hanya realisasi terkonfirmasi dihitung sebagai cair; rencana dan persetujuan terpisah |
| AC-53 | Data contoh digunakan saat pitch | Ditandai simulasi; tidak meniru transaksi bank atau verifikasi pejabat nyata |
| AC-54 | Penggunaan ponsel, keyboard, atau koneksi gagal | Form dapat dipulihkan, label/error terbaca, QR punya tautan alternatif |

### 15.1 Skenario demo utama: Bu Rina

Gunakan contoh handbook sebagai fixture sintetis: Kompos Mini, tingkat Mikro, RAB Rp5 juta, tahap 1 Rp1,5 juta jika porsi 30% dipilih. Jalankan RT, RW, kelurahan, bangun, checkpoint, sekitar 30 penguji selama 3-5 hari sebagai **contoh skenario**, verifikasi, passport, tahap 2, distribusi, tahap 3, dan etalase. Buat varian gagal ambang tanpa pelanggaran anggaran. [H, hlm. 13-14]

Tambahkan skenario Kecil untuk menguji panel; jangan menyimpulkan fitur panel lulus hanya dari demo Mikro.

Sebelum pitch/pilot, handbook menyarankan pengujian dengan RT, RW, dan staf kelurahan sungguhan. Gunakan alur dan data yang disepakati serta catat temuan mereka; keterlibatan dalam uji tidak boleh ditampilkan sebagai persetujuan resmi program. Pengaturan peserta uji dilakukan pemilik produk, tanpa AI menghubungi pihak lain otomatis.

### 15.2 Definition of Done

- Kebutuhan pada milestone terpenuhi dengan data yang tersimpan dan kontrol akses yang bekerja.
- Pemeriksaan tipe/build dan tes relevan berhasil; kegagalan yang tersisa dijelaskan.
- Tes negatif lintas pengguna, wilayah, file, dan status dijalankan untuk modul sensitif.
- Batas nilai, transisi tidak sah, retry, dan konkurensi keputusan/dana yang relevan diperiksa.
- Tidak ada secret, data warga nyata, atau akun petugas palsu yang diperlakukan sebagai validasi resmi.
- Dokumentasi setup, konfigurasi demo, kebutuhan environment, dan batas fitur diperbarui.
- Daftar D-xx yang masih menghambat operasi nyata disebutkan.
- UAT manusia dan deployment dilaporkan sesuai kejadian sebenarnya; “belum diuji” tetap ditulis bila belum dilakukan.

## 16. Daftar keputusan tertunda

**Status: model identitas D-18 disetujui 30 Oktober 2026; profil wilayah, draf empat langkah, dan penggunaan placeholder DEMO untuk prototipe disetujui 31 Oktober 2026.** Akun pribadi, pendaftaran warga mandiri, penugasan hak petugas oleh pengelola, dan pemisahan jabatan dari pemegang telah disetujui. Draf dapat disimpan/edit oleh pemilik; persetujuan ini tidak mengaktifkan pengiriman final, unggah lampiran, atau seluruh kebijakan D-xx. Kolom usulan bukan izin menerapkan kebijakan nyata. Keputusan uang, kelulusan, privasi, dan kewenangan tidak boleh diberi default diam-diam.

| ID | Keputusan dan alasan | Usulan untuk dibahas | Menghambat |
|---|---|---|---|
| D-01 | Empat nama tema dan master wilayah resmi belum lengkap. Pengguna menyetujui placeholder DEMO untuk prototipe pada 31 Oktober 2026 | Empat tema DEMO bernomor dan satu hierarki wilayah DEMO disediakan; nama/data resmi tetap harus berasal dari pemilik program | Form/master produksi, bukan draf prototipe |
| D-02 | Mikro tidak lewat panel tetapi tetap disyaratkan skor 70 | Kelurahan mengisi rubrik yang sama; validasi pengelola | Persetujuan Mikro nyata |
| D-03 | Formula skor panel, hubungan skor-suara, jumlah reviewer lengkap, revisi panel | Rata-rata tiga skor final, ambang 70, dan 2/3 setuju; semua reviewer sah selesai; perlu persetujuan | Kelulusan Kecil dan penilaian ulang |
| D-04 | Basis plafon/RAB, porsi jika awal <30%, batas kategori, biaya perawatan, pembulatan | Gunakan anggaran disetujui sebagai basis, rencana tahap eksplisit, total tidak melebihi anggaran | Validasi finansial dan rencana nominal |
| D-05 | LPJ sebelum distribusi berpotensi melingkar; otoritas tahap 3 dan suara pencairan panel belum jelas | LPJ tahap 2 tanpa bukti distribusi final; tahap 3 dengan bukti; otoritas mengikuti tingkat setelah disahkan | Dana lanjutan dan LPJ |
| D-06 | Hasil cek duplikasi harus memblokir atau memberi peringatan? | Nama sama/kemiripan sebagai flag; penolakan substansi oleh manusia | Submit dengan kandidat duplikasi |
| D-07 | Revisi kembali ke siapa, reset pengingat, perubahan ambang/RAB setelah lolos | Kembali ke peminta revisi; perubahan materiil mengulang review terdampak; versi dan siklus antrean jelas | Kirim ulang dan amendment |
| D-08 | Awal durasi bangun, hari kerja/kalender, checkpoint, perpanjangan, otoritas berhenti | Mulai dari realisasi tahap 1 terkonfirmasi; hari kalender; keputusan manual tercatat | Tenggat dan penahanan dana |
| D-09 | Jumlah misi, syarat buka uji, cohort, pengulangan uji gagal | Satu misi utama per versi inovasi untuk demo; uji ulang sebagai versi/putaran baru | Publikasi misi dan hasil gabungan |
| D-10 | Definisi selesai, denominator, data minimum, banyak indikator, efek peserta keluar | Pakai bukti tugas wajib tervalidasi; definisi cohort dan data minimum dikunci sebelum uji | Metrik dan kelayakan dana |
| D-11 | Isi tiga consent, autentikasi penguji, verifikasi umur dan wali | Naskah consent terpisah dan mekanisme wali yang dapat dibuktikan | Pendaftaran penguji nyata, terutama anak |
| D-12 | Kalender banding, jenis keputusan, kuota banding, dampak ke tenggat | Kalender kerja eksplisit; keputusan asal tetap tersimpan saat ditinjau | Perhitungan banding final |
| D-13 | Penghapusan vs audit/passport, metrik setelah tarik consent, retensi, cache/backup, agregasi | Minimalkan PII; sanitasi versi publik; kebijakan retensi/penghitungan disepakati | Pilot nyata dan passport publik |
| D-14 | Batas penguji berelasi, nilai sampel 10-20%, pembulatan, data perangkat | Parameter tanpa angka karangan; flag ditinjau manusia, gunakan data minimum | Pengujian independen dan audit acak |
| D-15 | Awal masa perawatan, biaya dan kewajiban pascaperawatan, penerima dan serah terima | Masa mulai dari serah terima; jangan menagih penerima otomatis | Distribusi dan pemeliharaan nyata |
| D-16 | Passport publik setelah tahap 7 atau etalase tahap 10; publikasi gagal; moderasi | Passport dapat diverifikasi setelah tahap 7, etalase setelah distribusi; pelajaran gagal diberi label | Kebijakan publikasi |
| D-17 | Definisi konflik; konflik kelurahan/fasilitator; sanksi/blacklist dan pemulihan | Reviewer pengganti independen; sanksi oleh pejabat berwenang, bukan flag otomatis | Penanganan kasus khusus |
| D-18 | Model akun pribadi + mandat jabatan, warga daftar sendiri dan penugasan petugas berwenang telah disetujui 30 Oktober 2026. Pengguna meminta lanjut ke admin/pengelolaan akses; admin awal ditetapkan setelah akun terverifikasi. Multi-peran dan hak anggota tim belum seluruhnya diputuskan | Email/password, UI pemberian/pencabutan peran dan mandat, wilayah/jabatan, serta audit tersedia. Google OAuth, unggah SK, workflow permohonan, owner tim, dan aturan multi-peran produksi tetap perlu pembahasan | Fondasi administrasi tersedia; label peran tidak mengesahkan kebijakan konflik atau hak global ke objek bisnis |
| D-19 | Jenis tanda tangan digital dan siapa penerbit sah | Acknowledgement login untuk demo berlabel simulasi; TTE operasional ditentukan pengelola | Klaim verifikasi resmi |
| D-20 | Bentuk reward/sertifikat dan penerbit | Penghargaan penyelesaian non-tunai; tidak bergantung rating | Fitur reward operasional |
| D-21 | Verifikasi OPD/industri dan tindak lanjut minat pilot; kontak CS | Form publik dengan kontak privat dan triase pengelola | Penanganan minat nyata |
| D-22 | Provider email/scheduler, jam job, eskalasi setelah reminder, target akun/deployment | Pengingat idempoten dari server. Eskalasi DIPUTUSKAN: hanya jalur dokumen fisik setelah 7 hari, tanpa kenaikan otomatis; provider email/scheduler masih terbuka | Pengingat operasional dan setup |
| D-23 | Tipe/ukuran/jumlah file, video, batas penyimpanan, retensi | Dokumen/gambar dulu, video lewat mekanisme yang disepakati; validasi server | Upload final dan biaya layanan |
| D-24 | Logo, warna, font, brand, alamat kontak resmi | UI netral yang mudah dibaca sebagai desain sementara | Finalisasi visual, bukan alur domain |

### 16.1 Keputusan pertama yang disarankan

Untuk mulai desain dan fondasi, cukup pastikan target repository/proyek dan pendekatan mandat akun (D-18); master tema/wilayah dapat memakai data demo sementara. Sebelum menyelesaikan alur persetujuan, selesaikan D-02/D-03/D-07. Sebelum dana, selesaikan D-04/D-05/D-08. Sebelum uji nyata dan publikasi, selesaikan D-09 sampai D-14 serta D-16/D-19.

Jangan membebani pengguna dengan seluruh 24 pertanyaan sekaligus apabila tahap yang dikerjakan tidak memerlukannya.

## 17. Risiko produk dan tindakan desain

| Risiko | Dampak | Tindakan dalam rancangan |
|---|---|---|
| Aturan usulan dibaca sebagai regulasi resmi | Penggunaan dana/otoritas tidak sah | Label draft, parameter program, validasi pengelola |
| Sistem menyamakan layak/disetujui/cair | Statistik dan keputusan uang menyesatkan | Status dan tabel domain terpisah |
| Satu akun jabatan dipakai bersama | Tindakan tak dapat diatribusikan | Login individu dan mandat jabatan |
| Penilaian Mikro/panel belum lengkap | Hasil lolos berbeda antardeveloper | D-02/D-03 menghalangi keputusan nyata |
| Pengubahan ambang setelah hasil terlihat | Bukti tidak dapat dipercaya | Versi rencana uji, perubahan resmi, audit |
| LPJ mewajibkan distribusi sebelum tahap 2 | Alur pendanaan buntu | Kelengkapan LPJ per tahap |
| Foto blur hanya tampilan CSS | Identitas tetap bocor | Derivatif publik tersanitasi dan file asli privat |
| Hash diperlakukan seperti bukti independen | QR palsu/diubah tampak valid | Verifikasi rekaman resmi, versi, status penerbitan |
| Transparansi mengungkap rekening/penguji | Kebocoran privasi | Pemisahan field/file publik dan privat |
| Penarikan consent merusak atau membocorkan versi lama | Privasi dan integritas berkonflik | Minim PII, kebijakan versi dan sanitasi eksplisit |
| Flag anomali menjadi hukuman otomatis | Warga jujur dirugikan | Tinjauan manusia dan banding |
| Akun gratis/provider belum memenuhi email/scheduler/storage | Demo tampak berjalan, operasi gagal | Verifikasi kemampuan akun saat setup; laporkan batas nyata |
| Sukses demo Mikro dianggap seluruh sistem siap | Kecil, panel, privasi, kegagalan belum diuji | Skenario terpisah dan status verifikasi per modul |

## 18. Matriks keterlacakan handbook

| Bagian handbook | Halaman | Pemetaan PRD |
|---|---|---|
| 1. Pengertian dan makna | 1-2 | Bagian 1-2; batas non-dompet |
| 2. Empat prinsip kerja | 2 | Bagian 1, 3, 7-8, 15 |
| 3. Aktor, akun, konflik | 3-4 | Bagian 3; FR-01, FR-04, FR-05, FR-19 |
| 4. Alur 10 tahap | 4-7 | Bagian 6-8; FR-02 sampai FR-14 |
| 5. Aturan pengajuan | 7-8 | Bagian 4; FR-02/03/05/07 |
| 6. Dana bertahap | 8-9 | FR-06, FR-13; bagian 8.3, 11.1, 11.4 |
| 7. Notifikasi/batas waktu | 9 | FR-17; bagian 9; D-07/D-22 |
| 8. QR dan isi passport | 9-10 | FR-11/12; bagian 10-12 |
| 9. Validitas data | 10 | FR-09/10/11/18; D-10/D-14/D-17 |
| 10. Privasi/consent | 10-11 | FR-09/10/12; bagian 10.1, 12.4; D-11/D-13 |
| 11. Banding | 11 | FR-16; D-12 |
| 12. Fungsi halaman | 11-13 | Bagian 5; FR-01 sampai FR-20 |
| 13. Contoh Bu Rina | 13-14 | Bagian 11.1 dan 15.1; angka contoh tidak dijadikan aturan universal |
| 14. Glosarium | 14-15 | Istilah domain di seluruh PRD; pembedaan PRD platform dan PRD inovasi |
| 15. Catatan/asumsi | 15 | Bagian 0, 4, 16-17; validasi kebijakan sebelum operasional |

## 19. Referensi teknis primer

Referensi diakses 30 Oktober 2026 untuk arah keamanan, bukan untuk mengklaim implementasi atau memilih versi paket. Saat implementasi, AI wajib membaca dokumentasi terkini dari fitur dan versi yang benar-benar dipakai.

- **[T1] [Supabase - Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).** Dasar RLS dan grant untuk tabel yang diekspos.
- **[T2] [Supabase - Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control).** Dasar pembatasan akses file melalui policy.
- **[T3] [Supabase - API Keys](https://supabase.com/docs/guides/getting-started/api-keys).** Pemisahan publishable key dan secret key; secret berprivilege tidak boleh dipublikasikan.
- **[T4] [OWASP - Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).** Hak minimum, penolakan default, dan otorisasi setiap request.

Arahan desain yang lebih spesifik, misalnya pemisahan mandat jabatan dan lifecycle passport, adalah **usulan analisis PRD ini**, bukan klaim yang seluruhnya diatur oleh referensi teknis tersebut.

## 20. Prompt awal untuk diberikan kepada AI pengembang

Salin prompt di bawah dan lampirkan PRD ini serta handbook. Jika project sudah ada, beri akses source yang benar. Prompt ini memulai pemeriksaan dan desain; tidak meminta AI langsung menulis seluruh aplikasi tanpa memahami aturan.

```text
Kamu adalah product engineer untuk KampungLab Surabaya.

Baca PRD_KampungLab_Surabaya_v1.md secara utuh, lalu cocokkan dengan
Handbook KampungLab Surabaya yang terlampir. Gunakan kebutuhan pengguna
terbaru sebagai arahan utama. Pertahankan label fakta handbook [H], usulan
[U], dan keputusan belum disepakati [D-xx]. Jangan menganggap usulan sudah
disetujui atau mengarang aturan yang belum ada.

Produk yang ingin dibangun adalah prototipe website fungsional dengan
Next.js, Tailwind CSS, Supabase, source di GitHub, dan target deployment
Vercel. Pilot hanya membuka Mikro dan Kecil.

Prinsip utama:
- KampungLab hanya mencatat dan memverifikasi; uang tidak melalui platform.
- Pengajuan berjenjang RT -> RW -> kelurahan; Kecil diteruskan ke panel.
- Tidak ada auto-approval atau kenaikan tingkat otomatis setelah 24 jam.
- Pisahkan persetujuan pengajuan, pelaksanaan, dana, uji, dan publikasi.
- Dana lanjutan bergantung bukti, LPJ, dan keputusan pihak berwenang.
- Feedback negatif tidak dapat dihapus inovator.
- Privasi penguji, mandat jabatan, wilayah, dan audit harus ditegakkan
  pada server/database, termasuk akses file, bukan hanya pada tampilan.
- Nilai plafon/durasi/porsi dalam handbook adalah konfigurasi usulan.
- Jangan membuat payment gateway, dompet, transfer otomatis, AI penilai,
  atau integrasi pemerintah yang tidak diminta.

Mulai dari Tahap 0 dan 1 pada PRD:
1. Periksa repository, instruksi proyek, dependency, skema, dan konfigurasi
   yang benar-benar tersedia. Jika repository belum ada, katakan demikian.
   Jangan mengasumsikan API atau tabel sudah ada dan jangan mengubah cloud
   project sebelum targetnya jelas.
2. Tulis pemahaman produk, ruang lingkup, gap handbook/PRD, dan keputusan
   D-xx yang benar-benar menghambat tahap pertama.
3. Ajukan hanya pertanyaan penghambat yang diperlukan. Lanjutkan pekerjaan
   independen yang tidak bergantung pada jawabannya.
4. Susun desain sistem: modul, ERD konseptual, matriks akses per
   wilayah/mandat, transisi status, rencana versi kebijakan/passport,
   rute halaman, dan langkah implementasi bertahap.
5. Bedakan rancangan baru dari kondisi aktual repository. Untuk demo,
   labeli data sintetis, pencairan simulasi, dan kebijakan sementara.
6. Verifikasi desain terhadap FR-01 s.d. FR-20, invarian bagian 8.6,
   kriteria AC-01 s.d. AC-54, serta keputusan D-01 s.d. D-24.

Setelah desain tahap awal siap, laporkan hasil yang konkret dan keputusan
yang masih diperlukan. Implementasi selanjutnya mengikuti milestone PRD,
bukan membuat seluruh dashboard palsu sekaligus. Pada setiap tahap,
laporkan perubahan, alasan, pengujian yang benar-benar dijalankan,
batasan, dan pekerjaan berikutnya. Jangan mengklaim UAT atau deployment
berhasil jika belum diverifikasi.
```

**Catatan pemakaian:** jika pemilik produk kemudian sudah menyetujui desain dan keputusan penghambat, instruksi lanjutan cukup menyebut milestone yang dikerjakan, perubahan keputusan D-xx, serta hasil verifikasi yang diharapkan. Perbarui PRD ketika keputusan berubah agar AI berikutnya tidak kembali memakai asumsi lama.
