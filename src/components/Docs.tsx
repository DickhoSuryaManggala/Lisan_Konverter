import { useState } from "react";
import { DownloadSimple, FilePdf, FileText, FileDoc, WarningCircle, Image as ImageIcon } from "@phosphor-icons/react";
import { convertFile, type ConvertResult, type Quality } from "../lib/convert.ts";
import { UploadDrop } from "./UploadDrop.tsx";
import { acceptDoc, DOC_MAX_BYTES, type JobId } from "../../shared/docs.ts";

const JOB_ICON: Record<JobId, React.ReactNode> = {
  "word-pdf": <FileDoc className="size-4" />,
  "md-pdf": <FileText className="size-4" />,
  "pdf-md": <FilePdf className="size-4" />,
  "word-md": <FileText className="size-4" />,
  "md-word": <FileDoc className="size-4" />,
  compress: <FilePdf className="size-4" />,
  "pdf-word": <FileDoc className="size-4" />,
  "pdf-txt": <FileText className="size-4" />,
  "word-txt": <FileText className="size-4" />,
  "img-pdf": <FilePdf className="size-4" />,
  "img-compress": <ImageIcon className="size-4" />,
  "pdf-jpg": <FilePdf className="size-4" />,
  "pdf-merge": <FilePdf className="size-4" />,
  "pdf-split": <FilePdf className="size-4" />,
  "pdf-rotate": <FilePdf className="size-4" />,
  "pdf-watermark": <FilePdf className="size-4" />,
  "pdf-page-numbers": <FilePdf className="size-4" />,
  "pdf-reorder": <FilePdf className="size-4" />,
  "pdf-crop": <FilePdf className="size-4" />,
  "pdf-pptx": <FilePdf className="size-4" />,
  "pdf-xlsx": <FilePdf className="size-4" />,
  "pptx-pdf": <FilePdf className="size-4" />,
  "xlsx-pdf": <FilePdf className="size-4" />,
  "pdf-sign": <FilePdf className="size-4" />,
  "html-pdf": <FilePdf className="size-4" />,
  "pdf-unlock": <FilePdf className="size-4" />,
  "pdf-protect": <FilePdf className="size-4" />,
  "pdf-a": <FilePdf className="size-4" />,
  "pdf-repair": <FilePdf className="size-4" />,
  "pdf-ocr": <FilePdf className="size-4" />,
  "pdf-redact": <FilePdf className="size-4" />,
  "pdf-form-fill": <FilePdf className="size-4" />,
};

export function Docs() {
  return (
    <section id="docs" className="px-6 py-32 md:py-48">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="max-w-4xl text-[clamp(2.4rem, 4.5vw, 4.4rem)] leading-[1.05] tracking-tight">
          Format lain.
        </h2>
        <p className="mt-5 max-w-[50ch] text-lg text-paper/60">
          Word, Markdown, PDF — konversi dua arah. Kompres PDF agar ringan kirim.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <JobCard id="word-pdf" label="Word ke PDF" icon={<FileDoc className="size-6" />} hint="DOCX, DOC" />
          <JobCard id="md-pdf" label="MD ke PDF" icon={<FileText className="size-6" />} hint="MD, TXT" />
          <JobCard id="pdf-md" label="PDF ke MD" icon={<FilePdf className="size-6" />} hint="PDF berteks" />
          <JobCard id="word-md" label="Word ke MD" icon={<FileText className="size-6" />} hint="DOCX, DOC" />
          <JobCard id="md-word" label="MD ke Word" icon={<FileDoc className="size-6" />} hint="MD, TXT" />
          <JobCard id="pdf-word" label="PDF ke Word" icon={<FileDoc className="size-6" />} hint="PDF berteks" />
          <JobCard id="pdf-txt" label="PDF ke TXT" icon={<FileText className="size-6" />} hint="PDF berteks" />
          <JobCard id="word-txt" label="Word ke TXT" icon={<FileText className="size-6" />} hint="DOCX, DOC" />
          <JobCard id="img-pdf" label="Gambar ke PDF" icon={<FilePdf className="size-6" />} hint="JPG, PNG" />
          <JobCard id="img-compress" label="Kompres Gambar" icon={<ImageIcon className="size-6" />} hint="JPG, PNG, WEBP" />
          <JobCard id="pdf-jpg" label="PDF ke JPG" icon={<FilePdf className="size-6" />} hint="Halaman 1" />
          <JobCard id="compress" label="Kompresi PDF" icon={<FilePdf className="size-6" />} hint="PDF" />
        </div>
      </div>
    </section>
  );
}

