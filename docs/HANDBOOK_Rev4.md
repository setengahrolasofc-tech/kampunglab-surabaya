
**MASTER HANDBOOK & PANDUAN TEKNIS PENGEMBANGAN WEB**

**KAMPUNGLAB SURABAYA**

**Edisi Revisi Final (Rev. 4)**

Proposal Inovboyo 2.0 – Surabaya Innovathon 2026 \| Badan Riset dan Inovasi Daerah (BRIDA) Kota Surabaya

> **Status dokumen.** Rev. 4 merupakan edisi final yang menggantikan Rev. 3. Filosofi inti tetap dipertahankan (bukti dulu dana kemudian, KampungLab bukan sumber dana, dari panggung ke kampung), sedangkan alur disesuaikan dengan aturan baru yang lebih sederhana: 3 role akun, 2 kategori plafon, penghapusan NIK, durasi uji 14 hari, serta kebijakan mitigasi risiko untuk Kelurahan maupun Inovator.

Ringkasan Perubahan Rev. 3 ke Rev. 4

| **Aspek**                     | **Rev. 3**                                  | **Rev. 4 (Final)**                                                                               |
|-------------------------------|---------------------------------------------|--------------------------------------------------------------------------------------------------|
| **Data penguji warga**        | Input NIK 16 digit (di-hash dan di-masking) | NIK dihapus. Validasi lewat nama/inisial, RT/RW, nomor WA aktif (disamarkan), dan foto di lokasi |
| **Nama bukti akhir**          | Evidence Passport                           | Rapor Bukti Inovasi                                                                              |
| **Durasi uji warga**          | Tidak diatur tegas                          | 14 hari kalender, 1 kali perpanjangan maks. 7 hari                                               |
| **Keputusan Lurah pasca uji** | Lanjut atau hentikan                        | 3 status: Lolos, Tunda/Uji Ulang, Gagal (STOPPED_AS_LEARNING)                                    |
| **Mitigasi pihak nakal**      | Belum diatur rinci                          | Kunci anggaran RKA, reimburse nota sah, restitusi 100%, blacklist, tombol Lapor Kendala          |
| **Batas usia inovator**       | Pelajar SMA/SMK ke atas                     | SMP/SD ke bawah dilarang (tetap tim 2–6 orang)                                                   |
| **Retensi data WA**           | Tidak ada                                   | Dianonimisasi otomatis setelah 90 hari                                                           |

1\. Pengertian, Makna, dan Prinsip Inti

*Bagian ini tidak berubah dari Rev. 3 dan menjadi dasar seluruh aturan di bawahnya*

1.1 Definisi KampungLab Surabaya

KampungLab Surabaya adalah platform web tata kelola inovasi. Di dalamnya, Tim Inovator mengajukan solusi atas masalah kampung, bekerja sama dengan Kelurahan, dan didanai secara bertahap. Solusi tersebut kemudian diuji oleh 30 warga melalui Google Form resmi BRIDA, lalu dibuktikan lewat **Rapor Bukti Inovasi** ber-QR sebelum masuk ke Etalase Publik.

1.2 Makna Nama dan Analogi Notaris Inovasi

- **Kampung:** ruang hidup warga Surabaya beserta struktur sosialnya (RT, RW, Kelurahan). Inovasi diuji di titik tempat masalah benar-benar terjadi.

- **Lab (Laboratorium):** tempat mencoba dan membuktikan secara terukur. Inovasi diperlakukan sebagai hipotesis yang harus diuji manfaat nyatanya, bukan sekadar janji di atas proposal.

- **Analogi Notaris Inovasi:** KampungLab bekerja seperti notaris pada jual beli rumah. Notaris tidak membayar harga rumah, tetapi memastikan rumah itu ada dan dokumennya sah. KampungLab tidak menyimpan atau mentransfer uang. Tugasnya memastikan inovasi benar-benar bekerja, sehingga dana kas Kelurahan tidak terbuang sia-sia. KampungLab bukan dompet penampung uang.

1.3 Tiga Kalimat Kunci

| **Kalimat Kunci**                   | **Makna Operasional di Sistem**                                                                                                | **Yang Bukan KampungLab**                                                                                               |
|-------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| **1. Bukti dulu, dana kemudian**    | Pencairan dana tahap lanjutan hanya diberikan setelah ada bukti uji warga yang valid dan serah terima nyata di lapangan.       | Bukan dompet digital, payment gateway, atau rekening penampung. Transfer dilakukan di luar platform.                    |
| **2. KampungLab bukan sumber dana** | Platform berfungsi sebagai lapisan pengajuan, pencatatan bukti, logbook, dan audit. Dana tetap berasal dari kas Kelurahan/OPD. | Bukan pengganti wewenang Lurah atau BRIDA. Keputusan tetap di tangan pejabat berwenang, sistem mencatat jejak auditnya. |
| **3. Dari panggung ke kampung**     | Inovasi tidak berhenti di presentasi lomba. Inovasi wajib diterapkan dan diserahkan gratis ke warga sasaran.                   | Bukan lomba seremonial, melainkan jalur hilirisasi ide menjadi solusi teruji yang bisa direplikasi.                     |

1.4 Prinsip “Uji yang Jujur Juga Boleh Gagal”

Inovasi yang belum memenuhi ambang kelayakan saat diuji warga akan dihentikan pendanaan lanjutannya dan dicatat sebagai pembelajaran. **Selama dana Tahap 1 (30%) dipakai jujur sesuai nota RAB di Logbook, kegagalan uji tidak dianggap pelanggaran hukum dan tidak menyebabkan masuk daftar hitam (blacklist).** Status akhirnya adalah STOPPED_AS_LEARNING, bukan sanksi.

