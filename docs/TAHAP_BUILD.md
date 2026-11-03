# Tahap build Rev. 4: file dan cara menguji

Prasyarat uji manual: ikuti `docs/SETUP_DEPLOY.md` (migrasi, Auth OTP, `.env.local`, `npm run seed:admin`, `ALLOW_DEMO_SEED=1 npm run seed:demo`).
Akun contoh ada di `docs/SETUP_DEPLOY.md` §4. Uji otomatis: `npm run typecheck && npm run lint && npm test && npm run test:db`.

## (a) Skema DB + RLS + seed
- Baru: `supabase/migrations/20261103090000_rev4_core.sql` (19 tabel, 12 enum, RLS, trigger guard, 34 RPC, parameter, 154 kelurahan, bucket `berkas`).
- Baru: `supabase/tests/rev4_workflow.sql`, `supabase/tests/mock-supabase.sql`, `supabase/tests/run-local.sh`.
- Uji: `npm run test:db` menjalankan seluruh siklus (daftar → mandat → pengajuan → 30-30-40 → survei 31 responden → Lolos → serah terima → Rapor → verifikasi hash → banding → sengketa → pembatalan → pencabutan mandat) dan 101 pernyataan (assert + percobaan yang harus ditolak), termasuk yang HARUS gagal (loncat status, edit setelah disetujui, Kelurahan tanpa mandat, role BRIDA lewat metadata, kebocoran data penguji).

## (b) Auth dan pendaftaran 3 role
- Baru/ubah: `src/app/auth/actions.ts`, `src/components/auth-forms.tsx`, `src/lib/auth/{validation.mjs,session.ts,types.ts}`, `src/app/{masuk,daftar,lupa-kata-sandi,ubah-kata-sandi,menunggu-verifikasi}/page.tsx`, `src/lib/supabase/{server,public,browser,admin}.ts`, `src/proxy.ts`.
- Uji manual: `/daftar` → pilih Inovator (langsung bisa masuk setelah OTP); pilih Kelurahan (akun `MENUNGGU_MANDAT`, hanya melihat `/menunggu-verifikasi`, semua `/kelurahan/*` mengarah ke sana); pilih BRIDA dengan kode salah → ditolak, kode benar → masuk `/admin`.

## (c) Antrean mandat, notifikasi, widget kelurahan kosong
- `src/app/admin/{page,mandat/page,actions}.ts(x)`, `src/app/notifikasi/*`, `src/components/notification-bell.tsx`.
- Uji: masuk sebagai `lurah.mojo@…` (terkunci) → masuk sebagai Super Admin → `/admin/mandat` → Beri Mandat / Tolak / Minta Perbaikan (alasan wajib) → lonceng notifikasi → `/admin` widget "Kelurahan belum bermandat" (filter kecamatan, centang "tampilkan semua"). Pastikan maksimal 2 mandat aktif (percobaan ke-3 ditolak) dan pencabutan wajib beralasan.

## (d) Alur pengajuan sampai Tahap 1
- `src/app/dashboard/{page,actions.ts,pengajuan/baru,pengajuan/[id]}`, `src/components/{new-draft-form,upload-field,project-nav,innovation-views}.tsx`, `src/app/kelurahan/{page,actions.ts,pengajuan/[id]}`, `src/app/berkas/route.ts`, `public/templates/Surat_Kesepakatan_Lokasi_Uji.docx`.
- Uji: `inovator@…` buat pengajuan ke **Kertajaya** (tanpa akun) → status "Menunggu BRIDA menunjuk admin kelurahan" + notifikasi BRIDA "Kelurahan X (Kec. Y) belum punya akun bermandat, ada N pengajuan menunggu" → BRIDA beri mandat Kertajaya → pengajuan otomatis berpindah. Coba plafon (Program > Rp5 juta ditolak), tim 1 atau 7 orang, anggota SMP/SD → ditolak. Kelurahan: Revisi → inovator edit & kirim ulang → Setuju (anggaran terkunci) → catat transfer Tahap 1 (nominal harus tepat 30%).

## (e) Logbook, survei bawaan, evaluasi 4 standar, keputusan Lurah
- `…/dashboard/pengajuan/[id]/{logbook,uji,poster}`, `src/app/uji/[id]/*`, `src/components/survey-form.tsx`, `src/lib/domain/survey.mjs`.
- Uji: Inovator isi Logbook bernota → "Siap Uji Warga" → buka Poster QR → buka `/uji/<id>` di ponsel (tanpa login): isi 30+ responden berbeda (kecamatan/kelurahan harus sesuai lokasi uji) → rekap real-time di dashboard Inovator dan Kelurahan. Setelah 14 hari (atau percepat dengan `update testing_integrations set test_end_date = now()`), uji menutup → Lurah memutuskan Lolos/Tunda/Gagal sesuai ambang.

## (f) Serah terima, Tahap 3, Rapor, Etalase
- `…/serah-terima`, `src/app/{etalase,rapor,verifikasi}`, `src/lib/client-ip.ts`.
- Uji: unggah BAST+Panduan+LPJ → Lurah validasi → catat Tahap 2 lalu Tahap 3 → Rapor terbit di `/etalase`, QR menuju `/rapor/<id>?h=<sha256>`; ubah angka dana di DB → halaman menampilkan peringatan merah.

## (g) Banding, sengketa, blacklist, audit
- `…/bantuan`, `src/app/admin/{sengketa,pengajuan/[id],blacklist,parameter,statistik,audit}`.
- Uji: tolak pengajuan → banding (sekali) → BRIDA putus; Lapor Kendala → mediasi; penghentian → nama masuk daftar hitam, akun ketua diblokir; ubah parameter lalu lihat `/admin/audit`.

## Yang diverifikasi dan yang belum
| Diverifikasi | Cara |
|---|---|
| Migrasi + RLS + state machine + semua RPC | `npm run test:db` (PostgreSQL 16, tiruan skema Supabase) |
| Logika domain, kesamaan transisi TS↔SQL | `npm test` (13 tes) |
| Tipe, lint, build produksi (28 rute) | `npm run typecheck`, `npm run lint`, `npm run build` |
| Halaman publik tampil tanpa backend, rute terlindungi mengarah ke Masuk | smoke test HTTP |

| BELUM diverifikasi (perlu Anda uji di proyek Supabase sungguhan) | Risiko |
|---|---|
| Aplikasi ↔ PostgREST | sintaks embed (`master_kelurahan!inner`, `users!kelurahan_mandates_user_id_fkey`), filter JSON (`data_snapshot_json->>judul`) |
| Kebijakan Storage di skema `storage` asli | uji di tiruan hanya memeriksa sintaks; uji unggah/unduh `berkas` per role |
| Email OTP, SMTP, alur daftar → verifikasi | bergantung pengaturan Auth proyek |
| Uji browser end-to-end (form, unggah, kompresi foto, cetak poster) | belum ada UAT |
| Beban dan performa | belum diuji |
