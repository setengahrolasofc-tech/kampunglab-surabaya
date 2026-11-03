# ASSUMPTIONS.md

Asumsi paling sederhana yang diambil saat membangun Rev. 4. Bila Anda tidak setuju dengan salah satunya, ubah di titik yang disebut.

## Akun dan mandat
1. **Kredensial di Supabase Auth.** Tabel `users` tidak menyimpan `password_hash`; `users.id` = `auth.users.id`. Login Google dihapus (tidak punya peran/NIP/kelurahan saat daftar). Email OTP dipertahankan.
2. **"Minta Perbaikan" mandat** tidak menambah nilai pada enum `users.status` (tetap 4 nilai). Dipakai kolom `perlu_perbaikan` + `catatan_verifikasi`; status tetap `MENUNGGU_MANDAT`.
3. **Pendaftar Kelurahan** membuat akun `MENUNGGU_MANDAT`; SK diunggah saat daftar (server, service_role). Bila `SUPABASE_SERVICE_ROLE_KEY` kosong, SK diunggah dari halaman "Menunggu verifikasi".
4. **Mandat otomatis UTAMA bila slot utama kosong**, selain itu CADANGAN (BRIDA boleh memilih). Pencabutan mandat utama tidak otomatis mempromosikan cadangan.
5. **Bila mandat terakhir sebuah kelurahan dicabut**, pengajuan berstatus `SUBMITTED_TO_KELURAHAN` di kelurahan itu kembali ke `WAITING_KELURAHAN_MANDATE` (supaya tidak ada pengajuan yang menunggu pemeriksa yang tidak ada). Pengajuan yang sudah berjalan (BUILDING_PHASE dst.) tidak diubah.
6. **Pendaftaran BRIDA**: server memeriksa `BRIDA_INVITE_CODE` (perbandingan waktu-konstan, jeda 0,8 dtk saat salah), membuat akun lewat service_role dengan email dianggap terverifikasi (kode undangan = bukti kepercayaan), lalu mengangkat peran. Role BRIDA tidak pernah diambil dari metadata signUp (diuji di `rev4_workflow.sql`).
7. **Notifikasi untuk "semua Admin BRIDA"** disimpan satu baris per admin (agar status dibaca per orang). `untuk_role` hanya penanda.

## Data dan tabel
8. **`problem_boards.kelurahan_id` dan `innovations.kelurahan_target_id` mengacu ke `master_kelurahan`**, bukan `kelurahan_profiles`, karena pengajuan harus bisa ditujukan ke kelurahan yang belum punya akun. `kelurahan_profiles` berisi profil pejabat per akun.
9. **`logbooks_and_funds`** memuat tiga jenis baris (`PENCAIRAN`, `LOGBOOK`, `SERAH_TERIMA`) lewat kolom `jenis`. Satu baris `PENCAIRAN` per tahap, satu baris `SERAH_TERIMA` per inovasi.
10. **`testing_integrations` = satu baris per ronde uji** (uji ulang menambah ronde). Metrik dibekukan saat uji ditutup agar Rapor stabil walau data penguji dianonimkan.
11. **Skala plafon diturunkan dari tipe** (kolom generated): Program/Produk = Kecil, Prototipe/Teknologi = Terapan.
12. **Tim 2–6 orang sudah termasuk ketua** (tepat satu `is_ketua`).
13. **Tabel dan data alur lama tidak dihapus** dari database. Aplikasi Rev. 4 tidak memakainya. Edge Function `private-attachments` dihapus dari repo; versi yang sudah ter-deploy boleh dihapus dari proyek Supabase. `database.types.ts` dihapus (klien tak bertipe; jalankan `supabase gen types` bila ingin tipe lagi).
14. **Master kelurahan** (31 kecamatan, 154 kelurahan) memakai daftar yang sudah ada di repo dan **belum divalidasi** terhadap master resmi Pemkot.