2\. Rangkuman Transformasi Sistem (Aturan Final)

*Perbandingan aturan lama dengan aturan baru beserta tujuan perubahannya*

2.1 Matriks Transformasi

| **Aspek**                            | **Aturan Lama**                                                                      | **Aturan Baru (Final)**                                                                                                                                     | **Tujuan**                                                                                            |
|--------------------------------------|--------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| **Verifikasi wilayah (RT/RW/Panel)** | Verifikasi berjenjang di aplikasi: akun RT, akun RW, Kelurahan, lalu Panel Reviewer. | Akun RT/RW dan Panel dihapus dari sistem. Diganti 1 dokumen offline “Surat Kesepakatan Lokasi Uji” ber-TTD basah/stempel Ketua RT/RW, Lurah, dan Ketua Tim. | Menghilangkan antrean berjenjang dan beban membuat ribuan akun RT/RW.                                 |
| **Role akun login**                  | 7+ role (Inovator, RT, RW, Kelurahan, Panel, Fasilitator, Warga, Admin).             | Hanya 3 aktor: Admin BRIDA/Super Admin, Akun Kelurahan/Lurah, Tim Inovator.                                                                                 | Database lebih bersih dan pengembangan lebih cepat.                                                   |
| **Syarat inovator**                  | Individu/tim, KTP lokal sesuai RT tempat mengajukan.                                 | Wajib tim 2–6 orang. KTP luar Surabaya boleh asal lokasi uji di Kelurahan Kota Surabaya. Pelajar SMP/SD ke bawah dilarang.                                  | Membuka kolaborasi mahasiswa dan peneliti serta mencegah proyek mangkrak karena dikerjakan sendirian. |
| **Pemetaan masalah**                 | Inovator hanya mengajukan di RT sendiri.                                             | Fitur baru Papan Masalah Kelurahan di halaman publik.                                                                                                       | Mempertemukan inovator yang punya solusi dengan kelurahan yang punya masalah.                         |
| **Plafon anggaran**                  | Mikro Rp5 jt, Kecil Rp25 jt, Menengah Rp50 jt.                                       | 2 kategori: Skala Kecil maks. Rp5 jt dan Skala Terapan maks. Rp15 jt.                                                                                       | Nominal aman untuk administrasi kas kelurahan.                                                        |
| **Skema pencairan**                  | 30% – 50% – 20%.                                                                     | 30% – 30% – 40%.                                                                                                                                            | Inovator wajib menyempurnakan produk dan menyerahkan alat untuk mencairkan 40% terakhir.              |
| **Data penguji**                     | NIK 16 digit di-hash.                                                                | NIK dihapus total.                                                                                                                                          | Mematuhi prinsip perlindungan data pribadi (UU PDP).                                                  |

2.2 Tiga Aktor Pemegang Akun dan Dua Aktor Tanpa Akun

<table>
<colgroup>
<col style="width: 21%" />
<col style="width: 26%" />
<col style="width: 52%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Aktor</strong></th>
<th><strong>Pengguna</strong></th>
<th><strong>Hak Akses dan Fungsi Utama</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>1. Admin BRIDA / Super Admin</strong></td>
<td>Staf resmi BRIDA Kota Surabaya selaku pemilik program.</td>
<td><ul>
<li><p>Memverifikasi SK pendaftaran akun Kelurahan.</p></li>
<li><p>Mengatur parameter sistem (plafon, porsi 30-30-40, durasi uji, ambang kelayakan).</p></li>
<li><p>Menduplikasi Master Google Form BRIDA untuk tiap proyek dan menanam (embed) hasil Google Sheets ke dashboard.</p></li>
<li><p>Memantau statistik eksekutif dan audit log, menengahi laporan kendala/sengketa, mengelola blacklist.</p></li>
</ul></td>
</tr>
<tr class="even">
<td><strong>2. Akun Kelurahan / Lurah</strong></td>
<td>Lurah atau staf yang ditugaskan lewat surat tugas (1 akun utama dan 1 cadangan per kelurahan).</td>
<td><ul>
<li><p>Mengunggah masalah ke Papan Masalah Kelurahan.</p></li>
<li><p>Memeriksa berkas pengajuan (PRD, RAB, Surat Keaslian, Surat Kesepakatan) lalu memutuskan Setuju, Revisi, atau Tolak.</p></li>
<li><p>Mengunggah bukti transfer Tahap 1, 2, dan 3.</p></li>
<li><p>Memantau Logbook, meninjau hasil uji 30 warga, dan memutuskan status pasca uji.</p></li>
<li><p>Memvalidasi BAST, Panduan Perawatan, dan LPJ 100% untuk menerbitkan Rapor Bukti Inovasi.</p></li>
</ul></td>
</tr>
<tr class="odd">
<td><strong>3. Tim Inovator</strong></td>
<td>Tim 2–6 orang (warga, pelajar min. SMA/SMK, mahasiswa, komunitas).</td>
<td><ul>
<li><p>Memilih masalah di Papan Masalah dan mengunduh template Surat Kesepakatan.</p></li>
<li><p>Mengajukan inovasi, mengisi PRD dan RAB, mengunggah Surat Keaslian bermeterai dan Surat Kesepakatan.</p></li>
<li><p>Mengisi Logbook dan mengunggah nota belanja.</p></li>
<li><p>Meminta akses uji warga dan mengunduh Poster QR resmi BRIDA.</p></li>
<li><p>Mengunggah BAST, Panduan, LPJ 100%, serta mengajukan banding atau Lapor Kendala.</p></li>
</ul></td>
</tr>
<tr class="even">
<td><strong>4. Warga Penguji (tanpa akun)</strong></td>
<td>Warga di RT/RW lokasi uji, minimal 30 orang unik.</td>
<td><ul>
<li><p>Scan QR pada poster, lalu mengisi Google Form resmi BRIDA tanpa membuat akun.</p></li>
</ul></td>
</tr>
<tr class="odd">
<td><strong>5. Publik, OPD, dan Industri (tanpa akun)</strong></td>
<td>Warga umum, instansi Pemkot, akademisi, perusahaan/CSR.</td>
<td><ul>
<li><p>Melihat Papan Masalah dan Etalase Inovasi, memindai QR Rapor Bukti Inovasi, dan menekan “Tandai Minat Pilot”.</p></li>
</ul></td>
</tr>
</tbody>
</table>

