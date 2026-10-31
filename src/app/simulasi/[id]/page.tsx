import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {isUuid} from "@/lib/admin/validation.mjs";
import {getSimulation} from "@/lib/simulations/data";
import {getDraftContext} from "@/lib/drafts/data";
import {validateDraftDocument} from "@/lib/drafts/schema.mjs";
import {InnovationSnapshot} from "@/components/innovation-snapshot";
import {RtNoteForm} from "@/components/simulation-forms";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Salinan simulasi DEMO",robots:{index:false,follow:false}};
const date=(v:string)=>new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(new Date(v))+" WIB";
export default async function SimulationPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{status?:string}>}){
  const {id}=await params;if(!isUuid(id))notFound();
  const data=await getSimulation(id);if(!data)notFound();
  const [context,query]=await Promise.all([getDraftContext(),searchParams]);
  const s=data.simulation;
  return <main id="konten-utama" tabIndex={-1} className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
    <nav aria-label="Navigasi simulasi" className="flex flex-wrap gap-5 text-sm font-semibold text-emerald-900"><Link href="/pengajuan" className="underline">Pengajuan Saya</Link>{data.can_note?<Link href="/antrean/rt" className="underline">Antrean RT</Link>:null}</nav>
    <p className="mt-7 text-xs font-bold tracking-widest text-emerald-800">SALINAN SIMULASI DEMO</p><h1 className="mt-3 break-words text-3xl font-bold sm:text-4xl">{s.title}</h1><p className="mt-4 break-all text-sm text-slate-600">{s.reference}</p><p className="mt-2 text-sm text-slate-600">Dikirim {date(s.submitted_at)} · salinan draf revisi {s.draft_revision}</p>
    <div className="mt-6 rounded-xl bg-amber-50 p-5 text-sm leading-7 text-amber-950"><p className="font-semibold">Tahap pemeriksaan awal RT — mode DEMO</p><p>Halaman ini menampilkan salinan yang tersimpan saat dikirim. Perubahan draf berikutnya tidak mengubah isi salinan. Catatan awal belum menjadi keputusan persetujuan, penolakan, atau pencairan dana.</p>{!data.route_ready?<p className="mt-3 font-semibold">Belum ada pemegang mandat utama RT aktif yang dapat memeriksa simulasi ini. Pengelola perlu menyiapkan petugas; proses tetap berada di RT.</p>:null}</div>
    {query.status==="catatan-disimpan"?<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-950">Catatan awal RT berhasil disimpan.</p>:null}
    <div className="mt-7"><InnovationSnapshot document={validateDraftDocument(s.document).data} territories={context.territories} themes={context.themes}/></div>
    <section aria-labelledby="rt-notes-title" className="mt-8 rounded-2xl border border-emerald-950/10 bg-white p-5 sm:p-7"><h2 id="rt-notes-title" className="text-xl font-bold">Riwayat catatan awal RT</h2>{data.notes.length?<ul className="mt-6 space-y-5">{data.notes.map(note=><li key={note.id} className="rounded-xl border border-slate-200 p-5"><p className="font-bold">{note.actor_name||"Petugas"} atas nama {note.office_name}</p><p className="mt-2 text-xs text-slate-600">{date(note.created_at)}</p>{note.family_conflict?<p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-950">Petugas melaporkan hubungan keluarga atau konflik kepentingan.</p>:<p className="mt-3 text-sm text-slate-600">Domisili: {note.domicile_checked?"sudah dicatat sebagai diperiksa":"belum dicatat sebagai diperiksa"}. Masalah nyata: {note.problem_checked?"sudah dicatat sebagai ditinjau":"belum dicatat sebagai ditinjau"}.</p>}<p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{note.body}</p></li>)}</ul>:<p className="mt-5 text-slate-600">Belum ada catatan petugas RT.</p>}</section>
    {data.can_note?<section aria-labelledby="rt-note-form" className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-5 sm:p-7"><h2 id="rt-note-form" className="mb-5 text-xl font-bold">Tambah catatan awal RT</h2><RtNoteForm key={data.requestId} simulationId={s.id} requestId={data.requestId}/></section>:null}
  </main>;
}
