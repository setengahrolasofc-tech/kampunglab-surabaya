# Draf program, periode dan usulan evaluasi

Milestone 1 November 2026. Implementasi parsial FR-19 untuk menyusun bahan pembahasan kebijakan. D-02/D-03 tetap terbuka; rumus tidak ditetapkan pada milestone ini. Modul ini tidak mengaktifkan program, menerapkan kebijakan ke pengajuan, menghitung kelulusan, memberi mandat atau menyetujui dana.

## Yang dibangun

- `/admin/program`: daftar draf bersama, pagination 20, form buat draf program/periode. Admin program aktif dapat menyusun/menyunting draf bersama; created_by adalah atribusi pembuat, bukan pembatas kepemilikan pribadi.
- `/admin/program/[id]`: usulan tersimpan, metadata aktor/alasan/waktu, penyuntingan menjadi versi baru, riwayat 20 versi per halaman, pembukaan nomor versi, serta perbandingan versi lama dengan versi draf terbaru. Versi lama hanya-baca di UI.
- Kode draf 3–48 huruf/angka/garis bawah/tanda hubung, dinormalisasi huruf besar, unik dan tetap. Nama wajib 3–160 karakter. Ringkasan serta tanggal usulan awal/akhir opsional; tanggal tidak menjadwalkan aktivitas atau aktivasi otomatis.
- Usulan penilai Mikro berupa teks peran/fungsi, rumus panel Kecil (rata-rata/median/konsensus), ambang skor, minimal suara Setuju, kewajiban tiga reviewer selesai, dan hubungan skor dengan suara. Semua boleh belum diusulkan. Pilihan boolean membedakan belum diusulkan, Ya dan Tidak; skor 0 tidak disamakan dengan kosong.
- Angka handbook 70/100 dan 2/3 hanya menjadi keterangan usulan. Tidak mengisi angka, evaluator, rumus atau tanggal secara otomatis. Isian lengkap tetap berstatus draf, bukan kebijakan disahkan. Nilai di luar usulan handbook tidak menjadi aturan operasional melalui formulir ini.
- Setiap perubahan data mempunyai alasan wajib, actor_id, nama profil aktor saat penyimpanan, waktu server, versi asal dan versi baru. Simpan tanpa perubahan data ditolak; revisi tidak menimpa snapshot lama. Actor/nama/timestamp berasal dari server/database, bukan form.

Belum ada parameter plafon/RAB/pencairan, durasi/checkpoint, rubrik baru, consent, template atau notifikasi dalam modul draf ini. Rubrik dan alur DEMO lama tidak membaca tabel ini. Pengesahan, aktivasi, penonaktifan, pengarsipan, penautan versi ke pengajuan baru dan migrasi pengajuan lama memerlukan desain/keputusan lanjutan. Tidak memberi klaim sebagai master program resmi.

## Database dan kendali mutasi

Migrasi `20261101040331_draft_programme_periods_and_evaluation_policy_versions.sql` sudah diterapkan. Dua tabel baru:

| Tabel | Kegunaan dan batas |
|---|---|
| `program_drafts` | Identitas/kode, penunjuk versi terbaru, pembuat, waktu; CHECK membatasi state hanya `draft` |
| `program_draft_versions` | Snapshot `program-proposal-v1`, alasan, aktor/nama, operation, expected_version, request_id dan waktu; unik per program/versi serta aktor/request_id |

FK komposit deferred `(id, version)` ke snapshot memastikan penunjuk versi terbaru mempunyai pasangan saat transaksi commit. Pembuatan root dan snapshot pertama, serta insert snapshot/revisi penunjuk berikutnya berada dalam transaksi RPC yang sama. Validasi JSON/tanggal/enum/nilai juga dilakukan database; payload harus memuat tepat field schema yang ditentukan. Tidak menerima state aktif, daftar grant, isi kode atau field tambahan sebagai kebijakan.

RLS deny-all dan tanpa CRUD langsung anon/authenticated pada kedua tabel. Wrapper `program_draft_workflow` adalah invoker authenticated-only; implementasi definer privat memakai search_path kosong serta guard sesi database/admin. Mutasi mengambil lock administrasi yang sama, memeriksa sesi/admin ulang, lalu memeriksa versi. Helper validator privat/pure tidak mendapat izin eksekusi langsung aplikasi.

Replay request_id yang sama dari aktor sama dengan operation, versi asal, document dan alasan yang sama mengembalikan versi yang sudah tercatat. Isi berbeda menjadi konflik. Revisi dari tab lama ditolak ketika versi terbaru sudah bergerak; tidak melakukan last-write-wins. Nonce form disimpan dalam state client agar tidak berganti hanya karena parent render ulang. Input dikendalikan React dan dipertahankan pada error; UI menawarkan pemeriksaan riwayat di tab baru. Jika koneksi terputus setelah commit, pengguna dapat memeriksa riwayat dan mengulang isi/kode permintaan yang sama. Muat ulang halaman membentuk permintaan baru.