3\. Skema Pendanaan dan Dua Kategori Plafon

*Parameter baku untuk menjaga akuntabilitas dana Kelurahan*

3.1 Dua Kategori Plafon Anggaran

<table>
<colgroup>
<col style="width: 19%" />
<col style="width: 28%" />
<col style="width: 15%" />
<col style="width: 15%" />
<col style="width: 22%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Kategori</strong></th>
<th><strong>Tipe Inovasi</strong></th>
<th><strong>Plafon Maks.</strong></th>
<th><strong>Durasi Bangun</strong></th>
<th><strong>Keterangan</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>Skala Kecil</strong></td>
<td><ul>
<li><p>Program (edukasi, sistem pengelolaan warga)</p></li>
<li><p>Produk Sederhana (kompos mini, alat rumah tangga non-elektronik kompleks)</p></li>
</ul></td>
<td>Rp5.000.000</td>
<td>30 hari kalender</td>
<td>Dana Tahap 1 (30%) maksimal Rp1,5 juta sehingga risiko kerugian awal kecil.</td>
</tr>
<tr class="even">
<td><strong>Skala Terapan</strong></td>
<td><ul>
<li><p>Prototipe Alat (mesin tepat guna, perangkat keras)</p></li>
<li><p>Teknologi (IoT, sensor lingkungan, sistem perangkat lunak kampung)</p></li>
</ul></td>
<td>Rp15.000.000</td>
<td>60 hari kalender</td>
<td>Cukup untuk komponen elektronik/fabrikasi, tetap dengan nota/kuitansi toko resmi.</td>
</tr>
</tbody>
</table>

3.2 Skema Pencairan Bertahap (30% – 30% – 40%)

<table>
<colgroup>
<col style="width: 15%" />
<col style="width: 8%" />
<col style="width: 30%" />
<col style="width: 46%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Tahap</strong></th>
<th><strong>Porsi</strong></th>
<th><strong>Peruntukan</strong></th>
<th><strong>Syarat Pencairan</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>Tahap 1 (Awal)</strong></td>
<td>30%</td>
<td>Modal rancang bangun: bahan baku dan penyiapan unit uji.</td>
<td>Proposal, RAB, dan Surat Kesepakatan disetujui Akun Kelurahan. Logbook terbuka otomatis.</td>
</tr>
<tr class="even">
<td><strong>Tahap 2 (Tengah)</strong></td>
<td>30%</td>
<td>Penyempurnaan produk berdasarkan masukan warga dan pematangan unit permanen.</td>
<td><ul>
<li><p>Logbook dan nota Tahap 1 lengkap.</p></li>
<li><p>Hasil uji memenuhi 4 standar kelayakan.</p></li>
<li><p>Lurah memutuskan “Lolos Uji &amp; Lanjut Tahap 2”.</p></li>
</ul></td>
</tr>
<tr class="odd">
<td><strong>Tahap 3 (Akhir)</strong></td>
<td>40%</td>
<td>Pelunasan produksi/distribusi, persiapan perawatan lokal, dan honor Tim Inovator (maks. 15% dari total RAB).</td>
<td><ul>
<li><p>Berita Acara Serah Terima (BAST) beserta foto serah terima.</p></li>
<li><p>Panduan Perawatan dan bukti pelatihan warga.</p></li>
<li><p>LPJ Keuangan 100%.</p></li>
<li><p>Ketiganya divalidasi Lurah.</p></li>
</ul></td>
</tr>
</tbody>
</table>

3.3 Komposisi RAB dan Dokumen Wajib

- Total RAB tidak boleh melebihi plafon kategori. Dana tak terduga maksimal 10%, honorarium Tim Inovator maksimal 15% (dicairkan di tahap akhir), dan RAB wajib memuat rencana perawatan 6–12 bulan.

- Dokumen saat pengajuan: (1) PRD/Dokumen Kebutuhan Produk (disederhanakan untuk tipe Program), (2) RAB terperinci per tahap, (3) Surat Pernyataan Keaslian dan Pertanggungjawaban bermeterai Rp10.000, (4) scan Surat Kesepakatan Lokasi Uji ber-TTD basah/stempel Ketua RT/RW, Lurah, dan Ketua Tim.

- Dana ditransfer langsung dari kas Kelurahan ke rekening tim inovator di luar aplikasi. Lurah tidak memegang uang tunai proyek, dan KampungLab tidak menyentuh dana.

4\. Mekanisme Uji Warga dan Empat Standar Kelayakan Otomatis

4.1 Mekanisme Pengumpulan Data

