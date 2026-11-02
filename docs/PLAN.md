# Rencana singkat

## Struktur folder
```
src/app/            halaman (App Router): (publik) / papan-masalah / etalase / rapor/[id] / survei/[kode] / masuk / daftar,
                    dashboard/inovator, dashboard/kelurahan, dashboard/brida, notifikasi
src/components/     Logo, komponen UI bersama
src/lib/supabase/   server.ts (sesi + RLS), admin.ts (service role, server saja), client.ts
src/lib/domain/     aturan murni (plafon, ambang kelayakan, hash rapor) + tes
supabase/migrations skema, RLS, fungsi alur kerja (001-004 = tahap a)
supabase/tests      tes asap SQL
scripts/            seed akun contoh
```

## Daftar halaman
| Kelompok | Halaman |
|---|---|
| Publik | Beranda, Papan Masalah (filter kecamatan/tema, tombol WA), Etalase + detail Rapor, Verifikasi QR `/rapor/{id}?h=`, Survei warga `/survei/{kode}`, Masuk/Daftar |
| Inovator | Ringkasan, Form pengajuan (tim 2-6, RAB, 4 dokumen), Logbook & dana, Panel Uji (Siap Uji, Poster QR, hasil real-time), Serah terima, Banding & Lapor Kendala |
| Kelurahan (bermandat) | Papan Masalah, Antrean pengajuan (Setuju/Revisi/Tolak), Monitoring Logbook & uji, Catat transfer Tahap 1-3, Keputusan pasca uji, Validasi BAST/Panduan/LPJ, Lapor Kendala. Sebelum mandat: hanya halaman "Menunggu verifikasi BRIDA" |
| Admin BRIDA | Antrean Mandat, Kelurahan Belum Bermandat (+filter kecamatan), Notifikasi, Parameter, Banding & sengketa, Blacklist, Statistik, Audit log |

## Urutan build
(a) skema + RLS + seed **[selesai]** · (b) auth 3 peran + status akun · (c) antrean mandat + notifikasi + widget · (d) pengajuan sampai Tahap 1 ·
(e) logbook, survei, evaluasi 4 standar, keputusan · (f) serah terima, Tahap 3, Rapor, Etalase · (g) banding, sengketa, blacklist, audit.

## Cara pengamanan (ringkas)
- Klien hanya punya hak kolom yang boleh diubah; status, mandat, pencairan, dan keputusan HANYA lewat fungsi alur kerja milik owner.
- Mesin status di database: tabel `innovation_transitions` + trigger; UI hanya mencerminkan.
- Peran BRIDA hanya lewat `app_metadata` (Admin API setelah kode undangan benar).
