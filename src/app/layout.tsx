import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KampungLab Surabaya",
  description: "Platform tata kelola inovasi kampung: bukti dulu, dana kemudian.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
