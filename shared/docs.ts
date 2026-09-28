import { extOf } from "./limits.ts";

export const DOC_MAX_BYTES = 50 * 1024 * 1024;
export const IMG_MAX = 20;

export type JobId =
  | "word-pdf"
  | "md-pdf"
  | "pdf-md"
  | "word-md"
  | "md-word"
  | "compress"
  | "pdf-word"
  | "pdf-txt"
  | "word-txt"
  | "img-pdf"
  | "img-compress"
  | "pdf-jpg"
  | "pdf-merge"
  | "pdf-split"
  | "pdf-pptx"
  | "pdf-xlsx"
  | "pptx-pdf"
  | "xlsx-pdf"
  | "pdf-sign"
  | "pdf-watermark"
  | "pdf-rotate"
  | "html-pdf"
  | "pdf-unlock"
  | "pdf-protect"
  | "pdf-reorder"
  | "pdf-a"
  | "pdf-repair"
  | "pdf-page-numbers"
  | "pdf-ocr"
  | "pdf-redact"
  | "pdf-crop"
  | "pdf-form-fill";

export type Job = {
  id: JobId;
  label: string;
  from: readonly string[];
  to: string;
  hint: string;
  accept: string;
};

export const JOBS: readonly Job[] = [
  {
    id: "word-pdf",
    label: "Word ke PDF",
    from: [".docx", ".doc"],
    to: "pdf",
    hint: "DOCX atau DOC. Maks 50 MB.",
    accept: ".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword",
  },
  {
    id: "md-pdf",
    label: "MD ke PDF",
    from: [".md", ".markdown", ".txt"],
    to: "pdf",
    hint: "Markdown atau TXT. Maks 50 MB.",
    accept: ".md,.markdown,.txt,text/markdown,text/plain",
  },
  {
    id: "pdf-md",
    label: "PDF ke MD",
    from: [".pdf"],
    to: "md",
    hint: "PDF berteks. Maks 50 MB.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "word-md",
    label: "Word ke MD",
    from: [".docx", ".doc"],
    to: "md",
    hint: "DOCX atau DOC. Maks 50 MB.",
    accept: ".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword",
  },
  {
    id: "md-word",
    label: "MD ke Word",
    from: [".md", ".markdown", ".txt"],
    to: "doc",
    hint: "Markdown atau TXT. Maks 50 MB.",
    accept: ".md,.markdown,.txt,text/markdown,text/plain",
  },
  {
    id: "compress",
    label: "Kompres PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "PDF. Maks 50 MB. Hasil sering lebih kecil.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-word",
    label: "PDF ke Word",
    from: [".pdf"],
    to: "doc",
    hint: "PDF berteks jadi DOC. Maks 50 MB.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-txt",
    label: "PDF ke TXT",
    from: [".pdf"],
    to: "txt",
    hint: "PDF berteks jadi TXT. Maks 50 MB.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "word-txt",
    label: "Word ke TXT",
    from: [".docx", ".doc"],
    to: "txt",
    hint: "DOCX atau DOC. Maks 50 MB.",
    accept: ".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword",
  },
  {
    id: "img-pdf",
    label: "Gambar ke PDF",
    from: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"],
    to: "pdf",
    hint: "1–20 gambar jadi satu PDF. JPG, PNG, WEBP, GIF, BMP. Maks 50 MB per berkas.",
    accept: ".jpg,.jpeg,.png,.webp,.gif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/bmp",
  },
  {
    id: "img-compress",
    label: "Kompres Gambar",
    from: [".jpg", ".jpeg", ".png", ".webp", ".bmp"],
    to: "jpg",
    hint: "Kompres foto JPG, PNG, WEBP. Maks 50 MB. Hasil lebih kecil.",
    accept: ".jpg,.jpeg,.png,.webp,.bmp,image/jpeg,image/png,image/webp,image/bmp",
  },
  {
    id: "pdf-jpg",
    label: "PDF ke JPG",
    from: [".pdf"],
    to: "jpg",
    hint: "Halaman pertama jadi JPG. Maks 50 MB.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-merge",
    label: "Gabungkan PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "Gabungkan beberapa file PDF menjadi satu.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-split",
    label: "Pisahkan PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "Pisahkan PDF menjadi beberapa file terpisah. Pilih halaman.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-rotate",
    label: "Putar PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "Putar halaman PDF ke sudut tertentu.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-watermark",
    label: "Tanda Air PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "Tambahkan watermark (teks) ke PDF.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-page-numbers",
    label: "Nomor Halaman",
    from: [".pdf"],
    to: "pdf",
    hint: "Tambah nomor halaman ke PDF.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-reorder",
    label: "Atur PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "Ubah urutan halaman PDF.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-crop",
    label: "Potong PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "Potong area halaman PDF.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-pptx",
    label: "PDF ke PowerPoint",
    from: [".pdf"],
    to: "pptx",
    hint: "PDF jadi presentasi PowerPoint. TODO: perlu API eksternal.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-xlsx",
    label: "PDF ke Excel",
    from: [".pdf"],
    to: "xlsx",
    hint: "PDF jadi lembar kalkulasi. TODO: perlu API eksternal.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pptx-pdf",
    label: "PowerPoint ke PDF",
    from: [".pptx", ".ppt"],
    to: "pdf",
    hint: "PowerPoint jadi PDF. TODO: perlu library office.",
    accept: ".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  {
    id: "xlsx-pdf",
    label: "Excel ke PDF",
    from: [".xlsx", ".xls"],
    to: "pdf",
    hint: "Excel jadi PDF. TODO: perlu library office.",
    accept: ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  {
    id: "pdf-sign",
    label: "Tanda Tangan PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "Tanda tangan digital PDF. TODO: perlu sertifikat.",
    accept: ".pdf,application/pdf",
  },
    {
    id: "html-pdf",
    label: "HTML ke PDF",
    from: [".html", ".htm"],
    to: "pdf",
    hint: "HTML jadi PDF. TODO: perlu html2pdf library.",
    accept: ".html,.htm,text/html",
  },
  {
    id: "pdf-unlock",
    label: "Buka PDF Terkunci",
    from: [".pdf"],
    to: "pdf",
    hint: "Hapus password PDF. TODO: perlu dekripsi.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-protect",
    label: "Proteksi PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "Tambah password PDF. TODO: perlu enkripsi.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-a",
    label: "PDF ke PDF/A",
    from: [".pdf"],
    to: "pdf",
    hint: "Format PDF/A untuk arsip. TODO: kompleks.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-repair",
    label: "Perbaiki PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "Perbaiki struktur PDF. TODO: perlu parser khusus.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-ocr",
    label: "OCR PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "OCR teks dari PDF scan. TODO: perlu Tesseract.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-redact",
    label: "Bangkan PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "Samarkan bagian PDF. TODO: UI select area.",
    accept: ".pdf,application/pdf",
  },
  {
    id: "pdf-form-fill",
    label: "Formulir PDF",
    from: [".pdf"],
    to: "pdf",
    hint: "Isi bidang formulir PDF. TODO: UI form detect.",
    accept: ".pdf,application/pdf",
  },
];

export function jobById(id: JobId): Job {
  const j = JOBS.find((x) => x.id === id);
  if (!j) throw new Error("Job tidak dikenal.");
  return j;
}

export function acceptDoc(name: string, size: number, job: JobId): string | null {
  if (size <= 0) return "Berkas kosong.";
  if (size > DOC_MAX_BYTES) return "Maksimal 50 MB.";
  const ext = extOf(name);
  const j = jobById(job);
  if (j.from.length > 0 && !(j.from as readonly string[]).includes(ext)) {
    return `Pakai ${j.from.join(", ")}.`;
  }
  return null;
}

export function outName(src: string, ext: string): string {
  const base = src.replace(/\.[^.]+$/, "") || "dokumen";
  return `${base}${ext.startsWith(".") ? ext : `.${ext}`}`;
}
