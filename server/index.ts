import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { acceptFile, extOf, MAX_BYTES } from "../shared/limits.ts";
import { transcribeFile } from "./transcribe.ts";

const require = createRequire(import.meta.url);
const busboy = require("busboy") as typeof import("busboy");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const UPLOADS = path.join(ROOT, "uploads");
const PORT = Number(process.env.PORT) || 8787;

let busy = false;
let visitorCount = 0;

function cors(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res: ServerResponse, code: number, body: object) {
  cors(res);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function send(res: ServerResponse, obj: object) {
  res.write(JSON.stringify(obj) + "\n");
}

async function handleTranscribe(req: IncomingMessage, res: ServerResponse) {
  if (busy) {
    json(res, 429, { t: "error", m: "Sedang memproses berkas lain. Tunggu selesai." });
    return;
  }
  busy = true;
  const id = randomUUID();
  const dir = path.join(UPLOADS, id);
  const ac = new AbortController();
  let dest = "";
  let filename = "";
  let lang = "id-ID";
  let size = 0;
  let tooBig = false;

  const abort = () => ac.abort();
  req.on("aborted", abort);

  try {
    await mkdir(dir, { recursive: true });
    await new Promise<void>((resolve, reject) => {
      const bb = busboy({
        headers: req.headers,
        limits: { files: 1, fileSize: MAX_BYTES, fields: 4 },
      });
      bb.on("field", (name: string, val: string) => {
        if (name === "lang") lang = val;
      });
      bb.on("file", (_name: string, file: NodeJS.ReadableStream & { truncated?: boolean }, info: { filename: string }) => {
        filename = info.filename || "audio";
        dest = path.join(dir, `src${extOf(filename) || ".bin"}`);
        const out = createWriteStream(dest);
        file.on("data", (c: Buffer) => {
          size += c.length;
        });
        file.on("limit", () => {
          tooBig = true;
          file.resume();
        });
        file.pipe(out);
        out.on("error", reject);
      });
      bb.on("error", reject);
      bb.on("finish", () => resolve());
      req.pipe(bb);
    });

    if (tooBig) {
      json(res, 413, { t: "error", m: "Maksimal 2 GB." });
      return;
    }
    const bad = acceptFile(filename, size);
    if (bad) {
      json(res, 400, { t: "error", m: bad });
      return;
    }

    cors(res);
    res.writeHead(200, {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();
    send(res, { t: "stage", s: "decode" });

    const chunksDir = path.join(dir, "chunks");
    const text = await transcribeFile(dest, chunksDir, lang, ac.signal, (i, n, piece) => {
      send(res, { t: "chunk", i, n, c: piece });
    });
    send(res, { t: "done", text });
    res.end();
  } catch (e) {
    const m = e instanceof Error ? e.message : "Gagal memproses audio.";
    if (res.headersSent) {
      send(res, { t: "error", m });
      res.end();
    } else {
      json(res, 500, { t: "error", m });
    }
  } finally {
    req.off("aborted", abort);
    busy = false;
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

const server = createServer((req, res) => {
  const url = req.url || "/";
  if (req.method === "OPTIONS") {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method === "GET" && url === "/api/health") {
    json(res, 200, { ok: true, busy });
    return;
  }
  if (req.method === "GET" && url === "/api/visitors") {
    // ponytail: in-memory count, resets on restart. Move to file/DB when persistence matters.
    visitorCount++;
    json(res, 200, { count: visitorCount });
    return;
  }
  if (req.method === "POST" && url === "/api/transcribe") {
    void handleTranscribe(req, res);
    return;
  }
  json(res, 404, { t: "error", m: "Not found" });
});

server.timeout = 0;
server.requestTimeout = 0;
server.headersTimeout = 0;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`lisan api http://127.0.0.1:${PORT}`);
});
