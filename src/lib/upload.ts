import { MAX_BYTES } from "../../shared/limits.ts";

export type Phase = "idle" | "uploading" | "decode" | "transcribing" | "done" | "error";

export type Progress = {
  phase: Phase;
  pct: number;
  chunk?: number;
  total?: number;
  text?: string;
  msg?: string;
};

function parseLine(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function apply(obj: Record<string, unknown>, acc: { text: string }, onProgress: (p: Progress) => void) {
  const t = obj.t as string;
  if (t === "stage") {
    onProgress({ phase: (obj.s as Phase) || "decode", pct: 0, text: acc.text });
    return;
  }
  if (t === "chunk") {
    const i = Number(obj.i);
    const n = Number(obj.n);
    const piece = String(obj.c ?? "").trim();
    if (piece) acc.text = acc.text ? `${acc.text} ${piece}` : piece;
    onProgress({
      phase: "transcribing",
      pct: n ? Math.round((i / n) * 100) : 0,
      chunk: i,
      total: n,
      text: acc.text,
    });
    return;
  }
  if (t === "done") {
    acc.text = String(obj.text ?? acc.text).trim();
    onProgress({ phase: "done", pct: 100, text: acc.text });
    return;
  }
  if (t === "error") {
    onProgress({ phase: "error", pct: 0, msg: String(obj.m ?? "Gagal.") });
  }
}

export function uploadAudio(
  file: File,
  lang: string,
  onProgress: (p: Progress) => void,
): { promise: Promise<void>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const acc = { text: "" };
  let seen = 0;

  const promise = new Promise<void>((resolve) => {
    if (file.size > MAX_BYTES) {
      onProgress({ phase: "error", pct: 0, msg: "Maksimal 2 GB." });
      resolve();
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("lang", lang);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      onProgress({ phase: "uploading", pct: Math.min(99, Math.round((e.loaded / e.total) * 100)) });
    };

    xhr.onprogress = () => {
      const raw = xhr.responseText;
      const next = raw.slice(seen);
      const lines = next.split("\n");
      const last = lines.pop() ?? "";
      seen = raw.length - last.length;
      for (const line of lines) {
        if (!line.trim()) continue;
        const obj = parseLine(line);
        if (obj) apply(obj, acc, onProgress);
      }
    };

     xhr.onload = () => {
       if (xhr.status >= 400) {
         const obj = parseLine(xhr.responseText.trim().split("\n")[0] ?? "");
         onProgress({
           phase: "error",
           pct: 0,
           msg: String(obj?.m ?? `Server ${xhr.status}`),
         });
         resolve();
         return;
       }
       const rest = xhr.responseText.slice(seen).trim();
       if (rest) {
         const obj = parseLine(rest);
         if (obj) apply(obj, acc, onProgress);
       }
       resolve();
     };

    xhr.onerror = () => {
      onProgress({ phase: "error", pct: 0, msg: "Jaringan gagal. Server API aktif?" });
      resolve();
    };

    xhr.onabort = () => {
      onProgress({ phase: "idle", pct: 0 });
      resolve();
    };

    const url = import.meta.env.DEV
      ? "http://127.0.0.1:8787/api/transcribe"
      : "/api/transcribe";
    xhr.open("POST", url);
    xhr.send(form);
  });

  return { promise, abort: () => xhr.abort() };
}
