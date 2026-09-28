import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { mdToHtml, stripHtml, textToMd } from "../../shared/md.ts";
import { IMG_MAX, outName, type JobId } from "../../shared/docs.ts";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function htmlToDocBlob(html: string): Blob {
  const inner = html.includes("<body") ? html : `<body>${html}</body>`;
  const doc = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head>${inner}</html>`;
  return new Blob(["\ufeff", doc], { type: "application/msword" });
}

function htmlToMd(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) {
      return Array.from(node.childNodes).map(walk).join("");
    }
    const tag = node.tagName.toLowerCase();
    const inner = Array.from(node.childNodes).map(walk).join("");
    if (tag === "h1") return `\n\n# ${inner.trim()}\n\n`;
    if (tag === "h2") return `\n\n## ${inner.trim()}\n\n`;
    if (tag === "h3") return `\n\n### ${inner.trim()}\n\n`;
    if (tag === "p") return `\n\n${inner.trim()}\n\n`;
    if (tag === "br") return "\n";
    if (tag === "li") return `- ${inner.trim()}\n`;
    if (tag === "ul" || tag === "ol") return `\n${inner}\n`;
    if (tag === "strong" || tag === "b") return `**${inner}**`;
    if (tag === "em" || tag === "i") return `*${inner}*`;
    if (tag === "code") return inner.includes("\n") ? `\n\n\`\`\`\n${inner.trim()}\n\`\`\`\n\n` : `\`${inner}\``;
    if (tag === "pre") return `\n\n\`\`\`\n${node.textContent?.trim() ?? ""}\n\`\`\`\n\n`;
    if (tag === "a") {
      const href = node.getAttribute("href") || "";
      return href ? `[${inner}](${href})` : inner;
    }
    return inner;
  };
  return walk(doc.body)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function wordHtml(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const u8 = new Uint8Array(buf);
  if (u8[0] === 0x50 && u8[1] === 0x4b) {
    const mammoth = await import("mammoth");
    const api = mammoth.default || mammoth;
    const { value } = await api.convertToHtml({ arrayBuffer: buf });
    return value;
  }
  const text = new TextDecoder().decode(buf);
  if (/<html/i.test(text) || /<w:worddocument/i.test(text)) return text;
  throw new Error("Pakai DOCX. DOC binary lama tidak didukung.");
}

async function fileText(file: File): Promise<string> {
  return file.text();
}

function paintPdf(html: string): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const maxW = 170;
  let y = 20;

  const addPage = () => {
    doc.addPage();
    y = 20;
  };

  const write = (text: string, size: number, gap: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(text || " ", maxW);
    for (const line of lines) {
      if (y > 277) addPage();
      doc.text(line, 20, y);
      y += gap;
    }
  };

  const walk = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (tag === "h1") {
      y += 4;
      write(text, 18, 8);
      y += 2;
      return;
    }
    if (tag === "h2") {
      y += 3;
      write(text, 14, 7);
      y += 1;
      return;
    }
    if (tag === "h3") {
      y += 2;
      write(text, 12, 6);
      return;
    }
    if (tag === "li") {
      write(`- ${text}`, 11, 6);
      return;
    }
    if (tag === "pre" || tag === "code") {
      if (tag === "code" && el.parentElement?.tagName.toLowerCase() === "pre") return;
      write(el.textContent?.trim() || " ", 9, 5);
      return;
    }
    if (tag === "p") {
      write(text, 11, 6);
      y += 2;
      return;
    }
    if (tag === "ul" || tag === "ol" || tag === "div" || tag === "body" || tag === "section") {
      for (const child of Array.from(el.children)) walk(child);
      if (!el.children.length && text) write(text, 11, 6);
      return;
    }
    if (el.children.length) {
      for (const child of Array.from(el.children)) walk(child);
      return;
    }
    if (text) write(text, 11, 6);
  };

  const root = parsed.body;
  if (root.children.length) for (const child of Array.from(root.children)) walk(child);
  else write(stripHtml(html) || " ", 11, 6);

  return doc.output("blob");
}

let workerInitialized = false;

async function getPdfJsLib() {
  const mod = await import("pdfjs-dist");
  if (!workerInitialized) {
    mod.GlobalWorkerOptions.workerSrc = pdfWorker;
    workerInitialized = true;
  }
  return mod;
}

