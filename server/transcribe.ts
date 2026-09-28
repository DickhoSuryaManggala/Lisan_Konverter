import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, unlink } from "node:fs/promises";
import { splitAudio } from "./ffmpeg.ts";

const CACHE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".cache");

type Asr = (audio: Float32Array, opts: Record<string, unknown>) => Promise<{ text: string }>;

let asr: Asr | null = null;
let asrLoading: Promise<Asr> | null = null;

async function getAsr(): Promise<Asr> {
  if (asr) return asr;
  if (!asrLoading) {
    asrLoading = (async () => {
      const { pipeline, env } = await import("@xenova/transformers");
      env.cacheDir = CACHE;
      const pipe = await pipeline("automatic-speech-recognition", "Xenova/whisper-base");
      const fn: Asr = (audio, opts) => pipe(audio, opts) as Promise<{ text: string }>;
      asr = fn;
      return fn;
    })();
  }
  return asrLoading;
}

async function wavToFloat32(file: string): Promise<Float32Array> {
  const buf = await readFile(file);
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "data") {
      const pcm = buf.subarray(offset + 8, offset + 8 + size);
      const n = Math.floor(pcm.length / 2);
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) out[i] = pcm.readInt16LE(i * 2) / 32768;
      return out;
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("Berkas audio tidak bisa dibaca.");
}

function whisperLang(lang: string) {
  return lang.startsWith("id") ? "indonesian" : "english";
}

export async function transcribeFile(
  src: string,
  chunksDir: string,
  lang: string,
  signal: AbortSignal,
  onChunk: (i: number, n: number, piece: string) => void,
): Promise<string> {
  const chunks = await splitAudio(src, chunksDir, signal);
  if (chunks.length === 0) throw new Error("Tidak ada audio di berkas itu.");
  const model = await getAsr();
  const parts: string[] = [];
  const n = chunks.length;
  for (let i = 0; i < n; i++) {
    if (signal.aborted) throw new Error("Dibatalkan.");
    const audio = await wavToFloat32(chunks[i]);
    await unlink(chunks[i]).catch(() => {});
    if (audio.length < 1600) continue;
    const out = await model(audio, {
      language: whisperLang(lang),
      task: "transcribe",
      return_timestamps: false,
    });
    const piece = (out.text || "").trim();
    if (piece) parts.push(piece);
    onChunk(i + 1, n, piece);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
