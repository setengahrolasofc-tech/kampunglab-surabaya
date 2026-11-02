# Keputusan dan konflik Handbook Rev. 4 (R4-xx)

Dibuat pada Milestone 0, 2 November 2026. Isinya daftar yang menunggu keputusan pemilik program. **Tidak ada item di sini yang sudah disetujui.** Kolom "Usulan" hanyalah usulan implementasi, bukan kebijakan. Kode produk Rev. 4 belum ditulis. Rencana dan peta konflik ada di `docs/REV4_M0_PLAN.md`.

Sumber otoritas: Handbook Rev. 4, lalu `PRD_KampungLab_Surabaya_v1.md`, lalu kode. Berkas `docs/HANDBOOK_Rev4.md` **belum ada di repo** (lihat R4-11), jadi isi Handbook yang dipakai di sini hanya yang tertulis di prompt pembangunan.

Jenis: **K** = kewajiban Handbook, **U** = usulan implementasi, **T** = keputusan terbuka, **X** = konflik atau celah yang ditemukan di repo.

## A. Keputusan terbuka dari prompt

| ID | Jenis | Pertanyaan | Usulan | Dampak bila terlambat |
|---|---|---|---|---|
| R4-01 | T | Batas hari restitusi (X hari) pada surat pernyataan bermeterai. | Tidak diusulkan angka. Jadikan parameter Admin dengan versi, kosong sampai diisi pemilik. | Tidak memblokir M1–M6; memblokir teks final template surat dan M7. |
| R4-02 | T | Perpanjangan masa bangun. Handbook hanya mengatur perpanjangan masa uji (satu kali, maks 7 hari). | Tidak ada perpanjangan masa bangun sampai diputuskan; sengketa lewat Lapor Kendala. | M4 (tenggat bangun 30/60 hari). |
| R4-03 | T | Batas waktu respons Kelurahan. | Parameter tenggat oleh Admin, pengingat di notifikasi, jalur Lapor Kendala. | M3. |
| R4-04 | T | Keaslian Surat Kesepakatan Lokasi Uji yang hanya scan. | Kode verifikasi tercetak di template dan telepon verifikasi acak oleh Kelurahan (dicatat sebagai centang di antrean). | M3 (template baru). |
| R4-05 | T | Benturan kepentingan: pemegang akun Kelurahan atau stafnya sebagai anggota tim yang menarget kelurahannya. | Blokir di server pada pengajuan ke kelurahan sendiri. **Syarat:** anggota tim harus punya akun (R4-20). | M1/M3. |
| R4-06 | T | Keunikan responden tanpa akun dan tanpa WhatsApp. | Kunci gabungan + token perangkat + batas laju + CAPTCHA saja, tanpa WhatsApp. Jujur ditampilkan sebagai "probabilistik". | M5. |
| R4-07 | T | Teks persetujuan data responden, persetujuan wali (<17), masa simpan foto, dasar hukum dan masa simpan blacklist. | Butuh naskah dari BRIDA/hukum. Sementara: placeholder berlabel "belum disahkan", dan tombol kirim survei tetap butuh centang. | M5/M7. Tidak boleh diaktifkan untuk warga nyata sebelum naskah ada. |
| R4-08 | T | Survei terbit langsung saat Siap Uji Warga, atau menunggu tinjauan Admin? Boleh AI merapikan kalimat? | Terbit langsung (sesuai prompt). AI nonaktif secara default; bila diaktifkan hasilnya wajib ditinjau inovator sebelum terkunci. | M5. |
| R4-09 | T | Cara dan batas waktu Admin menengahi sengketa yang melibatkan Kelurahan. | Parameter batas waktu; Admin memutus dengan alasan tercatat; Kelurahan yang terlibat tidak melihat catatan internal Admin. | M7. |
| R4-10 | T | Siapa memoderasi Papan Masalah. | Akun Kelurahan memoderasi masalah kelurahannya sendiri; Admin hanya menurunkan konten yang dilaporkan. | M2. |

## B. Konfirmasi yang diminta prompt

