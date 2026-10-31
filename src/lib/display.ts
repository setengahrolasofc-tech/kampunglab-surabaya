/** Referensi salinan dibuat database berawalan "DEMO-". Awalan itu tidak ditampilkan kepada pengguna. */
export const refLabel = (reference: string | null | undefined) => (reference ?? "").replace(/^DEMO-/, "");
