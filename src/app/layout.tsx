import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "KampungLab Surabaya — Uji jujur, boleh gagal", template: "%s | KampungLab Surabaya" },
  description:
    "Platform inovasi warga Surabaya: pengajuan ke Kelurahan, dana bertahap 30-30-40, uji oleh warga di kampung, dan Rapor Bukti Inovasi yang dapat diverifikasi lewat QR.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a href="#konten-utama" className="skip-link">Lewati ke konten utama</a>
        <SiteHeader />
        <div id="konten-utama" className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
