# Audit administrasi

Milestone 1 November 2026. Implementasi parsial FR-18 untuk penelusuran administrasi pada prototipe. Tidak membuat modul keputusan akhir, audit uji warga, sanksi, audit acak atau kebijakan retensi baru.

## Yang tersedia

`/admin/audit`, ditautkan dari halaman admin, menampilkan log yang sudah tersimpan. Filter modul, operasi, UUID aktor lengkap, dan rentang tanggal WIB. Tanggal akhir inklusif diterapkan sebagai sebelum pukul 00.00 WIB hari berikutnya. Filter rusak, tanggal tidak sah/terbalik, parameter berulang dan cursor tidak valid ditolak; tidak diganti diam-diam menjadi pencarian global.

| Modul | Objek audit yang boleh tampil |
|---|---|
| Akses dan mandat | `public.office_mandates`, `public.platform_role_grants` dari `private.identity_audit_events` |
| Wilayah dan jabatan | `public.territories`, `public.offices` dari sumber identitas yang sama |
| Pengaturan jalur fisik | `physical_route_settings` dari `private.simulation_audit` |
| Koordinasi panel | `simulation_panel_cases`, `simulation_panel_assignments`, `simulation_panel_events` dari sumber workflow yang sama |

Setiap baris berisi waktu asli audit, sumber, operasi, ID peristiwa/objek, ID akun aktor bila tercatat, role database, serta nama profil aktor **saat ini**. Nama tidak diklaim sebagai snapshot historis; ID aktor tetap menjadi rujukan atribusi. Jika akun tidak tercatat, UI tidak mengarang identitas individu atau menyebutnya petugas tertentu.

Riwayat akses/master memakai snapshot sebelum/sesudah yang memang tersimpan. Ringkasan hanya memperlihatkan scalar dari field user_id, office_id, role, mandate_type, starts_at, ends_at, status, granted_by, revoked_at, kind, code, name, parent_id, territory_id dan active. Objek/array, dasar SK dan alasan bebas tidak dikirim. Tautan penerima akses membuka halaman admin lama dengan pemeriksaan hak yang sama untuk rincian yang diizinkan di sana.

Log teknis koordinasi/fisik lama hanya merekam aktor/objek/operasi/waktu. UI menyatakan nilai sebelum/sesudah tidak tersedia; tidak membaca state objek saat ini untuk mengarang histori. Snapshot kosong atau perubahan hanya pada field yang tidak ditampilkan dijelaskan sebagai keterbatasan ringkasan. Log yang tidak pernah dibuat tidak di-backfill. Contohnya konfigurasi awal yang disisipkan sebelum trigger audit dipasang tidak otomatis menjadi peristiwa baru.

## Batas akses dan privasi

- Semua pembacaan memerlukan sesi database hidup dan peran admin program aktif, di Next.js maupun RPC. Cadangan/delegasi, reviewer atau warga tanpa admin tidak mendapat endpoint ini.
- Tiga tabel audit tetap privat, RLS aktif, tanpa CRUD langsung anon/authenticated. Viewer tidak menyediakan operasi tambah/edit/hapus atau ekspor audit.
- Metadata aktor dan ID penetapan adalah data internal untuk atribusi administrasi. Nama/ID tidak diterbitkan di halaman publik, statistik publik, CSV monitoring atau repository.
- Objek profil warga, draf pribadi, salinan/proposal, catatan/keputusan review, lampiran/tautan berkas, permintaan/tindakan fisik dan seluruh `simulation_panel_entries` dikecualikan dari sumber viewer. Tidak membuka nilai/suara reviewer, isi surat, PRD/RAB, email, HP, NIK, rekening, maupun alasan bebas.
- Admin koordinasi tetap tidak memperoleh pembaca proposal/berkas/nilai. Log metadata koordinasi tetap dapat menunjukkan ID/operasi saat objek asal sudah tidak tersedia; tidak mengambil isinya. Pembaca audit keputusan bisnis dengan scope objek/mandat tersendiri masih perlu dibangun.
- Akses hanya-baca pada aplikasi tidak menjadi klaim log kriptografis atau tahan perubahan oleh administrator database berprivilege. Retensi/penghapusan, audit akses pembaca, dan validitas bukti operasional belum ditetapkan di modul ini.

## Pagination dan implementasi

