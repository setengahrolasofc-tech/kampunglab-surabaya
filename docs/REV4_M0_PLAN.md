# Rencana Milestone 0: Handbook Rev. 4

Tanggal: 2 November 2026. Status: **menunggu konfirmasi pemilik program**. Tidak ada kode produk, migrasi, atau skema yang diubah. Keputusan terbuka ada di `docs/DECISIONS_REV4.md` (R4-xx).

## 1. Alur Rev. 4 yang saya pahami

Tiga peran berakun: Admin BRIDA, Akun Kelurahan, Inovator. Warga penguji adalah responden survei publik tanpa akun. RT, RW, panel reviewer, dan fasilitator tidak punya akun maupun halaman.

1. **Pengajuan.** Inovator (tim 2–6 orang) mengisi data inovasi, PRD, RAB, surat pernyataan bermeterai, dan Surat Kesepakatan Lokasi Uji. Skala Kecil: maks Rp5.000.000 dan 30 hari bangun. Skala Terapan: maks Rp15.000.000 dan 60 hari. Dana tak terduga ≤10%, honor ≤15%, perawatan 6–12 bulan dicatat terpisah.
2. **Penilaian Kelurahan.** Akun Kelurahan memutus, lalu Admin menyetujui pendanaan.
3. **Bangun.** Dana cair 30/30/40 dicatat di luar aplikasi (tanpa dompet, gerbang bayar, atau pencairan otomatis). Inovator mengunggah bukti nota dan BAST.
4. **Uji Warga.** Sistem membuat survei terkunci di `/uji/[kode]`. Empat standar: ≥30 responden valid unik, rata-rata ≥3,8 (dipotong ke satu desimal), ≥75% "Ya, membantu", ≥80% foto valid.
5. **Keputusan dan Rapor.** Lurah memutus Lolos, Tunda, atau Gagal. Hasilnya Rapor Bukti Inovasi dengan QR dan SHA-256. Data responden dianonimkan setelah 90 hari.

Aturan keras: tanpa NIK, tanpa rahasia di repo publik, audit log untuk perubahan status, uang, dan akses, RLS di semua tabel, bucket privat, peran istimewa hanya lewat mandat terlingkup.

## 2. Keadaan kode saat ini (zip main_8)

Alur yang berjalan adalah alur lama: warga mengajukan, RT lalu RW lalu Kelurahan memberi rekomendasi, lalu panel (Kecil) atau fasilitator. Isinya: antrean per tingkat, rekomendasi, jalur dokumen fisik, panel tiga kursi, mandat RT/RW/kelurahan, penetapan berjenjang (`/mandat`), draf bertahap dengan tiga dokumen unggahan, pemeriksaan AI, dan modul draf program Admin (`/admin/program`). Belum ada: pendanaan, bukti bangun, survei uji, Rapor, tim berakun, pekerjaan terjadwal, dan anonimisasi.

## 3. Konflik utama

Rinciannya di DECISIONS_REV4.md bagian C (R4-18 sampai R4-31). Ringkasnya:

| Area | Rev. 4 | Kode sekarang | ID |
|---|---|---|---|
| Peran | RT/RW/panel/fasilitator tidak ada | Semuanya ada, plus fitur penetapan berjenjang | R4-18, R4-19 |
| Tim | 2–6 orang, berakun | Nama saja, tanpa akun | R4-20 |
| Plafon | Rp5 jt / Rp15 jt, 30/30/40 | Template RAB: Rp5 jt / Rp25 jt, 30/50/20 | R4-23 |
| Bentuk | Skala Kecil/Terapan | Mikro/Kecil, jalur panel | R4-22 |
| PRD | Terstruktur untuk generator survei | Dokumen unggahan saja | R4-25 |
| Domisili | Hanya lokasi uji wajib di Surabaya | Domisili wajib | R4-26 |
| Terjadwal | Wajib (90 hari, tenggat) | Tidak ada | R4-27 |
| AI | Hanya rapikan survei, opsional | Memeriksa isi dokumen via pihak ketiga | R4-29 |

## 4. Rencana migrasi (non-destruktif)

