"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type ViewMode = "desktop" | "mobile";

type BenchmarkVideo = {
  id: string;
  thumb: string;
  title: string;
  channel: string;
  stats: string;
  duration: string;
};

type GeneratedThumb = {
  id: string;
  src: string;
};

type ExtraThumb = {
  id: string;
  preview: string | null;
  talkName: string;
};

type PendingDelete =
  | { kind: "generated"; src: string; label: string }
  | { kind: "upload"; id: string; label: string };

const BENCHMARKS: BenchmarkVideo[] = [
  {
    id: "good-slap",
    thumb: "/refs/compare/thumb-slap.png",
    title: "When your opponent in a slap competition does this BS",
    channel: "Slap League Clips",
    stats: "4.6M views · 1 mo ago",
    duration: "1:31",
  },
  {
    id: "good-first",
    thumb: "/refs/compare/thumb-first-video.png",
    title: "My first Video",
    channel: "NewCreator",
    stats: "10K views · 9d ago",
    duration: "1:23",
  },
];

function DurationBadge({ children }: { children: string }) {
  return (
    <span className="absolute bottom-1.5 right-1.5 rounded px-1 py-0.5 text-xs font-medium text-white bg-black/80">
      {children}
    </span>
  );
}

function TalkIdBadge({ children }: { children: string }) {
  return (
    <span
      className="absolute right-2 top-2 z-10 max-w-[min(100%-3.5rem,14rem)] truncate rounded bg-[#cc0000] px-2 py-0.5 font-mono text-[11px] font-bold tracking-tight text-white shadow-md ring-1 ring-black/40"
      title={children}
    >
      {children}
    </span>
  );
}

function VideoMeta({
  title,
  channel,
  stats,
  titleNode,
}: {
  title: string;
  channel: string;
  stats: string;
  titleNode?: ReactNode;
}) {
  return (
    <div className="mt-3 flex gap-3">
      <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-neutral-700" aria-hidden />
      <div className="min-w-0 flex-1">
        <div>
          {titleNode ?? (
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[#f1f1f1]">{title}</h3>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-4 text-neutral-400">
          {channel} · {stats}
        </p>
      </div>
    </div>
  );
}

function ThumbFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`group/frame relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-900 ${className}`}>
      {children}
    </div>
  );
}

function DeleteThumbButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-neutral-200 opacity-90 transition hover:bg-[#cc0000] hover:text-white md:opacity-0 md:group-hover/frame:opacity-100 focus:opacity-100"
      aria-label="Delete thumbnail"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 3h6m-8 4h10m-1 0-.7 12.1A2 2 0 0 1 13.3 21H10.7a2 2 0 0 1-2-1.9L8 7m3 4v6m4-6v6M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function BenchmarkCard({ video, isMobile }: { video: BenchmarkVideo; isMobile: boolean }) {
  return (
    <article className="flex w-full min-w-0 flex-col">
      <ThumbFrame>
        <Image
          src={video.thumb}
          alt=""
          fill
          className="object-cover"
          sizes={isMobile ? "100vw" : "25vw"}
        />
        <DurationBadge>{video.duration}</DurationBadge>
      </ThumbFrame>
      <VideoMeta title={video.title} channel={video.channel} stats={video.stats} />
    </article>
  );
}

function GeneratedCard({
  src,
  title,
  duration,
  talkName,
  onDelete,
}: {
  src: string;
  title: string;
  duration: string;
  talkName: string;
  onDelete?: () => void;
}) {
  return (
    <article className="flex w-full min-w-0 flex-col">
      <ThumbFrame>
        {onDelete ? <DeleteThumbButton onClick={onDelete} /> : null}
        <TalkIdBadge>{talkName}</TalkIdBadge>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
        <DurationBadge>{duration}</DurationBadge>
      </ThumbFrame>
      <VideoMeta title={title} channel="@sidvenkman" stats={`0 views · ${talkName}`} />
    </article>
  );
}

type FaceRef = {
  name: string;
  label: string;
  src: string;
  isSid: boolean;
};

function FaceRefTile({ face }: { face: FaceRef }) {
  return (
    <figure className="w-[88px] shrink-0">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-800 ring-1 ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={face.src} alt="" className="h-full w-full object-cover" />
      </div>
      <figcaption className="mt-1.5 truncate font-mono text-[10px] font-medium text-neutral-300" title={face.label}>
        {face.label}
      </figcaption>
    </figure>
  );
}

function FaceRefsPanel({ faces }: { faces: FaceRef[] }) {
  const sid = faces.filter((f) => f.isSid);
  const other = faces.filter((f) => !f.isSid);
  if (!sid.length && !other.length) return null;

  return (
    <section className="mb-8 border-b border-white/10 pb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Face refs</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Pick a Sid face for the next generate — say the name (e.g. <span className="font-mono text-neutral-400">sid-headback</span>
        ).
      </p>
      {sid.length ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {sid.map((face) => (
            <FaceRefTile key={face.src} face={face} />
          ))}
        </div>
      ) : null}
      {other.length ? (
        <>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-neutral-500">Other refs (fail / guest)</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {other.map((face) => (
              <FaceRefTile key={face.src} face={face} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function AddCard({
  title,
  duration,
  onPick,
  onTitle,
  onTitleBlur,
}: {
  title: string;
  duration: string;
  onPick: (file: File) => void;
  onTitle: (v: string) => void;
  onTitleBlur: () => void;
}) {
  const inputId = useId();

  return (
    <article className="flex w-full min-w-0 flex-col">
      <ThumbFrame className="ring-2 ring-inset ring-dashed ring-[#cc0000]/45">
        <label htmlFor={inputId} className="absolute inset-0 cursor-pointer">
          <span className="flex h-full flex-col items-center justify-center gap-2 text-neutral-500">
            <span className="text-2xl">+</span>
            <span className="text-xs">Add another thumbnail</span>
          </span>
        </label>
        <DurationBadge>{duration}</DurationBadge>
      </ThumbFrame>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.currentTarget.value = "";
        }}
      />
      <VideoMeta
        title={title || "Your title here"}
        channel="@sidvenkman"
        stats="0 views · just now"
        titleNode={
          <input
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            onBlur={onTitleBlur}
            className="w-full bg-transparent text-sm font-medium leading-snug text-[#f1f1f1] outline-none placeholder:text-neutral-600"
            placeholder="Your title here"
          />
        }
      />
    </article>
  );
}

type GeneratedLatest = {
  title?: string;
  thumb?: string;
  thumbs?: GeneratedThumb[];
  duration?: string;
};

function normalizeGeneratedThumbs(list: GeneratedThumb[]): GeneratedThumb[] {
  const seen = new Set<string>();
  const out: GeneratedThumb[] = [];
  for (const t of list) {
    const src = t.src?.trim();
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const file = src.split("/").pop()?.replace(/\.jpg$/i, "") ?? src;
    out.push({ ...t, id: t.id || file, src });
  }
  out.sort((a, b) => sortKey(a.src) - sortKey(b.src) || a.src.localeCompare(b.src));
  return out;
}

function sortKey(src: string) {
  const m = src.match(/-v(\d+)\.jpg$/i);
  if (m) return Number(m[1]);
  return 0;
}

function thumbTalkName(src: string) {
  const file = src.split("/").pop() ?? src;
  return file.replace(/\.(jpg|jpeg|png|webp)$/i, "");
}

export function ThumbnailCompareBoard() {
  const [view, setView] = useState<ViewMode>("desktop");
  const [generated, setGenerated] = useState<GeneratedThumb[]>([]);
  const [extras, setExtras] = useState<ExtraThumb[]>([]);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("4:31");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [faceRefs, setFaceRefs] = useState<FaceRef[]>([]);
  const titleBaselineRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    fetch("/generated/latest.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load generated list (${r.status})`);
        return r.json() as Promise<GeneratedLatest>;
      })
      .then((data) => {
        if (cancelled) return;
        const raw = Array.isArray(data.thumbs) && data.thumbs.length
          ? data.thumbs
          : data.thumb
            ? [{ id: "latest", src: data.thumb }]
            : [];
        setGenerated(normalizeGeneratedThumbs(raw));
        if (data.title) {
          setTitle((old) => {
            if (old.trim()) return old;
            titleBaselineRef.current = data.title!;
            return data.title!;
          });
        }
        if (data.duration) setDuration(data.duration);
      })
      .catch((err) => {
        if (!cancelled) {
          setActionError(err instanceof Error ? err.message : "Could not load generated thumbnails");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/refs/faces", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load face refs (${r.status})`);
        return r.json() as Promise<{ faces?: FaceRef[] }>;
      })
      .then((data) => {
        if (!cancelled) setFaceRefs(Array.isArray(data.faces) ? data.faces : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setActionError(err instanceof Error ? err.message : "Could not load face refs");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const extrasRef = useRef(extras);
  useEffect(() => {
    extrasRef.current = extras;
  }, [extras]);

  const addUpload = useCallback((file: File) => {
    const preview = URL.createObjectURL(file);
    const stamp = Date.now();
    setExtras((old) => [
      ...old,
      { id: `${stamp}-${old.length}`, preview, talkName: `upload-${stamp}` },
    ]);
  }, []);

  useEffect(() => {
    return () => {
      for (const extra of extrasRef.current) {
        if (extra.preview?.startsWith("blob:")) URL.revokeObjectURL(extra.preview);
      }
    };
  }, []);

  const saveTitle = useCallback(async () => {
    const next = title.trim();
    if (!next || next === titleBaselineRef.current.trim()) return;
    setActionError(null);
    try {
      const res = await fetch("/api/generated/latest", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Save failed (${res.status})`);
      }
      titleBaselineRef.current = next;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not save title");
    }
  }, [title]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setActionError(null);
    try {
      if (pendingDelete.kind === "upload") {
        setExtras((old) => {
          const hit = old.find((e) => e.id === pendingDelete.id);
          if (hit?.preview?.startsWith("blob:")) URL.revokeObjectURL(hit.preview);
          return old.filter((e) => e.id !== pendingDelete.id);
        });
      } else {
        const res = await fetch("/api/generated/thumb", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ src: pendingDelete.src }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Delete failed (${res.status})`);
        }
        setGenerated((old) => old.filter((t) => t.src !== pendingDelete.src));
      }
      setPendingDelete(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, deleting]);

  const gridClass =
    view === "desktop"
      ? "grid w-full grid-cols-2 items-start gap-x-4 gap-y-8 xl:grid-cols-4"
      : "grid w-full grid-cols-1 items-start gap-y-6";

  const mainClass =
    view === "desktop"
      ? "mx-auto w-full max-w-[1600px] px-6 py-6"
      : "flex w-full justify-center px-4 py-4";

  const shellClass =
    view === "mobile"
      ? "w-full max-w-[390px] rounded-[2rem] border border-neutral-800 bg-[#0f0f0f] px-3 pb-4 pt-2"
      : "w-full";

  const deleteDescription =
    pendingDelete?.kind === "upload"
      ? "This upload is only in your browser session. It will be removed from the compare board."
      : `Remove ${pendingDelete?.label ?? "this thumb"} from the board and delete the file from public/generated/. This cannot be undone.`;

  return (
    <div className="bg-[#0f0f0f] text-[#f1f1f1]">
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete thumbnail?"
        description={deleteDescription}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        confirmDisabled={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      />

      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0f0f0f]">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff0000] text-sm font-bold">
            SV
          </div>
          <p className="text-sm font-semibold">Thumb compare</p>
          <div
            className="ml-auto flex rounded-full border border-neutral-700 bg-[#121212] p-0.5 text-xs font-medium"
            role="tablist"
            aria-label="Layout preview"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "desktop"}
              onClick={() => setView("desktop")}
              className={`rounded-full px-4 py-1.5 transition ${
                view === "desktop" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              Desktop
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "mobile"}
              onClick={() => setView("mobile")}
              className={`rounded-full px-4 py-1.5 transition ${
                view === "mobile" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              Mobile
            </button>
          </div>
        </div>
      </header>

      {actionError ? (
        <div className="border-b border-[#cc0000]/40 bg-[#cc0000]/10 px-6 py-2 text-center text-sm text-[#ffb4b4]">
          {actionError}
          <button
            type="button"
            className="ml-3 underline hover:text-white"
            onClick={() => setActionError(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <main className={mainClass}>
        <div className={shellClass}>
          {view === "mobile" ? (
            <div className="mb-2 flex justify-center">
              <div className="h-1 w-14 rounded-full bg-neutral-700" aria-hidden />
            </div>
          ) : null}
          <FaceRefsPanel faces={faceRefs} />
          <div className={gridClass}>
            {BENCHMARKS.map((video) => (
              <BenchmarkCard key={video.id} video={video} isMobile={view === "mobile"} />
            ))}
            {generated.map((thumb) => {
              const talkName = thumbTalkName(thumb.src);
              return (
                <GeneratedCard
                  key={thumb.src}
                  src={thumb.src}
                  title={title}
                  duration={duration}
                  talkName={talkName}
                  onDelete={() =>
                    setPendingDelete({ kind: "generated", src: thumb.src, label: talkName })
                  }
                />
              );
            })}
            {extras.map((extra) => (
              <GeneratedCard
                key={extra.id}
                src={extra.preview || ""}
                title={title}
                duration={duration}
                talkName={extra.talkName}
                onDelete={() =>
                  setPendingDelete({ kind: "upload", id: extra.id, label: extra.talkName })
                }
              />
            ))}
            <AddCard
              title={title}
              duration={duration}
              onPick={addUpload}
              onTitle={setTitle}
              onTitleBlur={() => {
                void saveTitle();
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
