# KampungLab Surabaya

Website tata kelola inovasi warga: pengajuan, verifikasi berjenjang, uji warga, dan Evidence Passport. KampungLab mencatat keputusan dan realisasi dana; transfer uang dilakukan di luar platform oleh pihak berwenang.

**Status saat ini: akun pribadi dan fondasi mandat jabatan.** Daftar/masuk email-password, callback konfirmasi, pemulihan kata sandi, dashboard pribadi, edit nama, dan keluar akun telah diimplementasikan. Database profil, wilayah, jabatan, mandat, role grant, serta audit privat telah dibuat dengan RLS. Pengajuan, penilaian, dana, dan uji warga belum diimplementasikan. Google OAuth, UI pengelolaan mandat, dan deployment Vercel masih pekerjaan berikutnya. UAT email dan tampilan akun belum selesai.

## Teknologi

- Next.js App Router dan TypeScript.
- React Server Components untuk halaman informasi.
- Tailwind CSS, ESLint, dan npm lockfile.
- Supabase Auth SSR berbasis cookie, database identitas dengan RLS, dan SDK publik tanpa privilege admin.
- Target hosting: Vercel.

Versi dependency tercatat di `package.json` dan `package-lock.json`. Repository publik; field `private: true` pada `package.json` mencegah publikasi package npm dan tidak mengubah visibilitas GitHub.

## Membuka di Antigravity

Gunakan Node.js 24 dan Git. Pada terminal di folder tempat menyimpan proyek:

```bash
git clone https://github.com/setengahrolasofc-tech/kampunglab-surabaya.git
cd kampunglab-surabaya
npm ci
npm run dev
```

Buka folder `kampunglab-surabaya` di Antigravity, kemudian buka [localhost:3000](http://localhost:3000). Halaman informasi belum memerlukan file environment. Untuk memeriksa koneksi Supabase, ikuti [panduan konfigurasi](docs/SUPABASE_SETUP.md) dan buat `.env.local` di root proyek.

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
npm test
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
- [Konfigurasi Supabase](docs/SUPABASE_SETUP.md): proyek yang dipilih, environment lokal, dan pemeriksaan hanya-baca `npm run check:supabase`.
- [Desain identitas/mandat](docs/IDENTITY_ACCESS_DESIGN.md): keputusan D-18 yang disetujui, hak akses, dan batas milestone.
- [UAT akun](docs/AUTH_UAT.md): langkah pengujian email, sesi, profil, dan batas verifikasi.
- [Admin dan akses](docs/ADMIN_UAT.md): penetapan peran/mandat, wilayah/jabatan, pencabutan, audit, dan verifikasi.
- [Profil wilayah dan draf](docs/DRAFTS_UAT.md): pengisian empat langkah, RAB sementara, simpan/edit, dan batas akses pribadi.
- [Simulasi dan antrean RT](docs/SIMULATION_UAT.md): pengiriman salinan DEMO, pembacaan sesuai mandat, catatan awal RT, dan persiapan dua akun untuk UAT.

Angka plafon, durasi, dan skema 30/50/20 dari handbook merupakan usulan kebijakan. Jangan menampilkannya sebagai ketetapan resmi Pemkot. Keputusan `D-01` sampai `D-24` pada PRD belum otomatis disetujui.

## Konfigurasi berikutnya

1. Gunakan proyek Supabase yang sudah dipilih dan tercatat pada panduan konfigurasi; jangan membuat proyek duplikat.
2. Uji daftar/masuk lewat email pribadi dan pastikan callback tetap sesuai origin aplikasi.
3. Admin pertama sudah ditetapkan atas instruksi pemilik setelah akun terverifikasi. Buka `/admin` dari dashboard untuk pengelolaan akses; data wilayah resmi dan dokumen mandat tetap perlu disiapkan pemilik. Tidak ada pendaftar yang mendapat admin otomatis.
4. Siapkan project Vercel dan environment; verifikasi akses repository untuk build/deploy.
5. Profil wilayah dan draf empat langkah tersedia pada `/profil/wilayah` dan `/pengajuan`. Uji dengan katalog DEMO yang jelas berlabel; master resmi dan pengiriman final tetap perlu disiapkan sebelum operasional.

Jangan commit `.env`, secret key, kredensial, data warga, SK, atau bukti keuangan. Contoh environment nanti hanya memuat nama variabel dan placeholder. Jangan memakai database produksi untuk demo/preview.

Brand dan tampilan fondasi bersifat sementara. Tidak ada klaim afiliasi resmi atau pengelolaan dana pemerintah yang telah berjalan.
