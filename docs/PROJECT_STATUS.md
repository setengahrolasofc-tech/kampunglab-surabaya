# Status Proyek KampungLab Surabaya

Tanggal pembaruan: 30 Oktober 2026.

## Milestone saat ini: akun pribadi dan fondasi mandat jabatan

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
- Daftar/masuk email-password, callback PKCE, permintaan reset password, ubah password, dan keluar akun.
- Dashboard terlindungi, profil sendiri, nama tampilan dapat diubah, serta daftar mandat/peran aktif dari database.
- Lima tabel public dengan RLS (profiles, territories, offices, office_mandates, platform_role_grants), audit privat, dan dua migrasi yang sudah diterapkan. Tipe TypeScript dihasilkan dari schema nyata.
- Pembatasan penulisan kolom profil, audit privat, dan exclusion constraints untuk periode mandat.

Belum diimplementasikan:

- Google OAuth, UI admin pemberian/pencabutan mandat, unggah SK, serta master wilayah resmi. Struktur mandat ada, workflow administratif lengkap belum dibangun.
- Pengajuan, RAB, review RT/RW/kelurahan, serta panel.
- Schema modul pengajuan/dana/uji, policy Storage, dan bucket berkas.
- Pencatatan dana, checkpoint, misi, consent, serta bukti uji.
- Passport/QR, LPJ, distribusi, etalase data, minat pilot, dan banding.
- Scheduler, email, dan audit operasional.
- Hosting/deployment Vercel.
- Penetapan admin pertama; tidak ada pengguna yang otomatis memperoleh hak tersebut.

Tidak ada angka statistik, transaksi, akun jabatan, atau hasil uji fiktif yang disajikan sebagai data nyata.

## Verifikasi

Status pemeriksaan diperbarui setelah pemeriksaan selesai. Keberadaan script pemeriksaan tidak berarti pemeriksaannya sudah lulus.

- Lint: lulus (`npm run lint`).
- Typecheck: lulus (`npm run typecheck`).
- Build produksi: lulus (`npm run build`), halaman informasi berhasil diprerender.
- Audit dependency produksi: `npm audit --omit=dev` melaporkan 0 kerentanan pada saat pemeriksaan; bukan jaminan keamanan seluruh sistem.
- Tes unit: 10/10 lulus (`npm test`), mencakup konfigurasi dan validasi Auth/redirect/masa mandat.
- Pemeriksaan koneksi HTTP: lulus untuk Auth JWKS dan Auth Settings (`npm run check:supabase`), memakai publishable key tanpa sesi pengguna.
- SQL isolasi/constraint: `supabase/tests/identity_access.sql` lulus dan fixture di-rollback; promosi mandiri, akses lintas pengguna, perubahan ownership, audit, serta mandat tumpang-tindih ditolak.
- HTTP non-browser: 11 skenario lulus pada hasil build, termasuk login/cookie SSR, guard dashboard, edit profil, cache private/no-store, penolakan Origin asing, query Data API bertoken, blok promosi mandiri, logout, dan callback aman.
- Browser/UAT manusia: pengguna mengonfirmasi beranda tampil di localhost; UAT responsif, keyboard, dan alur bisnis belum dilakukan.
- Database kini memiliki lima tabel aplikasi dengan RLS aktif. Root metadata Data API tetap membutuhkan privilege tambahan; query tabel menggunakan sesi pengguna telah diuji tanpa secret key.
- Security advisors: peringatan proteksi password bocor belum aktif. Performance advisors: tiga index FK belum digunakan pada database baru. Tautan remediasi ada di AUTH_UAT.md.
- Pengiriman/pembukaan email konfirmasi dan recovery nyata, Google, refresh token dalam browser setelah masa kedaluwarsa, serta UAT visual akun belum diverifikasi.
- Deployment Vercel: belum dilakukan.

## Milestone berikutnya

Jalankan UAT email dan dashboard memakai akun pemilik. Setelah identitas admin pertama diverifikasi, lanjutkan penugasan/administrasi dan master wilayah sebelum modul pengajuan. Target Supabase: project ref `zxfaotlqldfrlccahebw`. Keputusan produk lain pada PRD tetap berlaku sesuai statusnya.

Hak akses jabatan berhubungan dengan identitas, mandat, wilayah, waktu berlaku, dan objek yang diproses. KampungLab tidak melakukan transfer uang; persetujuan dan realisasi dana dipisahkan ketika modul tersebut dibangun.

## Pembersihan QA

Fixture SQL seluruhnya di-rollback. Satu akun sintetis untuk uji HTTP telah dinonaktifkan/soft-delete, password acaknya diganti, dan seluruh sesi tersisanya dibuat kedaluwarsa (0 sesi yang belum kedaluwarsa). File kredensial QA lokal sudah dihapus. Penghapusan permanen melalui execute_sql tertahan karena konfirmasi bawaan Supabase dua kali kedaluwarsa; baris akun/profil QA berlabel `Synthetic HTTP QA (disabled)` dan jejak pseudonimnya masih tersimpan. Tidak ada jabatan/role program yang diberikan kepada akun tersebut. Pengelola dapat menghapus permanen lewat jalur administrasi berwenang saat konfirmasi tersedia; jangan menganggap baris ini sebagai warga program.