## Alur dan aturan
15. **Status `WAITING_BRIDA_GFORM` tidak dipakai.** Karena survei dibuat otomatis, "Siap Uji Warga" langsung membuka `COMMUNITY_TESTING`. Nilai enum dipertahankan agar sesuai Rev. 4.
16. **Transfer wajib persis `round(total_rab × porsi)`** (30/30/40, dibaca dari parameter). Selisih ditolak.
17. **Tahap 2**: keputusan Lolos tidak mengubah status; Kelurahan lalu mencatat transfer Tahap 2 yang memindahkan ke `REFINEMENT_AND_HANDOVER`. **Tahap 3** hanya setelah BAST+Panduan+LPJ divalidasi, dan otomatis menerbitkan Rapor.
18. **Aturan keputusan Lurah**: Lolos hanya bila keempat standar terpenuhi. Tunda bila belum lolos dan (responden < 30 atau rating ≥ 3,0). Gagal bila belum lolos. Gagal tidak memberi sanksi.
19. **Uji ditutup "malas"** (saat halaman dibuka / `sync_due_tests()`), tanpa cron. Bila ingin penutupan tepat waktu, jadwalkan `select public.sync_due_tests();` dengan pg_cron tiap 15 menit.
20. **Perpanjangan uji** sekali (+7 hari), hanya sebelum masa uji berakhir dan selama kuota belum genap, oleh Inovator atau Kelurahan bermandat.
21. **Banding**: satu kali, maksimal 7 hari kalender sejak keputusan (parameter `banding_maks_hari`; template menyebut 5 hari kerja). Dikabulkan = kembali diperiksa Kelurahan; ditolak = final.
22. **Pembatalan Kelurahan** mensyaratkan alasan ≥ 20 karakter (dicatat audit). Reimburse = jumlah belanja Logbook yang bernota. **Penghentian + daftar hitam** hanya bila Dana Tahap 1 sudah tercatat. Daftar hitam mencocokkan nama anggota (huruf besar/kecil diabaikan) dan memblokir akun ketua.
23. **Lapor Kendala** membekukan pengajuan (`DISPUTED`) dan menyimpan status sebelumnya; BRIDA memutus: lanjutkan, batalkan, atau hentikan.

## Survei bawaan
24. **Foto**: spesifikasi meminta foto *wajib* sekaligus ambang "≥ 80% berfoto". Diselesaikan dengan parameter `survey_foto_wajib` (default **Ya**); ambang 80% tetap dihitung. Bila BRIDA mengubahnya menjadi Tidak, ambang 80% menjadi bermakna.
25. **Pertanyaan kontekstual (3 buah)** dibuat dari templat tetap di SQL memakai judul, masalah, tujuan, dan target pengguna yang diisi di formulir (bukan dari mem-parsing PDF dan bukan AI). Dibekukan per ronde; Inovator tidak dapat mengubahnya.
26. **Responden harus berdomisili di kelurahan lokasi uji** (kecamatan+kelurahan harus cocok); RT/RW dicatat tetapi tidak dicocokkan karena target RT/RW berupa teks bebas.
27. **Deduplikasi**: sha256 dari nama|usia|tempat tinggal|RT|RW (huruf kecil) per ronde. **Rate limit**: 10 kiriman per jam per hash IP per inovasi (parameter). Hash IP = HMAC-SHA256 dengan garam server; IP mentah tidak disimpan. Responden di jaringan seluler bersama bisa terkena batas ini; naikkan parameter bila perlu.
28. **Privasi**: tabel penguji lengkap hanya terbaca Kelurahan bermandat dan Admin BRIDA. Inovator dan publik hanya melihat agregat + ulasan dengan inisial. "Anonimisasi data penguji" (BRIDA) mengubah nama jadi inisial, menghapus tempat tinggal dan foto.
29. **Foto survei dikompres di perangkat** (maks. 1280 px) sebelum dikirim; unggah lewat server (service_role) karena penguji tidak punya akun.

## Rapor Bukti Inovasi
30. **Hash** = SHA-256 dari `id|rating(2 desimal)|%membantu|%foto|jumlah responden|total dana cair` untuk ronde Lolos terakhir. Halaman verifikasi menghitung ulang dari data hidup; tidak cocok dengan hash tersimpan atau hash di URL = peringatan merah.
31. **Etalase membaca snapshot** (`evidence_passports.data_snapshot_json`, publik) sehingga tidak membuka tabel penguji. **Tandai Minat Pilot** lewat server (honeypot + 3 kiriman/hari/hash IP).
32. **Rapor PDF** = halaman cetak (Cetak → Simpan sebagai PDF), bukan PDF yang dibuat server.

## Penggunaan service_role (hanya server, `src/lib/supabase/admin.ts`)
Pendaftaran BRIDA, SK saat daftar Kelurahan, survei warga publik (foto + RPC), minat pilot, penghapusan foto setelah anonimisasi, dan skrip seed. Semua RPC publik yang menulis data (`submit_survey_response`, `tandai_minat_pilot`) di-grant hanya ke `service_role`.
