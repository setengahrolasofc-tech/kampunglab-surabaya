export const physicalStatusLabels:Record<string,string>={pending:"Menunggu konfirmasi",accepted:"Dikonfirmasi",rejected:"Dokumen ditolak",withdrawn:"Ditarik pengaju",obsolete:"Ditutup karena tahap berubah"};
export const physicalActionLabels:Record<string,string>={accept:"Mengonfirmasi rekomendasi fisik",reject:"Menolak dokumen fisik",conflict:"Melaporkan konflik",withdraw:"Menarik permintaan"};
export const physicalDate=(value:string)=>new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(new Date(value))+" WIB";
export const physicalPage=(value?:string)=>value&&/^[1-9]\d{0,3}$/.test(value)?Number(value)-1:0;
