import type { ReactNode, SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size: number, children: ReactNode, p: SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>{children}</svg>
);

export const IconHome = ({ size = 18, ...p }: P) => base(size, <><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>, p);
export const IconFolder = ({ size = 18, ...p }: P) => base(size, <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />, p);
export const IconEdit = ({ size = 18, ...p }: P) => base(size, <><path d="M4 20h4L19 9l-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></>, p);
export const IconBoard = ({ size = 18, ...p }: P) => base(size, <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>, p);
export const IconChart = ({ size = 18, ...p }: P) => base(size, <><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-5M12 16V8M16 16v-3" /></>, p);
export const IconBook = ({ size = 18, ...p }: P) => base(size, <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3Z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></>, p);
export const IconGear = ({ size = 18, ...p }: P) => base(size, <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>, p);
export const IconSearch = ({ size = 18, ...p }: P) => base(size, <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>, p);
export const IconBell = ({ size = 18, ...p }: P) => base(size, <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>, p);
export const IconArrow = ({ size = 16, ...p }: P) => base(size, <path d="M5 12h14M13 6l6 6-6 6" />, { strokeWidth: 2.2, ...p });
export const IconSend = ({ size = 24, ...p }: P) => base(size, <path d="m21 3-9.5 18-2.2-7.8L2 11Zm0 0L9.3 13.2" />, p);
export const IconPin = ({ size = 24, ...p }: P) => base(size, <><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>, p);
export const IconDownload = ({ size = 24, ...p }: P) => base(size, <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 20h14" /></>, p);
export const IconQr = ({ size = 24, ...p }: P) => base(size, <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4" /></>, p);
export const IconBulb = ({ size = 22, ...p }: P) => base(size, <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" /></>, p);
export const IconCheck = ({ size = 22, ...p }: P) => base(size, <path d="m5 12.5 4.5 4.5L19 7.5" />, { strokeWidth: 2.6, ...p });
export const IconTrophy = ({ size = 22, ...p }: P) => base(size, <><path d="M8 4h8v5a4 4 0 0 1-8 0Z" /><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4" /><path d="M12 13v4M8 21h8M9 17h6" /></>, p);
export const IconPeople = ({ size = 22, ...p }: P) => base(size, <><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2a5 5 0 0 1 5 4.8" /></>, p);
export const IconDoc = ({ size = 22, ...p }: P) => base(size, <><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></>, p);
export const IconShield = ({ size = 22, ...p }: P) => base(size, <><path d="M12 3 4 6v6c0 4.5 3.4 7.8 8 9 4.6-1.2 8-4.5 8-9V6Z" /><path d="m8.5 12 2.5 2.5 5-5" /></>, p);
export const IconBars = ({ size = 22, ...p }: P) => base(size, <path d="M5 20v-6M11 20V9M17 20V4" />, { strokeWidth: 3, ...p });
export const IconHeadset = ({ size = 22, ...p }: P) => base(size, <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /><path d="M19 20c0 1-2 2-5 2" /></>, p);
export const IconInfo = ({ size = 18, ...p }: P) => base(size, <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></>, p);
export const IconPlay = ({ size = 16, ...p }: P) => base(size, <><rect x="3" y="5" width="18" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" /></>, p);
export const IconInsta = ({ size = 16, ...p }: P) => base(size, <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5v.01" /></>, p);
export const IconChat = ({ size = 16, ...p }: P) => base(size, <><circle cx="12" cy="12" r="9" /><path d="M8 13c1 2 3 3 5 2.5M9 9.5v.01M15 9.5v.01" /></>, p);
export const IconCaret = ({ size = 12, ...p }: P) => base(size, <path d="m6 9 6 6 6-6" />, { strokeWidth: 2.4, ...p });
export const IconBulbSolid = ({ size = 18, ...p }: P) => base(size, <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" /></>, p);