interface Props {
  id: JobId;
  label: string;
  icon: React.ReactNode;
  hint: string;
}

function JobCard({ id, label, icon, hint }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "converting" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [quality, setQuality] = useState<Quality>("sedang");
  const [pct, setPct] = useState(0);
  const [saved, setSaved] = useState<ConvertResult | null>(null);

  const busy = status === "converting";

  const onPick = (f: File) => {
    const bad = acceptDoc(f.name, f.size, id);
    if (bad) {
      setError(bad);
      return;
    }
    setFile(f);
    setStatus("idle");
    setError("");
    setSaved(null);
    setPct(0);
  };

  const onClear = () => {
    setFile(null);
    setStatus("idle");
    setError("");
    setSaved(null);
    setPct(0);
  };

  const runConvert = async () => {
    if (!file) return;
    setStatus("converting");
    setError("");
    setPct(12);
    try {
      const r = await convertFile(file, id, id === "compress" || id === "img-compress" ? quality : "sedang");
      setPct(100);
      setStatus("done");
      setSaved(r);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Konversi gagal.";
      setError(m);
      setStatus("error");
    }
  };

  const download = () => {
    if (!saved) return;
    const url = URL.createObjectURL(saved.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = saved.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ratio = saved ? Math.round((saved.after / saved.before) * 100) : 0;

  return (
    <article className="flex flex-col rounded-2xl border border-paper/10 bg-[#1a1c17] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-lg font-medium">{label}</span>
        </div>
        <span className="text-xs text-paper/40">{hint}</span>
      </div>

      <div className="mt-4">
        <UploadDrop
          disabled={busy}
          file={file}
          onPick={onPick}
          onClear={onClear}
          accept={id === "compress" ? ".pdf,application/pdf" : ""}
          hint={id === "compress" ? `PDF. Maks ${Math.round(DOC_MAX_BYTES / (1024 * 1024))} MB.` : undefined}
          maxSize={DOC_MAX_BYTES}
          error={error}
        />
      </div>

      {(id === "compress" || id === "img-compress") && file && (
        <div className="mt-4 flex items-center gap-3">
          <label className="text-xs text-paper/60">Kualitas</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as Quality)}
            disabled={busy}
            className="rounded-full border border-paper/15 bg-ink px-3 py-1.5 text-sm text-paper outline-none focus:border-moss"
          >
            <option value="ringan">Ringan</option>
            <option value="sedang">Sedang</option>
            <option value="kuat">Kuat</option>
          </select>
          <span className="text-xs text-paper/40">Ringan = ukuran jauh lebih kecil</span>
        </div>
      )}

      {!saved && file && !busy && status !== "error" && status !== "done" && (
        <button
          type="button"
          onClick={runConvert}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-medium text-paper hover:bg-moss-deep disabled:opacity-50"
        >
          {JOB_ICON[id]}
          Konversi
        </button>
      )}

      {busy && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-paper/50">
            <span>Mengonversi…</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper/10">
            <div className="h-full rounded-full bg-moss transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {saved && status === "done" && (
        <button
          type="button"
          onClick={download}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink hover:scale-[1.02]"
        >
          <DownloadSimple className="size-4" />
          Unduh {saved.name}
        </button>
      )}

      {saved && (
        <p className="mt-2 text-xs text-paper/40">
          {Math.round(saved.before / 1024)} KB → {Math.round(saved.after / 1024)} KB ({ratio}%)
        </p>
      )}

      {status === "error" && error && (
        <div className="mt-3 flex items-start gap-2 text-sm text-paper/80">
          <WarningCircle className="mt-0.5 size-4 shrink-0 text-paper/50" />
          <span>{error}</span>
        </div>
      )}
    </article>
  );
}