| ID | Jenis | Hal | Usulan |
|---|---|---|---|
| R4-11 | X | `docs/HANDBOOK_Rev4.md` tidak ada di repo. Saya tidak bisa memeriksa Handbook langsung. | **Blocker kecil.** Tolong simpan Handbook sebagai Markdown di repo (PDF tidak terbaca). Sebelum itu, semua aturan di bawah bersumber dari teks prompt dan saya tandai bila ada yang terasa tidak lengkap. |
| R4-12 | U | Peta transisi status (16 status). Lihat tabel di REV4_M0_PLAN.md bagian 5. | Konfirmasi peta. Celah yang perlu keputusan: R4-13 sampai R4-16. |
| R4-13 | T | `APPEALED`: siapa memutus, batas waktu banding (template: maks 5 hari kerja), apakah hanya satu kali. | Admin memutus; satu kali banding; batas 5 hari kerja sebagai parameter. |
| R4-14 | T | `DISPUTED`: Admin "mengembalikan ke status sebelumnya". Perlu menyimpan status asal; bagaimana bila jam uji berjalan saat sengketa. | Simpan `status_before_dispute`; jam masa bangun/uji dibekukan selama sengketa. Perlu persetujuan. |
| R4-15 | T | Jumlah uji ulang. Handbook: Gagal bila "uji ulang tetap tidak memenuhi standar". | Maksimal satu uji ulang. |
| R4-16 | T | Penutupan masa uji (14/21 hari): otomatis oleh sistem atau manual? | Otomatis oleh pekerjaan terjadwal (R4-27), tetap ada tombol Admin untuk menutup lebih awal. |
| R4-17 | U | Konfirmasi larangan peran: Admin tidak boleh membuat atau menjadi anggota tim; pemegang akun Kelurahan tidak boleh jadi anggota tim ke kelurahannya sendiri. | Diaktifkan sebagai pembatas database setelah R4-20. |

## C. Konflik antara Rev. 4, PRD v1, dan kode

