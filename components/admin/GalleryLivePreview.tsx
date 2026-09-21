"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WorksGallery, { type Artwork } from "@/components/WorksGallery";
import { cn, formatApiError } from "@/lib/formatters";

/**
 * The public Gallery, rendered with the public components, plus drag-to-reorder.
 *
 * This runs inside the admin's "Live view" iframe, so Tailwind breakpoints and
 * next/image sizes respond to the frame's own width — what David sees here at
 * 390px is what a phone shows. The nav and footer are real but `inert`, so
 * nothing inside the frame can navigate away.
 *
 * Dragging uses Pointer Events rather than HTML5 drag-and-drop: the masonry
 * reflows live under the pointer (no ghost image needed), the photo can't
 * hijack the drag, and touch works — the admin is used on a phone.
 */

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

const SWAP_COOLDOWN_MS = 120;
const EDGE_SCROLL_PX = 60;
const EDGE_SCROLL_STEP = 14;

function getCategories(artworks: Artwork[]): string[] {
  const cats = new Set(
    artworks.map((a) => a.category).filter(Boolean) as string[],
  );
  return Array.from(cats);
}

/** Lift `id` out and drop it at `targetId`'s slot — the card view's algorithm,
 *  keyed by id so it stays correct while the list is moving. Moving later
 *  lands just after the target; moving earlier lands just before it. */
