import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "KampungLab Surabaya — Dari ide warga, jadi bukti nyata",
    template: "%s | KampungLab Surabaya",
  },
  description:
    "Konsep platform inovasi warga melalui pengajuan berjenjang, uji di kampung, dan Evidence Passport.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a href="#konten-utama" className="skip-link">
          Lewati ke konten utama
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
