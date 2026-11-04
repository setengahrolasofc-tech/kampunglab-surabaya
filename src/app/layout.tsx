import type { Metadata, Viewport } from "next";
import { Montserrat, Poppins } from "next/font/google";
import type { ReactNode } from "react";
import { ChromeVisibility } from "@/components/chrome-visibility";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-poppins", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-logo", display: "swap" });

export const metadata: Metadata = {
  title: { default: "KampungLab Surabaya — Inovasi Berkarya, Kampung Berdaya", template: "%s | KampungLab Surabaya" },
  description:
    "Platform inovasi warga Surabaya: pengajuan ke Kelurahan, dana bertahap 30-30-40, uji oleh warga di kampung, dan Rapor Bukti Inovasi yang dapat diverifikasi lewat QR.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#14455c" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${poppins.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#konten-utama" className="skip-link">Lewati ke konten utama</a>
        <ChromeVisibility header={<SiteHeader />} footer={<SiteFooter />}>{children}</ChromeVisibility>
      </body>
    </html>
  );
}
