const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value) => typeof value === "string" && uuid.test(value);
export const roleLabels = { program_admin: "Admin program", reviewer: "Reviewer", facilitator: "Fasilitator" };
export const mandateLabels = { primary: "Utama", backup: "Cadangan", delegate: "Delegasi" };

export function makeTerritoryLabels(territories) {
  const byId = new Map(territories.map(item => [item.id, item]));
  return new Map(territories.map(item => {
    const parts = [];
    let current = item;
    for (let level = 0; current && level < 3; level++) {
      parts.unshift(`${current.kind.toUpperCase()} ${current.name} (${current.code})`);
      if (!current.parent_id) break;
      const parent = byId.get(current.parent_id);
      if (!parent) { parts.unshift("Induk wilayah belum termuat"); break; }
      current = parent;
    }
    return [item.id, parts.join(" / ")];
  }));
}

// All administrative dates are explicitly entered in Surabaya time (UTC+07).
export function wibToIso(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+07:00`);
  if (!Number.isFinite(date.getTime())) return null;
  const roundTrip = new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 16);
  return roundTrip === value ? date.toISOString() : null;
}

export function validateAdminForm(form) {
  const get = (key) => typeof form.get(key) === "string" ? form.get(key).trim() : "";
  const operation = get("operation");
  /** @type {Record<string, string | boolean | null>} */
  const payload = {};
  /** @type {Record<string, string>} */
  const errors = {};
  const text = (key, min, max) => {
    const value = get(key);
    if (value.length < min || value.length > max || /[\u0000-\u001f]/.test(value)) errors[key] = `Isi ${min}–${max} karakter.`;
    payload[key] = value;
  };
  const id = (key, optional = false) => {
    const value = get(key);
    if ((!optional || value) && !isUuid(value)) errors[key] = "Pilih data yang tersedia.";
    payload[key] = value || null;
  };
  const choice = (key, allowed) => {
    const value = get(key);
    if (!allowed.includes(value)) errors[key] = "Pilih opsi yang tersedia.";
    payload[key] = value;
  };
  if (operation === "create_territory") {
    choice("kind", ["kelurahan", "rw", "rt"]); text("code", 1, 40); text("name", 1, 160); id("parent_id", true);
    if (payload.kind === "kelurahan" ? payload.parent_id : !payload.parent_id) errors.parent_id = "Kelurahan tanpa induk; RW di bawah kelurahan, RT di bawah RW.";
  } else if (operation === "create_office") {
    id("territory_id"); text("name", 1, 160);
  } else if (["grant_role", "grant_mandate"].includes(operation)) {
    id("user_id"); text("reference", 2, 240);
    payload.starts_at = wibToIso(get("starts_at"));
    payload.ends_at = get("ends_at") ? wibToIso(get("ends_at")) : null;
    if (!payload.starts_at) errors.starts_at = "Isi tanggal dan jam mulai yang valid (WIB).";
    if (get("ends_at") && !payload.ends_at) errors.ends_at = "Isi tanggal dan jam akhir yang valid (WIB).";
    if (payload.starts_at && payload.ends_at && payload.ends_at <= payload.starts_at) errors.ends_at = "Akhir harus setelah mulai.";
    payload.verified = get("verified") === "on";
    if (!payload.verified) errors.verified = "Konfirmasi pemeriksaan identitas dan dasar kewenangan.";
    if (operation === "grant_role") choice("role", Object.keys(roleLabels));
    else {
      id("office_id"); choice("mandate_type", Object.keys(mandateLabels));
      if (payload.mandate_type === "delegate" && !payload.ends_at) errors.ends_at = "Delegasi wajib memiliki tanggal akhir.";
    }
  } else if (["revoke_role", "revoke_mandate"].includes(operation)) {
    id("id"); id("user_id"); text("reason", 3, 500);
  } else errors.operation = "Tindakan tidak tersedia.";
  return { operation, payload, errors };
}
