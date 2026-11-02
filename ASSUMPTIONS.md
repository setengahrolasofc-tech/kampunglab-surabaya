# ASSUMPTIONS.md

Keputusan yang saya ambil saat prompt atau handbook ambigu. Ubah di sini bila salah; tiap butir menyebut dampaknya.

## Sumber kebenaran
1. Prompt menang atas handbook pada "Perubahan dari Handbook" (survei bawaan menggantikan Google Form/Sheets; tanpa nomor WA; tanpa anonimisasi 90 hari). Selebihnya handbook Rev. 4.

## Akun dan mandat
2. **Kata sandi dikelola Supabase Auth.** `users.password_hash` dari handbook tidak dibuat; `public.users.id` = `auth.users.id`. `is_verified` tidak dibuat: akun terverifikasi = `status = 'AKTIF'`.
3. **Peran BRIDA_ADMIN hanya dari `app_metadata`** (`kl_role`), yang hanya bisa diisi lewat Admin API. Server memeriksa `BRIDA_INVITE_CODE` lebih dulu, lalu membuat akun dengan service role. Peran BRIDA di `user_metadata` (yang bisa dipalsukan klien) ditolak trigger.
4. **Super Admin** = BRIDA_ADMIN dengan `is_super_admin = true` (dibuat `npm run seed:accounts`). Kewenangan khususnya (mis. mengangkat admin) ditetapkan di tahap berikutnya.
5. "Minta Perbaikan" tidak ada di enum `users.status`, jadi dicatat di tabel tambahan **`mandate_requests`** (MENUNGGU / PERLU_PERBAIKAN / DIBERI / DITOLAK). Akun tetap `MENUNGGU_MANDAT` selama diperbaiki. Menolak mandat mengubah `users.status` menjadi `DITOLAK`.
6. `kelurahan_profiles` kini **satu baris per kelurahan** (bukan per user), karena satu kelurahan punya hingga 2 akun. Tabel `innovations`, `problem_boards`, dan mandat merujuk ke `master_kelurahan`, bukan ke `kelurahan_profiles`, agar pengajuan ke kelurahan tanpa akun tetap bisa disimpan (status WAITING_KELURAHAN_MANDATE).
7. Notifikasi untuk "semua Admin BRIDA" ditulis **satu baris per admin aktif** saat kejadian, supaya status dibaca per orang. Admin yang dibuat belakangan tidak melihat notifikasi lama.
8. Pendaftaran Kelurahan membutuhkan sesi untuk mengunggah SK. Untuk pengembangan, nonaktifkan "Confirm email" di Supabase Auth, atau unggah SK setelah login pertama (alur tahap b).

## Pengajuan dan status
9. **`WAITING_BRIDA_GFORM` tetap ada di enum tetapi tidak dipakai.** Karena survei dibuat otomatis oleh website, "Siap Uji Warga" langsung memindahkan `BUILDING_PHASE` ke `COMMUNITY_TESTING`.
10. `skala_plafon` dan `durasi_bangun_hari` **ditentukan trigger dari `tipe_inovasi`** (PROGRAM/PRODUK = KECIL, PROTOTIPE/TEKNOLOGI = TERAPAN), bukan dipilih pengguna.
11. RAB disimpan sebagai angka: `total_rab`, `rab_tak_terduga` (maks 10%), `rab_honor` (maks 15%), `rencana_perawatan_bulan` (6-12, diperiksa saat kirim). Rincian per tahap ada di berkas `rab_url`.
12. "Penguncian anggaran RKA" diwujudkan sebagai: `rka_locked_at` terisi saat disetujui, lalu total RAB/tipe/kelurahan tidak bisa diubah siapa pun. Pembatalan sepihak Kelurahan wajib mengisi alasan (diterapkan di fungsi tahap d).
13. **Tabel `logbooks_and_funds` dipecah tiga** (`fund_disbursements`, `logbook_entries`, `handover_documents`) agar RLS bisa membedakan siapa boleh menulis kolom apa. Isi kolomnya sama dengan handbook.
14. Nominal pencairan boleh **kurang dari atau sama dengan** porsi (30/30/40% x total RAB), tidak boleh lebih.
15. Tambahan di luar handbook: `innovation_status_history`, `innovation_transitions` (mesin status), `system_parameters`, `disputes`, `blacklist_entries`, `submission_reviews`, `pilot_interests`.
16. Keputusan Lurah: **LOLOS** hanya bila keempat standar terpenuhi; bila setelah perpanjangan kuota 30 tidak tercapai tetapi tiga standar lain terpenuhi, Lurah dapat memilih Lolos dengan catatan alasan. Pengaman tambahan: batas uji ulang `retest_maks_kali = 2` (dapat diubah; bukan dari handbook).
17. Banding hanya satu kali (`appeal_used`); putusan BRIDA: dikabulkan (APPROVED_WAITING_TERM_1) atau ditolak final (REJECTED).

## Survei bawaan
18. Pertanyaan kontekstual (2-3) dibuat dari **templat aturan** berdasarkan judul, masalah, tujuan, dan target pengguna (tanpa AI), dibekukan saat uji dimulai, dan tidak dapat diedit inovator.
19. Kunci deduplikasi = SHA-256 dari nama (huruf kecil, dirapikan) + usia + tempat tinggal + RT + RW, per inovasi per ronde. Rate limit: 10 kiriman per hash IP per inovasi per 24 jam (`survey_rate_limit_per_ip_per_hari`). IP di-hash dengan `IP_HASH_SALT` di server; IP asli tidak disimpan.
20. Foto survei disimpan di bucket privat `survey-photos`, ditulis server dengan service role, dilihat lewat signed URL. Kelurahan terkait dan Admin melihat foto dan data lengkap; ketua tim hanya melihat nama samar, tanpa foto. Publik hanya melihat ulasan dengan nama samar ("B*** S***") dan lokasi RT/RW + kelurahan.
21. Ronde uji ulang disimpan sebagai baris baru `testing_integrations` (`ronde` 2, 3, ...); deduplikasi berlaku per ronde.
22. Batas hari mengikuti **zona WIB** (Asia/Jakarta).

## Rapor Bukti Inovasi
23. Hash SHA-256 dihitung dari metrik uji (responden, rata-rata rating, % membantu, % foto), total dana cair, dan ID inovasi. Halaman QR menghitung ulang dari data hidup dan membandingkannya dengan hash di URL dan hash tersimpan; beda = peringatan merah (tahap f).

## Data
24. **Daftar 154 kelurahan di 31 kecamatan saya tulis dari ingatan dan perlu diverifikasi** terhadap data resmi sebelum produksi. Admin dapat mengubahnya; perubahan tercatat di audit log.
25. Berkas disimpan di bucket privat `documents` dengan jalur `{uid_pengunggah}/{id_inovasi | sk}/{nama_berkas}`; kolom `*_url` berisi jalur itu, bukan URL publik.
