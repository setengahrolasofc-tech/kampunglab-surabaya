import Link from "next/link";
import { Main, btnPrimary } from "@/components/ui";

export default function NotFound() {
  return <Main narrow><div className="space-y-4 py-16 text-center"><h1 className="text-3xl font-extrabold">Halaman tidak ditemukan</h1><p className="text-indigo-space/75">Tautan mungkin salah, atau Anda tidak berwenang membukanya.</p><Link href="/" className={btnPrimary}>Ke beranda</Link></div></Main>;
}
