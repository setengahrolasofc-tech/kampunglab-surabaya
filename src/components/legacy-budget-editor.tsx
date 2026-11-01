"use client";
import type {DraftDocument} from "@/lib/drafts/types";
import {budgetLineTotal,formatRupiahMilli} from "@/lib/drafts/schema.mjs";
type Budget=DraftDocument["budget"];
const fields=[
  {key:"description",label:"Uraian kebutuhan",max:240},
  {key:"category",label:"Kategori",max:80},
  {key:"unit",label:"Satuan",max:40},
  {key:"quantity",label:"Volume (maksimal 3 desimal)",max:16},
  {key:"unit_price",label:"Harga satuan (Rp)",max:13},
  {key:"usage_stage",label:"Tahap penggunaan",max:80},
] as const;
export function LegacyBudgetEditor({budget,onChange,errors}:{budget:Budget;onChange:(budget:Budget)=>void;errors:Record<string,string>}){
  return <section aria-labelledby="legacy-rab-title" className="space-y-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5"><h3 id="legacy-rab-title" className="font-bold">Rincian RAB dari draf lama</h3><p className="text-sm leading-7 text-slate-700">Rincian tetap tersimpan dan menjadi dasar subtotal. Edit baris secara langsung agar sesuai dokumen RAB. Sedikitnya satu baris dipertahankan; membuka atau menyimpan draf tidak mengubahnya menjadi subtotal tunggal.</p>{errors["budget.items"]?<p role="alert" className="text-sm text-red-800">{errors["budget.items"]}</p>:null}
    <ol className="space-y-5">{budget.items.map((item,index)=><li key={`${item.id}-${index}`} className="rounded-xl border border-emerald-950/10 bg-white p-4"><h4 className="mb-4 font-semibold">Komponen {index+1}</h4><div className="grid gap-4 sm:grid-cols-2">{fields.map(field=>{const id=`legacy-rab-${index}-${field.key}`,error=errors[`budget.items.${index}.${field.key}`];return <div key={field.key}><label htmlFor={id} className="mb-2 block text-sm font-semibold">{field.label}</label><input id={id} value={item[field.key]} maxLength={field.max} inputMode={field.key==="quantity"?"decimal":field.key==="unit_price"?"numeric":undefined} aria-invalid={Boolean(error)} aria-describedby={error?`${id}-error`:undefined} onChange={event=>onChange({...budget,items:budget.items.map((row,i)=>i===index?{...row,[field.key]:event.target.value}:row)})} className="min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 aria-invalid:border-red-600"/>{error?<p id={`${id}-error`} className="mt-2 text-sm text-red-800">{error}</p>:null}</div>;})}</div><p className="mt-4 text-sm font-semibold">Subtotal baris: {budgetLineTotal(item)===null?"periksa angka":formatRupiahMilli(budgetLineTotal(item)??BigInt(0))}</p><button type="button" disabled={budget.items.length===1} onClick={()=>onChange({...budget,items:budget.items.filter((_,i)=>i!==index)})} className="mt-3 min-h-11 text-sm font-semibold text-red-800 underline disabled:opacity-40">Hapus komponen {index+1}</button></li>)}</ol>
    <button type="button" disabled={budget.items.length>=50} onClick={()=>onChange({...budget,items:[...budget.items,{id:crypto.randomUUID(),description:"",category:"",unit:"",quantity:"",unit_price:"",usage_stage:""}]})} className="min-h-11 rounded-xl border border-emerald-900 px-4 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-40">Tambah komponen RAB</button>
  </section>;
}
