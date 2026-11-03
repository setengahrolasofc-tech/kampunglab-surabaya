/** Pembaca FormData yang ringkas untuk server action. */
export const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
export const optStr = (f: FormData, k: string) => str(f, k) || null;
export const int = (f: FormData, k: string) => {
  const v = str(f, k).replace(/[.\s]/g, "").replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) && v !== "" ? Math.round(n) : NaN;
};
export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
