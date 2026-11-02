// Membuat akun contoh lewat Supabase Admin API (trigger pendaftaran mengisi public.users).
// Jalankan: npm run seed:accounts  (butuh SUPABASE_SERVICE_ROLE_KEY di .env.local)
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local"); process.exit(1); }
const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const sa = { email: process.env.SEED_SUPERADMIN_EMAIL ?? "superadmin@kampunglab.local", password: process.env.SEED_SUPERADMIN_PASSWORD ?? "GantiPasswordIni123!" };
const { data: kel } = await admin.from("master_kelurahan").select("id").eq("kelurahan", "Gubeng").limit(1).single();

const accounts = [
  { ...sa, app: { kl_role: "BRIDA_ADMIN", kl_super_admin: "true" }, meta: { name: "Super Admin BRIDA" } },
  { email: "inovator@kampunglab.local", password: "Inovator123!", app: {}, meta: { name: "Tim Inovator Contoh", role: "INNOVATOR", phone_wa: "081200000001", institusi: "Universitas Contoh", kota_domisili: "Surabaya" } },
  { email: "lurah.gubeng@kampunglab.local", password: "Lurah12345!", app: {}, meta: { name: "Lurah Gubeng Contoh", role: "KELURAHAN", nip: "198001012005011001", jabatan: "Lurah", phone_wa: "081200000002", kelurahan_id: kel?.id } },
];
for (const a of accounts) {
  const { error } = await admin.auth.admin.createUser({ email: a.email, password: a.password, email_confirm: true, app_metadata: a.app, user_metadata: a.meta });
  console.log(error ? `GAGAL ${a.email}: ${error.message}` : `OK    ${a.email}`);
}
console.log("\nAkun Kelurahan contoh berstatus MENUNGGU_MANDAT sampai Admin BRIDA memberi mandat (tahap c).");
