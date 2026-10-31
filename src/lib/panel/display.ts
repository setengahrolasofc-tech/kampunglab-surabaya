export const panelSeats={brida_opd:"BRIDA / OPD",academic:"Akademisi",practitioner:"Praktisi"} as const;
export const panelStatus:Record<string,string>={active:"Aktif",revoked:"Dicabut",conflict:"Mundur karena konflik",open:"Pembagian aktif",paused:"Pembagian dijeda"};
export const panelEventLabels:Record<string,string>={share:"Pengaju mengaktifkan pembagian ke panel",pause:"Pengaju menjeda pembagian ke panel",assign:"Admin menetapkan reviewer",revoke:"Admin mencabut penugasan"};
export const panelRubric=[
  {key:"problem_score",label:"Masalah nyata dan terverifikasi",max:25},
  {key:"beneficiaries_score",label:"Penerima manfaat jelas dan memadai",max:25},
  {key:"feasibility_score",label:"Kelayakan solusi dan kemampuan tim",max:20},
  {key:"evidence_score",label:"Ukuran bukti terukur",max:15},
  {key:"budget_score",label:"RAB wajar dan tidak duplikat",max:15},
] as const;
export const panelDate=(value:string)=>new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(new Date(value))+" WIB";
export const panelPage=(value?:string)=>value&&/^[1-9]\d{0,3}$/.test(value)?Number(value)-1:0;