async function pdfToText(file: File): Promise<string> {
  const { getDocument } = await getPdfJsLib();
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let line = "";
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = "transform" in item ? Number((item.transform as number[])[5]) : 0;
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        parts.push(line.trimEnd());
        line = "";
      }
      line += item.str + (item.hasEOL ? "\n" : "");
      lastY = y;
    }
    if (line.trim()) parts.push(line.trimEnd());
    if (i < pdf.numPages) parts.push("");
  }
  const text = parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new Error("PDF tanpa teks. Hasil kosong. Scan gambar tidak bisa dibaca.");
  return text;
}

export type Quality = "ringan" | "sedang" | "kuat";

const Q: Record<Quality, { jpeg: number; scale: number }> = {
  ringan: { jpeg: 0.72, scale: 1.4 },
  sedang: { jpeg: 0.52, scale: 1.15 },
  kuat: { jpeg: 0.34, scale: 0.95 },
};

async function compressPdf(file: File, quality: Quality): Promise<Blob> {
  const { getDocument } = await getPdfJsLib();
  const srcBuf = await file.arrayBuffer();
  const src = new Uint8Array(srcBuf).slice();
  const loadingTask = getDocument({ data: src });
  const pdf = await loadingTask.promise;
  const out = await PDFDocument.create();
  const { jpeg, scale } = Q[quality];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas gagal.");

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale });
    const w = Math.min(4096, Math.ceil(vp.width));
    const h = Math.min(4096, Math.ceil(vp.height));
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    const drawViewport = page.getViewport({ scale: w / page.getViewport({ scale: 1 }).width });
    await page.render({ canvas, canvasContext: ctx, viewport: drawViewport }).promise;
    const jpegBlob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("JPEG gagal."))), "image/jpeg", jpeg);
    });
    const jpg = await out.embedJpg(await jpegBlob.arrayBuffer());
    const p = out.addPage([w * 0.75, h * 0.75]);
    p.drawImage(jpg, { x: 0, y: 0, width: p.getWidth(), height: p.getHeight() });
  }

  const bytes = await out.save({ useObjectStreams: true });
  const result = new Blob([new Uint8Array(bytes).buffer], { type: "application/pdf" });
  if (result.size >= file.size) {
    const copy = await PDFDocument.load(new Uint8Array(srcBuf), { ignoreEncryption: true });
    const slim = await copy.save({ useObjectStreams: true });
    return new Blob([new Uint8Array(slim).buffer], { type: "application/pdf" });
  }
  return result;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gambar gagal dibaca."));
    };
    img.src = url;
  });
}

async function embedImagePage(out: Awaited<ReturnType<typeof PDFDocument.create>>, file: File) {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas gagal.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const jpeg: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("JPEG gagal."))), "image/jpeg", 0.92);
  });
  const jpg = await out.embedJpg(await jpeg.arrayBuffer());
  const maxW = 595.28;
  const maxH = 841.89;
  const scale = Math.min(maxW / jpg.width, maxH / jpg.height, 1);
  const w = jpg.width * scale;
  const h = jpg.height * scale;
  const page = out.addPage([maxW, maxH]);
  page.drawImage(jpg, { x: (maxW - w) / 2, y: (maxH - h) / 2, width: w, height: h });
}

export type ConvertResult = { blob: Blob; name: string; before: number; after: number };

export async function convertImagesToPdf(files: File[]): Promise<ConvertResult> {
  if (!files.length) throw new Error("Pilih gambar dulu.");
  if (files.length > IMG_MAX) throw new Error(`Maksimal ${IMG_MAX} gambar.`);
  const out = await PDFDocument.create();
  for (const f of files) await embedImagePage(out, f);
  const bytes = await out.save({ useObjectStreams: true });
  const blob = new Blob([new Uint8Array(bytes).buffer], { type: "application/pdf" });
  const name = files.length === 1 ? outName(files[0].name, "pdf") : "gambar.pdf";
  return { blob, name, before: files.reduce((n, f) => n + f.size, 0), after: blob.size };
}

async function pdfFirstPageJpg(file: File): Promise<Blob> {
  const { getDocument } = await getPdfJsLib();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const vp = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(4096, Math.ceil(vp.width));
  canvas.height = Math.min(4096, Math.ceil(vp.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas gagal.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const draw = page.getViewport({ scale: canvas.width / page.getViewport({ scale: 1 }).width });
  await page.render({ canvas, canvasContext: ctx, viewport: draw }).promise;
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("JPG gagal."))), "image/jpeg", 0.88);
  });
}

