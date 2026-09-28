import { useCallback, useEffect, useRef, useState } from "react";
import {
  Copy,
  DownloadSimple,
  Microphone,
  Stop,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { exportDoc, exportPdf, exportTxt } from "../lib/export";
import { getSpeechCtor, LANGS, type Rec } from "../lib/speech";
import { uploadAudio, type Phase } from "../lib/upload";
import { UploadDrop } from "./UploadDrop";
import { ACCEPT_ATTR } from "../../shared/limits.ts";

type MicStatus = "idle" | "live" | "denied" | "missing";

const BUSY: Phase[] = ["uploading", "decode", "transcribing"];

export function Studio() {
  const recRef = useRef<Rec | null>(null);
  const wantLive = useRef(false);
  const finalRef = useRef("");
  const abortUpload = useRef<(() => void) | null>(null);

  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [lang, setLang] = useState("id-ID");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"live" | "upload">("live");
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pct, setPct] = useState(0);
  const [chunk, setChunk] = useState({ i: 0, n: 0 });

  useEffect(() => {
    if (!getSpeechCtor()) setMicStatus("missing");
    return () => {
      wantLive.current = false;
      recRef.current?.abort();
      abortUpload.current?.();
    };
  }, []);

  function bind(rec: Rec) {
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (ev) => {
      let fin = finalRef.current;
      let mid = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) fin += r[0].transcript + " ";
        else mid += r[0].transcript;
      }
      finalRef.current = fin;
      setText(fin);
      setInterim(mid);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        wantLive.current = false;
        setMicStatus("denied");
        setErr("Izin mikrofon ditolak. Buka pengaturan browser, izinkan mikrofon.");
        return;
      }
      if (e.error === "no-speech") return;
      setErr(e.error === "network" ? "Jaringan gagal. Coba lagi." : `Error: ${e.error}`);
    };
    rec.onend = () => {
      if (wantLive.current) {
        try {
          rec.start();
        } catch {
          setMicStatus("idle");
        }
      } else {
        setMicStatus("idle");
        setInterim("");
      }
    };
  }

  function start() {
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      setMicStatus("missing");
      return;
    }
    setErr("");
    wantLive.current = true;
    const rec = recRef.current ?? new Ctor();
    recRef.current = rec;
    bind(rec);
    try {
      rec.start();
      setMicStatus("live");
    } catch {
      setErr("Gagal mulai rekam. Coba klik lagi.");
      setMicStatus("idle");
    }
  }

  function stop() {
    wantLive.current = false;
    recRef.current?.stop();
    setMicStatus("idle");
    setInterim("");
  }

  function onEdit(v: string) {
    finalRef.current = v;
    setText(v);
    setInterim("");
  }

  function wipe() {
    stop();
    abortUpload.current?.();
    abortUpload.current = null;
    finalRef.current = "";
    setText("");
    setInterim("");
    setErr("");
    setPhase("idle");
    setPct(0);
    setChunk({ i: 0, n: 0 });
    setFile(null);
  }

  const runUpload = useCallback(
    (f: File) => {
      abortUpload.current?.();
      setErr("");
      setFile(f);
      setPhase("uploading");
      setPct(0);
      const { promise, abort } = uploadAudio(f, lang, (p) => {
        setPhase(p.phase);
        setPct(p.pct);
        if (p.chunk && p.total) setChunk({ i: p.chunk, n: p.total });
        if (p.text !== undefined) {
          finalRef.current = p.text;
          setText(p.text);
          setInterim("");
        }
        if (p.phase === "error" && p.msg) setErr(p.msg);
      });
      abortUpload.current = abort;
      void promise;
    },
    [lang],
  );

  async function copy() {
    const v = (text + interim).trim();
    if (!v) return;
    await navigator.clipboard.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const full = (text + (interim ? (text ? " " : "") + interim : "")).trim();
  const words = full ? full.split(/\s+/).length : 0;
  const ready = full.length > 0;
  const uploading = BUSY.includes(phase);
  const busy = micStatus === "live" || uploading;

  const phaseLabel =
    phase === "uploading"
      ? "Mengunggah"
      : phase === "decode"
        ? "Menyiapkan audio"
        : phase === "transcribing"
          ? chunk.n
            ? `Transkrip ${chunk.i} / ${chunk.n}`
            : "Transkrip"
          : "";

  return (
    <section id="studio" className="px-6 py-32 md:py-48">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="max-w-4xl text-[clamp(2.4rem,4.5vw,4.4rem)] leading-[1.05] tracking-tight">
          Studio.
        </h2>
        <p className="mt-5 max-w-[50ch] text-lg text-paper/60">
          Rekam langsung, atau unggah MP3 dan sejenisnya sampai 2 GB. Sunting, unduh.
        </p>

        <div className="mt-10 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("live")}
            className={`rounded-full px-5 py-2.5 text-sm font-medium ${tab === "live" ? "bg-paper text-ink" : "border border-paper/15 text-paper/70 hover:text-paper"}`}
          >
            Rekam
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`rounded-full px-5 py-2.5 text-sm font-medium ${tab === "upload" ? "bg-paper text-ink" : "border border-paper/15 text-paper/70 hover:text-paper"}`}
          >
            Unggah
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-paper/10 bg-[#1a1c17]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper/10 px-5 py-4 md:px-8">
            <div className="flex flex-wrap items-center gap-3">
              {tab === "live" &&
                (micStatus === "live" ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Stop weight="fill" className="size-4" />
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={start}
                    disabled={micStatus === "missing" || uploading}
                    className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-medium text-paper transition-transform duration-200 hover:bg-moss-deep hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Microphone weight="fill" className="size-4" />
                    Rekam
                  </button>
                ))}
              {tab === "upload" && file && !uploading && phase !== "done" && (
                <button
                  type="button"
                  onClick={() => runUpload(file)}
                  className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-medium text-paper hover:bg-moss-deep"
                >
                  Transkrip
                </button>
              )}
              {uploading && (
                <button
                  type="button"
                  onClick={() => {
                    abortUpload.current?.();
                    setPhase("idle");
                    setPct(0);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink"
                >
                  <Stop weight="fill" className="size-4" />
                  Batal
                </button>
              )}
              <label className="sr-only" htmlFor="lang">
                Bahasa
              </label>
              <select
                id="lang"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                disabled={busy}
                className="rounded-full border border-paper/15 bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-moss"
              >
                {LANGS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 text-sm text-paper/45">
              {micStatus === "live" && (
                <span className="flex items-center gap-2 text-moss">
                  <span className="flex h-3 items-end gap-0.5" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="w-0.5 animate-pulse rounded-full bg-moss"
                        style={{
                          height: `${8 + (i % 3) * 6}px`,
                          animationDelay: `${i * 120}ms`,
                        }}
                      />
                    ))}
                  </span>
                  Live
                </span>
              )}
              <span>{words} kata</span>
            </div>
          </div>

          {tab === "upload" && (
            <div className="border-b border-paper/10 px-5 py-5 md:px-8">
              <UploadDrop
                disabled={uploading}
                file={file}
                onPick={runUpload}
                onClear={() => {
                  abortUpload.current?.();
                  setFile(null);
                  setPhase("idle");
                  setPct(0);
                }}
                accept={ACCEPT_ATTR}
                hint="MP3, WAV, M4A, AAC, OGG, FLAC, WEBM, OPUS. Maks 2 GB."
                maxSize={2 * 1024 * 1024 * 1024}
              />
              {uploading && (
                <div className="mt-5">
                  <div className="flex justify-between text-xs text-paper/50">
                    <span>{phaseLabel}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper/10">
                    <div
                      className="h-full rounded-full bg-moss transition-[width] duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {micStatus === "missing" && tab === "live" && (
            <div className="flex items-start gap-3 border-b border-paper/10 px-5 py-4 text-sm text-paper/80 md:px-8">
              <WarningCircle className="mt-0.5 size-5 shrink-0 text-paper/50" />
              Browser ini tidak mendukung Web Speech. Pakai Chrome atau Edge, atau unggah berkas.
            </div>
          )}
          {err && (
            <div className="flex items-start gap-3 border-b border-paper/10 px-5 py-4 text-sm text-paper/80 md:px-8">
              <WarningCircle className="mt-0.5 size-5 shrink-0 text-paper/50" />
              {err}
            </div>
          )}

          <label className="sr-only" htmlFor="transcript">
            Transkrip
          </label>
          <textarea
            id="transcript"
            value={busy ? full : text}
            readOnly={busy}
            onChange={(e) => onEdit(e.target.value)}
            placeholder={
              tab === "upload"
                ? "Unggah berkas. Teks muncul di sini setelah transkrip."
                : "Tekan Rekam, lalu bicara. Teks muncul di sini. Boleh disunting."
            }
            className="min-h-[280px] w-full resize-y bg-transparent px-5 py-6 text-lg leading-relaxed text-paper placeholder:text-paper/30 outline-none md:min-h-[340px] md:px-8"
          />

          <div className="flex flex-wrap items-center gap-3 border-t border-paper/10 px-5 py-4 md:px-8">
            <button
              type="button"
              disabled={!ready}
              onClick={() => exportTxt(full)}
              className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink disabled:opacity-35"
            >
              <DownloadSimple className="size-4" />
              TXT
            </button>
            <button
              type="button"
              disabled={!ready}
              onClick={() => exportDoc(full)}
              className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-4 py-2 text-sm font-medium text-paper disabled:opacity-35"
            >
              <DownloadSimple className="size-4" />
              DOC
            </button>
            <button
              type="button"
              disabled={!ready}
              onClick={() => void exportPdf(full)}
              className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-4 py-2 text-sm font-medium text-paper disabled:opacity-35"
            >
              <DownloadSimple className="size-4" />
              PDF
            </button>
            <button
              type="button"
              disabled={!ready}
              onClick={() => void copy()}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-paper/70 hover:text-paper disabled:opacity-35"
            >
              <Copy className="size-4" />
              {copied ? "Tersalin" : "Salin"}
            </button>
            <button
              type="button"
              disabled={!ready && !busy && !file}
              onClick={wipe}
              className="ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-paper/50 hover:text-paper disabled:opacity-35"
            >
              <Trash className="size-4" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