function moveTo(list: Artwork[], id: string, targetId: string): Artwork[] {
  const from = list.findIndex((a) => a.id === id);
  const to = list.findIndex((a) => a.id === targetId);
  if (from === -1 || to === -1) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function GalleryLivePreview() {
  const [works, setWorks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  // Drag bookkeeping lives in refs so pointermove never waits on a render.
  const worksRef = useRef<Artwork[]>([]);
  const dragIdRef = useRef<string | null>(null);
  const startOrderRef = useRef<string[]>([]);
  const lastTargetRef = useRef<string | null>(null);
  const lastSwapAtRef = useRef(0);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    worksRef.current = works;
  }, [works]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/artworks");
      const data = await res.json();
      if (Array.isArray(data)) setWorks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    [],
  );

  const persist = useCallback(
    async (ordered: Artwork[]) => {
      setSave({ kind: "saving" });
      const updated = ordered.map((w, i) => ({ ...w, sort_order: i }));
      setWorks(updated);

      let res: Response | null = null;
      let body: { error?: unknown } = {};
      try {
        res = await fetch("/api/artworks/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: updated.map((w) => ({ id: w.id, sort_order: w.sort_order })),
          }),
        });
        body = await res.json().catch(() => ({}));
      } catch {
        res = null;
      }

      if (!res || !res.ok) {
        // Optimistic order was refused — re-read so the frame shows the order
        // the Gallery page really has, same as the card view does.
        setSave({
          kind: "error",
          message: formatApiError(body.error, "Couldn't save the new order"),
        });
        load();
        return;
      }

      setSave({ kind: "saved" });
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(
        () => setSave({ kind: "idle" }),
        2200,
      );
      // Tell the admin screen hosting this frame so its card view re-reads.
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: "artworks:reordered" },
          window.location.origin,
        );
      }
    },
    [load],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const id = dragIdRef.current;
      if (!id) return;
      dragIdRef.current = null;
      lastTargetRef.current = null;
      setDragId(null);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* capture may already be gone */
      }

      const current = worksRef.current;
      const changed = current.some((w, i) => w.id !== startOrderRef.current[i]);
      if (changed) persist(current);
    },
    [persist],
  );

  const onPointerDown = (id: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragIdRef.current = id;
    startOrderRef.current = worksRef.current.map((w) => w.id);
    lastTargetRef.current = null;
    lastSwapAtRef.current = 0;
    setDragId(id);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const id = dragIdRef.current;
    if (!id) return;

    // Keep the piece reachable when the list is taller than the frame.
    const vh = window.innerHeight;
    if (e.clientY < EDGE_SCROLL_PX) window.scrollBy(0, -EDGE_SCROLL_STEP);
    else if (e.clientY > vh - EDGE_SCROLL_PX) window.scrollBy(0, EDGE_SCROLL_STEP);

    const now = performance.now();
    if (now - lastSwapAtRef.current < SWAP_COOLDOWN_MS) return;

    const cell = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-artwork-id]");
    const targetId = cell?.dataset.artworkId;
    if (!cell || !targetId || targetId === id) {
      // Over the dragged piece itself (or nothing): forget the last target so
      // dragging straight back over that neighbour can undo the move.
      lastTargetRef.current = null;
      return;
    }
    if (targetId === lastTargetRef.current) return;

    // Only commit once the pointer is past the target's midpoint, so brushing
    // the edge of a neighbour while the columns reflow doesn't bounce pieces.
    const rect = cell.getBoundingClientRect();
    const list = worksRef.current;
    const fromIdx = list.findIndex((w) => w.id === id);
    const toIdx = list.findIndex((w) => w.id === targetId);
    const movingLater = toIdx > fromIdx;
    const mid = rect.top + rect.height / 2;
    if (movingLater ? e.clientY < mid : e.clientY > mid) return;

    lastTargetRef.current = targetId;
    lastSwapAtRef.current = now;
    const next = moveTo(list, id, targetId);
    worksRef.current = next;
    setWorks(next);
  };

  const categories = getCategories(works);

  return (
    <>
      {/* Real nav and footer for fidelity; `inert` so nothing here navigates
          the frame or takes focus. */}
      <div inert>
        <Navigation activeHref="/works" />
      </div>

      {/* Mirrors the shell of app/(public)/works/page.tsx — keep in sync. */}
      <main className="flex-1">
        <div className="pt-24 pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h1 className="font-display text-4xl font-bold text-primary-dark sm:text-5xl">
              Gallery
            </h1>

            {loading ? (
              <div className="mt-12 columns-2 gap-4 md:columns-3" aria-busy="true">
                {["h-72", "h-56", "h-80", "h-64", "h-52", "h-72"].map((h, i) => (
                  <div key={i} className="mb-4 w-full break-inside-avoid">
                    <div
                      className={`w-full ${h} rounded-xl bg-gradient-to-br from-sage to-primary/10 motion-safe:animate-pulse`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <WorksGallery
                artworks={works}
                categories={categories}
                renderItem={(card, artwork, index) => (
                  <div
                    data-artwork-id={artwork.id}
                    onPointerDown={onPointerDown(artwork.id)}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    style={{ touchAction: "none" }}
                    className={cn(
                      "relative select-none rounded-xl cursor-grab active:cursor-grabbing transition-opacity",
                      dragId === artwork.id &&
                        "opacity-70 ring-2 ring-gold ring-offset-2 ring-offset-cream",
                    )}
                  >
                    {card}
                    {/* Editor chrome — not on the public site. */}
                    <span
                      className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-admin-ink/55 px-2.5 py-1 text-[12px] font-bold text-cream"
                      title="Drag to move this piece"
                    >
                      <GripVertical size={13} />
                      {index + 1}
                    </span>
                  </div>
                )}
              />
            )}

            {!loading && works.length === 0 && (
              <p className="mt-4 text-center text-sm text-text-muted">
                Until you add a piece, visitors see a set of sample images here.
              </p>
            )}
          </div>
        </div>
      </main>

      <div inert>
        <Footer />
      </div>

      {/* Save status — editor chrome, fixed so it never shifts the layout. */}
      {save.kind !== "idle" && (
        <div
          role="status"
          className={cn(
            "fixed bottom-4 right-4 z-[60] max-w-[80vw] rounded-full px-4 py-2 text-sm font-semibold shadow-lg",
            save.kind === "saving" && "bg-admin-ink/80 text-cream",
            save.kind === "saved" && "bg-primary text-cream",
            save.kind === "error" && "bg-admin-danger text-cream",
          )}
        >
          {save.kind === "saving" && "Saving…"}
          {save.kind === "saved" && "Order saved"}
          {save.kind === "error" &&
            `${save.message} — showing the order the site has`}
        </div>
      )}
    </>
  );
}
