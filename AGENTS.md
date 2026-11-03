<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## KampungLab project rules (Handbook Rev. 4)

- Sumber kebenaran produk: Handbook Rev. 4 (`HANDBOOK_KAMPUNGLAB (REV 4).docx`, di luar repo) dan `ASSUMPTIONS.md`. Dokumen alur lama (RT -> RW -> Panel) ada di `docs/arsip-alur-lama/` dan TIDAK berlaku.
- Hanya 3 role login: INNOVATOR, KELURAHAN, BRIDA_ADMIN. Tidak ada akun RT/RW/Panel/Warga. Warga penguji mengisi survei bawaan tanpa akun.
- Website TIDAK menyimpan atau memindahkan uang. Jangan menambah dompet, payment gateway, atau pencairan otomatis; hanya mencatat bukti transfer.
- Status pengajuan hanya berubah lewat fungsi RPC di database (`app.set_status`, tabel `innovation_transitions`, trigger `guard_innovation_status`). Jangan menulis UPDATE status dari aplikasi. Bila menambah transisi, ubah SQL (migrasi baru) DAN `src/lib/domain/workflow.mjs`; `tests/domain.test.mjs` memeriksa keduanya identik.
- Role yang dipilih saat pendaftaran bukan otorisasi: Kelurahan hanya berwenang bila punya mandat aktif (`kelurahan_mandates`) dan akun AKTIF; BRIDA hanya lewat kode undangan server.
- Aturan bisnis (plafon, 30-30-40, ambang kelayakan, tim 2-6) dibaca dari `system_parameters`; jangan menanam angka baru di UI tanpa menambah parameter.
- Repositori ini publik. Jangan commit rahasia (`SUPABASE_SERVICE_ROLE_KEY`, `BRIDA_INVITE_CODE`, `IP_HASH_SALT`), data peserta nyata, dokumen identitas, atau bukti keuangan.
- Baca dokumentasi Next.js yang terpasang untuk API yang dipakai. Versi dependensi eksak; commit `package-lock.json`.
- Server Component secara bawaan; client component hanya untuk interaksi nyata. Server Action wajib `async function` (bukan arrow const).
- Jalankan lint, typecheck, build, `npm test`, dan `npm run test:db`. Laporkan verifikasi browser/UAT, database sungguhan, dan deployment secara terpisah dan jujur.
- Teks antarmuka berbahasa Indonesia. Warna dan logo mengikuti Bab 8.4 dan 8.5 handbook (token di `src/app/globals.css`).
