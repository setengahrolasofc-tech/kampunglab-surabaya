"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Beranda ("/") punya header + footer sendiri (sesuai mockup Landing Page), dan area /dashboard
 * memakai sidebar + topbar sendiri (mockup Homepage Dashboard). Di rute lain, header & footer global tetap tampil.
 */
export function ChromeVisibility({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const path = usePathname() ?? "/";
  const own = path === "/" || path === "/dashboard" || path.startsWith("/dashboard/");
  return (
    <>
      {!own && header}
      <div id="konten-utama" className="flex-1">{children}</div>
      {!own && footer}
    </>
  );
}