Pagination memakai urutan `(occurred_at DESC, source DESC, id DESC)`, 20 baris per halaman, dengan mengambil maksimal 21 untuk mengetahui apakah masih ada hasil lebih lama. Cursor menyimpan tiga nilai posisi tersebut dalam base64url, mempertahankan mikrodetik timestamp. Cursor bukan token izin; sesi/admin/filter selalu diperiksa lagi di server. Tidak memakai nomor offset atau mengklaim total seluruh log.

Filter baru memulai lagi dari hasil terbaru. Tautan “lebih lama” mempertahankan filter. Peristiwa baru terlihat dengan muat ulang dari awal; tidak ada polling/Realtime. Ini bukan snapshot MVCC antar-request: transaksi lama yang baru commit, pemeliharaan berprivilege atau perubahan nama profil dapat mengubah hasil antarhalaman. Tidak mengklaim riwayat urutan commit sempurna; waktu audit lama memakai timestamp yang disimpan trigger.

Migrasi `20261101033003_scoped_administration_audit_reader.sql` menambah dua indeks parsial timeline, helper sanitasi scalar privat, implementasi reader privat dengan guard sesi/admin dan search_path kosong, serta wrapper publik security invoker authenticated-only. Helper sanitasi invoker/pure tidak dapat dieksekusi langsung oleh anon/authenticated. Tidak mengganti trigger audit atau memberi grant baru pada tabel. Total 22 migrasi, 20 tabel public dengan RLS.

Tipe TypeScript dihasilkan ulang dari schema nyata. Halaman memakai Server Component dynamic, proxy `/admin/:path*` private/no-store, metadata noindex/no-referrer, dan tanpa state client untuk memuat log. Tidak memerlukan dependency/environment baru atau deployment ulang Edge.

## Verifikasi dan pemeriksaan nanti

Lint, TypeScript Next.js/Edge dan build produksi diperiksa. Hash ketiga fungsi dicocokkan dengan migrasi; metadata memastikan dua indeks, RLS/tanpa CRUD pada ketiga tabel audit, wrapper invoker, helper privat dan grant eksekusinya. Security advisor hanya peringatan lama [proteksi password bocor belum aktif](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Percobaan migrasi pertama tertolak karena penutup ekspresi SQL; metadata memastikan 0 fungsi/indeks baru tertinggal. Setelah diperbaiki migrasi berhasil diterapkan satu kali. Tidak ada peristiwa audit atau histori bisnis yang dibuat ulang/diedit sebagai bagian perbaikan ini.

Tes unit, SQL skenario, HTTP, browser dan UAT tetap ditunda atas arahan pengguna. Tidak memanggil reader sebagai pengguna/QA, membuat akun/mandat/peristiwa fixture, mengaktifkan QA, atau menulis data bisnis. Metadata dan build tidak membuktikan runtime/izin/pagination lulus. Query plan/benchmark performa belum dijalankan. Vercel belum dideploy pada milestone ini.

- [ ] Anon/warga/reviewer/petugas tanpa admin ditolak, termasuk akses RPC/helper/tabel langsung. Sesi/peran dicabut atau kedaluwarsa berlaku pada request berikutnya.
- [ ] Hanya delapan jenis objek yang diizinkan muncul; profil/draf/proposal/score/berkas dan field bebas tidak keluar melalui RPC atau UI.
- [ ] Before/after sesuai snapshot asli; field null/kosong/hilang dan perubahan hanya pada field tersembunyi dijelaskan jujur. Log workflow tidak diperlakukan sebagai snapshot.
- [ ] Aktor null/profil hilang/berganti nama tidak mengubah ID historis atau membuat atribusi fiktif.
- [ ] Filter setiap modul/operasi/aktor, tanggal valid/leap-day/tidak sah/rentang terbalik, serta batas tengah malam WIB benar.
- [ ] Pagination lebih dari 20 baris, timestamp sama lintas sumber/UUID, mikrodetik, cursor rusak/manipulasi, empty page dan perubahan bersamaan ditangani.
- [ ] Data master berisi markup/teks panjang tetap escaped, tabel dapat dibaca pada layar kecil, keyboard/details/tautan/filter dan private/no-store diperiksa manusia.

Daftar pekerjaan seluruh PRD ada di [PRD_BACKLOG.md](PRD_BACKLOG.md).
