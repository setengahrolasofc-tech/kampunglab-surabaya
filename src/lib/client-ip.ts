import "server-only";
import { headers } from "next/headers";
import { hashIp } from "@/lib/domain/survey.mjs";

/** Hash IP pengunjung dengan garam server. IP mentah tidak disimpan. */
export async function visitorIpHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "tak-diketahui";
  const salt = process.env.IP_HASH_SALT?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "kampunglab-dev-salt";
  return hashIp(ip, salt);
}
