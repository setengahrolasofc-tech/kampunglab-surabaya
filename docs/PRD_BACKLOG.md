# Sisa pekerjaan menurut PRD

Pembaruan 1 November 2026 setelah pusat notifikasi dan monitoring admin. Acuan: PRD_KampungLab_Surabaya_v1.md, implementasi repository, serta metadata cloud pada milestone ini. Status **parsial** berarti sebagian kode tersedia, bukan modul operasional lengkap atau UAT lulus. Tidak menggunakan persentase penyelesaian karena cakupan dan keputusan D-xx belum final.

| PRD | Yang tersedia | Yang masih harus dikerjakan |
|---|---|---|
| FR-01 Akun/profil/mandat | Akun pribadi, profil/domisili, admin peran/mandat; kode OTP/Google dari upstream | Verifikasi konfigurasi email/OTP/Google, unggah SK, permohonan/undangan peran, hak anggota tim dan multi-peran operasional (D-18) |
| FR-02 Wizard pengajuan | Empat langkah, PRD/RAB/keaslian privat, batas draf, pemeriksaan AI opsional | Pengiriman resmi, nomor resmi, validasi konfigurasi AI dan alur dokumen, aturan finansial final D-04 |
| FR-03 Validasi/versi | Revisi draf, snapshot putaran DEMO, kirim ulang, retry/konflik | Duplikasi D-06; amendment, perubahan materiil dan rute revisi operasional D-07 |
| FR-04 RT/RW/kelurahan | Antrean, rekomendasi/revisi/tolak/konflik DEMO, timer serta jalur fisik manual | Kewenangan fisik operasional, delegasi/cadangan dan serah terima, rute pengecualian konflik yang disahkan, template surat terisi otomatis; D-17/D-18/D-19 |
| FR-05 Kelayakan/panel | Jalur Mikro/Kecil DEMO; panel Kecil tiga kursi, rubrik/suara individu, konflik/pengganti | Evaluator Mikro D-02; formula/kelengkapan/relasi skor-suara dan keputusan akhir panel D-03; integrasi OPD/Menengah P2 |
| FR-06 Pendanaan | Isian/ringkasan RAB pada draf; belum ada modul dana | Anggaran disetujui, rencana/persetujuan tahap 1–3, bukti realisasi privat, konfirmasi, koreksi, penghentian/pengembalian; D-04/D-05. Transfer tetap di luar platform |
| FR-07 Pembangunan | Belum | Mulai/tenggat, checkpoint, bukti progres, peninjauan dan satu perpanjangan; D-08 |
| FR-08 Misi uji | Belum | Penugasan fasilitator, rencana/tugas/ambang, buka/tutup misi, QR dan poster; D-09 |
| FR-09 Penguji/consent | Belum | Pendaftaran/verifikasi penguji, tiga naskah consent, privasi, wali, relasi, penarikan dan penghapusan; D-11/D-13/D-14 |
| FR-10 Tugas/rating/feedback | Belum | Checklist, unggah bukti, revisi/verifikasi tugas, rating/feedback, moderasi dan reward; D-10/D-16/D-20 |
| FR-11 Verifikasi hasil | Belum | Perhitungan indikator/cohort/denominator, hasil tidak cukup data/gagal, verifikasi fasilitator, koreksi/anulir; D-10/D-14/D-19 |
| FR-12 Evidence Passport | Belum | Snapshot versi hasil, verifier QR/hash terhadap server, sanitasi publik, penggantian/pencabutan; D-13/D-16 dan hasil uji yang sah |
| FR-13 LPJ/distribusi/perawatan | Belum | LPJ realisasi vs RAB, review/revisi, bukti serah terima, distribusi, panduan dan periode perawatan; D-05/D-15 |
| FR-14 Etalase/publikasi | Halaman informasi umum, bukan etalase inovasi | Etalase, pencarian/filter, halaman bukti tersanitasi, moderasi dan publikasi pelajaran gagal; D-13/D-16 |
| FR-15 Minat Pilot/CS | Belum | Form minat, consent kontak, verifikasi organisasi, anti-spam, triase/notifikasi dan kontak CS yang disetujui; D-21 |
| FR-16 Banding | Belum | Pengajuan ke keputusan tertentu, lampiran, reviewer independen, putusan dan pemulihan alur; kalender/kuota/dampak D-12 |
| FR-17 Notifikasi | Inbox dari catatan tersimpan, tanda baca, scope aktif | Email satu kali ≥24 jam, scheduler, idempotensi retry dan status/audit pengiriman; D-22. Notifikasi modul dana/uji/banding mengikuti modul tersebut |
| FR-18 Audit/validitas | Audit privat identitas/draf/review/lampiran/fisik/panel | Pembaca audit lintas modul sesuai hak, anomali/peninjauan, sampling acak, rotasi fasilitator, koreksi metrik; D-14/D-17 serta dependensi uji |
| FR-19 Pengaturan/master | Wilayah/jabatan, pemberian/pencabutan mandat/peran, batas hari fisik DEMO | Program/periode, kebijakan berversi, parameter plafon/durasi/ambang/rubrik/consent, master resmi tervalidasi/import, kesiapan operasional menyeluruh; D-01/D-04/D-18/D-23 |
| FR-20 Dashboard/laporan | Dashboard akun/warga, antrean petugas, monitoring admin status/tema/kelurahan, usia antrean, CSV agregat | Dashboard fasilitator serta metrik dana/uji/LPJ/banding/reminder gagal, laporan operasional lengkap, agregasi publik D-13 |

