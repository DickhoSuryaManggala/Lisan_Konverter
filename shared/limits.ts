export const MAX_BYTES = 2 * 1024 * 1024 * 1024;
export const DOC_MAX_BYTES = 50 * 1024 * 1024;

export const ACCEPT_EXT = [
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".ogg",
  ".oga",
  ".webm",
  ".flac",
  ".opus",
  ".wma",
  ".mp4",
] as const;

export const DOC_EXT = [
  ".docx",
  ".doc",
] as const;

export const MD_EXT = [
  ".md",
  ".markdown",
  ".txt",
] as const;

export const PDF_EXT = [
  ".pdf",
] as const;

export const ACCEPT_ATTR = ACCEPT_EXT.join(",");
export const DOC_ATTR = [...DOC_EXT, ...MD_EXT, ...PDF_EXT].join(",");

export function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i).toLowerCase();
}

export function acceptFile(name: string, size: number): string | null {
  if (size <= 0) return "Berkas kosong.";
  if (size > MAX_BYTES) return "Maksimal 2 GB.";
  if (!(ACCEPT_EXT as readonly string[]).includes(extOf(name))) {
    return "Format tidak didukung. Pakai MP3, WAV, M4A, AAC, OGG, FLAC, WEBM, atau OPUS.";
  }
  return null;
}

export function acceptDocFile(name: string, size: number): string | null {
  if (size <= 0) return "Berkas kosong.";
  if (size > DOC_MAX_BYTES) return "Maksimal 50 MB.";
  const ext = extOf(name).toLowerCase() as any;
  const ok = [
    ".docx",
    ".doc",
    ".md",
    ".markdown",
    ".txt",
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
  ].includes(ext);
    if (!ok) return "Pakai DOCX, DOC, MD, TXT, atau PDF.";
  return null;
}

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
