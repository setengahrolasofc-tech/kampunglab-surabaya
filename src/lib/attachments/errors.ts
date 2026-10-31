import "server-only";
const messages:Record<string,string>={
  PHYSICAL_UPLOAD_NOT_AVAILABLE:"Unggah surat fisik hanya tersedia setelah batas hari pada antrean RT/RW yang sesuai. Periksa tahap terbaru dari salinan simulasi.",
  SESSION_REQUIRED:"Sesi sudah tidak berlaku. Masuk kembali sebelum melanjutkan.",
  ATTACHMENT_UNAVAILABLE:"Lampiran tidak tersedia untuk akunmu.",
  DEMO_ONLY:"Simpan draf dengan wilayah yang tersedia sebelum mengunggah.",
  INVALID_FILE:"Gunakan PDF, JPEG, PNG, atau WebP yang valid, dengan ekstensi sesuai isinya dan nama maksimal 160 karakter.",
  FILE_TOO_LARGE:"Ukuran berkas maksimal 3 MiB.",
  ATTACHMENT_LIMIT:"Batas: 10 berkas aktif per draf dan 50 berkas aktif per akun. Lepas lampiran dari draf bila tidak dipakai.",
  UPLOAD_RATE_LIMIT:"Batas: 30 reservasi unggahan per 24 jam. Coba lagi setelah jendela batasnya berlalu.",
  UPLOAD_REQUEST_CONFLICT:"Permintaan sebelumnya memakai berkas berbeda. Periksa daftar di tab baru, lalu muat ulang halaman untuk unggahan baru.",
  ATTACHMENT_ARCHIVED:"Lampiran sudah dilepas atau draf tidak lagi memakai pilihan yang sesuai. Periksa daftar terbaru.",
  UPLOAD_NOT_CONFIRMED:"Unggahan belum dapat dikonfirmasi. Periksa daftar di tab baru; pilih ulang berkas yang sama untuk mencoba kembali, atau lepas reservasi yang tertunda.",
  FILE_INTEGRITY_MISMATCH:"Integritas berkas tidak sesuai catatan unggahan. Unduhan dihentikan; hubungi pengelola.",
};
export const fileErrorMessage=(code:string)=>Object.hasOwn(messages,code)?messages[code]:"Layanan berkas belum dapat menyelesaikan permintaan. Periksa daftar di tab baru sebelum mencoba kembali.";
export async function edgeFileError(error:unknown):Promise<string>{
  if(error&&typeof error==="object"&&"context" in error&&error.context instanceof Response){
    try {const data=await error.context.clone().json();if(typeof data?.error==="string")return data.error;}catch{/* Do not expose raw provider messages. */}
  }
  return "FILE_SERVICE_UNAVAILABLE";
}
