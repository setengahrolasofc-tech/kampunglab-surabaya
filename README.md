# KampungLab Surabaya

Website tata kelola inovasi warga: pengajuan, verifikasi berjenjang, uji warga, dan Evidence Passport. KampungLab mencatat keputusan dan realisasi dana; transfer uang dilakukan di luar platform oleh pihak berwenang.

**Status saat ini: fondasi proyek.** Tersedia halaman pengantar dan panduan alur. Pengajuan, autentikasi, database, uji warga, dan pencairan belum diimplementasikan. Belum terhubung ke Supabase atau dideploy ke Vercel.

## Teknologi

- Next.js App Router dan TypeScript.
- React Server Components untuk halaman informasi.
- Tailwind CSS, ESLint, dan npm lockfile.
- Target berikutnya: Supabase untuk auth/database/storage dan Vercel untuk hosting.

Versi dependency tercatat di `package.json` dan `package-lock.json`. Repository publik; field `private: true` pada `package.json` mencegah publikasi package npm dan tidak mengubah visibilitas GitHub.

## Membuka di Antigravity

Gunakan Node.js 24 dan Git. Pada terminal di folder tempat menyimpan proyek:

```bash
git clone https://github.com/setengahrolasofc-tech/kampunglab-surabaya.git
cd kampunglab-surabaya
npm ci
npm run dev
```

Buka folder `kampunglab-surabaya` di Antigravity, kemudian buka [localhost:3000](http://localhost:3000). Fondasi ini belum memerlukan akun Supabase atau file environment.

Setelah perubahan berikutnya sudah masuk GitHub, jalankan dari folder proyek:

```bash
git pull --ff-only
npm ci
```

Jika ada perubahan lokal, periksa `git status` dan selesaikan terlebih dahulu. Jangan menimpa perubahan dengan reset paksa. Hentikan dan jalankan ulang server lokal bila dependency berubah.

## Pemeriksaan

```bash
npm run lint
npm run typecheck
npm run build
```

`typecheck` menghasilkan tipe rute Next.js sebelum menjalankan TypeScript. `build` membuat hasil produksi; `npm run start` menjalankan hasil build tersebut. Pemeriksaan otomatis tidak menggantikan UAT tampilan dan interaksi oleh pengguna.

## Struktur

```text
src/app/             Halaman, layout, metadata, dan style global
src/components/      Komponen tampilan bersama
public/              Aset publik yang aman ditampilkan
docs/                Status proyek dan catatan implementasi
PRD_KampungLab_Surabaya_v1.md  Kebutuhan produk dan keputusan tertunda
AGENTS.md            Petunjuk pengembangan untuk AI
```

## Dokumen acuan

- [PRD sistem](PRD_KampungLab_Surabaya_v1.md): baca sebelum menambah aturan bisnis.
- [Status proyek](docs/PROJECT_STATUS.md): yang tersedia, belum diimplementasikan, dan belum diverifikasi.
- [Petunjuk AI](AGENTS.md): aturan teknis dan batas pengembangan.

Angka plafon, durasi, dan skema 30/50/20 dari handbook merupakan usulan kebijakan. Jangan menampilkannya sebagai ketetapan resmi Pemkot. Keputusan `D-01` sampai `D-24` pada PRD belum otomatis disetujui.

## Konfigurasi berikutnya

1. Pilih project Supabase dan akun yang benar sebelum membuat schema atau migrasi.
2. Sepakati model mandat akun dan keputusan yang menghambat milestone terkait.
3. Susun schema, kebijakan akses, serta migrasi dari kondisi proyek yang benar-benar tersedia.
4. Siapkan project Vercel dan environment; verifikasi akses repository untuk build/deploy.
5. Implementasikan fitur bertahap dan laporkan verifikasi yang benar-benar dilakukan.

Jangan commit `.env`, secret key, kredensial, data warga, SK, atau bukti keuangan. Contoh environment nanti hanya memuat nama variabel dan placeholder. Jangan memakai database produksi untuk demo/preview.

Brand dan tampilan fondasi bersifat sementara. Tidak ada klaim afiliasi resmi atau pengelolaan dana pemerintah yang telah berjalan.
