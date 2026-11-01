import "server-only";
import { Document, Footer, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { PHYSICAL_LETTER_VERSION, physicalLetterChecks, type PhysicalLetter } from "./letter";
import { physicalDate } from "./display";

const clean = (value: string) => value.replace(/\p{Cc}/gu, " ");
const paragraph = (value: string, bold = false) => new Paragraph({ children: [new TextRun({ text: clean(value), bold })] });

export async function createPhysicalLetterDocx(data: PhysicalLetter) {
  const stage = data.stage.toUpperCase();
  const rows = [
    ["Referensi salinan DEMO", data.reference],
    ["Nama inovasi", data.title],
    ["Nama tampilan akun pengaju", data.applicantName],
    ["Wilayah", `RT ${data.rt} / RW ${data.rw} / Kelurahan ${data.kelurahan}`],
    ["Sumber", `Putaran ${data.attempt}, revisi draf ${data.draftRevision}, versi alur ${data.workflowVersion}`],
  ];
  const hasAppendix = Boolean(data.problem || data.beneficiaries || data.beneficiaryCount);
  const children = [
    new Paragraph({ children: [new TextRun({ text: "DRAF SIMULASI DEMO — BELUM DITANDATANGANI", bold: true, color: "9A3412", size: 20 })] }),
    new Paragraph({ children: [new TextRun({ text: `SURAT REKOMENDASI ${stage}`, bold: true, size: 28 })] }),
    paragraph("Program KampungLab Surabaya · Template usulan untuk latihan"),
    paragraph("Nomor surat resmi (diisi petugas): ........................................................"),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [2300, 7446], rows: rows.map(([label, value]) => new TableRow({ children: [
      new TableCell({ width: { size: 2300, type: WidthType.DXA }, children: [paragraph(label, true)] }),
      new TableCell({ width: { size: 7446, type: WidthType.DXA }, children: [paragraph(value)] }),
    ] })) }),
    paragraph(`Antrean ${stage} dimulai ${physicalDate(data.queueEnteredAt)}. Batas konfigurasi DEMO: ${data.delayDays} × 24 jam, versi ${data.settingsVersion}; jalur terbuka sejak ${physicalDate(data.eligibleAt)}.`),
    paragraph("Nama tampilan akun belum merupakan verifikasi identitas. Nama pemohon sesuai dokumen: ................................................................................"),
    paragraph(hasAppendix ? "Uraian masalah dan penerima manfaat dari isian salinan tersedia pada lampiran. Lengkapi bagian yang belum tersedia sesuai PRD putaran ini." : "Uraian ringkas masalah dan penerima manfaat (diisi sesuai PRD putaran ini):"),
    paragraph("...................................................................................................................."),
    paragraph(`Saya, Ketua ${stage} / pemeriksa berwenang: ................................................, telah melakukan pemeriksaan berikut (centang sendiri):`),
    ...physicalLetterChecks[data.stage].map(label => paragraph(`☐ ${label}`)),
    paragraph("Jika terdapat konflik kepentingan, jangan mengambil keputusan substansi; hubungi pengelola untuk pemeriksa independen."),
    paragraph("Keputusan manual:  ☐ Setuju    ☐ Perlu revisi    ☐ Tolak", true),
    paragraph("Catatan / alasan: ........................................................................................"),
    paragraph("...................................................................................................................."),
    paragraph("Surabaya, .................................... (tanggal ditandatangani)"),
    paragraph(`Ketua ${stage} / pemeriksa berwenang,`),
    new Paragraph({ text: " ", spacing: { after: 360 } }),
    paragraph("(..............................................................)"),
    paragraph("Tanda tangan, nama jelas dan stempel diisi manual."),
    paragraph("Kelurahan memeriksa keaslian, mengonfirmasi kepada RT/RW, dan mencatat tindakan melalui alur DEMO. Pilihan pada kertas belum mengubah status aplikasi. Kewenangan operasional masih perlu ditetapkan; surat ini bukan persetujuan resmi program atau dana."),
    paragraph(`Disiapkan ${physicalDate(data.generatedAt)} · ${PHYSICAL_LETTER_VERSION}`),
  ];
  if (hasAppendix) children.push(
    new Paragraph({ pageBreakBefore: true, children: [new TextRun({ text: "LAMPIRAN ISIAN SALINAN DEMO", bold: true, size: 26 })] }),
    paragraph(`${data.reference} · Putaran ${data.attempt} · Antrean ${stage}`, true),
    paragraph("Informasi ini berasal dari isian pengaju pada salinan yang dikirim. Isinya belum merupakan hasil verifikasi petugas."),
    paragraph("Masalah", true), paragraph(data.problem || "Belum tersedia pada isian teks salinan; lengkapi sesuai PRD putaran ini."),
    paragraph("Penerima manfaat", true), paragraph(data.beneficiaries || "Belum tersedia pada isian teks salinan; lengkapi sesuai PRD putaran ini."),
    paragraph("Perkiraan jumlah penerima manfaat", true), paragraph(data.beneficiaryCount || "Belum tersedia; lengkapi sesuai PRD putaran ini."),
  );
  const document = new Document({
    creator: "KampungLab Surabaya — Prototipe", title: `Draf rekomendasi ${stage} DEMO`, description: "Draf privat untuk pemeriksaan dan penandatanganan manual.",
    styles: { default: { document: { run: { font: "Arial", size: 20 }, paragraph: { spacing: { after: 100, line: 250 } } } } },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1080, right: 1080 } } },
      footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: clean(`DRAF DEMO · ${data.reference} · ${stage} · ${PHYSICAL_LETTER_VERSION}`), size: 16, color: "64748B" })] })] }) }, children,
    }],
  });
  return Packer.toBuffer(document);
}
