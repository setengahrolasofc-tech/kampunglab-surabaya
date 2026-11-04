import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Flash } from "@/components/flash";
import { IconArrow, IconBell, IconBulb, IconCheck, IconDoc, IconDownload, IconInfo, IconPeople, IconPin, IconQr, IconSend, IconTrophy } from "@/components/icons";
import { homeFor, requireAnyUser } from "@/lib/auth/session";
import { needsProfileCompletion } from "@/lib/auth/profile.mjs";
import { angka, tanggal } from "@/lib/domain/format.mjs";
import { FINAL_STATUSES, phaseOf, STATUS_INFO } from "@/lib/domain/workflow.mjs";

export const metadata: Metadata = { title: "Beranda Dashboard" };

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

interface Row { id: string; judul: string; status: string; status_changed_at: string }

function persenProgres(status: string) {
  if (status === "COMPLETED_PUBLISHED") return 100;
  const p = phaseOf(status);
  return p === 0 ? 0 : p * 20 - 5;
}

const kartu = "rounded-2xl border border-[#e3eaf1] bg-white shadow-[0_1px_2px_rgba(20,48,74,0.04)]";

function StatKartu({ nilai, label, warna, ikon }: { nilai: string; label: string; warna: string; ikon: ReactNode }) {
  return (
    <div className={`${kartu} flex items-center gap-3 px-4 py-3.5`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${warna}`}>{ikon}</span>
      <p className="leading-tight"><span className="block text-xl font-bold text-[#14304a]">{nilai}</span><span className="text-[11px] text-[#14304a]/65">{label}</span></p>
    </div>
  );
}

export default async function DashboardBeranda({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const session = await requireAnyUser();
  if (session.profile.role !== "INNOVATOR") redirect(homeFor(session.profile.role));
  if (needsProfileCompletion(session.profile)) redirect("/lengkapi-profil");
  if (session.profile.status === "DIBLOKIR") redirect("/masuk?status=diblokir");
  const { supabase, userId } = session;
  await supabase.rpc("sync_due_tests");

  const { data } = await supabase.from("innovations").select("id, judul, status, status_changed_at").eq("leader_user_id", userId).order("status_changed_at", { ascending: false });
  const rows = (data ?? []) as Row[];
  const ids = rows.map((r) => r.id);

  const [tests, resp, notif] = await Promise.all([
    ids.length ? supabase.from("testing_integrations").select("total_valid_respondents, avg_rating").in("innovation_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("survey_responses").select("dibuat_pada").in("innovation_id", ids).order("dibuat_pada", { ascending: false }).limit(2000) : Promise.resolve({ data: [] }),
    supabase.from("notifications").select("id, pesan, tautan, dibuat_pada").eq("untuk_user_id", userId).order("dibuat_pada", { ascending: false }).limit(3),
  ]);

  const total = rows.length;
  const selesai = rows.filter((r) => r.status === "COMPLETED_PUBLISHED").length;
  const berproses = rows.filter((r) => r.status !== "DRAFT" && !FINAL_STATUSES.includes(r.status)).length;
  const testRows = (tests.data ?? []) as Array<{ total_valid_respondents: number | null; avg_rating: number | null }>;
  const warga = testRows.reduce((a, t) => a + (t.total_valid_respondents ?? 0), 0);
  const ratings = testRows.filter((t) => t.avg_rating != null).map((t) => Number(t.avg_rating));
  const kepuasan = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length / 5) * 100) : null;

  const aktif = rows.find((r) => r.status !== "DRAFT" && !FINAL_STATUSES.includes(r.status)) ?? rows.find((r) => !FINAL_STATUSES.includes(r.status)) ?? rows[0] ?? null;
  const progres = aktif ? persenProgres(aktif.status) : 0;

  // Tren partisipasi: jumlah responden per bulan, 5 bulan terakhir.
  const now = new Date();
  const bulan = Array.from({ length: 5 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1); return { key: `${d.getFullYear()}-${d.getMonth()}`, label: BULAN[d.getMonth()]!, n: 0 }; });
  for (const r of (resp.data ?? []) as Array<{ dibuat_pada: string }>) {
    const d = new Date(r.dibuat_pada);
    const b = bulan.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (b) b.n += 1;
  }
  const maks = Math.max(1, ...bulan.map((b) => b.n));
  const titik = bulan.map((b, i) => ({ x: 20 + i * 62, y: 70 - (b.n / maks) * 52, ...b }));
  const garis = titik.map((t) => `${t.x},${t.y}`).join(" ");
  const adaTren = bulan.some((b) => b.n > 0);

  const pengumuman = (notif.data ?? []) as Array<{ id: string; pesan: string; tautan: string | null; dibuat_pada: string }>;
  const ikonPengumuman = [<IconDoc key="a" size={15} />, <IconBell key="b" size={15} />, <IconInfo key="c" size={15} />];
  const warnaPengumuman = ["bg-[#dbeafb] text-[#2a6fc0]", "bg-[#fff1cf] text-[#b98a0e]", "bg-[#d9f1ff] text-[#1488c5]"];

  const lingkar = 2 * Math.PI * 34;

  return (
    <div className="space-y-5 pt-1">
      <Flash ok={sp.ok} err={sp.err} />

      {/* Banner sambutan */}
      <section className="relative flex min-h-[132px] items-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#1c70a8] via-[#2184a7] to-[#2aa08f] px-6 py-5 text-white sm:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/banner-dashboard.jpg" alt="" aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[46%] object-cover [mask-image:linear-gradient(to_right,transparent,black_40%)] sm:block" />
        <div className="relative space-y-1.5">
          <h1 className="text-[1.35rem] font-bold">Selamat datang, {session.profile.name}! <span aria-hidden>👋</span></h1>
          <p className="max-w-sm text-xs leading-relaxed text-white/90">Mari lanjutkan perjalanan inovasi Anda untuk mewujudkan kampung yang lebih berdaya.</p>
          <Link href={aktif ? `/dashboard/pengajuan/${aktif.id}` : "/dashboard/pengajuan/baru"} className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#bdebcf] px-4 py-1.5 text-xs font-semibold text-[#14304a] hover:bg-[#cdf3da]">
            {aktif ? "Lanjutkan Proyek" : "Mulai Pengajuan"} <IconArrow size={13} />
          </Link>
        </div>
      </section>

      {/* Statistik */}
      <section aria-label="Ringkasan" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatKartu nilai={angka(total)} label="Total Inovasi" warna="bg-[#fff1cf] text-[#e0a210]" ikon={<IconBulb size={20} />} />
        <StatKartu nilai={angka(berproses)} label="Dalam Proses" warna="bg-[#d5f2e3] text-[#1fa66e]" ikon={<IconCheck size={20} />} />
        <StatKartu nilai={angka(selesai)} label="Selesai" warna="bg-[#fff1cf] text-[#e0a210]" ikon={<IconTrophy size={20} />} />
        <StatKartu nilai={angka(warga)} label="Partisipasi Warga" warna="bg-[#dbeafb] text-[#2a6fc0]" ikon={<IconPeople size={20} />} />
      </section>

      {/* Status proyek + pengumuman */}
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <section id="proyek-anda" className={`${kartu} p-4`} aria-labelledby="status-proyek">
          <div className="mb-3 flex items-center justify-between"><h2 id="status-proyek" className="text-[13px] font-bold text-[#14304a]">Status Proyek Anda</h2><Link href="/dashboard/proyek" className="text-[11px] font-semibold text-[#1488c5] hover:underline">Lihat Detail <span aria-hidden>→</span></Link></div>
          {aktif ? (
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/proyek-thumb.jpg" alt="" aria-hidden className="h-[84px] w-[84px] shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Link href={`/dashboard/pengajuan/${aktif.id}`} className="block truncate text-sm font-bold text-[#14304a] hover:underline">{aktif.judul || "(Draft tanpa judul)"}</Link>
                <span className="inline-block rounded-full bg-[#dbeafb] px-2.5 py-0.5 text-[10px] font-semibold text-[#2a6fc0]">{STATUS_INFO[aktif.status]?.label ?? aktif.status}</span>
                <div className="flex items-center gap-2" role="progressbar" aria-valuenow={progres} aria-valuemin={0} aria-valuemax={100} aria-label="Progres tahap proyek">
                  <div className="h-2 flex-1 rounded-full bg-[#e3eaf1]"><div className="h-2 rounded-full bg-[#1fa68a]" style={{ width: `${progres}%` }} /></div>
                  <span className="text-[11px] font-semibold text-[#14304a]/70">{progres}%</span>
                </div>
                <p className="text-[10px] text-[#14304a]/60">Diperbarui: {tanggal(aktif.status_changed_at)}</p>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[#cfdbe6] p-5 text-center text-xs text-[#14304a]/65">Belum ada pengajuan. Mulai dari <Link href="/papan-masalah" className="font-semibold text-[#1488c5] underline">Papan Masalah</Link> atau buat pengajuan baru.</p>
          )}
        </section>

        <section className={`${kartu} p-4`} aria-labelledby="pengumuman">
          <div className="mb-3 flex items-center justify-between"><h2 id="pengumuman" className="text-[13px] font-bold text-[#14304a]">Pengumuman Terbaru</h2><Link href="/notifikasi" className="text-[11px] font-semibold text-[#1488c5] hover:underline">Lihat Semua <span aria-hidden>→</span></Link></div>
          {pengumuman.length === 0 ? <p className="py-4 text-center text-xs text-[#14304a]/60">Belum ada pengumuman.</p> : (
            <ul className="space-y-2.5">
              {pengumuman.map((n, i) => (
                <li key={n.id} className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${warnaPengumuman[i % 3]}`}>{ikonPengumuman[i % 3]}</span>
                  <p className="min-w-0 text-[11px] leading-tight">
                    <Link href={n.tautan || "/notifikasi"} className="block truncate font-semibold text-[#14304a] hover:underline">{n.pesan}</Link>
                    <span className="text-[10px] text-[#14304a]/55">{tanggal(n.dibuat_pada)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Akses cepat + kutipan */}
      <div className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
        <section aria-labelledby="akses-cepat">
          <h2 id="akses-cepat" className="mb-2.5 text-[13px] font-bold text-[#14304a]">Akses Cepat</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "Ajukan Inovasi", h: "/dashboard/pengajuan/baru", i: <IconSend size={24} /> },
              { l: "Lihat Papan Masalah", h: "/papan-masalah", i: <IconPin size={24} /> },
              { l: "Unduh Panduan", h: "/dokumen", i: <IconDownload size={24} /> },
              { l: "Cek Verifikasi QR", h: "/verifikasi", i: <IconQr size={24} /> },
            ].map((a) => (
              <li key={a.l}>
                <Link href={a.h} className="flex h-full min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl bg-[#dbeafb] px-2 py-3 text-center text-[11px] font-semibold leading-tight text-[#14304a] transition hover:-translate-y-0.5 hover:bg-[#cfe3f8]">
                  <span className="text-[#2a6fc0]">{a.i}</span>{a.l}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <aside className="relative flex min-h-[120px] items-end overflow-hidden rounded-2xl bg-[#c9ecd7] p-4 lg:mt-[26px]" aria-label="Kutipan">
          <svg aria-hidden viewBox="0 0 120 70" className="absolute bottom-0 right-0 h-[70%] text-[#a9dcc0]" fill="currentColor"><path d="M2 70V44h10v-8h8v8h8V30h12v40Zm44 0V34l7-12 7 12v36Zm18 0V20l6-18 6 18v50Zm22 0V40h9V26h9v14h10v30Z" /></svg>
          <p className="relative max-w-[10rem] text-[15px] font-semibold italic leading-snug text-[#14304a]"><span aria-hidden className="mb-1 block text-3xl not-italic leading-none text-[#2a9d8f]">“</span>Inovasi hari ini, untuk kampung yang lebih baik esok.</p>
        </aside>
      </div>

      {/* Insight + kontak */}
      <section aria-labelledby="insight" className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className={`${kartu} p-4`}>
          <h2 id="insight" className="mb-3 text-[13px] font-bold text-[#14304a]">Insight KampungLab</h2>
          <div className="grid items-center gap-4 sm:grid-cols-[150px_1fr]">
            <figure className="flex flex-col items-center gap-1.5">
              <svg viewBox="0 0 84 84" width="104" height="104" role="img" aria-label={kepuasan != null ? `Tingkat kepuasan warga ${kepuasan} persen` : "Tingkat kepuasan warga belum tersedia"}>
                <circle cx="42" cy="42" r="34" fill="none" stroke="#dcefe9" strokeWidth="8" />
                {kepuasan != null && <circle cx="42" cy="42" r="34" fill="none" stroke="#1d9a8f" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(kepuasan / 100) * lingkar} ${lingkar}`} transform="rotate(-90 42 42)" />}
                <text x="42" y="47" textAnchor="middle" fontSize="16" fontWeight="700" fill="#14304a">{kepuasan != null ? `${kepuasan}%` : "—"}</text>
              </svg>
              <figcaption className="text-center text-[10px] font-medium text-[#14304a]/70">Tingkat Kepuasan<br />Warga</figcaption>
            </figure>
            <div>
              <p className="mb-1 text-[11px] font-semibold text-[#14304a]">Tren Partisipasi Warga</p>
              <svg viewBox="0 0 330 100" className="h-auto w-full" role="img" aria-label="Grafik jumlah responden uji warga per bulan">
                <defs><linearGradient id="tren" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1fa68a" stopOpacity="0.28" /><stop offset="1" stopColor="#1fa68a" stopOpacity="0" /></linearGradient></defs>
                {[18, 44, 70].map((y) => <line key={y} x1="10" x2="320" y1={y} y2={y} stroke="#e8eef3" />)}
                {adaTren && <><polygon points={`${titik[0]!.x},78 ${garis} ${titik[titik.length - 1]!.x},78`} fill="url(#tren)" /><polyline points={garis} fill="none" stroke="#1fa68a" strokeWidth="1.8" strokeLinejoin="round" />{titik.map((t) => <circle key={t.key} cx={t.x} cy={t.y} r="2.6" fill="#1fa68a" />)}</>}
                {titik.map((t) => <text key={t.key} x={t.x} y="94" textAnchor="middle" fontSize="8" fill="#14304a" fillOpacity="0.6">{t.label}</text>)}
                {!adaTren && <text x="165" y="48" textAnchor="middle" fontSize="9" fill="#14304a" fillOpacity="0.55">Belum ada responden uji warga</text>}
              </svg>
            </div>
          </div>
        </div>
        <aside className="flex flex-col justify-between gap-3 rounded-2xl bg-[#14304a] p-4 text-white" aria-labelledby="kontak-kami">
          <div><h2 id="kontak-kami" className="text-[13px] font-bold">Kontak Kami</h2><p className="mt-1 text-[11px] leading-snug text-white/75">Punya pertanyaan atau masukan? Tim kami siap membantu.</p></div>
          <Link href="/panduan" className="inline-flex w-fit items-center gap-2 rounded-full bg-[#bdebcf] px-4 py-1.5 text-xs font-semibold text-[#14304a] hover:bg-[#cdf3da]">Hubungi Kami <IconArrow size={13} /></Link>
        </aside>
      </section>
    </div>
  );
}
