# Asumsi Rev. 4

Sumber: `docs/HANDBOOK_Rev4.md` dan prompt pembangunan Rev. 4 (3 Nov 2026). Bila keduanya berbeda, prompt menang untuk bagian "Perubahan dari Handbook". Asumsi di bawah dipilih yang paling sederhana dan mudah diganti.

## Tahap (a): skema, RLS, seed

1. **Tabel pengguna.** `public.profiles` (dari Supabase Auth) tetap menjadi tabel pengguna. Peran dan status Rev. 4 ada di `account_registrations` (INNOVATOR, KELURAHAN, BRIDA_ADMIN; status MENUNGGU_MANDAT, AKTIF, DITOLAK, DIBLOKIR). Kata sandi dikelola Supabase Auth, bukan kolom `password_hash`.
2. **Mandat Kelurahan.** Memakai `offices` + `office_mandates` yang sudah ada (jenis `kelurahan`, `primary` = UTAMA, `backup` = CADANGAN, maks 1 + 1 per kelurahan dijaga constraint eksklusi), bukan tabel `kelurahan_mandates` baru. Pencabutan wajib beralasan dan tercatat.
3. **Admin BRIDA.** Admin BRIDA = pemegang `platform_role_grants.program_admin` yang aktif. Pendaftaran BRIDA lewat kode undangan: nilainya disimpan sebagai hash bcrypt di `private.brida_invite` (diisi operator dari variabel `BRIDA_INVITE_CODE` lewat skrip seed), bukan dibaca dari env saat runtime, supaya aplikasi tidak butuh kunci service role. Lima percobaan gagal per jam per akun mengunci sementara.
4. **Notifikasi.** Tabel baru `rev4_notifications`. Notifikasi lama (`notification_receipts`) tetap untuk fitur lama yang belum dinonaktifkan.
5. **Master kelurahan.** `master_kelurahan` diisi 153 kelurahan contoh dari daftar yang sudah ada di repo. Belum dicocokkan dengan daftar resmi.
6. **Plafon.** Plafon mengikuti tipe inovasi (Bab 8.2): PROGRAM/PRODUK → Skala Kecil Rp5 jt; PROTOTIPE/TEKNOLOGI → Skala Terapan Rp15 jt. Nilai plafon dibaca dari `system_parameters`.
7. **Status.** Enum sesuai Bab 8.1 ditambah `WAITING_KELURAHAN_MANDATE`. `WAITING_BRIDA_GFORM` tidak dipakai (Google Form diganti survei bawaan). Perubahan status hanya lewat `rev4_transition`; tabel `rev4_transition_actors` menentukan siapa boleh pindah dari status mana ke mana.
8. **Pemicu "Siap Uji Warga".** Tombol itu langsung memindahkan BUILDING_PHASE ke COMMUNITY_TESTING (tanpa persetujuan BRIDA). Survei dan masa uji dibuat di tahap (e).
9. **Transisi tambahan** yang tidak tertulis di handbook: `APPEALED` diputus Admin BRIDA (kembali ke SUBMITTED atau REJECTED); sengketa dibuka oleh pihak terkait atau Admin dan hanya Admin yang menutupnya (kembali ke status sebelumnya); pembatalan Kelurahan dan blacklist wajib beralasan.
10. **Data lama.** Tidak ada tabel atau kolom lama yang dihapus. Fitur RT/RW/panel lama masih ada di kode; penyembunyiannya dikerjakan di tahap (b)-(c).
11. **Konfirmasi yang belum diputuskan** (R4-xx di `docs/DECISIONS_REV4.md`): batas hari restitusi, perpanjangan masa bangun, tenggat respons Kelurahan, teks persetujuan data penguji.
