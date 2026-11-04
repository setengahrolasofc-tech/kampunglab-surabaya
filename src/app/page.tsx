import Link from "next/link";
import { HeroSlides } from "@/components/hero-slides";
import { IconArrow, IconBars, IconBulb, IconCaret, IconChat, IconDoc, IconInsta, IconPlay, IconQr, IconShield, IconTrophy } from "@/components/icons";
import { LandingHeader } from "@/components/landing-header";
import { LogoHouse } from "@/components/logo";
import { getSession, homeFor } from "@/lib/auth/session";

const FITUR = [
  { judul: "Pengajuan Inovasi", isi: "Ajukan ide dan solusi untuk kampung Anda", href: "/daftar", bg: "bg-[#d6f0e0]", ikon: <IconDoc size={26} /> },
  { judul: "Pantau Proyek", isi: "Lihat perjalanan inovasi dari awal hingga akhir", href: "/papan-masalah", bg: "bg-[#d9f0e3]", ikon: <IconTrophy size={26} /> },
  { judul: "Verifikasi QR", isi: "Pastikan keaslian Rapor Bukti Inovasi", href: "/verifikasi", bg: "bg-[#d8eaf4]", ikon: <IconShield size={26} /> },
  { judul: "Data Transparan", isi: "Akses hasil dan penggunaan dana", href: "/etalase", bg: "bg-[#d6f0e0]", ikon: <IconBars size={26} /> },
];

const STRIP = [
  { label: "Identifikasi", ikon: <IconBulb size={16} /> },
  { label: "Kolaborasi", ikon: <IconChat size={16} /> },
  { label: "Uji", ikon: <IconDoc size={16} /> },
  { label: "Dampak", ikon: <IconBars size={16} /> },
];

