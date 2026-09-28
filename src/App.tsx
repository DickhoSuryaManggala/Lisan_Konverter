import { MagnifyingGlass, Microphone, Waveform, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { FormatAccordion, PinnedHow, TrustMarquee } from "./components/Motion";
import { Studio } from "./components/Studio";
import { ToolPage } from "./components/ToolPage";
import { JOBS, type JobId } from "../shared/docs.ts";

const MAIN_NAV = [
  { href: "#studio", label: "Studio" },
  { href: "#alat", label: "Konversi" },
  { href: "#kegunaan", label: "Kegunaan" },
];

function Nav() {
  return (
    <header className="fixed top-4 z-30 flex w-full justify-center px-4">
      <nav className="flex h-16 w-full max-w-[1400px] items-center justify-between rounded-full border border-paper/10 bg-ink/70 px-3 pl-6 shadow-[inset_0_1px_0_rgba(236,238,232,0.08)] backdrop-blur-xl max-md:bg-ink max-md:backdrop-blur-none">
        <a href="#atas" className="flex items-center gap-2 text-sm font-medium tracking-wide">
          <Waveform weight="bold" className="size-5 text-moss" />
          Lisan
        </a>
        <div className="flex items-center gap-6">
          <ul className="hidden items-center gap-6 text-sm text-paper/70 lg:flex">
            {MAIN_NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="hover:text-paper">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#studio"
            className="inline-flex items-center rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Mulai rekam
          </a>
        </div>
      </nav>
    </header>
  );
 }

function Hero() {
  return (
    <section id="atas" className="relative min-h-[100dvh] overflow-hidden px-6 pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(61,107,79,0.28),transparent_55%)]" />
      <div className="relative mx-auto grid min-h-[calc(100dvh-6rem)] max-w-[1400px] items-end gap-10 pb-16 lg:grid-cols-12 lg:items-center lg:pb-0">
        <div className="z-10 lg:col-span-7 lg:pb-20">
          <h1 className="max-w-5xl text-[clamp(3rem,5vw,5.5rem)] leading-[1.05] tracking-tight">
            Suara jadi teks. Siap unduh.
          </h1>
          <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-paper/65">
            Rekam bicara atau unggah MP3 sampai 2 GB. Sunting, unduh TXT, DOC, atau PDF.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#studio"
              className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 text-base font-medium text-paper transition-transform duration-200 hover:bg-moss-deep hover:scale-[1.02] active:scale-[0.98]"
            >
              <Microphone weight="fill" className="size-5" />
              Mulai rekam
            </a>
            <a
              href="#format"
              className="inline-flex items-center rounded-full border border-paper/25 px-6 py-3 text-base font-medium text-paper hover:border-paper/50"
            >
              Lihat format
            </a>
          </div>
        </div>
        <div className="relative lg:col-span-5 lg:-mb-24">
          <div className="overflow-hidden rounded-2xl">
            <img
              src="https://picsum.photos/seed/lisan-hero-voice/1400/1600"
              alt="Mikrofon di meja kerja gelap"
              className="aspect-[4/5] w-full object-cover grayscale contrast-125 mix-blend-luminosity opacity-90 transition-transform duration-700 ease-out hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Bento() {
  return (
    <section id="kegunaan" className="px-6 py-32 md:py-48">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="max-w-4xl text-[clamp(2.2rem,4.2vw,4.2rem)] leading-[1.08] tracking-tight">
          Dari rapat sampai naskah. Satu alur.
        </h2>
        <div className="mt-16 grid auto-rows-[minmax(220px,auto)] grid-cols-1 grid-flow-dense gap-4 md:grid-cols-12 md:auto-rows-[200px]">
          <article className="group relative overflow-hidden rounded-2xl md:col-span-8 md:row-span-2">
            <img
              src="https://picsum.photos/seed/lisan-meeting-room/1600/1000"
              alt=""
              className="absolute inset-0 h-full w-full object-cover grayscale contrast-125 opacity-80 transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
            <div className="relative flex h-full min-h-[280px] flex-col justify-end p-8 md:p-10">
              <h3 className="text-3xl tracking-tight md:text-4xl">Dikte langsung</h3>
              <p className="mt-2 max-w-[40ch] text-paper/70">
                Tangan di keyboard, mulut jalan. Transkrip muncul saat Anda bicara.
              </p>
            </div>
          </article>
          <article className="flex flex-col justify-between rounded-2xl bg-moss p-8 text-paper md:col-span-4 md:row-span-1">
            <h3 className="text-2xl tracking-tight">Berkas sampai 2 GB</h3>
            <p className="mt-4 text-sm leading-relaxed text-paper/85">
              MP3, WAV, M4A, dan sejenisnya. Diproses di mesin Anda, lalu dihapus.
            </p>
          </article>
          <article className="relative overflow-hidden rounded-2xl bg-[#1a1c17] p-8 md:col-span-4 md:row-span-1">
            <h3 className="text-2xl tracking-tight">Sunting dulu</h3>
            <p className="mt-4 text-sm leading-relaxed text-paper/60">
              Salah dengar? Koreksi di editor, baru unduh. Yang tersimpan hanya yang Anda setujui.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function ToolSelect() {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const hits = term
    ? JOBS.filter(
        (j) =>
          j.label.toLowerCase().includes(term) ||
          j.id.includes(term) ||
          j.from.some((e) => e.includes(term)) ||
          j.to.includes(term),
      )
    : JOBS;

  return (
    <section id="alat" className="px-6 py-32 md:py-48">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="max-w-4xl text-[clamp(2.4rem,4.5vw,4.4rem)] leading-[1.05] tracking-tight">
          Pilih alat konversi.
        </h2>
        <div className="mt-8 max-w-xl">
          <label htmlFor="cari-alat" className="sr-only">
            Cari alat
          </label>
          <div className="flex items-center gap-3 rounded-full border border-paper/15 bg-[#1a1c17] px-5 focus-within:border-moss">
            <MagnifyingGlass className="size-5 shrink-0 text-paper/40" />
            <input
              id="cari-alat"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari alat: pdf, word, kompres…"
              className="w-full bg-transparent py-3.5 text-base text-paper outline-none placeholder:text-paper/40"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Bersihkan pencarian"
                className="shrink-0 text-paper/40 hover:text-paper"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
          <p className="mt-3 text-sm text-paper/40">
            {hits.length} dari {JOBS.length} alat
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {hits.map((job) => (
            <a
              key={job.id}
              href={`#${job.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-paper/10 bg-[#1a1c17] p-8 transition-colors hover:border-moss"
            >
              <span className="text-3xl font-medium tracking-tight text-paper">{job.label}</span>
              <span className="mt-4 text-sm text-paper/40 group-hover:text-moss">Buka alat →</span>
            </a>
          ))}
        </div>
        {hits.length === 0 && (
          <p className="mt-10 text-lg text-paper/50">Tidak ada alat cocok dengan &ldquo;{q}&rdquo;.</p>
        )}
      </div>
    </section>
  );
}

function Footer() {
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem("lisan:visted")) return;
    sessionStorage.setItem("lisan:visted", "1");
    fetch("/api/visitors")
      .then((r) => r.json())
      .then((d) => setVisitorCount(d.count))
      .catch(() => {});
  }, []);

  return (
    <footer className="px-6 py-32 md:py-48">
      <div className="mx-auto max-w-[1400px] border-t border-paper/10 pt-20">
        <h2 className="max-w-5xl text-[clamp(2.6rem,5vw,5rem)] leading-[1.05] tracking-tight">
          Bicara. Unduh. Selesai.
        </h2>
        <a
          href="#studio"
          className="mt-10 inline-flex items-center rounded-full bg-paper px-8 py-4 text-lg font-medium text-ink transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Mulai rekam
        </a>

        <div className="mt-24 grid gap-12 border-t border-paper/10 pt-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 text-lg font-medium tracking-wide">
              <Waveform weight="bold" className="size-5 text-moss" />
              Lisan
            </div>
            <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-paper/40">
              Rekam bicara jadi teks, konversi PDF, Word, dokumen, dan lainnya. Semua di browser, tanpa server.
            </p>
          </div>
          <div className="md:col-span-7">
            <h3 className="text-sm font-medium text-paper/70">Fitur</h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-paper/40 sm:grid-cols-3">
              {JOBS.map((j) => (
                <li key={j.id}>
                  <a href={`#${j.id}`} className="hover:text-paper">
                    {j.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-end justify-between gap-6 border-t border-paper/10 pt-8 text-sm text-paper/40">
          <span>&copy; 2026 Lisan. Semua hak dilindungi.</span>
          <span>{visitorCount.toLocaleString()} orang berkunjung</span>
          <span>Chrome atau Edge. Unggah sampai 2 GB.</span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const toolIds: JobId[] = JOBS.map((j) => j.id);
  const current = hash.slice(1);
  const isTool = (toolIds as string[]).includes(current);

  return (
    <main className="overflow-x-hidden w-full max-w-full bg-ink text-paper">
      <div className="grain" aria-hidden />
      <Nav />
      {isTool ? (
        <ToolPage id={current as JobId} />
      ) : (
        <>
          <Hero />
          <Studio />
          <ToolSelect />
          <Bento />
          <PinnedHow />
          <FormatAccordion />
          <TrustMarquee />
        </>
      )}
      <Footer />
    </main>
  );
}
