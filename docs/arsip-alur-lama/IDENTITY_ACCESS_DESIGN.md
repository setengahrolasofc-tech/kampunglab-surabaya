# Identitas dan mandat jabatan

Keputusan pengguna, 30 Oktober 2026: setiap orang memakai akun pribadi. Warga dapat mendaftar sendiri; hak RT/RW/kelurahan, reviewer/fasilitator, dan admin diberikan melalui penugasan berwenang. Jabatan bertahan ketika pemegangnya berganti. Ini menyelesaikan bagian model identitas pada D-18, bukan seluruh keputusan pada baris tersebut.

## Cakupan fondasi akun

Daftar/masuk email dan password, konfirmasi email melalui PKCE callback, permintaan reset password, ubah password untuk pengguna terautentikasi, keluar akun melalui POST Server Action, profil sendiri, serta dashboard pribadi. Google OAuth menunggu konfigurasi provider dan tetap pekerjaan lanjutan. Perubahan ini tidak menonaktifkan konfirmasi email atau mengubah konfigurasi pengiriman email Supabase.

## Data

| Entitas | Fungsi | Akses aplikasi tahap ini |
|---|---|---|
| profiles | Identitas pribadi minimal, nama tampilan | Baca sendiri; hanya nama tampilan dapat diubah sendiri |
| territories | Kelurahan, RW, RT dengan parent yang sesuai | Baca pengguna login; penulisan hanya pengelola terpercaya |
| offices | Jabatan RT/RW/kelurahan pada wilayah | Baca pengguna login; penulisan hanya pengelola terpercaya |
| office_mandates | Orang, jabatan, utama/cadangan/delegasi, periode, referensi surat, pencabutan | Baca mandat sendiri; tidak ada pemberian mandat mandiri |
| platform_role_grants | Penetapan program_admin/reviewer/facilitator beserta periode | Baca penetapan sendiri; tidak ada pemberian hak mandiri |
| private.identity_audit_events | Jejak perubahan profil dan penetapan, tanpa email/password/isi surat | Tidak diekspos melalui API aplikasi |

Tidak ada kolom role pada profiles. Metadata pendaftaran hanya boleh mengisi nama tampilan. Reviewer/fasilitator tetap membutuhkan penugasan pada objek pengajuan/misi ketika modul tersebut dibangun; label peran global tidak memberi izin membaca semua pengajuan.

RLS dan grant mencegah pengguna mengubah ID, waktu pembuatan, jabatan, role grant, dan audit. Semua tabel public memakai RLS. Tabel wilayah tidak berisi identitas pribadi. Bukti SK mentah/bucket belum dibuat; referensi penetapan hanya dibaca pemilik mandat.

Masa berlaku memakai interval [mulai, akhir). Delegasi wajib memiliki akhir; mandat utama/cadangan dapat berakhir terbuka sampai dicabut. Exclusion constraints mencegah dua pemegang utama atau cadangan yang periodenya bertumpuk pada jabatan sama, termasuk permintaan bersamaan. Orang yang sama tidak dapat menjadi utama dan cadangan bersamaan pada jabatan yang sama. Penggantian mempertahankan baris lama dan membuat penetapan baru.

Halaman `/admin` menyediakan pencarian akun lewat email lengkap, pemberian/pencabutan peran, pemberian/pencabutan mandat, pembuatan wilayah/jabatan, dan 30 audit perubahan akses terbaru. Akun tujuan wajib aktif dan email terkonfirmasi. Identitas pemilik telah dicocokkan dengan dashboard dan Auth; admin pertama ditetapkan melalui instruksi eksplisit pengguna pada 30 Oktober 2026, bukan berdasarkan urutan pendaftar atau metadata. Identitas pribadi bootstrap tidak disimpan dalam migration atau kode publik. Tidak ada pejabat atau wilayah operasional fiktif yang di-seed.

## Administrasi akses