Uji warga memakai **Master Google Form resmi milik akun BRIDA**. Admin BRIDA menduplikasinya untuk setiap proyek dan menanam hasil Google Sheets-nya secara real-time ke dashboard KampungLab. Warga penguji tidak perlu membuat akun, cukup scan QR pada poster. Karena form dikuasai BRIDA, inovator tidak bisa mengubah hasil uji.

4.2 Empat Ambang Batas (Threshold) Kelayakan

| **No** | **Parameter**             | **Ambang Batas**                                                         | **Sumber Data**                     |
|--------|---------------------------|--------------------------------------------------------------------------|-------------------------------------|
| 1      | Kuota partisipan          | Minimal 30 responden warga unik.                                         | Jumlah baris valid di Google Sheets |
| 2      | Skor rating kuantitatif   | Rata-rata minimal 3,8 dari 5,0 bintang.                                  | Kolom rating (1–5)                  |
| 3      | Persentase kebermanfaatan | Minimal 75% menjawab “Ya, Membantu”.                                     | Pertanyaan wajib kebermanfaatan     |
| 4      | Validitas bukti visual    | Minimal 80% melampirkan foto selfie/aktivitas penggunaan alat di lokasi. | Kolom unggah foto                   |

4.3 Durasi Uji dan Aturan Perpanjangan

- **Durasi standar: 14 hari kalender (2 minggu)** sejak poster QR disebar di RT/RW. Waktu ini cukup bagi warga untuk mencoba alat bergantian hingga terkumpul minimal 30 responden, tanpa membuat proyek menggantung terlalu lama.

- **Perpanjangan:** bila kuota 30 responden belum genap (misalnya baru 20), sistem memunculkan tombol perpanjangan **satu kali, maksimal 7 hari tambahan, tanpa tambahan biaya**.

- **Setelah perpanjangan:** bila kuota tetap tidak tercapai, sistem mengunci data dan meminta Lurah mengevaluasi, apakah proyek dilanjutkan dengan jumlah responden yang ada atau dihentikan.

4.4 Tiga Status Keputusan Lurah Pasca Uji

| **Status Keputusan**                                       | **Kondisi**                                                                         | **Konsekuensi**                                                                                                                                 |
|------------------------------------------------------------|-------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| **1. Lolos Uji & Lanjut Tahap 2**                          | Keempat standar kelayakan terpenuhi.                                                | Dana Tahap 2 (30%) dicairkan. Proyek masuk fase penyempurnaan dan serah terima.                                                                 |
| **2. Tunda / Perbaikan & Uji Ulang 14 Hari**               | Jumlah responden kurang dari 30, atau rating rata-rata berada di rentang 3,00–3,79. | Inovator memperbaiki produk lalu uji ulang 14 hari. Dana Tahap 2 belum cair.                                                                    |
| **3. Gagal Uji / Proyek Dihentikan (STOPPED_AS_LEARNING)** | Hasil uji tidak layak dan Lurah memutuskan menghentikan proyek.                     | Pendanaan lanjutan berhenti, dicatat sebagai pembelajaran. Bukan pelanggaran dan bukan blacklist selama dana Tahap 1 dipakai jujur sesuai nota. |

5\. Kebijakan Transparansi dan Perlindungan Data Pribadi

5.1 Penghapusan Input NIK

Input NIK 16 digit **dihapus seluruhnya** dari Google Form dan database. Keputusan ini mengikuti prinsip minimisasi data dalam UU Perlindungan Data Pribadi (UU PDP): sistem tidak mengumpulkan data yang tidak benar-benar dibutuhkan, sehingga risiko kebocoran data KTP warga hilang sejak awal.

5.2 Cara Menjaga Keunikan Responden

| **Data yang Diminta**              | **Fungsi dan Perlakuan**                                                                     |
|------------------------------------|----------------------------------------------------------------------------------------------|
| **Nama atau inisial**              | Identitas dasar responden. Boleh inisial agar warga nyaman.                                  |
| **RT/RW**                          | Memastikan responden berdomisili di lokasi uji sesuai Surat Kesepakatan.                     |
| **Nomor WhatsApp aktif**           | Penanda keunikan (1 nomor = 1 suara). Di dashboard ditampilkan disamarkan, misalnya 0812890. |
| **Foto penggunaan alat di lokasi** | Bukti bahwa warga benar-benar mencoba inovasi. Wajah tidak wajib tampak.                     |

5.3 Retensi dan Anonimisasi Data

- Nomor WhatsApp responden dihapus/dianonimisasi otomatis **90 hari** setelah masa uji ditutup.

- Dashboard Lurah, Inovator, dan publik hanya menampilkan nomor yang sudah disamarkan.

- Etalase Publik tidak menampilkan wajah warga yang tidak dikehendaki. Foto dipakai sebagai bukti validasi, bukan materi promosi.

5.4 Transparansi Dana

Semua nota belanja inovator wajib diunggah ke Logbook yang dapat dilihat Lurah dan Admin BRIDA. Realisasi dana ditampilkan di Rapor Bukti Inovasi sehingga publik dapat memverifikasi penggunaan anggaran.

6\. Mitigasi Risiko dan Aturan Kecurangan

*Perlindungan untuk kedua pihak: Inovator dari Kelurahan yang membatalkan sepihak, dan Kelurahan dari Inovator yang nakal*

6.1 Jika Kelurahan/Lurah Membatalkan Proyek Sepihak

Dana Tahap 1 (30%) tidak pernah masuk ke rekening pribadi Lurah. Dana ditransfer dari kas Kelurahan ke rekening tim inovator di luar aplikasi. Risiko yang perlu ditutup adalah Kelurahan mengalihkan anggaran atau menghentikan proyek setelah inovator mulai berbelanja dan merakit.