export default async function Beranda() {
  const session = await getSession();
  const masukHref = session ? homeFor(session.profile.role) : "/masuk";
  const masukLabel = session ? "Dashboard" : "Login";

  return (
    <>
      <LandingHeader masukHref={masukHref} masukLabel={masukLabel} />

      {/* ===== Hero layar penuh (mockup "LANDING PAGE" dan "2") ===== */}
      <section className="relative isolate min-h-[640px] overflow-hidden text-white" style={{ height: "max(100svh, 640px)" }}>
        <HeroSlides />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-black/20 to-transparent" aria-hidden />
        <div className="absolute left-[20px] right-[20px] top-[35%] sm:left-[8.1%] sm:right-[6%]">
          <h1 className="text-[clamp(2.3rem,4.65vw,5rem)] font-bold leading-[1.07] tracking-[-0.01em]">
            Inovasi Berkarya<br />Kampung Berdaya
          </h1>
          <p className="mt-2 max-w-[min(50vw,52rem)] max-sm:max-w-none text-[clamp(0.95rem,1.28vw,1.3rem)] leading-[1.15]">
            Mari bersama mengenali tantangan, mengembangkan gagasan, dan berkolaborasi menghadirkan solusi nyata untuk kampung yang lebih baik.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <a href="#tentang" className="flex h-[39px] w-[143px] items-center justify-center rounded-lg bg-white text-[15px] font-medium text-[#0b5aa6] shadow-sm transition hover:bg-[#eef6ff]">Kenali Kami</a>
            <Link href={masukHref} className="flex h-[39px] w-[143px] items-center justify-center rounded-lg bg-white text-[15px] font-medium text-[#0b5aa6] shadow-sm transition hover:bg-[#eef6ff]">{masukLabel}</Link>
          </div>
        </div>
        <a href="#tentang" aria-label="Gulir ke bawah" className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 rounded-full border border-white/50 p-1.5 text-white/80 hover:text-white sm:block"><IconCaret size={16} /></a>
      </section>

      {/* ===== Jalur singkat (strip bawah hero di mockup Landing Page) ===== */}
      <div className="bg-[#14455c] text-white">
        <ul className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3.5 text-[13px] font-medium">
          {STRIP.map((s) => (
            <li key={s.label} className="flex items-center gap-2"><span className="text-[#7fe0c4]">{s.ikon}</span>{s.label}</li>
          ))}
          <li className="font-bold tracking-wide">SURABAYA</li>
        </ul>
      </div>

      <div className="bg-[#f4f9fb] pb-10">
        {/* ===== Apa itu KampungLab? ===== */}
        <section id="tentang" className="mx-auto grid max-w-5xl items-center gap-6 px-6 py-14 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl [mask-image:linear-gradient(to_right,black_75%,transparent)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/warga-ilustrasi.jpg" alt="Warga, inovator, dan petugas kelurahan berdiskusi bersama" className="h-auto w-full" loading="lazy" />
          </div>
          <div className="space-y-3">
            <h2 className="text-[1.7rem] font-bold text-[#14304a]">Apa itu KampungLab?</h2>
            <p className="text-sm leading-relaxed text-[#14304a]/75">
              KampungLab adalah ekosistem inovasi kelurahan yang menghubungkan masyarakat, inovator, dan pemerintah untuk menemukan solusi atas permasalahan nyata di lingkungan sekitar.
            </p>
            <Link href="/panduan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a8f86] hover:underline">Pelajari lebih lanjut <IconArrow size={14} /></Link>
          </div>
        </section>

        {/* ===== Jelajahi Fitur Utama ===== */}
        <section aria-labelledby="fitur" className="mx-auto max-w-5xl px-6">
          <h2 id="fitur" className="mb-5 text-center text-[1.35rem] font-bold text-[#14304a]">Jelajahi Fitur Utama</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FITUR.map((f) => (
              <li key={f.judul}>
                <Link href={f.href} className={`relative flex h-full min-h-[148px] flex-col rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-md ${f.bg}`}>
                  <span className="mb-3 text-[#1a9a86]">{f.ikon}</span>
                  <span className="text-[15px] font-bold leading-tight text-[#14304a]">{f.judul.split(" ").map((w, i) => <span key={i} className="block">{w}</span>)}</span>
                  <span className="mt-1.5 max-w-[80%] text-[11px] leading-snug text-[#14304a]/70">{f.isi}</span>
                  <span className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#14455c] text-white"><IconArrow size={12} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ===== Banner ajakan ===== */}
        <section aria-label="Mulai sekarang" className="mx-auto mt-6 max-w-5xl px-6">
          <div className="relative flex min-h-[150px] items-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#14455c] via-[#17608a] to-[#1d79a8] p-7 text-white sm:p-9">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/banner-cta.jpg" alt="" aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[42%] object-cover [mask-image:linear-gradient(to_right,transparent,black_45%)] sm:block" loading="lazy" />
            <div className="relative max-w-md space-y-2">
              <h2 className="text-xl font-bold leading-snug">Bersama Kita Wujudkan<br />Kampung yang Lebih Inovatif</h2>
              <p className="text-xs text-white/85">Karena setiap ide, punya potensi untuk membawa perubahan.</p>
              <Link href={session ? masukHref : "/daftar"} className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#bdebcf] px-5 py-2 text-xs font-semibold text-[#14304a] hover:bg-[#cdf3da]">Mulai Sekarang <IconArrow size={13} /></Link>
            </div>
          </div>
        </section>
      </div>

      {/* ===== Footer (mockup Landing Page) ===== */}
      <footer className="no-print border-t border-[#d8e6ee] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-4 text-xs text-[#14304a] sm:flex-row">
          <LogoHouse size={26} />
          <nav aria-label="Tautan footer" className="flex gap-6 font-medium">
            <Link href="/" className="hover:text-[#1a8f86]">Beranda</Link>
            <Link href="/panduan" className="hover:text-[#1a8f86]">Program</Link>
            <Link href="/panduan#faq" className="hover:text-[#1a8f86]">FAQ</Link>
            <Link href="/verifikasi" className="hover:text-[#1a8f86]">Kontak</Link>
          </nav>
          <div className="flex items-center gap-3 text-[#14304a]">
            <span aria-label="YouTube"><IconPlay size={16} /></span>
            <span aria-label="Instagram"><IconInsta size={16} /></span>
            <span aria-label="Kanal komunitas"><IconQr size={16} /></span>
          </div>
        </div>
        <p className="border-t border-[#eef3f6] px-6 py-2 text-center text-[10px] text-[#14304a]/55">
          Website ini tidak menyimpan atau memindahkan uang: transfer dilakukan Kelurahan di luar aplikasi, website hanya mencatat bukti. · Handbook Rev. 4
        </p>
      </footer>
    </>
  );
}
