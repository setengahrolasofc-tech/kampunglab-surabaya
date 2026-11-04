# Kode OTP tidak terkirim: pemeriksaan

Urutan dari penyebab paling mungkin. Setelah perbaikan kode ini, pesan error di halaman Daftar/Lupa kata sandi menyebut penyebabnya, dan detail teknisnya tercatat di log server dengan awalan `[auth:...]`.

## 1. Trigger pendaftaran bentrok (penyebab di repo ini)
Pendaftaran membuat baris di `auth.users`; trigger database lalu membuat `public.users`. Jika trigger itu gagal, Supabase membatalkan pendaftaran ("Database error saving new user") dan **email OTP tidak pernah dikirim**.

Cek di SQL Editor:
```sql
select tgname, tgenabled from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal order by 1;
```
Yang benar hanya: `initialize_user_profile` dan `kampunglab_rev4_new_user`. Bila ada `on_auth_user_created` atau `on_auth_user_email_changed`, itu sisa skema tahap (a) lama: terapkan migrasi `20261103000000_remove_stage_a_schema.sql`, lalu `20261103090000_rev4_core.sql` (`supabase db push`).

Cek apakah skema Rev. 4 terpasang: `select to_regprocedure('app.on_auth_user_created()');` harus tidak null.

## 2. Email bawaan Supabase terbatas
Layanan email bawaan hanya mengirim sedikit email per jam dan **hanya ke anggota tim proyek**. Gejala: kode `over_email_send_rate_limit` atau `email_address_not_authorized`. Solusi: Authentication → SMTP Settings → isi SMTP sendiri (Resend, Brevo, Gmail SMTP, dll).

## 3. Template email harus menampilkan kode
Authentication → Email Templates: **Confirm signup**, **Reset password**, dan **Magic Link** harus memuat `{{ .Token }}` (template siap pakai di `docs/email-templates/`). Tanpa itu email berisi tautan, bukan kode.

## 4. Panjang kode
Aplikasi menunggu 6 digit (`OTP_LENGTH` di `src/lib/auth/validation.mjs`). Samakan dengan Authentication → Providers → Email → "Email OTP Length".

## 5. Konfirmasi email
Authentication → Providers → Email → "Confirm email" harus aktif agar `signUp` mengirim kode.

## Melihat penyebab sebenarnya
Dashboard Supabase → Logs → Auth: cari baris pada waktu pendaftaran. Error `500 ... Database error saving new user` = butir 1; `429` = batas kirim (butir 2).
