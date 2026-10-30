# Status Proyek KampungLab Surabaya

Tanggal pembaruan: 30 Oktober 2026.

## Milestone saat ini: fondasi Next.js dan konfigurasi Supabase

Tersedia:

- Next.js App Router, TypeScript, dan Tailwind CSS.
- Halaman pengantar berbahasa Indonesia dan halaman panduan alur.
- Navigasi yang menuju halaman/section yang benar-benar tersedia.
- Layout responsif dasar, skip link, metadata, dan halaman 404.
- PRD sistem, petunjuk AI, npm lockfile, dan instruksi menjalankan secara lokal.
- Script lint, typecheck, dan build.
- Proyek Supabase `kampunglab-surabaya` pada koneksi SetengahRolasOfc, organisasi `setengahrolasofc-tech's Org`, region Singapore.
- Template environment tanpa key asli, factory SDK publik stateless yang belum dipakai halaman, script pemeriksaan koneksi, dan tes validasi konfigurasi.

Belum diimplementasikan:

- Supabase Auth, profil wilayah, akun jabatan, dan delegasi.
- Pengajuan, RAB, review RT/RW/kelurahan, serta panel.
- Schema database, policy RLS/Storage, dan migrasi.
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
- Tes konfigurasi: 4/4 lulus (`npm test`).
- Pemeriksaan koneksi HTTP: lulus untuk Auth JWKS dan Auth Settings (`npm run check:supabase`), memakai publishable key tanpa sesi pengguna.
- Pemeriksaan database melalui koneksi pengelola: `SELECT 1` mengembalikan `connection_ok: 1`; ini tidak membuktikan akses pengguna/RLS.
- Browser/UAT manusia: pengguna mengonfirmasi beranda tampil di localhost; UAT responsif, keyboard, dan alur bisnis belum dilakukan.
- Supabase: status `ACTIVE_HEALTHY`; inspeksi schema `public` mengembalikan nol tabel aplikasi. Security advisors tidak melaporkan temuan saat pemeriksaan awal.
- Root metadata Data API menolak key publik; pemeriksaan koneksi memakai endpoint Auth publik. Query aplikasi, login/sesi, RLS, dan Storage belum diverifikasi.
- Deployment Vercel: belum dilakukan.

## Milestone berikutnya

Selesaikan keputusan desain yang diperlukan untuk identitas dan wilayah sebelum membuat schema/auth. Target Supabase sudah dipilih: project ref `zxfaotlqldfrlccahebw`. Baca matriks keputusan pada PRD; seluruh 24 keputusan tidak harus dijawab hanya untuk menjalankan halaman informasi.

Hak akses jabatan berhubungan dengan identitas, mandat, wilayah, waktu berlaku, dan objek yang diproses. KampungLab tidak melakukan transfer uang; persetujuan dan realisasi dana dipisahkan ketika modul tersebut dibangun.
