# Revisi usulan untuk Handbook KampungLab Surabaya

Teks pengganti handbook untuk aturan 7 hari (keputusan pengguna, 31 Okt 2026). Tandai sebagai usulan sampai disepakati BRIDA/OPD. Catatan: fiturnya belum dibangun di aplikasi; teks ini menetapkan kebijakan yang dituju.

## Bagian 7. Notifikasi dan batas waktu (ganti)

Untuk menjaga setiap tingkat benar-benar memverifikasi, pengajuan tidak naik otomatis ke tingkat berikutnya.

- Setiap pengajuan baru di antrean sebuah tingkat memicu notifikasi ke pemegang akun (dan petugas delegasi bila ada).
- Bila belum ada keputusan dalam 1 x 24 jam, sistem mengirim satu kali pengingat ke akun utama dan akun cadangan tingkat tersebut.
- Pengajuan tetap berada di antrean tingkat itu sampai ada keputusan Setuju, Revisi, atau Tolak. Hitung mundur dan status "menunggu" terlihat oleh inovator.
- **Jalur dokumen fisik.** Jika RT atau RW belum memutuskan setelah 7 hari, tombol "Ajukan lewat dokumen fisik" terbuka untuk inovator. Inovator mencetak surat rekomendasi (template kosong tersedia; versi terisi otomatis diusulkan), meminta tanda tangan dan stempel RT/RW, lalu mengunggah scan atau fotonya. Kelurahan mengonfirmasi ke RT/RW; setelah dikonfirmasi, rekomendasi dicatat sebagai keputusan Setuju bermetode dokumen fisik dan pengajuan lanjut ke tingkat berikutnya. Tidak ada kenaikan otomatis tanpa keputusan atau konfirmasi.
- Hitungan 7 hari berlaku per tingkat dan dimulai ulang setiap pengajuan masuk antrean (waktu revisi tidak dihitung).
- Seluruh pengingat dan tindakan tercatat di audit log. Dokumen fisik disimpan privat; di passport hanya tampil label "rekomendasi manual, dikonfirmasi kelurahan".

## Bagian 15. Catatan dan asumsi (ganti butir keempat)

- ~~Kebijakan lanjutan bila pengajuan menunggu terlalu lama... belum ditetapkan.~~ Ditetapkan: setelah 7 hari tanpa keputusan RT/RW, jalur dokumen fisik terbuka (bagian 7). Angka 7 hari adalah parameter usulan yang dapat diatur Admin. Yang masih perlu disepakati: siapa yang mengonfirmasi dokumen fisik RT (usulan: kelurahan) dan kebijakan bila kelurahan sendiri tidak merespons.

## Bagian 12.2 (tambahan pada halaman inovator)

| Halaman | Fungsi |
|---|---|
| Status Pengajuan | Tambahan: tombol "Ajukan lewat dokumen fisik" muncul setelah 7 hari tanpa keputusan RT/RW; unduh template surat; unggah scan; status konfirmasi kelurahan |

## Bagian 12.4 (tambahan pada halaman petugas)

| Halaman | Fungsi |
|---|---|
| Detail Verifikasi (Kelurahan) | Tambahan: membuka dokumen fisik, mengonfirmasi atau menolak dengan alasan |

## Daftar template dokumen (tambahkan di bagian 5.4)

Surat pernyataan keaslian karya, PRD, RAB, surat rekomendasi RT, surat rekomendasi RW, surat tugas delegasi akun jabatan, bukti penerimaan dana, laporan kemajuan, formulir consent penguji, formulir persetujuan wali, LPJ, panduan perawatan, berita acara serah terima, dan surat keberatan (banding). File ada di `public/templates` dan halaman `/dokumen`.