- **Penguncian anggaran (locked budget):** setelah Surat Kesepakatan disetujui di sistem, anggaran 30% awal serta 30% + 40% berikutnya dikunci dalam dokumen RKA Kelurahan. Lurah tidak dapat membatalkan sepihak tanpa alasan audit yang sah.

- **Reimburse nota sah:** bila pembatalan terpaksa terjadi karena instruksi mendadak Pemkot, seluruh belanja inovator yang sesuai nota di Logbook wajib diganti oleh Kelurahan memakai dana operasional kelurahan. Inovator sudah bekerja sah sesuai kontrak sistem dan tidak boleh dirugikan.

6.2 Jika Inovator Nakal (Mangkrak, Fiktif, atau Memalsukan Nota)

Berlaku bila inovator telah menerima Dana Tahap 1 tetapi menghilang, tidak membuat alat, membuat alat fiktif, atau memalsukan nota di Logbook.

| **Sanksi**                               | **Ketentuan**                                                                                                                                                                                                                                 |
|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Pengembalian dana (restitusi)**        | Bukan denda, melainkan kewajiban mengembalikan **100% dana yang diterima** ke Kas Kelurahan, sesuai Surat Pernyataan bermeterai Rp10.000 yang ditandatangani saat mendaftar. Batas waktu (X hari) ditetapkan dalam surat pernyataan tersebut. |
| **Pemblokiran akun**                     | Akun tim diblokir permanen oleh Admin BRIDA.                                                                                                                                                                                                  |
| **Daftar Hitam (Blacklist) se-Surabaya** | Nama ketua dan seluruh anggota dicatat sehingga tidak dapat mendaftar program inovasi Pemkot Surabaya, termasuk Inovboyo tahun berikutnya.                                                                                                    |
| **Jalur hukum**                          | Bila nilainya besar dan memenuhi unsur penipuan anggaran publik, Kelurahan/BRIDA berhak meneruskan ke Inspektorat atau Aparat Penegak Hukum (APH).                                                                                            |

> **Pembeda penting.** Gagal uji (produk tidak disukai warga) berbeda dari kecurangan. Gagal uji dengan nota jujur dicatat sebagai pembelajaran. Sanksi pada bagian ini hanya berlaku untuk mangkrak, fiktif, atau pemalsuan.

6.3 Tiga Benteng Pengaman Otomatis di Sistem

1.  **Pencairan bertahap berbasis bukti fisik.** Dana tidak cair sekaligus. 30% awal untuk bahan dasar, 30% kedua hanya setelah 30 warga menguji dan lolos standar, 40% terakhir hanya setelah serah terima resmi (BAST ber-TTD dan foto).

2.  **Transparansi nota terbuka.** Semua nota dapat dilihat Lurah dan Admin BRIDA di Logbook, sehingga nota fiktif mudah terdeteksi saat audit.

3.  **Tombol “Lapor Kendala / Sengketa”.** Inovator yang merasa dipersulit Lurah, atau Lurah yang menilai inovator mangkrak, dapat melapor. Laporan masuk ke Admin BRIDA untuk ditengahi secara resmi.

7\. Nama Baru Fitur dan Lima Fase Alur Lengkap

7.1 Rapor Bukti Inovasi (Pengganti Evidence Passport)

Istilah “Evidence Passport” diganti menjadi **“Rapor Bukti Inovasi”** agar lebih mudah dipahami warga dan perangkat kelurahan. Fungsinya sama dan terbit otomatis setelah proyek selesai. Isinya:

- QR code verifikasi dan cryptographic hash SHA-256 sebagai penanda keaslian data.

- Metrik hasil uji warga (jumlah responden, rata-rata rating, persentase kebermanfaatan, validitas foto).

- Ulasan jujur warga, termasuk keluhan.

- Transparansi dana (realisasi Tahap 1, 2, 3).

- Tombol **“Tandai Minat Pilot”** bagi OPD dan industri yang ingin mengadopsi atau mendanai replikasi.

7.2 Lima Fase Inti