1. Semua migrasi baru, tidak mengubah berkas lama, tanpa `drop table` atau `drop column`.
2. Satu pengaturan program menandai jalur lama nonaktif. RPC lama menolak, rute lama menampilkan halaman "tidak tersedia", navigasi disembunyikan. Data lama tetap ada untuk audit.
3. Mandat RT/RW dibekukan, mandat kelurahan tetap dipakai sebagai akun Kelurahan. Peran `reviewer` dan `facilitator` berhenti diberikan.
4. Pengajuan lama diberi status turunan (arsip) tanpa mengubah baris asalnya.
5. Status baru memakai enum atau tabel baru dengan tabel transisi dan audit log. Parameter program berversi dan dibekukan saat pengajuan dikirim.
6. Tabel baru dengan RLS: tim, pendanaan dan tahap cair, bukti bangun, survei, respons, foto, keputusan, Rapor, parameter, audit.
7. Anonimisasi lewat fungsi yang bisa diuji langsung, dijadwalkan setelah R4-27 disetujui.

## 5. Peta status yang diusulkan (konfirmasi R4-12)

| Dari | Ke | Oleh |
|---|---|---|
| DRAFT | SUBMITTED | Inovator |
| SUBMITTED | KELURAHAN_REVIEW / RETURNED | Sistem / Kelurahan |
| KELURAHAN_REVIEW | APPROVED_BY_KELURAHAN / REJECTED / RETURNED | Kelurahan |
| APPROVED_BY_KELURAHAN | FUNDED / REJECTED | Admin |
| FUNDED | BUILDING | Admin (dana tahap 1 tercatat) |
| BUILDING | READY_TO_TEST | Inovator, lalu Admin memverifikasi bukti |
| READY_TO_TEST | TESTING | Sistem (survei terbit) |
| TESTING | TEST_CLOSED | Sistem atau Admin (R4-16) |
| TEST_CLOSED | PASSED / DEFERRED / FAILED | Lurah |
| DEFERRED | TESTING | Inovator (satu kali, R4-15) |
| PASSED, DEFERRED, FAILED | APPEALED | Inovator (R4-13) |
| BUILDING, TESTING | DISPUTED | Admin (R4-14) |
| DISPUTED | status asal | Admin |
| Status mana pun sebelum PASSED | CANCELLED_BY_KELURAHAN | Kelurahan |
| Setelah pelanggaran berat | TERMINATED_BLACKLISTED | Admin |

Ini 16 status dengan rincian nama yang masih perlu disamakan dengan Handbook (R4-11).

## 6. Urutan milestone dan perkiraan ukuran

Ukuran: S ≤1 hari kerja, M 2–3 hari, L 4–6 hari, XL >6 hari.

| M | Isi | Ukuran | Bergantung pada |
|---|---|---|---|
| M1 | Fondasi: parameter berversi, peran 3 akun, penonaktifan jalur lama, tim berakun, tabel status dan audit | L | R4-11, R4-18, R4-19, R4-20, R4-22, R4-26 |
| M2 | Papan Masalah dan Etalase publik | M | R4-10, R4-36 |
| M3 | Pengajuan baru (wizard, tim, lokasi uji, template RAB/surat baru), antrean Kelurahan | L | R4-04, R4-05, R4-23, R4-24, R4-25 |
| M4 | Pendanaan dan pencatatan 30/30/40, bukti bangun, tenggat | M | R4-02, R4-03 |
| M5 | Survei otomatis `/uji/[kode]`, anti-penipuan, foto | XL | R4-06, R4-07, R4-08, R4-28 |
| M6 | Perhitungan empat standar, keputusan Lurah, Rapor, QR dan SHA-256 | M | R4-33, R4-34, R4-35 |
| M7 | Sengketa, banding, sanksi, blacklist, anonimisasi 90 hari | L | R4-01, R4-09, R4-13, R4-14, R4-27 |
| M8 | Seed contoh, UAT, dokumen operasi, pengerasan RLS | M | R4-30 |

Karena lingkungan saya tidak bisa menjalankan `npm install`, tes saya terbatas pada unit test `node:test` murni dan SQL yang dibaca manual. Build Vercel Anda tetap pemeriksa tipe sebenarnya.

## 7. Yang saya butuhkan sebelum M1

1. Berkas Handbook Rev. 4 sebagai Markdown di `docs/HANDBOOK_Rev4.md` (R4-11).
2. Persetujuan menonaktifkan RT/RW/panel/fasilitator secara non-destruktif (R4-18) dan membatasi `/mandat` (R4-19).
3. Jawaban minimal untuk R4-20 (anggota tim wajib berakun), R4-22 (pemetaan bentuk), R4-26 (domisili opsional), R4-27 (pekerjaan terjadwal).
4. Konfirmasi peta status (bagian 5).

Item R4-01 sampai R4-10 boleh dijawab belakangan sesuai kolom ketergantungan.
