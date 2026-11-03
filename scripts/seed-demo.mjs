// Membuat akun contoh untuk menguji setiap role. HANYA untuk lingkungan pengembangan/staging.
//   node --env-file=.env.local scripts/seed-demo.mjs
// Akun (password = SEED_DEMO_PASSWORD, min. 12 karakter):
//   inovator@demo.kampunglab.test          INNOVATOR
//   inovator2@demo.kampunglab.test         INNOVATOR (untuk uji sengketa/banding)
//   lurah.airlangga@demo.kampunglab.test   KELURAHAN Airlangga, kecamatan Gubeng  -> diberi mandat UTAMA
//   staf.airlangga@demo.kampunglab.test    KELURAHAN Airlangga                    -> diberi mandat CADANGAN
//   lurah.mojo@demo.kampunglab.test        KELURAHAN Mojo, Gubeng                 -> MENUNGGU_MANDAT (untuk uji antrean mandat)
// Kelurahan Kertajaya (Gubeng) sengaja dibiarkan tanpa akun: kirim pengajuan ke sana untuk menguji WAITING_KELURAHAN_MANDATE.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_DEMO_PASSWORD || "";
if (!url || !key || password.length < 12) { console.error("Isi NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan SEED_DEMO_PASSWORD (min. 12 karakter)."); process.exit(1); }
if (/\.supabase\.co/.test(url) && process.env.ALLOW_DEMO_SEED !== "1") {
  console.error("Ini akan membuat akun contoh di proyek Supabase hosted. Set ALLOW_DEMO_SEED=1 bila memang disengaja (staging)."); process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function kelurahanId(kecamatan, kelurahan) {
  const { data } = await admin.from("master_kelurahan").select("id").eq("kecamatan", kecamatan).eq("kelurahan", kelurahan).single();
  return data.id;
}
async function makeUser(email, meta) {
  const r = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
  if (r.data?.user) return r.data.user.id;
  if (r.error?.code === "email_exists") { const { data } = await admin.from("users").select("id").eq("email", email).single(); return data.id; }
  throw new Error(`${email}: ${r.error?.message}`);
}

const airlangga = await kelurahanId("Gubeng", "Airlangga");
const mojo = await kelurahanId("Gubeng", "Mojo");
await makeUser("inovator@demo.kampunglab.test", { display_name: "Rani Inovator", role: "INNOVATOR", phone_wa: "081234567890", institusi: "UNESA", kota_domisili: "Sidoarjo" });
await makeUser("inovator2@demo.kampunglab.test", { display_name: "Budi Inovator", role: "INNOVATOR", phone_wa: "081234567891", institusi: "Komunitas Warga", kota_domisili: "Surabaya" });
const lurah = await makeUser("lurah.airlangga@demo.kampunglab.test", { display_name: "Lurah Airlangga (demo)", role: "KELURAHAN", kelurahan_id: airlangga, nip: "198001012005011001", jabatan: "Lurah", phone_wa: "081111111111" });
const staf = await makeUser("staf.airlangga@demo.kampunglab.test", { display_name: "Staf Airlangga (demo)", role: "KELURAHAN", kelurahan_id: airlangga, nip: "199001012015011003", jabatan: "Staf Pelayanan", phone_wa: "081111111112" });
await makeUser("lurah.mojo@demo.kampunglab.test", { display_name: "Lurah Mojo (demo)", role: "KELURAHAN", kelurahan_id: mojo, nip: "198501012010011002", jabatan: "Lurah", phone_wa: "081111111113" });

const { data: brida } = await admin.from("users").select("id").eq("role", "BRIDA_ADMIN").eq("status", "AKTIF").limit(1).maybeSingle();
if (!brida) { console.error("Jalankan seed:admin lebih dulu agar ada Admin BRIDA pemberi mandat."); process.exit(1); }
for (const [uid, tipe] of [[lurah, "UTAMA"], [staf, "CADANGAN"]]) {
  const { data: ada } = await admin.from("kelurahan_mandates").select("id").eq("user_id", uid).is("dicabut_pada", null).maybeSingle();
  if (ada) continue;
  await admin.from("users").update({ sk_document_url: `sk/${uid}/sk-demo.pdf` }).eq("id", uid);
  const { error } = await admin.from("kelurahan_mandates").insert({ user_id: uid, kelurahan_id: airlangga, tipe, diberikan_oleh: brida.id });
  if (error) throw error;
  await admin.from("users").update({ status: "AKTIF", is_verified: true }).eq("id", uid);
}
console.log("Akun demo siap. Lihat komentar di atas berkas ini untuk daftar akun.");