Trigger audit teknis mencatat operasi root/snapshot ke `private.simulation_audit` tanpa menyalin document atau alasan. Pembaca audit administrasi umum masih memakai whitelist delapan jenis objek sebelumnya; riwayat program lengkap dibaca di modul program sendiri. Integrasi jenis objek baru ke pembaca audit umum masih tersisa.

Tidak ada seed program, penetapan evaluator, role baru, migrasi pengajuan lama atau perubahan fungsi keputusan/dana. Tipe TypeScript dihasilkan dari schema nyata. Total 23 migrasi dan 22 tabel public dengan RLS. Tidak memerlukan dependency/environment baru atau deployment ulang Edge.

## Batas akses, histori dan privasi

- Halaman/list/detail dan semua Server Action memerlukan admin aktif; database mengulang guard. Warga, reviewer atau mandat jabatan tanpa admin tidak menerima akses otomatis.
- Proposal adalah data internal penyusunan, bukan form data warga. Nama aktor yang disimpan adalah snapshot profil saat aksi, bukan verifikasi identitas institusi. Gunakan ID aktor untuk rujukan atribusi.
- Snapshot hanya bertambah melalui API. Ini bukan log kriptografis/tahan manipulasi oleh administrator database berprivilege. Retensi/penghapusan operasional D-13 belum ditetapkan.
- Halaman dynamic dan proxy `/admin/:path*` private/no-store. Hanya form interaktif yang menjadi Client Component; pembaca/riwayat tetap Server Component. Tidak ada autosave, ekspor, polling atau aktivasi.
- List/history memakai offset dengan urutan stabil; penambahan versi/draf antar-request dapat menggeser halaman. Satu pembacaan details mengambil current/selected/history dalam statement SQL yang sama. Ini tidak menjanjikan snapshot MVCC yang bertahan lintas navigasi.

## Verifikasi

Lint, TypeScript Next.js/Edge dan build produksi diperiksa. Metadata memastikan dua tabel RLS/tanpa CRUD aplikasi, CHECK state draft, FK current-version deferred, wrapper invoker dan helper/guard/grant privat. Hash ketiga fungsi dicocokkan dengan file migrasi. Security advisor tetap hanya peringatan lama [proteksi password bocor belum aktif](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Tes unit, SQL skenario, HTTP, browser dan UAT tetap ditunda sesuai arahan pengguna. Tidak membuat draf program/versi contoh, fixture, akun, mandat atau keputusan QA. Tidak memanggil operasi workflow sebagai pengguna. Build/migrasi/metadata tidak membuktikan cabang simpan, retry, konkurensi, izin maupun UI sudah lulus. Vercel belum dideploy pada milestone ini.

- [ ] Anon/warga/reviewer/non-admin ditolak pada halaman, action, RPC/helper dan tabel langsung; sesi/peran dicabut/kedaluwarsa ditolak, termasuk saat menunggu lock.
- [ ] Buat draf dengan isian opsional kosong tetap null/belum diusulkan. False dan skor 0 dibaca benar. Tidak ada nilai/pengesahan/aktivasi bawaan.
- [ ] Kode unik/tetap, tanggal aktual/leap-day/rentang terbalik, field tambahan/tipe salah, karakter kontrol dan panjang Unicode dibatasi pada action dan database.
- [ ] Dua tab/admin menyimpan versi asal sama hanya menghasilkan satu revisi berikutnya. Replay identik tidak menggandakan versi; replay berbeda ditolak; rollback tidak meninggalkan root tanpa snapshot.
- [ ] Riwayat lama tidak dapat ditulis ulang lewat API; pilihan versi, perbedaan nilai, actor/nama snapshot, alasan dan waktu sesuai rekaman. Tanpa perubahan data tidak membuat versi kosong.
- [ ] Timeout setelah commit, input/error, nonce yang tetap, tab riwayat baru dan navigasi versi terbaru ditangani tanpa menimpa usulan admin lain.
- [ ] Tabel baru tidak memengaruhi submit/review/panel/fisik/dana, termasuk ketika semua usulan terisi atau mencoba state aktif melalui request buatan.
- [ ] Keyboard, details, label/error, date/select, layar kecil, cache privat dan teks master berisi markup diperiksa manusia.

Backlog lengkap: [PRD_BACKLOG.md](PRD_BACKLOG.md).
