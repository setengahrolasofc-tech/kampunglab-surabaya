"use client";
import { useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cx } from "./ui";

const MAKS = 10 * 1024 * 1024;
const TIPE = ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

/**
 * Unggah langsung ke Supabase Storage (bucket privat "berkas") memakai sesi pengguna.
 * Path: <prefix>/<uuid>-<nama>. Hasilnya berupa path di input tersembunyi `name`, divalidasi ulang oleh RPC/RLS.
 * prefix contoh: "<innovation_id>/nota", "<innovation_id>/transfer".
 */
export function UploadField({ name, prefix, label, initial, required, accept }: {
  name: string; prefix: string; label: string; initial?: string | null; required?: boolean; accept?: string;
}) {
  const [path, setPath] = useState(initial ?? "");
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");
  const [msg, setMsg] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (!TIPE.includes(file.type)) { setState("error"); setMsg("Format harus PDF, JPG, PNG, WebP, DOCX, atau XLSX."); return; }
    if (file.size > MAKS) { setState("error"); setMsg("Ukuran maksimal 10 MB."); return; }
    setState("uploading"); setMsg("");
    const safe = file.name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").slice(-80) || "berkas";
    const target = `${prefix}/${crypto.randomUUID()}-${safe}`;
    try {
      const { error } = await createBrowserSupabaseClient().storage.from("berkas").upload(target, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setPath(target); setState("idle");
    } catch {
      setState("error"); setMsg("Unggah gagal. Pastikan Anda masih masuk dan berwenang, lalu coba lagi.");
    }
  }

  const nama = path ? path.split("/").pop()?.replace(/^[0-9a-f-]{36}-/, "") : "";
  return (
    <div className="space-y-1">
      <span className="block text-sm font-semibold text-indigo-space">{label}{required && <span className="text-red-700"> *</span>}</span>
      <input type="hidden" name={name} value={path} />
      <div className={cx("flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-sm", state === "error" ? "border-red-400 bg-red-50" : "border-indigo-space/30 bg-white")}>
        <input ref={input} type="file" accept={accept ?? ".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx"} className="text-xs file:mr-3 file:rounded-md file:border-0 file:bg-celadon file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-space"
          onChange={(e) => onPick(e.target.files?.[0])} aria-label={label} />
        {state === "uploading" && <span className="text-xs text-teal-deep">Mengunggah…</span>}
        {path && state !== "uploading" && <span className="text-xs font-semibold text-[#2c6b5b]">✓ {nama}</span>}
      </div>
      {state === "error" && <p className="text-xs font-medium text-red-700" role="alert">{msg}</p>}
    </div>
  );
}
