import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";
import { LogoFull } from "@/components/logo";
import { Alert, Card, Main, cx } from "@/components/ui";
import { getSession, homeFor } from "@/lib/auth/session";
import { destinationForIntent, normalizeIntent } from "@/lib/auth/validation.mjs";
import { lengkapiProfilUrl, needsProfileCompletion } from "@/lib/auth/profile.mjs";

export const metadata: Metadata = { title: "Masuk" };

const INFO: Record<string, string> = {
  "perlu-masuk": "Silakan masuk untuk melanjutkan.",
  diblokir: "Akun ini diblokir. Hubungi Admin BRIDA bila Anda merasa ini keliru.",
  "google-gagal": "Masuk dengan Google belum berhasil. Coba lagi, atau masuk dengan email dan password.",
  "tautan-gagal": "Tautan verifikasi tidak valid atau sudah kedaluwarsa. Masuk, atau minta kode baru lewat Lupa password.",
};

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ status?: string; sebagai?: string }> }) {
  const { status, sebagai } = await searchParams;
  const intent = normalizeIntent(sebagai);
  const session = await getSession();
  if (session && session.profile.status !== "DIBLOKIR") {
    if (needsProfileCompletion(session.profile)) redirect(lengkapiProfilUrl(intent));
    redirect(session.profile.role === "INNOVATOR" && intent === "kelurahan" ? destinationForIntent(intent) : homeFor(session.profile.role));
  }
  return (
    <Main narrow>
      <Card className="mx-auto max-w-md space-y-5">
        <div className="flex justify-center"><LogoFull size={44} /></div>
        <h1 className="text-center text-xl font-bold">Masuk</h1>
        <nav aria-label="Pilih jenis akun" className="grid grid-cols-2 gap-1 rounded-xl bg-celadon/40 p-1 text-center text-sm font-semibold">
          {([["inovator", "Inovator / Warga"], ["kelurahan", "Kelurahan"]] as const).map(([v, t]) => (
            <Link key={v} href={`/masuk?sebagai=${v}`} aria-current={intent === v ? "page" : undefined}
              className={cx("rounded-lg px-3 py-2", intent === v ? "bg-white text-teal-deep shadow" : "text-indigo-space/70 hover:text-teal-deep")}>{t}</Link>
          ))}
        </nav>
        {intent === "kelurahan" && <Alert tone="info">Akses Kelurahan hanya aktif setelah <strong>Admin BRIDA memberi izin</strong>. Belum punya akses? Masuk atau daftar, lalu kirim permintaan akses beserta SK/surat tugas.</Alert>}
        <LoginForm sebagai={intent} info={status ? INFO[status] : undefined} />
      </Card>
    </Main>
  );
}
