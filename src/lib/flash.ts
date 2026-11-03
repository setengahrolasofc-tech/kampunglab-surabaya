import { redirect } from "next/navigation";

/** Kembali ke halaman dengan pesan singkat (query ?ok= / ?err=). Jangan panggil di dalam try/catch. */
export function back(path: string, kind: "ok" | "err", message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(message.slice(0, 400))}`);
}
