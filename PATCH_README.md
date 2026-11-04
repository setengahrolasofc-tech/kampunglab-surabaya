# Patch UI KampungLab Surabaya (hanya file yang berubah)

Salin isi zip ini ke folder utama proyek (timpa file yang sama). Struktur folder sudah sesuai proyek.

## File baru / diganti
| Path | Isi |
|---|---|
| `src/app/page.tsx` | Beranda baru: hero layar penuh (mockup LANDING PAGE + "2"), strip jalur, Apa itu KampungLab?, Fitur Utama, banner ajakan, footer |
| `src/app/layout.tsx` | Font Poppins + Montserrat (logo), header/footer global disembunyikan di `/` dan `/dashboard*` |
| `src/app/globals.css` | Font Poppins dan token warna mockup |
| `src/app/dashboard/layout.tsx` | Kerangka sidebar + topbar untuk Inovator |
| `src/app/dashboard/page.tsx` | Beranda dashboard sesuai mockup (banner, 4 statistik, status proyek, pengumuman, akses cepat, insight) |
| `src/app/dashboard/proyek/page.tsx` | Menu "Proyek Saya": daftar proyek lama (dipindah dari dashboard lama) |
| `src/components/` | `logo.tsx` (varian hero + logo rumah), `icons.tsx`, `landing-header.tsx`, `hero-slides.tsx`, `chrome-visibility.tsx`, `dashboard-shell.tsx`, `sidebar-nav.tsx` |
| `public/images/` | 6 gambar (hero kabut, hero fajar, ilustrasi warga, banner, dll.) |
| `rapikan-file-lama.sh` | Memindahkan 7 tes alur lama + `simulation-fixture.mjs` ke `tests/arsip-alur-lama/`, dan menghapus dokumen dobel di `docs/` |

## Cara pakai
1. Salin isi zip ke proyek, lalu jalankan `sh rapikan-file-lama.sh` dan `npm test`.
2. `npm run dev` untuk melihat hasilnya. Build butuh internet (font dari Google Fonts); di Vercel otomatis.

## Yang perlu kamu tahu
- **Foto dari mockup, bukan file asli.** Latar hero diambil dari gambar yang kamu kirim, teks dan tombolnya dihapus. Resolusinya 1366 px, jadi di layar besar agak lembut. Gambar lain (`warga-ilustrasi`, `banner-cta`, `banner-dashboard`, `proyek-thumb`) dipotong dari `3.png`. Timpa dengan file asli beresolusi tinggi **dengan nama yang sama** di `public/images/`.
- **Header**: di puncak hanya logo (sesuai mockup). Setelah digulir menjadi bilah putih bersudut membulat dengan menu Beranda, Program, Inovasi, Tentang Kami, dan Login (menu ditambahkan agar situs tetap bisa dinavigasi).
- **Hero** bergantian antara dua foto tiap 7 detik (mati bila perangkat meminta gerak dikurangi).
- **Dashboard memakai data asli**: total/dalam proses/selesai dari pengajuanmu, partisipasi warga dan kepuasan dari hasil uji, tren dari jumlah responden per bulan, pengumuman dari notifikasi. Persentase progres dihitung dari fase (bukan input manual). Foto proyek masih gambar tetap.
- Bagian lama di beranda (Lima fase, Program dalam angka) tidak ada di mockup, jadi dihapus dari beranda. Datanya (`public_stats`) tidak berubah dan bisa dipakai lagi di halaman lain.
- Menu sidebar "Papan Masalah", "Data & Laporan" (ke Etalase), "Panduan", dan "Pengaturan" (ubah kata sandi) membuka halaman yang sudah ada; di sana header global tampil seperti biasa.
- Migrasi Supabase lama **tidak disentuh**: kalau database di Supabase sudah memakai migrasi itu, menghapusnya dari repo bisa membuat `db push` gagal.

## Pemeriksaan yang sudah dilakukan
`tsc --noEmit` dan ESLint bersih; `next build` berhasil (font distub karena tanpa internet); beranda dan dashboard dirender dan dibandingkan dengan mockup pada 1366×768 dan 390 px. Belum diuji dengan Supabase sungguhan.
