// Membuat 1 akun Super Admin (BRIDA_ADMIN) lewat service_role. Jalankan SEKALI per lingkungan:
//   node --env-file=.env.local scripts/seed-super-admin.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || "";
if (!url || !key || !email || password.length < 12) {
  console.error("Isi NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_ADMIN_EMAIL, dan SEED_ADMIN_PASSWORD (min. 12 karakter) di .env.local.");
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: "Super Admin BRIDA" } });
let id = created.data?.user?.id;
if (!id) {
  if (created.error?.code !== "email_exists") { console.error("Gagal membuat akun:", created.error?.message); process.exit(1); }
  const { data } = await admin.from("users").select("id").eq("email", email).maybeSingle();
  id = data?.id;
  if (!id) { console.error("Email sudah ada di Auth tetapi belum ada baris public.users."); process.exit(1); }
}
const { error } = await admin.from("users").update({ role: "BRIDA_ADMIN", status: "AKTIF", is_verified: true, name: "Super Admin BRIDA" }).eq("id", id);
if (error) { console.error("Gagal mengangkat menjadi BRIDA_ADMIN:", error.message); process.exit(1); }
await admin.from("audit_logs").insert({ aktor_id: id, aksi: "SUPER ADMIN DI-SEED", target: `users/${id}`, detail_json: {} });
console.log(`Super Admin siap: ${email}`);