<table>
<colgroup>
<col style="width: 11%" />
<col style="width: 23%" />
<col style="width: 46%" />
<col style="width: 19%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Fase</strong></th>
<th><strong>Nama</strong></th>
<th><strong>Alur Kerja dan Interaksi Aktor</strong></th>
<th><strong>Output</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>Fase 1</strong></td>
<td>Pemetaan dan Kesepakatan Offline</td>
<td><ul>
<li><p>Kelurahan mengunggah masalah ke Papan Masalah (opsional).</p></li>
<li><p>Inovator memilih masalah atau survei mandiri.</p></li>
<li><p>Pertemuan offline Inovator, Ketua RT/RW, dan Lurah untuk menyepakati titik uji dan menandatangani Surat Kesepakatan Lokasi Uji.</p></li>
</ul></td>
<td>Surat Kesepakatan ber-TTD basah/stempel</td>
</tr>
<tr class="even">
<td><strong>Fase 2</strong></td>
<td>Pengajuan dan Dana Tahap 1 (30%)</td>
<td><ul>
<li><p>Inovator mengisi pengajuan (data inovasi, PRD, RAB, Surat Keaslian, upload Surat Kesepakatan).</p></li>
<li><p>Akun Kelurahan memeriksa berkas. Bila disetujui, Kelurahan mentransfer 30% di luar platform dan mengunggah bukti transfer.</p></li>
</ul></td>
<td>Status “Didanai Tahap 1” dan Logbook terbuka</td>
</tr>
<tr class="odd">
<td><strong>Fase 3</strong></td>
<td>Pembuatan dan Setup GForm BRIDA</td>
<td><ul>
<li><p>Inovator membangun inovasi, mengisi Logbook dan nota, lalu menekan “Siap Uji Warga”.</p></li>
<li><p>Admin BRIDA menduplikasi Master Google Form, menanam link Sheets ke halaman proyek, dan menerbitkan poster QR.</p></li>
</ul></td>
<td>Poster QR dan Live Tracker</td>
</tr>
<tr class="even">
<td><strong>Fase 4</strong></td>
<td>Uji Warga dan Evaluasi Dana Tahap 2 (30%)</td>
<td><ul>
<li><p>Poster disebar di RT/RW. Minimal 30 warga mengisi form dalam 14 hari (+7 hari bila diperpanjang).</p></li>
<li><p>Dashboard menghitung 4 standar kelayakan secara real-time.</p></li>
<li><p>Lurah memilih: Lolos, Tunda/Uji Ulang, atau Gagal. Bila lolos, Dana Tahap 2 ditransfer.</p></li>
</ul></td>
<td>Keputusan Lurah dan bukti transfer Tahap 2</td>
</tr>
<tr class="odd">
<td><strong>Fase 5</strong></td>
<td>Serah Terima Akhir, Tahap 3 (40%), dan Rapor Bukti Inovasi</td>
<td><ul>
<li><p>Inovator menyempurnakan produk dari ulasan warga, menyerahkan gratis ke RT/RW, melatih perawatan lokal, lalu mengunggah BAST, Panduan, dan LPJ 100%.</p></li>
<li><p>Lurah memvalidasi 3 berkas dan mentransfer 40%. Sistem menerbitkan Rapor Bukti Inovasi di Etalase Publik.</p></li>
</ul></td>
<td>Rapor Bukti Inovasi ber-QR dan publikasi di Etalase</td>
</tr>
</tbody>
</table>

8\. Panduan Teknis Backend dan Frontend Web KampungLab

8.1 Arsitektur State Machine

Setiap pengajuan dikendalikan oleh kolom status (enum) agar alur halaman dan hak akses tombol terkunci secara tertib. Status bertanda (\*) adalah tambahan Rev. 4 untuk mengakomodasi aturan baru.

| **Status**                                 | **Keterangan**                                                                                                      |
|--------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| **DRAFT**                                  | Inovator sedang mengisi pengajuan, belum dikirim.                                                                   |
| **SUBMITTED_TO_KELURAHAN**                 | Menunggu keputusan Lurah (Setuju / Revisi / Tolak).                                                                 |
| **REVISION_REQUESTED, REJECTED, APPEALED** | Diminta revisi, ditolak, atau sedang banding di meja Admin BRIDA.                                                   |
| **APPROVED_WAITING_TERM_1**                | Disetujui Lurah, menunggu bukti transfer Tahap 1 (30%).                                                             |
| **BUILDING_PHASE**                         | Dana Tahap 1 cair. Logbook terbuka, inovator mengunggah progres dan nota.                                           |
| **WAITING_BRIDA_GFORM**                    | Inovator menekan “Siap Uji Warga”. Menunggu Admin BRIDA memasukkan tautan Form dan Sheets.                          |
| **COMMUNITY_TESTING**                      | Poster QR aktif, masa uji 14 hari. Sistem menarik data Sheets berkala. Perpanjangan 7 hari dapat diaktifkan sekali. |
| **EVALUATION_TERM_2**                      | Masa uji selesai. Menunggu keputusan Lurah (Lolos / Tunda / Gagal).                                                 |
| **RETEST_PENDING (\*)**                    | Keputusan “Tunda/Perbaikan”. Inovator memperbaiki produk lalu uji ulang 14 hari.                                    |
| **REFINEMENT_AND_HANDOVER**                | Dana Tahap 2 cair. Inovator menyempurnakan produk dan mengunggah BAST, Panduan, LPJ 100%.                           |
| **COMPLETED_PUBLISHED**                    | Dana Tahap 3 (40%) cair. Rapor Bukti Inovasi terbit di Etalase Publik.                                              |
| **STOPPED_AS_LEARNING**                    | Proyek dihentikan karena gagal uji. Dicatat sebagai pembelajaran, bukan sanksi.                                     |
| **DISPUTED (\*)**                          | Ada Lapor Kendala/Sengketa yang sedang ditengahi Admin BRIDA.                                                       |
| **CANCELLED_BY_KELURAHAN (\*)**            | Dibatalkan Kelurahan. Memicu kewajiban reimburse nota sah.                                                          |
| **TERMINATED_BLACKLISTED (\*)**            | Dihentikan karena mangkrak/fiktif/pemalsuan. Akun diblokir dan nama masuk blacklist.                                |

8.2 Skema Delapan Tabel Database Relasional

