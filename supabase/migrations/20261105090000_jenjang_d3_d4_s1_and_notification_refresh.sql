-- 1) Jenjang mahasiswa dipisah: D3, D4, S1. Nilai lama MAHASISWA_DIPLOMA_S1 tetap ada agar data lama valid
--    (tidak ditawarkan lagi di formulir). ADD VALUE tidak dapat dipakai di transaksi yang sama, jadi tidak dipakai di sini.
alter type public.education_level add value if not exists 'MAHASISWA_D3' after 'SMA_SMK';
alter type public.education_level add value if not exists 'MAHASISWA_D4' after 'MAHASISWA_D3';
alter type public.education_level add value if not exists 'MAHASISWA_S1' after 'MAHASISWA_D4';

-- 2) Pastikan API Supabase mengenali fungsi notifikasi (cache skema yang usang membuat tombol "tandai dibaca" gagal tanpa pesan).
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
notify pgrst, 'reload schema';