## Pekerjaan lintas modul yang belum selesai

- Menetapkan keputusan kebijakan penghambat bersama pemilik program. Prioritas jalur berikutnya: D-02/D-03 untuk kelulusan, D-04/D-05 untuk dana, D-08 untuk pembangunan, dan D-09/D-10/D-11/D-13/D-14 untuk uji warga. Persetujuan akses teknis tidak sama dengan pengesahan angka/kewenangan tersebut.
- Menetapkan dan memverifikasi data master resmi, kewenangan, template, penandatanganan, retensi/backup/penghapusan, serta batas berkas operasional. Lampiran privat pendukung DEMO sudah tersedia; SK/bukti dana/uji dan derivatif publik memerlukan jenis/scope tersendiri.
- Menjalankan tes unit/regresi, SQL skenario negatif dan konkurensi, HTTP/API, serta UAT manusia untuk fitur yang dibangun setelah keputusan RT/RW. Tes alur tetap ditunda atas instruksi pengguna; hasil historis fondasi akun/admin tidak membuktikan modul baru lulus.
- Verifikasi provider email/OTP/Google, konfigurasi AI opsional, pengingat server, serta operasi gagal/retry. Jangan melaporkan email terkirim atau dokumen disahkan hanya dari tersedianya kode.
- Deploy Next.js ke Vercel, periksa environment/Auth Site URL/redirect, region, build/log, cache dan domain, kemudian UAT produksi. Backend berkas Supabase sudah aktif; itu tidak berarti website sudah dideploy ke Vercel.
- Review keamanan menyeluruh sebelum pilot nyata, termasuk sesi/hak lintas wilayah/file/peran ganda, sanitasi aset publik, dan proteksi password bocor yang masih belum aktif. Rincian historis ada di PROJECT_STATUS.md.

## Urutan kerja yang disarankan

1. Tetapkan D-02/D-03, lalu lengkapi evaluasi Mikro dan keputusan akhir panel Kecil DEMO sebelum menyambung pendanaan.
2. Tetapkan D-04/D-05, bangun pencatatan dana dan review bukti; lanjut checkpoint dengan D-08.
3. Tetapkan kebijakan uji/privasi, bangun misi → penguji → tugas/bukti → verifikasi hasil.
4. Lengkapi Passport, LPJ/distribusi/perawatan, lalu publikasi, minat pilot dan banding dengan kebijakannya.
5. Konfigurasi reminder/email dan pengaturan program, perluas laporan/audit, kemudian verifikasi lintas modul dan deployment.

Urutan ini rekomendasi implementasi, bukan pengesahan usulan D-xx. Fitur pendukung yang tidak memerlukan keputusan baru dapat dikerjakan sambil menunggu keputusan pemilik program.
