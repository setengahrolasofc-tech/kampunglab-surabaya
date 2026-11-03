import Link from "next/link";
import { cx } from "./ui";

const ITEMS = [
  { seg: "", label: "Ringkasan & Form" }, { seg: "/logbook", label: "Logbook & Dana" }, { seg: "/uji", label: "Uji Warga" },
  { seg: "/serah-terima", label: "Serah Terima" }, { seg: "/bantuan", label: "Banding & Lapor Kendala" },
];

export function ProjectNav({ id, active }: { id: string; active: string }) {
  return (
    <nav aria-label="Bagian proyek" className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-celadon/40 p-1 text-sm font-semibold">
      {ITEMS.map((i) => (
        <Link key={i.seg} href={`/dashboard/pengajuan/${id}${i.seg}`} aria-current={active === i.seg ? "page" : undefined}
          className={cx("whitespace-nowrap rounded-lg px-3 py-1.5", active === i.seg ? "bg-white text-teal-deep shadow-sm" : "text-indigo-space/70 hover:bg-white/60")}>{i.label}</Link>
      ))}
    </nav>
  );
}
