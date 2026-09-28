import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STEPS = [
  {
    title: "Rekam atau unggah",
    body: "Klik Rekam, atau jatuhkan MP3 sampai 2 GB. Tidak ada akun.",
    img: "https://picsum.photos/seed/lisan-mic-desk/1200/800",
  },
  {
    title: "Bicara, lalu sunting",
    body: "Kalimat muncul langsung. Salah dengar? Edit di tempat. Bahasa Indonesia atau Inggris.",
    img: "https://picsum.photos/seed/lisan-edit-notes/1200/800",
  },
  {
    title: "Unduh berkas",
    body: "TXT untuk catatan cepat. DOC untuk Word. PDF untuk kirim. Nama file otomatis.",
    img: "https://picsum.photos/seed/lisan-print-paper/1200/800",
  },
];

export function PinnedHow() {
  const wrap = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useGSAP(
    () => {
      if (reduce) return;
      if (!window.matchMedia("(min-width: 1024px)").matches) return;
      const pin = wrap.current?.querySelector(".pin-col");
      if (!pin) return;
      ScrollTrigger.create({
        trigger: wrap.current,
        start: "top top",
        end: "bottom bottom",
        pin,
        pinSpacing: false,
      });
      gsap.utils.toArray<HTMLElement>(".how-shot").forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 0.8, opacity: 0.35 },
          {
            scale: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              end: "top 30%",
              scrub: true,
            },
          },
        );
        gsap.to(el, {
          opacity: 0.2,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "bottom 45%",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    },
    { scope: wrap, dependencies: [reduce] },
  );

  return (
    <section ref={wrap} className="relative px-6 py-32 md:py-48">
      <div className="mx-auto grid max-w-[1400px] gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="pin-col lg:col-span-5 lg:self-start">
          <h2 className="max-w-xl text-[clamp(2.2rem,4vw,4rem)] leading-[1.08] tracking-tight">
            Tiga langkah. Selesai.
          </h2>
        </div>
        <div className="flex flex-col gap-24 lg:col-span-7 lg:gap-32">
          {STEPS.map((s) => (
            <article key={s.title} className="max-w-xl">
              <div className="how-shot overflow-hidden rounded-2xl">
                <img
                  src={s.img}
                  alt=""
                  className="aspect-[3/2] w-full object-cover grayscale contrast-125 opacity-90"
                />
              </div>
              <h3 className="mt-8 text-3xl tracking-tight md:text-4xl">{s.title}</h3>
              <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-paper/60">{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const SLICES = [
  {
    id: "txt",
    name: "TXT",
    line: "Teks polos. Ringan. Buka di mana saja.",
    img: "https://picsum.photos/seed/lisan-txt-paper/900/1200",
  },
  {
    id: "doc",
    name: "DOC",
    line: "Siap Word. Rapikan di kantor, lanjut di rumah.",
    img: "https://picsum.photos/seed/lisan-doc-desk/900/1200",
  },
  {
    id: "pdf",
    name: "PDF",
    line: "A4 rapi. Kirim, cetak, arsip.",
    img: "https://picsum.photos/seed/lisan-pdf-print/900/1200",
  },
];

export function FormatAccordion() {
  const [open, setOpen] = useState(0);
  return (
    <section id="format" className="px-6 py-32 md:py-48">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="max-w-4xl text-[clamp(2.2rem,4.2vw,4.2rem)] leading-[1.08] tracking-tight">
          Satu rekaman,
          <span
            className="mx-3 inline-block h-10 w-24 rounded-full bg-cover bg-center align-middle md:h-12 md:w-32"
            style={{ backgroundImage: "url(https://picsum.photos/seed/lisan-voice-wave/240/80)" }}
          />
          tiga berkas.
        </h2>
        <div className="mt-16 hidden h-[70vh] min-h-[420px] overflow-hidden rounded-2xl md:flex">
          {SLICES.map((s, i) => {
            const on = open === i;
            return (
              <button
                key={s.id}
                type="button"
                onMouseEnter={() => setOpen(i)}
                onFocus={() => setOpen(i)}
                className="group relative overflow-hidden border-r border-ink/40 text-left transition-[flex] duration-700 ease-out last:border-r-0"
                style={{ flex: on ? 3.2 : 1 }}
                aria-pressed={on}
              >
                <img
                  src={s.img}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover grayscale contrast-125 transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-ink/55" />
                <div className="relative flex h-full flex-col justify-end p-8">
                  <span className="text-4xl font-medium tracking-tight text-paper">{s.name}</span>
                  <p
                    className={`mt-3 max-w-[28ch] text-sm text-paper/80 transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"}`}
                  >
                    {s.line}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-10 grid gap-4 md:hidden">
          {SLICES.map((s) => (
            <article key={s.id} className="overflow-hidden rounded-2xl">
              <img src={s.img} alt="" className="aspect-[16/9] w-full object-cover grayscale contrast-125" />
              <div className="bg-[#1a1c17] p-6">
                <h3 className="text-2xl">{s.name}</h3>
                <p className="mt-2 text-sm text-paper/60">{s.line}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const TICKER = ["Rapat", "Kuliah", "Wawancara", "Catatan lapangan", "Naskah", "Notulen", "Podcast", "Ide cepat"];

export function TrustMarquee() {
  const row = [...TICKER, ...TICKER];
  return (
    <div className="overflow-hidden border-y border-paper/10 py-8">
      <div className="marquee-track flex w-max gap-16 pr-16 text-4xl tracking-tight text-paper/25 md:text-6xl">
        {row.map((t, i) => (
          <span key={`${t}-${i}`} className="shrink-0">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
