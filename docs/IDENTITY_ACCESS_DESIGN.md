# Identitas dan mandat jabatan

Keputusan pengguna, 30 Oktober 2026: setiap orang memakai akun pribadi. Warga dapat mendaftar sendiri; hak RT/RW/kelurahan, reviewer/fasilitator, dan admin diberikan melalui penugasan berwenang. Jabatan bertahan ketika pemegangnya berganti. Ini menyelesaikan bagian model identitas pada D-18, bukan seluruh keputusan pada baris tersebut.

## Cakupan milestone

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

Penulisan jabatan/mandat saat ini hanya melalui jalur pengelola database terpercaya; UI admin dan RPC pemberian hak belum tersedia. Tidak ada admin yang ditetapkan otomatis dari pendaftar pertama, email tertentu, atau user_metadata. Bootstrap admin pertama memerlukan identitas pengguna yang sudah diverifikasi pemilik program. Tidak ada pejabat atau wilayah operasional fiktif yang di-seed.

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