| **Tabel**                | **Kolom Utama**                                                                                                                                                                                                                                                                                                                             | **Fungsi dan Validasi**                                                                                                                |
|--------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| **users**                | id (PK), name, email, password_hash, role ENUM(BRIDA_ADMIN, KELURAHAN, INNOVATOR), phone_wa, sk_document_url, is_verified, is_blacklisted                                                                                                                                                                                                   | Kredensial 3 role. Akun KELURAHAN wajib is_verified = true dari Admin BRIDA berdasarkan SK.                                            |
| **kelurahan_profiles**   | id (PK), user_id (FK), nama_kelurahan, kecamatan, nama_lurah, nip_lurah, kontak_wa_resmi                                                                                                                                                                                                                                                    | Master data kelurahan dan pejabat pemegang akun.                                                                                       |
| **problem_boards**       | id (PK), kelurahan_id (FK), judul_masalah, kategori_tema, deskripsi_lokasi_rt_rw, kontak_wa_narahubung, status ENUM(OPEN, SOLVED), solved_by_innovation_id                                                                                                                                                                                  | Daftar Papan Masalah. Otomatis SOLVED saat inovasi terkait mencapai COMPLETED_PUBLISHED.                                               |
| **innovations**          | id (PK), kode_unik, leader_user_id (FK), kelurahan_target_id (FK), problem_board_id (FK, nullable), judul, tipe_inovasi ENUM(PROTOTIPE, PRODUK, PROGRAM, TEKNOLOGI), skala_plafon ENUM(KECIL_5JT, TERAPAN_15JT), total_rab, target_rt_rw, prd_url, rab_url, surat_keaslian_url, surat_kesepakatan_url, status, dispute_flag, dispute_reason | Tabel induk. Validasi: PROGRAM/PRODUK maka total_rab ≤ 5.000.000 (30 hari). PROTOTIPE/TEKNOLOGI maka total_rab ≤ 15.000.000 (60 hari). |
| **innovation_members**   | id (PK), innovation_id (FK), nama_anggota, peran_dalam_tim, institusi_asal, kota_domisili, jenjang_pendidikan                                                                                                                                                                                                                               | Anggota tim. Validasi: 2–6 baris per inovasi. Jenjang SMP/SD ke bawah ditolak.                                                         |
| **logbooks_and_funds**   | id (PK), innovation_id (FK), tahap ENUM(TAHAP_1_30, TAHAP_2_30, TAHAP_3_40), nominal_cair, bukti_transfer_url, deskripsi_progres, nota_belanja_url, bast_url, panduan_url, lpj_akhir_url, verified_by_lurah_at                                                                                                                              | Pencairan 30-30-40, progres, nota, dan 3 dokumen akhir. Dasar perhitungan reimburse bila dibatalkan.                                   |
| **testing_integrations** | id (PK), innovation_id (FK), gform_public_url, gsheet_embed_url, gsheet_csv_api_url, qr_poster_url, test_start_date, test_end_date, is_extended, total_valid_respondents, avg_rating, helpful_percentage, photo_valid_percentage, is_eligible_standard, lurah_decision ENUM(LOLOS, TUNDA, GAGAL), wa_anonymized_at                          | Tautan Form/Sheets BRIDA, jadwal uji 14 hari + perpanjangan, hasil hitung 4 standar, dan keputusan Lurah.                              |
| **evidence_passports**   | id (PK), innovation_id (FK), passport_code, data_snapshot_json, sha256_hash, published_at, pilot_interest_count                                                                                                                                                                                                                             | Menyimpan Rapor Bukti Inovasi. Nama tabel dipertahankan agar kode lama kompatibel, namanya di antarmuka “Rapor Bukti Inovasi”.         |

8.3 Integrasi Google Sheets BRIDA dan Prosedur Fallback

- **Integrasi utama (CSV/API):** setelah menduplikasi Master Google Form, Admin BRIDA mengaktifkan “Publish to web” (CSV) pada Google Sheets respons dan menempelkan URL ke kolom gsheet_csv_api_url. Backend menarik data terjadwal (atau saat halaman dimuat) untuk menghitung responden unik, rata-rata rating, persentase kebermanfaatan, dan persentase foto valid.

- **Deduplikasi:** responden dianggap unik berdasarkan kombinasi nomor WA, nama/inisial, dan RT/RW. Backend hanya menampilkan nomor yang sudah disamarkan.

- **Fallback manual:** bila sinkronisasi gagal (URL berubah, kuota API terlampaui, jaringan), Admin BRIDA mengunduh Sheets sebagai CSV lalu mengunggahnya ke dashboard. Sistem menjalankan perhitungan yang sama dari file tersebut dan mencatatnya di audit log sebagai input manual.

- **Keaslian Rapor Bukti Inovasi:** URL verifikasi berbentuk \[domain\]/rapor/{id}?h={sha256_hash}. Hash dibangkitkan dari gabungan metrik skor, total dana cair, dan ID inovasi. Bila data diubah setelah terbit, hash tidak cocok dan halaman QR menampilkan peringatan merah.

8.4 Identitas Visual: Color Palette Resmi

Palet resmi bernama “Teal Blue & co.”. Kode warna berikut dipakai sebagai variabel CSS/Tailwind.

<table>
<colgroup>
<col style="width: 13%" />
<col style="width: 23%" />
<col style="width: 19%" />
<col style="width: 44%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Swatch</strong></th>
<th><strong>Nama dan Kode Hex</strong></th>
<th><strong>Nilai RGB</strong></th>
<th><strong>Peruntukan di Antarmuka</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>#222E50</strong></td>
<td><p><strong>Space Indigo</strong></p>
<p>#222E50</p></td>
<td>RGB(34, 46, 80)</td>
<td>Teks utama (heading dan body), latar Navbar/Sidebar/Footer, kartu sorotan gelap.</td>
</tr>
<tr class="even">
<td><strong>#007991</strong></td>
<td><p><strong>Deep Teal Blue</strong></p>
<p>#007991</p></td>
<td>RGB(0, 121, 145)</td>
<td>Warna identitas utama: tombol aksi utama (CTA), tautan aktif, border fokus form, kata “Kampung” pada logo.</td>
</tr>
<tr class="odd">
<td><strong>#439A86</strong></td>
<td><p><strong>Sea Green</strong></p>
<p>#439A86</p></td>
<td>RGB(67, 154, 134)</td>
<td>Warna sekunder dan status sukses: badge “Memenuhi Standar Kelayakan”, indikator progres selesai, ikon verifikasi QR.</td>
</tr>
<tr class="even">
<td><strong>#BCD8C1</strong></td>
<td><p><strong>Soft Celadon</strong></p>
<p>#BCD8C1</p></td>
<td>RGB(188, 216, 193)</td>
<td>Latar kartu ringkasan, garis pembatas, latar badge tahap, hover tabel.</td>
</tr>
<tr class="odd">
<td><strong>#E9D985</strong></td>
<td><p><strong>Warm Sand Gold</strong></p>
<p>#E9D985</p></td>
<td>RGB(233, 217, 133)</td>
<td>Aksen dan perhatian: lingkaran cahaya pada logo, badge “Menunggu Verifikasi Lurah”, bintang rating, sorotan metrik penting.</td>
</tr>
</tbody>
</table>