- `is_program_admin` dan `admin_access` adalah wrapper SECURITY INVOKER. Implementasi definer disimpan di schema private, search_path kosong, EXECUTE hanya untuk authenticated. Setiap jalur internal tetap memeriksa izin; pemanggilan langsung tidak melewati guard.
- Schema private mendapat USAGE untuk wrapper; semua tabel audit tetap tanpa SELECT/INSERT/UPDATE/DELETE bagi aplikasi. Fungsi trigger tetap tanpa EXECUTE bagi aplikasi. Tidak ada grant tulis tabel peran/mandat atau direktori profil umum.
- Izin admin diperiksa dari tabel penetapan, tanggal server, akun terkonfirmasi/tidak diblokir, serta session_id yang masih tercatat dan belum kedaluwarsa di auth.sessions. JWT/user_metadata atau menu yang tersimpan di browser tidak cukup.
- Mutasi diserialkan dengan transaction advisory lock, kemudian hak admin diperiksa lagi setelah mendapat lock. Exclusion constraints tetap menjadi pengaman tumpang tindih periode.
- `granted_by` selalu berasal dari auth.uid(), bukan dari form. Pemberian membutuhkan referensi dasar penetapan dan konfirmasi bahwa identitas/kewenangan telah diperiksa; ini bukan pengganti verifikasi SK oleh manusia.
- Admin tidak dapat menambah atau mencabut grant program_admin miliknya sendiri melalui aplikasi. Admin aktif lain atau pengelola database berwenang diperlukan untuk perubahan itu. Ini perlindungan operasional prototipe, bukan pengesahan kebijakan multi-peran yang belum disepakati.
- Pencabutan membutuhkan alasan dan mempertahankan baris historis. Audit merekam whitelist perubahan sebelum/sesudah tanpa email, password, nama profil, atau isi SK. Tidak ada antarmuka hapus audit.
- Waktu formulir menggunakan WIB secara eksplisit dan disimpan sebagai timestamptz. UI menampilkan 500 wilayah/jabatan dan 100 penetapan terbaru per jenis untuk akun terpilih; pagination/import skala kota belum tersedia.
- Master kelurahan → RW → RT divalidasi database. Jabatan diturunkan jenisnya dari wilayah. Referensi dokumen tersedia sebagai teks; unggah/penyimpanan berkas SK dan workflow permohonan peran belum dibangun.
- Peran reviewer/fasilitator belum memberi akses global ke pengajuan. Modul objek dan penugasan per pengajuan/misi masih pekerjaan berikutnya.

## Sesi dan alur email

- SSR cookie-aware client dibuat per request; proxy me-refresh sesi hanya pada rute yang memakai Auth.
- Halaman dan Server Action terlindungi memanggil getUser untuk memeriksa identitas terkini di Auth server.
- Dashboard membaca data melalui token pengguna dan RLS, tanpa secret/service-role key.
- Respons rute Auth/dashboard diberi Cache-Control private, no-store. Cookie/cache headers dari refresh dipertahankan.
- Callback menerima code dan hanya mengizinkan tujuan /dashboard atau /ubah-kata-sandi; token tidak dibawa ke URL tujuan atau dicatat di log.
- NEXT_PUBLIC_APP_URL adalah origin terpercaya dari konfigurasi, bukan Host/header yang dikirim pengunjung. Default lokal http://localhost:3000; deployment harus mengaturnya dengan benar dan memasukkan callback pada redirect allowlist Supabase.
- Form memakai validasi server, status pending, pesan umum untuk kegagalan kredensial, dan respons reset yang tidak mengungkap apakah email terdaftar. Password tidak dikembalikan dalam state aksi atau log.

## Batas verifikasi

Tes database dijalankan dengan identitas sintetis dan di-rollback. Pengiriman email nyata serta alur membuka link di browser memerlukan UAT pemilik akun; tidak boleh diklaim lulus berdasarkan tes unit. Pengiriman email mengikuti konfigurasi dan batas Supabase yang berlaku; SMTP/provider khusus belum disiapkan. Konfirmasi PKCE sebaiknya dibuka pada browser yang digunakan mendaftar. Pengujian autentikasi tidak mengesahkan kebijakan wilayah, skor, dana, atau consent penguji yang masih tertunda.
