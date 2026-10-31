import Link from "next/link";
import type {PhysicalContext} from "@/lib/physical/types";
import {physicalDate} from "@/lib/physical/display";
export function PhysicalClock({data}:{data:PhysicalContext}){
  if(!data.stage&&!data.request_count)return null;
  return <section className="mt-6 rounded-xl border border-emerald-200 bg-white p-5 text-sm leading-7"><h2 className="font-bold">Batas waktu jalur dokumen fisik</h2>{data.stage?<><p className="mt-3">Antrean {data.stage.toUpperCase()} sejak {physicalDate(data.queue_entered_at)}. Batas {data.delay_days} × 24 jam: {physicalDate(data.eligible_at)}.</p><p>{data.eligible?"Batas waktu tahap ini sudah tercapai; belum ada keputusan otomatis.":"Tetap menunggu keputusan petugas. Jalur fisik terbuka setelah batas waktu."}</p><p className="mt-2 text-xs text-slate-600">Diperiksa {physicalDate(data.server_now)}. Muat ulang untuk memperbarui informasi.</p></>:null}{data.is_owner&&(data.eligible||data.request_count>0)?<Link href={`/simulasi/${data.simulation.id}/dokumen-fisik`} className="mt-3 inline-block font-semibold text-emerald-900 underline">{data.pending_id?"Lihat permintaan dokumen fisik":data.eligible?"Ajukan lewat dokumen fisik / lihat riwayat":"Lihat riwayat dokumen fisik"}</Link>:null}</section>;
}