8.5 Penggunaan Logo

- Logo terdiri dari monogram “K” geometris dengan gradasi biru-hijau (#007991 ke \#439A86) dan lingkaran emas (#E9D985) di kanan atas yang melambangkan ide/cahaya inovasi warga, diikuti tulisan “KampungLab SURABAYA”.

- Logo versi penuh dipakai di Beranda, halaman Masuk, dan kop Rapor Bukti Inovasi (PDF). Di Navbar mobile atau sidebar dashboard, gunakan monogram “K” saja.

- Logo dirancang untuk latar terang (putih \#FFFFFF atau \#F4F9F6). Di atas latar gelap (#222E50), letakkan logo di dalam kontainer putih atau ubah teks “KampungLab” menjadi putih.

8.6 Sitemap: Empat Kelompok Halaman Utama

<table>
<colgroup>
<col style="width: 20%" />
<col style="width: 29%" />
<col style="width: 50%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Kelompok</strong></th>
<th><strong>Halaman</strong></th>
<th><strong>Komponen dan Fitur Utama</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td><strong>Publik (tanpa login)</strong></td>
<td><p>1. Beranda</p>
<p>2. Papan Masalah Kelurahan</p>
<p>3. Etalase Inovasi dan Detail Rapor</p>
<p>4. Verifikasi QR</p>
<p>5. Masuk/Daftar</p></td>
<td><ul>
<li><p>Beranda: penjelasan 5 fase, prinsip “Uji jujur boleh gagal”, statistik dana dan inovasi.</p></li>
<li><p>Papan Masalah: daftar masalah dengan filter kecamatan/tema dan tombol “Hubungi WA Kelurahan”.</p></li>
<li><p>Etalase: katalog inovasi lulus uji, grafik rating, laporan dana, tombol “Tandai Minat Pilot”.</p></li>
</ul></td>
</tr>
<tr class="even">
<td><strong>Dashboard Tim Inovator</strong></td>
<td><p>1. Ringkasan Proyek</p>
<p>2. Form Pengajuan</p>
<p>3. Logbook dan Laporan Dana</p>
<p>4. Panel Misi Uji Warga</p>
<p>5. Serah Terima Akhir, Banding, dan Lapor Kendala</p></td>
<td><ul>
<li><p>Form pengajuan: profil tim (2–6 orang), tipe inovasi dan plafon, unggah PRD, RAB, Surat Keaslian, Surat Kesepakatan.</p></li>
<li><p>Logbook: progres dan foto nota.</p></li>
<li><p>Panel Uji: tombol “Siap Uji Warga”, unduh Poster QR, rekap real-time, penghitung hari uji dan perpanjangan.</p></li>
<li><p>Serah terima: unggah BAST, Panduan, LPJ 100%.</p></li>
</ul></td>
</tr>
<tr class="odd">
<td><strong>Dashboard Kelurahan (Lurah)</strong></td>
<td><p>1. Kelola Papan Masalah</p>
<p>2. Antrean dan Verifikasi Pengajuan</p>
<p>3. Monitoring Logbook dan Uji Warga</p>
<p>4. Pencatatan Transfer Dana</p>
<p>5. Lapor Kendala</p></td>
<td><ul>
<li><p>Form tambah masalah (judul, tema, lokasi RT/RW, nomor WA).</p></li>
<li><p>Pemeriksaan berkas: Setuju, Revisi, Tolak.</p></li>
<li><p>Evaluasi 4 standar kelayakan dengan 3 tombol keputusan: Lolos, Tunda/Uji Ulang, Gagal.</p></li>
<li><p>Form bukti transfer Tahap 1, 2, 3.</p></li>
</ul></td>
</tr>
<tr class="even">
<td><strong>Dashboard Admin BRIDA</strong></td>
<td><p>1. Verifikasi Akun Kelurahan</p>
<p>2. Manajemen Link GForm</p>
<p>3. Pengaturan Parameter, Banding, dan Sengketa</p>
<p>4. Statistik Eksekutif, Audit Log, dan Blacklist</p></td>
<td><ul>
<li><p>Persetujuan SK akun Lurah baru.</p></li>
<li><p>Input tautan Google Form/Sheets resmi per proyek dan unggah CSV fallback.</p></li>
<li><p>Pengaturan plafon, ambang kelulusan, durasi uji, serta meja putusan banding dan sengketa.</p></li>
<li><p>Pengelolaan daftar hitam dan penghapusan/anonimisasi WA 90 hari.</p></li>
</ul></td>
</tr>
</tbody>
</table>

— Akhir Dokumen Handbook KampungLab Surabaya Rev. 4 —
