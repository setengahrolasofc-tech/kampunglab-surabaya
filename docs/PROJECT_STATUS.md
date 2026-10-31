# Status Proyek KampungLab Surabaya

Tanggal pembaruan: 31 Oktober 2026.

## Milestone saat ini: admin dan pengelolaan akses

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
- Lima tabel public dengan RLS (profiles, territories, offices, office_mandates, platform_role_grants), audit privat, dan tiga migrasi yang sudah diterapkan. Tipe TypeScript dihasilkan dari schema nyata.
- Pembatasan penulisan kolom profil, audit privat, dan exclusion constraints untuk periode mandat.
- Admin pertama ditetapkan atas instruksi eksplisit pemilik setelah identitas akun dicocokkan dengan dashboard dan email terkonfirmasi di Auth. Tidak ada bootstrap otomatis dari pendaftar pertama atau user_metadata.
- Halaman `/admin`: cari akun terkonfirmasi lewat email lengkap, tetapkan/cabut peran program dan mandat jabatan, buat wilayah/jabatan, lihat riwayat akun dan 30 audit perubahan akses terbaru.
- RPC admin memeriksa hak dari database, status akun, masa berlaku, dan sesi yang masih hidup. Mutasi mengunci transaksi lalu memeriksa ulang izin; pemberi hak tidak diambil dari form.
- Audit aman menyimpan whitelist sebelum/sesudah tanpa email/password/isi SK. Tabel peran/mandat tetap tanpa izin tulis langsung melalui Data API. Migration administrasi sudah diterapkan dan tipe diperbarui dari schema nyata.

Belum diimplementasikan:

- Google OAuth, unggah SK, workflow permohonan peran/undangan, pagination/import skala kota, serta master wilayah resmi. Form administratif tersedia; verifikasi dasar kewenangan tetap dilakukan manusia.
- Pengajuan, RAB, review RT/RW/kelurahan, serta panel.
- Schema modul pengajuan/dana/uji, policy Storage, dan bucket berkas.
- Pencatatan dana, checkpoint, misi, consent, serta bukti uji.
- Passport/QR, LPJ, distribusi, etalase data, minat pilot, dan banding.
- Scheduler, email, dan audit operasional.
- Hosting/deployment Vercel.

Tidak ada angka statistik, transaksi, akun jabatan, atau hasil uji fiktif yang disajikan sebagai data nyata.

## Verifikasi

Status pemeriksaan diperbarui setelah pemeriksaan selesai. Keberadaan script pemeriksaan tidak berarti pemeriksaannya sudah lulus.

- Lint: lulus (`npm run lint`).
- Typecheck: lulus (`npm run typecheck`).
- Build produksi: lulus (`npm run build`), halaman informasi berhasil diprerender.
- Audit dependency produksi: `npm audit --omit=dev` melaporkan 0 kerentanan pada saat pemeriksaan; bukan jaminan keamanan seluruh sistem.
- Tes unit: 16/16 lulus (`npm test`), mencakup konfigurasi, Auth/redirect/masa mandat, serta validasi administrasi dan waktu WIB.
- Pemeriksaan koneksi HTTP: lulus untuk Auth JWKS dan Auth Settings (`npm run check:supabase`), memakai publishable key tanpa sesi pengguna.
- SQL isolasi/constraint: `supabase/tests/identity_access.sql` lulus dan fixture di-rollback; promosi mandiri, akses lintas pengguna, perubahan ownership, audit, serta mandat tumpang-tindih ditolak.
- SQL administrasi: `supabase/tests/admin_access.sql` lulus dengan seluruh fixture di-rollback. Warga/anon dan wrapper bypass ditolak; pemberian/pencabutan, hierarki, benturan periode, audit, self-admin, session mismatch/expired, serta akses admin yang dicabut diperiksa.
- HTTP non-browser: 11 skenario lulus pada hasil build, termasuk login/cookie SSR, guard dashboard, edit profil, cache private/no-store, penolakan Origin asing, query Data API bertoken, blok promosi mandiri, logout, dan callback aman.
- HTTP admin non-browser: 4 skenario warga dan 12 skenario admin lulus. Termasuk guard halaman/aksi langsung, pencarian email, halaman target/riwayat, penolakan role palsu/perubahan admin sendiri, RPC bertoken, RLS profil yang tetap membatasi diri sendiri, serta token sesi yang sudah keluar kehilangan hak admin. Penulisan positif admin diuji melalui rollback SQL, bukan dengan data warga nyata.
- Browser/UAT manusia: pengguna mengonfirmasi beranda, email konfirmasi masuk, dan memperlihatkan dashboard pribadinya. Edit profil/keluar-masuk/recovery secara manual belum dikonfirmasi; pengguna meminta langsung lanjut admin. UAT admin, responsif, keyboard, dan alur bisnis masih perlu dilakukan manusia.
- Database kini memiliki lima tabel aplikasi dengan RLS aktif. Root metadata Data API tetap membutuhkan privilege tambahan; query tabel menggunakan sesi pengguna telah diuji tanpa secret key.
- Security advisors: peringatan proteksi password bocor belum aktif. Performance advisors: tiga index FK belum digunakan pada database baru. Tautan remediasi ada di AUTH_UAT.md.
- Email konfirmasi nyata diterima dan sesi dashboard pemilik terlihat pada screenshot; detail pembukaan callback tidak diperiksa langsung. Recovery nyata, Google, refresh token dalam browser setelah kedaluwarsa, serta UAT admin belum diverifikasi.
- Deployment Vercel: belum dilakukan.

## Milestone berikutnya

Jalankan UAT `/admin` melalui docs/ADMIN_UAT.md. Siapkan master wilayah/tema dan dasar mandat yang sah sebelum modul pengajuan; tidak ada pejabat atau wilayah resmi yang dibuat oleh AI. Target Supabase: project ref `zxfaotlqldfrlccahebw`. Keputusan produk lain pada PRD tetap berlaku sesuai statusnya.

Hak akses jabatan berhubungan dengan identitas, mandat, wilayah, waktu berlaku, dan objek yang diproses. KampungLab tidak melakukan transfer uang; persetujuan dan realisasi dana dipisahkan ketika modul tersebut dibangun.

## Pembersihan QA

Fixture SQL seluruhnya di-rollback. Akun sintetis HTTP dari milestone sebelumnya dipakai ulang untuk pengujian warga dan admin; tidak dibuat akun HTTP tambahan. Grant admin QA bersifat sementara dan dicabut setelah pemeriksaan. Akun kemudian dinonaktifkan/soft-delete, password acaknya diganti, dan seluruh sesi tersisanya dibuat kedaluwarsa. File kredensial QA lokal dihapus setelah pemeriksaan. Penghapusan permanen sebelumnya tertahan karena konfirmasi bawaan Supabase dua kali kedaluwarsa; baris akun/profil QA berlabel `Synthetic HTTP QA (disabled)`, penetapan QA yang sudah dicabut, dan jejak pseudonimnya tetap tersimpan sebagai riwayat. Pengelola dapat menghapus permanen lewat jalur administrasi berwenang saat konfirmasi tersedia; jangan menganggap baris ini sebagai warga program.
