import { useState } from "react";
import { ArrowLeft, DownloadSimple, WarningCircle } from "@phosphor-icons/react";
import { convertFile, convertImagesToPdf, type ConvertResult, type Quality } from "../lib/convert.ts";
import { UploadDrop } from "./UploadDrop.tsx";
import { acceptDoc, DOC_MAX_BYTES, IMG_MAX, jobById, type JobId } from "../../shared/docs.ts";

export function ToolPage({ id }: { id: JobId }) {
  const job = jobById(id);
  const multi = id === "img-pdf";
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [quality, setQuality] = useState<Quality>("sedang");
  const [saved, setSaved] = useState<ConvertResult | null>(null);
  const busy = status === "working";
  const ready = multi ? files.length > 0 : !!file;

  async function run() {
    if (multi) {
      if (!files.length) return;
      setStatus("working");
      setError("");
      try {
        const r = await convertImagesToPdf(files);
        setSaved(r);
        setStatus("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Konversi gagal.");
        setStatus("error");
      }
      return;
    }
    if (!file) return;
    setStatus("working");
    setError("");
    try {
      const r = await convertFile(file, id, quality);
      setSaved(r);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Konversi gagal.");
      setStatus("error");
    }
  }

  function save() {
    if (!saved) return;
    const url = URL.createObjectURL(saved.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = saved.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setFile(null);
    setFiles([]);
    setSaved(null);
    setError("");
    setStatus("idle");
  }

  return (
    <section className="px-6 pb-32 pt-32 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <a href="#alat" className="inline-flex items-center gap-2 text-sm text-paper/60 hover:text-paper">
          <ArrowLeft className="size-4" />
          Semua alat
        </a>
        <h1 className="mt-6 max-w-3xl text-[clamp(2.6rem,5vw,4.5rem)] leading-[1.05] tracking-tight">
          {job.label}.
        </h1>
        <p className="mt-4 max-w-[50ch] text-lg text-paper/60">{job.hint} Diproses di browser.</p>
        <div className="mt-10 rounded-2xl border border-paper/10 bg-[#1a1c17] p-5 md:p-8">
          <UploadDrop
            disabled={busy}
            file={file}
            files={multi ? files : undefined}
            multiple={multi}
            maxFiles={multi ? IMG_MAX : 1}
            onPick={(f) => {
              const bad = acceptDoc(f.name, f.size, id);
              if (bad) {
                setError(bad);
                setStatus("error");
                return;
              }
              setFile(f);
              setSaved(null);
              setError("");
              setStatus("idle");
            }}
            onPickMany={(incoming) => {
              const filtered = incoming.filter((f) => {
                const bad = acceptDoc(f.name, f.size, id);
                if (bad) setError(bad);
                return !acceptDoc(f.name, f.size, id);
              });
              setFiles((prev) => {
                const room = IMG_MAX - prev.length;
                return [...prev, ...filtered.slice(0, room)];
              });
              setSaved(null);
              setError("");
              setStatus("idle");
            }}
            onClear={reset}
            onRemove={
              multi
                ? (i) => {
                    setFiles((prev) => prev.filter((_, n) => n !== i));
                    setSaved(null);
                    setStatus("idle");
                  }
                : undefined
            }
            accept={job.accept}
            hint={job.hint}
            maxSize={DOC_MAX_BYTES}
            error={status === "error" ? error : ""}
          />
          {(id === "compress" || id === "img-compress") && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {(["ringan", "sedang", "kuat"] as Quality[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={busy}
                  onClick={() => setQuality(q)}
                  className={`rounded-full px-5 py-2 text-sm font-medium ${quality === q ? "bg-paper text-ink" : "border border-paper/15 text-paper/70 hover:text-paper"}`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          {ready && status !== "done" && (
            <button
              type="button"
              onClick={run}
              disabled={busy}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-moss px-6 py-3.5 text-base font-medium text-paper hover:bg-moss-deep disabled:opacity-50"
            >
              {busy ? "Mengonversi..." : id === "compress" || id === "img-compress" ? "Kompres" : "Konversi"}
            </button>
          )}
          {busy && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper/10">
              <div className="marquee-track h-full w-1/3 rounded-full bg-moss" />
            </div>
          )}
          {saved && status === "done" && (
            <div className="mt-6 rounded-2xl border border-paper/10 bg-ink p-5">
              <p className="truncate text-sm text-paper">{saved.name}</p>
              <p className="mt-1 text-xs text-paper/40">
                {(saved.before / 1024).toFixed(0)} KB ke {(saved.after / 1024).toFixed(0)} KB
                {multi ? ` · ${files.length} halaman` : ""}
              </p>
              <button
                type="button"
                onClick={save}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-paper px-6 py-3 text-base font-medium text-ink hover:scale-[1.01]"
              >
                <DownloadSimple className="size-5" />
                Unduh hasil
              </button>
              <button
                type="button"
                onClick={reset}
                className="mt-2 w-full rounded-full px-6 py-2 text-sm text-paper/60 hover:text-paper"
              >
                Konversi lagi
              </button>
            </div>
          )}
          {status === "error" && error && !ready && (
            <div className="mt-4 flex items-start gap-2 text-sm text-paper/80">
              <WarningCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