const IQ: Record<Quality, { quality: number; maxDim: number }> = {
  ringan: { quality: 0.85, maxDim: 2560 },
  sedang: { quality: 0.65, maxDim: 1920 },
  kuat: { quality: 0.45, maxDim: 1280 },
};

async function compressImage(file: File, quality: Quality): Promise<Blob> {
  const img = await loadImage(file);
  const { quality: q, maxDim } = IQ[quality];
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas gagal.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const type = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Kompres gambar gagal."))), type, q);
  });
}

export async function convertFile(file: File, job: JobId, quality: Quality = "sedang"): Promise<ConvertResult> {
  const before = file.size;
  let blob: Blob;
  let name: string;

  if (job === "word-pdf") {
    blob = paintPdf(await wordHtml(file));
    name = outName(file.name, "pdf");
  } else if (job === "md-pdf") {
    blob = paintPdf(mdToHtml(await fileText(file)));
    name = outName(file.name, "pdf");
  } else if (job === "pdf-md") {
    const md = textToMd(await pdfToText(file));
    blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    name = outName(file.name, "md");
  } else if (job === "word-md") {
    const md = htmlToMd(await wordHtml(file));
    blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    name = outName(file.name, "md");
  } else if (job === "md-word") {
    blob = htmlToDocBlob(mdToHtml(await fileText(file)));
    name = outName(file.name, "doc");
  } else if (job === "compress") {
    blob = await compressPdf(file, quality);
    name = outName(file.name.replace(/\.pdf$/i, "") + "-kecil", "pdf");
  } else if (job === "pdf-word") {
    const raw = (await pdfToText(file))
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    blob = htmlToDocBlob(raw.split(/\n/).map((l) => `<p>${l || "&nbsp;"}</p>`).join(""));
    name = outName(file.name, "doc");
  } else if (job === "pdf-txt") {
    blob = new Blob([await pdfToText(file)], { type: "text/plain;charset=utf-8" });
    name = outName(file.name, "txt");
  } else if (job === "word-txt") {
    blob = new Blob([stripHtml(await wordHtml(file))], { type: "text/plain;charset=utf-8" });
    name = outName(file.name, "txt");
  } else if (job === "img-pdf") {
    return convertImagesToPdf([file]);
  } else if (job === "img-compress") {
    blob = await compressImage(file, quality);
    const ext = file.name.toLowerCase().endsWith(".png") ? "png" : file.name.toLowerCase().endsWith(".webp") ? "webp" : "jpg";
    name = outName(file.name.replace(/\.[^.]+$/, "") + "-kecil", ext);
  } else if (job === "pdf-merge") {
    throw new Error("PDF merge belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-split") {
    throw new Error("PDF split belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-rotate") {
    throw new Error("PDF rotate belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-watermark") {
    throw new Error("PDF watermark belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-page-numbers") {
    throw new Error("Nomor halaman belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-reorder") {
    throw new Error("Atur PDF belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-crop") {
    throw new Error("Potong PDF belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-pptx") {
    throw new Error("PDF ke PowerPoint belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-xlsx") {
    throw new Error("PDF ke Excel belum diimplementasi. Pilih alat lain.");
  } else if (job === "pptx-pdf") {
    throw new Error("PowerPoint ke PDF belum diimplementasi. Pilih alat lain.");
  } else if (job === "xlsx-pdf") {
    throw new Error("Excel ke PDF belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-sign") {
    throw new Error("Tanda tangan PDF belum diimplementasi. Pilih alat lain.");
  } else if (job === "html-pdf") {
    throw new Error("HTML ke PDF belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-unlock") {
    throw new Error("Buka PDF terkunci belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-protect") {
    throw new Error("Proteksi PDF belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-a") {
    throw new Error("PDF ke PDF/A belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-repair") {
    throw new Error("Perbaiki PDF belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-ocr") {
    throw new Error("OCR PDF belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-redact") {
    throw new Error("Bangkan PDF belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-form-fill") {
    throw new Error("Formulir PDF belum diimplementasi. Pilih alat lain.");
  } else if (job === "pdf-jpg") {
    blob = await pdfFirstPageJpg(file);
    name = outName(file.name, "jpg");
  } else {
    throw new Error("Job tidak dikenal.");
  }

  return { blob, name, before, after: blob.size };
}

export function saveResult(r: ConvertResult) {
  download(r.blob, r.name);
}
