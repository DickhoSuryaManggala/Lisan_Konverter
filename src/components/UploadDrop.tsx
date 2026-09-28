import { useCallback, useRef, useState } from "react";
import { CloudArrowUp, WarningCircle, X } from "@phosphor-icons/react";

type Props = {
  disabled: boolean;
  file?: File | null;
  files?: File[];
  onPick: (file: File) => void;
  onPickMany?: (files: File[]) => void;
  onClear: () => void;
  onRemove?: (index: number) => void;
  accept?: string;
  hint?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  error?: string | null;
};

export function UploadDrop({
  disabled,
  file,
  files,
  onPick,
  onPickMany,
  onClear,
  onRemove,
  accept,
  hint,
  maxSize,
  maxFiles,
  multiple,
  error,
}: Props) {
  const [err, setErr] = useState("");
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const list = files ?? (file ? [file] : []);
  const cap = maxFiles ?? 1;
  const room = cap - list.length;

  const validate = useCallback(
    (f: File | undefined) => {
      if (!f) return "Berkas kosong.";
      const srcMax = maxSize ?? 0;
      if (srcMax && f.size > srcMax) return `Maksimal ${Math.round(srcMax / 1024 ** 2)} MB.`;
      const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
      const accepted = accept
        ? accept
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      if (accepted.length && !accepted.some((a) => ext.endsWith(a.replace(/^\./, "")) || f.type === a)) {
        return `Pakai ${accepted.filter((a) => a.startsWith(".")).join(", ")}.`;
      }
      return null;
    },
    [accept, maxSize],
  );

  const takeMany = useCallback(
    (incoming: File[]) => {
      if (!incoming.length) return;
      if (!multiple) {
        const bad = validate(incoming[0]);
        if (bad) {
          setErr(bad);
          return;
        }
        setErr("");
        onPick(incoming[0]);
        return;
      }
      const next: File[] = [];
      for (const f of incoming) {
        if (list.length + next.length >= cap) {
          setErr(`Maksimal ${cap} gambar.`);
          break;
        }
        const bad = validate(f);
        if (bad) {
          setErr(bad);
          continue;
        }
        next.push(f);
      }
      if (!next.length) return;
      if (list.length + next.length <= cap) setErr("");
      onPickMany ? onPickMany(next) : onPick(next[0]);
    },
    [multiple, validate, onPick, onPickMany, list.length, cap],
  );

  const dropzone = room > 0 && (
    <button
      type="button"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        takeMany(Array.from(e.dataTransfer.files));
      }}
      className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-200 disabled:opacity-40 ${over ? "border-moss bg-moss/10" : "border-paper/15 bg-[#111310] hover:border-moss"}`}
    >
      <CloudArrowUp weight="bold" className="size-8 text-paper/30" />
      <p className="text-sm text-paper/70">Seret berkas ke sini, atau pilih</p>
      {hint && <p className="text-xs text-paper/35">{hint}</p>}
    </button>
  );

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          takeMany(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      {list.length > 0 && (
        <ul className="mb-3 space-y-2">
          {list.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${i}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-paper/10 bg-[#111310] px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-paper">{f.name}</p>
                <p className="mt-1 text-xs text-paper/40">{(f.size / 1024 ** 2).toFixed(1)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => (onRemove ? onRemove(i) : onClear())}
                disabled={disabled}
                className="rounded-full p-2 text-paper/50 hover:text-paper disabled:opacity-40"
                aria-label={`Hapus ${f.name}`}
              >
                <X className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {multiple && list.length > 0 && room > 0 && (
        <p className="mb-3 text-xs text-paper/40">
          {list.length} / {cap} gambar. Boleh tambah {room} lagi.
        </p>
      )}
      {dropzone}
      {(err || error) && (
        <div className="mt-3 flex items-start gap-2 text-sm text-paper/80">
          <WarningCircle className="mt-0.5 size-4 shrink-0 text-paper/50" />
          <span>{err || error}</span>
        </div>
      )}
    </div>
  );
}