| ID | Jenis | Konflik | Usulan |
|---|---|---|---|
| R4-18 | X | **RT, RW, panel, fasilitator dihapus** di Rev. 4, tetapi kode punya: antrean RT/RW, rekomendasi RT/RW, jalur dokumen fisik RT/RW, panel Kecil tiga kursi (4 tabel, halaman `/panel`, `/admin/panel`), peran `reviewer`/`facilitator`, dan mandat RT/RW. | Nonaktifkan non-destruktif: data dipertahankan, rute dan RPC ditolak lewat satu pengaturan, UI disembunyikan. Tidak ada `drop`. **Butuh persetujuan sebelum M1.** |
| R4-19 | X | **Fitur penetapan berjenjang yang dibangun belakangan** (`/mandat/[id]`, RPC `delegated_mandate`: RW menetapkan RT, kelurahan menetapkan RW) bertentangan dengan Rev. 4 (RT/RW tidak punya akun). Penetapan Admin → akun kelurahan masih sesuai. | Batasi ke jenis `kelurahan` oleh Admin saja; RT/RW dinonaktifkan. Notifikasi `assign_rt`/`assign_rw` dihentikan. |
| R4-20 | X | Anggota tim di kode hanya nama + peran (maks 20), tanpa akun. Rev. 4 mewajibkan 2–6 orang, larangan benturan kepentingan, dan blacklist "ketua dan semua anggota". Semua ini butuh identitas anggota. | Anggota diundang dengan email dan wajib punya akun terverifikasi; maks 6, min 2 saat kirim. |
| R4-21 | X | Jenjang pendidikan: SMP/SD ke bawah ditolak. Tidak ada kolom jenjang di profil. NIK dilarang. | Pernyataan jenjang oleh anggota (pilihan) di profil, bukan dokumen. Perlu persetujuan hukum/privasi. |
| R4-22 | X | Bentuk inovasi di kode: `produk`, `prototipe`, `program`, `teknologi` (`gagasan` sudah dihapus). Rev. 4: Program, Produk sederhana, Prototipe alat, Teknologi. Nama "Kecil" saat ini berarti jalur panel; Rev. 4 memakai "Skala Kecil" untuk plafon Rp5 juta. | Petakan `program` dan `produk` ke Skala Kecil, `prototipe` dan `teknologi` ke Skala Terapan. Ganti label "Mikro/Kecil" lama. Konfirmasi bahwa `produk` = "Produk sederhana". |
| R4-23 | X | Template RAB berisi plafon usulan Rp5 juta / **Rp25 juta** dan pencairan **30/50/20**. Rev. 4: Rp5 juta / **Rp15 juta** dan **30/30/40**. Template "Surat Pernyataan" juga menyebut jadwal tahap lama ("Tahap 1–9"). | Ubah template .docx dan `src/lib/templates.ts`. Halaman `/panduan` menyebut "sepuluh tahap"; ganti ke lima fase. |
| R4-24 | X | Template Surat Kesepakatan Lokasi Uji tidak ada. Pengajuan tidak punya kolom daftar RT/RW lokasi uji. | Buat template (R4-04). Tambah daftar lokasi uji pada pengajuan. |
| R4-25 | X | **PRD saat ini hanya berupa dokumen unggahan**, bukan data terstruktur. Generator survei Rev. 4 butuh data terstruktur: masalah, penerima manfaat, indikator + ambang sukses, tugas uji. Bentuk `program` bahkan tidak punya PRD. | Tambah isian terstruktur minimal untuk indikator sukses dan tugas uji (maks 5 indikator) di wizard, di luar dokumen PRD. Berlaku untuk semua bentuk. |
| R4-26 | X | Domisili warga wajib (kelurahan/RW/RT Surabaya) sebelum bisa membuat draf. Rev. 4: warga ber-KTP luar Surabaya boleh; yang wajib hanya lokasi uji di kelurahan Surabaya. | Domisili jadi opsional; kelurahan tujuan dipilih di pengajuan. |
| R4-27 | X | Tidak ada pekerjaan terjadwal di repo, padahal dibutuhkan untuk anonimisasi 90 hari, penutupan masa uji, dan tenggat. | Pakai `pg_cron` Supabase atau Edge Function terjadwal; diuji lewat fungsi yang bisa dipanggil langsung. Perlu konfirmasi ketersediaan di paket Supabase Anda. |
| R4-28 | X | CAPTCHA, batas laju, kompresi foto, pembuangan EXIF, dan hash perseptual belum ada. Pilihan teknis (Turnstile/hCaptcha; pustaka gambar di Edge Function Deno) menambah dependensi dan layanan pihak ketiga. | Putuskan penyedia CAPTCHA. Pembuangan EXIF dan hash perseptual dikerjakan di Edge Function dengan pustaka tertentu yang saya usulkan di M5 sebelum dipasang. |
| R4-29 | X | Pemeriksaan dokumen dengan AI (Anthropic API) sudah ada dan **mengirim isi dokumen ke pihak ketiga**, padahal Rev. 4 hanya mengizinkan AI untuk merapikan kalimat survei dan opsional. | Tahan sebagai opsional, dimatikan secara default, dan beri tahu pengunggah. Putuskan apakah tetap dipertahankan. |
| R4-30 | X | Tulisan "DEMO" sudah diminta dihapus dari UI, sementara Rev. 4 meminta seed demo "berlabel jelas". Database juga masih memakai tema dan wilayah berkode DEMO sebagai prasyarat. | Seed Rev. 4 diberi label di data (kolom `is_sample`), bukan di setiap kalimat UI. Konfirmasi. |
| R4-31 | X | Lampiran: Rev. 4 meminta "URL bertanda tangan berbatas waktu". Kode saat ini mengunduh lewat Edge Function (no-store, tanpa URL publik). Batas 3 MiB dan 10 berkas per draf terlalu kecil untuk foto nota dan BAST. | Pertahankan jalur unduh yang sekarang (lebih ketat). Naikkan batas lewat parameter. |
| R4-32 | T | Parameter Admin (plafon, porsi, durasi, ambang, templat survei): modul `/admin/program` yang ada hanya menyimpan draf proposal tanpa pemakai saat jalan. | Tabel parameter berversi baru; pengajuan membekukan versi parameter saat dikirim. |
| R4-33 | T | Rumus Rapor: SHA-256 dari "metrik skor, total dana cair, dan ID inovasi" belum menentukan urutan dan format. | Canonical JSON dengan kunci terurut, uang dalam satuan rupiah bulat. Konfirmasi. |
| R4-34 | T | Pemotongan rata-rata satu desimal (3,79 tidak jadi 3,8). | Hitung dengan bilangan bulat (jumlah rating × 10 dibagi jumlah, dibagi bawah). Diuji pada batas 3,79/3,80/4,49/4,50. |
| R4-35 | T | Definisi respons "valid": lokasi cocok, tidak bertanda anomali (atau ditinjau valid), foto lolos. Apakah respons bertanda yang ditetapkan "valid" ikut standar 4 (foto)? | Foto lolos dan duplikat dihitung terpisah dari validitas Lurah. |
| R4-36 | T | Data warga pada Papan Masalah dan Etalase yang boleh tampil publik. | Hanya data inovasi tersanitasi; tidak ada nama warga penguji. |

## Yang belum dikerjakan

Seluruh implementasi Rev. 4 (M1–M8). Tidak ada perubahan skema, migrasi, atau kode produk pada Milestone 0.
