"use client";

import { useEffect, useRef, useState } from "react";

export type LibraryRef = {
  name: string;
  src: string;
  folder: "faces" | "compare" | "uploads";
};

export function SupportingRefsPanel({
  selected,
  onChangeSelected,
}: {
  selected: string[];
  onChangeSelected: (srcs: string[]) => void;
}) {
  const [library, setLibrary] = useState<LibraryRef[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [libraryRev, setLibraryRev] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const fetchGen = useRef(0);

  useEffect(() => {
    const gen = ++fetchGen.current;
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/refs/library", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled || gen !== fetchGen.current) return;
        if (!res.ok) throw new Error(data.error || "Could not load refs library");
        setLibrary(Array.isArray(data.items) ? data.items : []);
        setLoadError(null);
      } catch (e) {
        if (!cancelled && gen === fetchGen.current) {
          setLoadError(e instanceof Error ? e.message : "Load failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [libraryRev]);

  const toggle = (src: string) => {
    onChangeSelected(
      selected.includes(src)
        ? selected.filter((s) => s !== src)
        : [...selected, src].slice(0, 6),
    );
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    setLoadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/refs/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setLibraryRev((n) => n + 1);
      if (data.src) {
        onChangeSelected(
          [...selected.filter((s) => s !== data.src), data.src].slice(0, 6),
        );
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const selectedItems = library.filter((i) => selected.includes(i.src));

  return (
    <div className="mt-4 rounded-xl border border-neutral-800 bg-black/30 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Supporting images
        </p>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void onUpload(f);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-neutral-600 px-3 py-1 text-[11px] text-neutral-200 hover:bg-white/5 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload image"}
          </button>
        </div>
      </div>
      <p className="mb-2 text-[10px] text-neutral-500">
        Picked files are sent to the image model and named in the prompt (e.g.{" "}
        <span className="text-neutral-400">sid-cringe.png</span>).
      </p>
      {loadError ? (
        <p className="mb-2 text-[10px] text-amber-300">{loadError}</p>
      ) : null}
      {selectedItems.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <span
              key={item.src}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-700/50 bg-emerald-950/40 pl-1 pr-1.5 text-[10px] text-emerald-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
              {item.name}
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() => toggle(item.src)}
                className="ml-0.5 text-neutral-400 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
        {library.map((item) => {
          const on = selected.includes(item.src);
          return (
            <button
              key={item.src}
              type="button"
              onClick={() => toggle(item.src)}
              className={`flex w-24 flex-col overflow-hidden rounded-lg border text-left ${
                on
                  ? "border-emerald-600 ring-1 ring-emerald-600/50"
                  : "border-neutral-700 hover:border-neutral-500"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                className="aspect-video w-full object-cover"
              />
              <span className="truncate px-1 py-0.5 text-[9px] text-neutral-400">
                {item.folder}/{item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}