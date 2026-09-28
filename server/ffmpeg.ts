import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static") as string | null;

export function runFfmpeg(args: string[], signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("ffmpeg tidak terpasang."));
      return;
    }
    const child = spawn(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
      windowsHide: true,
    });
    const onAbort = () => {
      child.kill();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    let err = "";
    child.stderr?.on("data", (d: Buffer) => {
      err += d.toString();
    });
    child.on("error", (e) => {
      signal?.removeEventListener("abort", onAbort);
      reject(e);
    });
    child.on("close", (code) => {
      signal?.removeEventListener("abort", onAbort);
      if (code === 0) resolve();
      else reject(new Error(err.trim() || `ffmpeg exit ${code}`));
    });
  });
}

export async function splitAudio(src: string, dir: string, signal?: AbortSignal): Promise<string[]> {
  await mkdir(dir, { recursive: true });
  const pattern = path.join(dir, "c_%04d.wav");
  await runFfmpeg(
    [
      "-i",
      src,
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      "-f",
      "segment",
      "-segment_time",
      "30",
      "-reset_timestamps",
      "1",
      pattern,
    ],
    signal,
  );
  const names = (await readdir(dir))
    .filter((n) => n.endsWith(".wav"))
    .sort();
  return names.map((n) => path.join(dir, n));
}
