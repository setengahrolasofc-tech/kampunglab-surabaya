import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const BUCKET = "kampunglab-private-demo";
const MAX_FILE = 3 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const knownErrors = new Set([
  "SESSION_REQUIRED", "ATTACHMENT_UNAVAILABLE", "DEMO_ONLY", "INVALID_FILE", "ATTACHMENT_LIMIT",
  "PHYSICAL_UPLOAD_NOT_AVAILABLE", "UPLOAD_RATE_LIMIT", "UPLOAD_REQUEST_CONFLICT", "ATTACHMENT_ARCHIVED", "UPLOAD_NOT_CONFIRMED",
]);
class FileError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
const json = (value: unknown, status = 200) => Response.json(value, { status, headers });

function environmentKey(group: string, legacy: string) {
  const raw = Deno.env.get(group);
  if (raw) { const value = JSON.parse(raw).default; if (typeof value === "string" && value) return value; }
  return Deno.env.get(legacy) ?? "";
}
function rpcError(error: { message: string; code?: string }) {
  if (knownErrors.has(error.message)) throw new FileError(error.message, error.code === "PT409" ? 409 : error.message === "SESSION_REQUIRED" ? 401 : 400);
  throw new FileError("FILE_SERVICE_UNAVAILABLE", 503);
}
function hash(bytes: Uint8Array<ArrayBuffer>) {
  return crypto.subtle.digest("SHA-256", bytes).then(result => Array.from(new Uint8Array(result), n => n.toString(16).padStart(2, "0")).join(""));
}
function fileMime(bytes: Uint8Array<ArrayBuffer>, name: string) {
  const ascii = (start: number, end: number) => new TextDecoder().decode(bytes.subarray(start, end));
  let mime = "";
  if (bytes.length >= 16 && ascii(0, 5) === "%PDF-" && ascii(Math.max(0, bytes.length - 1024), bytes.length).includes("%%EOF")) mime = "application/pdf";
  else if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.at(-2) === 255 && bytes.at(-1) === 217) mime = "image/jpeg";
  else if (bytes.length >= 45 && [137,80,78,71,13,10,26,10].every((n, i) => bytes[i] === n)
    && ascii(12, 16) === "IHDR" && [0,0,0,0,73,69,78,68,174,66,96,130].every((n, i) => bytes[bytes.length - 12 + i] === n)) mime = "image/png";
  else if (bytes.length >= 20 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP"
    && new DataView(bytes.buffer).getUint32(4, true) + 8 === bytes.length && ["VP8 ","VP8L","VP8X"].includes(ascii(12, 16))) mime = "image/webp";
  const extension = name.toLowerCase().split(".").at(-1);
  const allowed: Record<string, string[]> = { "application/pdf": ["pdf"], "image/jpeg": ["jpg","jpeg"], "image/png": ["png"], "image/webp": ["webp"] };
  if (!mime || !allowed[mime]?.includes(extension ?? "")) throw new FileError("INVALID_FILE");
  return mime;
}
async function boundedBody(req: Request, limit: number) {
  if (Number(req.headers.get("Content-Length") ?? 0) > limit) throw new FileError("FILE_TOO_LARGE", 413);
  if (!req.body) throw new FileError("INVALID_FILE");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) { await reader.cancel(); throw new FileError("FILE_TOO_LARGE", 413); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const output = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length; }
  return output;
}
type FileRecord = { id: string; owner_id?: string; original_name: string; mime_type: string; byte_size: number; sha256: string; object_path: string; storage_state?: string };

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) throw new FileError("SESSION_REQUIRED", 401);
    const token = auth.slice(7);
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const publicKey = environmentKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
    const secret = environmentKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !publicKey || !secret) throw new FileError("FILE_SERVICE_UNAVAILABLE", 503);
    const userClient = createClient(url, publicKey, { global: { headers: { Authorization: auth } }, auth: { persistSession: false, autoRefreshToken: false } });
    const identity = await userClient.auth.getUser(token);
    if (identity.error || !identity.data.user) throw new FileError("SESSION_REQUIRED", 401);
    // Decode only after Auth has verified the original JWT. Never use editable metadata.
    const encoded = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!encoded) throw new FileError("SESSION_REQUIRED", 401);
    const sessionId = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "="))).session_id;
    if (typeof sessionId !== "string" || !UUID.test(sessionId)) throw new FileError("SESSION_REQUIRED", 401);
    const actorId = identity.data.user.id;
    // A separate backend client never inherits a caller's Authorization header.
    const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false }, global: {
      fetch: (input, init) => {
        const next = new Headers(init?.headers);
        if (secret.startsWith("sb_secret_") && next.get("Authorization") === `Bearer ${secret}`) next.delete("Authorization");
        return fetch(input, { ...init, headers: next, signal: AbortSignal.timeout(45000) });
      },
    } });
    const contentType = req.headers.get("Content-Type") ?? "";
    if (contentType.startsWith("multipart/form-data")) {
      const body = await boundedBody(req, MAX_FILE + 65536);
      const form = await new Response(body, { headers: { "Content-Type": contentType } }).formData();
      const file = form.get("file"), draftId = String(form.get("draft_id") ?? ""), requestId = String(form.get("request_id") ?? "");
      if (form.get("operation") !== "upload" || !(file instanceof File) || !UUID.test(draftId) || !UUID.test(requestId)) throw new FileError("INVALID_FILE");
      const purpose = String(form.get("purpose") ?? "supporting"), physicalSimulationId = form.get("physical_simulation_id");
      if (!["supporting", "physical_rt", "physical_rw"].includes(purpose)
        || (purpose === "supporting" ? physicalSimulationId !== null : typeof physicalSimulationId !== "string" || !UUID.test(physicalSimulationId))) throw new FileError("INVALID_FILE");
      const name = file.name.normalize("NFC").trim();
      if (!name || name.length > 160 || /[\u0000-\u001f\u007f/\\]/.test(name) || file.size === 0) throw new FileError("INVALID_FILE");
      if (file.size > MAX_FILE) throw new FileError("FILE_TOO_LARGE", 413);
      const bytes = new Uint8Array(await file.arrayBuffer()), mime = fileMime(bytes, name), digest = await hash(bytes);
      const reservation = await userClient.rpc("attachment_workflow", { operation: "reserve", payload: { purpose, physical_simulation_id: physicalSimulationId, draft_id: draftId, request_id: requestId, name, mime_type: mime, byte_size: bytes.length, sha256: digest } });
      if (reservation.error) rpcError(reservation.error);
      const record = reservation.data as FileRecord;
      if (!record || !UUID.test(record.id) || record.owner_id !== actorId || record.object_path !== `${actorId}/${record.id}/blob`) throw new FileError("FILE_SERVICE_UNAVAILABLE", 503);
      if (record.storage_state !== "ready") {
        const upload = await admin.storage.from(BUCKET).upload(record.object_path, bytes, { contentType: mime, cacheControl: "0", upsert: false, metadata: { sha256: digest } });
        if (upload.error) {
          // An identical previous attempt may have stored the blob before losing its response.
          const existing = await admin.storage.from(BUCKET).download(record.object_path);
          if (existing.error || !existing.data || existing.data.size !== bytes.length || await hash(new Uint8Array(await existing.data.arrayBuffer())) !== digest) throw new FileError("UPLOAD_NOT_CONFIRMED", 409);
        }
      }
      const completion = await admin.rpc("attachment_service", { operation: "complete", payload: { id: record.id, actor_id: actorId, session_id: sessionId } });
      if (completion.error) rpcError(completion.error);
      return json({ id: record.id });
    }
    if (!contentType.startsWith("application/json")) throw new FileError("INVALID_FILE");
    const input = JSON.parse(new TextDecoder().decode(await boundedBody(req, 16384)));
    if (!input || typeof input !== "object" || input.operation !== "download" || !UUID.test(String(input.id ?? ""))
      || (input.simulation_id != null && !UUID.test(String(input.simulation_id)))
      || (input.physical_request_id != null && !UUID.test(String(input.physical_request_id)))) throw new FileError("INVALID_FILE");
    const payload = { id: input.id, simulation_id: input.simulation_id ?? null, physical_request_id: input.physical_request_id ?? null };
    const authorization = await userClient.rpc("attachment_workflow", { operation: "read", payload });
    if (authorization.error) rpcError(authorization.error);
    const record = authorization.data as FileRecord;
    const downloaded = await admin.storage.from(BUCKET).download(record.object_path);
    if (downloaded.error || !downloaded.data) throw new FileError("ATTACHMENT_UNAVAILABLE", 404);
    if (downloaded.data.size !== record.byte_size || downloaded.data.size > MAX_FILE) throw new FileError("FILE_INTEGRITY_MISMATCH", 409);
    const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
    if (await hash(bytes) !== record.sha256 || fileMime(bytes, record.original_name) !== record.mime_type) throw new FileError("FILE_INTEGRITY_MISMATCH", 409);
    const fresh = await userClient.rpc("attachment_workflow", { operation: "read", payload });
    if (fresh.error) rpcError(fresh.error);
    const filename = encodeURIComponent(record.original_name).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(bytes, { headers: { ...headers, "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="lampiran"; filename*=UTF-8''${filename}`, "Content-Security-Policy": "sandbox" } });
  } catch (error) {
    return error instanceof FileError ? json({ error: error.code }, error.status) : json({ error: "FILE_SERVICE_UNAVAILABLE" }, 503);
  }
});
