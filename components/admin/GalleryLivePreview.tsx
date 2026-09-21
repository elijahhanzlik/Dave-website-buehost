"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WorksGallery, { type Artwork } from "@/components/WorksGallery";
import {
  WIDE_QUERY,
  buildGalleryColumns,
  galleryReadingOrder,
} from "@/lib/galleryLayout";
import { cn, formatApiError } from "@/lib/formatters";

/**
 * The public Gallery, rendered with the public components, plus drag-to-place.
 *
 * This runs inside the admin's "Live view" iframe, so Tailwind breakpoints and
 * next/image sizes respond to the frame's own width — what David sees here at
 * 390px is what a phone shows. The nav and footer are real but `inert`, so
 * nothing inside the frame can navigate away.
 *
 * Every piece belongs to one of the three wide-screen columns (see
 * lib/galleryLayout.ts). Dragging lifts one piece and drops it at a precise
 * spot — above or below a neighbour, or at the foot of a column — and nothing
 * else moves. Dragging is only offered at wide sizes, because the two-column
 * phone layout is derived from this one rather than arranged by hand.
 *
 * Pointer Events rather than HTML5 drag-and-drop: the layout updates live
 * under the pointer (no ghost image needed), the photo can't hijack the drag,
 * and touch works — the admin is used on a phone or tablet. Moves and the
 * release are listened for on the window for the length of a drag, because
 * a piece dropped into another column is re-created by React under its new
 * column and any listener or pointer capture on the old node would be lost.
 */

type Columns = Artwork[][];

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

const MOVE_COOLDOWN_MS = 120;
// The pointer must travel this far after a move before another move can
// fire, so a reflow under a stationary pointer never cascades.
const MOVE_MIN_TRAVEL_PX = 14;
const EDGE_SCROLL_PX = 60;
const EDGE_SCROLL_STEP = 14;

function getCategories(artworks: Artwork[]): string[] {
  const cats = new Set(
    artworks.map((a) => a.category).filter(Boolean) as string[],
  );
  return Array.from(cats);
}

/** Flat list WorksGallery rebuilds these exact columns from: each piece
 *  stamped with its column, sort_order = reading order. */
function columnsToWorks(columns: Columns): Artwork[] {
  const stamped = columns.map((column, c) =>
    column.map((a) => ({ ...a, gallery_column: c })),
  );
  return galleryReadingOrder(stamped).map((a, i) => ({ ...a, sort_order: i }));
}

function signature(columns: Columns): string {
  return columns.map((c) => c.map((a) => a.id).join(",")).join("|");
}

/** Lift `id` out of wherever it is and put it at one precise spot. */
function place(
  columns: Columns,
  id: string,
  target: { column: number; beforeId?: string },
): Columns {
  let item: Artwork | undefined;
  const next = columns.map((column) =>
    column.filter((a) => {
      if (a.id === id) {
        item = a;
        return false;
      }
      return true;
    }),
  );
  const column = next[target.column];
  if (!item || !column) return columns;
  const at = target.beforeId
    ? column.findIndex((a) => a.id === target.beforeId)
    : -1;
  column.splice(at === -1 ? column.length : at, 0, item);
  return next;
}

export default function GalleryLivePreview() {
  const [columns, setColumns] = useState<Columns>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });

  // Drag bookkeeping lives in refs so pointermove never waits on a render.
  const columnsRef = useRef<Columns>([]);
  const dragIdRef = useRef<string | null>(null);
  const startSignatureRef = useRef("");
  const lastTargetRef = useRef<string | null>(null);
  const lastMoveAtRef = useRef(0);
  const lastMovePointRef = useRef<{ x: number; y: number } | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/artworks");
      const data = await res.json();
      if (Array.isArray(data)) setColumns(buildGalleryColumns(data));
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
    async (next: Columns) => {
      setSave({ kind: "saving" });
      const works = columnsToWorks(next);

      let res: Response | null = null;
      let body: { error?: unknown } = {};
      try {
        res = await fetch("/api/artworks/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: works.map((w) => ({
              id: w.id,
              sort_order: w.sort_order,
              gallery_column: w.gallery_column,
            })),
          }),
        });
        body = await res.json().catch(() => ({}));
      } catch {
        res = null;
      }

      if (!res || !res.ok) {
        // Optimistic arrangement was refused — re-read so the frame shows
        // what the Gallery page really has.
        setSave({
          kind: "error",
          message: formatApiError(body.error, "Couldn't save the new arrangement"),
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

  const onPointerMove = useCallback((e: PointerEvent) => {
    const id = dragIdRef.current;
    if (!id) return;

    // Keep the piece reachable when the list is taller than the frame.
    const vh = window.innerHeight;
    if (e.clientY < EDGE_SCROLL_PX) window.scrollBy(0, -EDGE_SCROLL_STEP);
    else if (e.clientY > vh - EDGE_SCROLL_PX) window.scrollBy(0, EDGE_SCROLL_STEP);

    const now = performance.now();
    if (now - lastMoveAtRef.current < MOVE_COOLDOWN_MS) return;
    const last = lastMovePointRef.current;
    if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < MOVE_MIN_TRAVEL_PX) {
      return;
    }

    const columnEl = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-column]");
    if (!columnEl) {
      lastTargetRef.current = null;
      return;
    }
    const column = Number(columnEl.dataset.column);

    // The drop spot is "above the first neighbour whose middle is below the
    // pointer", or the foot of the column. Gaps between pieces count too, so
    // hovering between two pieces slips the dragged one in between them.
    let beforeId: string | undefined;
    for (const cell of columnEl.querySelectorAll<HTMLElement>("[data-artwork-id]")) {
      const cellId = cell.dataset.artworkId;
      if (!cellId || cellId === id) continue;
      const rect = cell.getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        beforeId = cellId;
        break;
      }
    }
    const key = `${column}:${beforeId ?? "end"}`;
    if (key === lastTargetRef.current) return;
    lastTargetRef.current = key;

    const next = place(columnsRef.current, id, { column, beforeId });
    if (signature(next) === signature(columnsRef.current)) return;

    lastMoveAtRef.current = now;
    lastMovePointRef.current = { x: e.clientX, y: e.clientY };
    columnsRef.current = next;
    setColumns(next);
  }, []);

  const endDrag = useCallback(() => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    const id = dragIdRef.current;
    if (!id) return;
    dragIdRef.current = null;
    lastTargetRef.current = null;
    setDragId(null);

    const current = columnsRef.current;
    if (signature(current) !== startSignatureRef.current) persist(current);
  }, [onPointerMove, persist]);

  // A drag in flight when the frame unmounts must not leave window listeners.
  useEffect(() => endDrag, [endDrag]);

  const onPointerDown = (id: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    // Columns are only arranged in the wide layout; the phone layout follows.
    if (!window.matchMedia(WIDE_QUERY).matches) return;
    e.preventDefault();
    dragIdRef.current = id;
    startSignatureRef.current = signature(columnsRef.current);
    lastTargetRef.current = null;
    lastMoveAtRef.current = 0;
    lastMovePointRef.current = null;
    setDragId(id);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  const works = columnsToWorks(columns);
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

            {/* Editor chrome — only at phone width, where columns can't be
                arranged by hand. */}
            {!loading && works.length > 0 && (
              <p className="mt-4 rounded-xl bg-sage px-4 py-3 text-sm text-primary md:hidden">
                Phones show your pieces two across, in the order you arranged
                them. To move pieces, switch the preview to Laptop or Desktop.
              </p>
            )}

            {loading ? (
              <div className="mt-12 flex gap-4" aria-busy="true">
                {[["h-72", "h-64"], ["h-56", "h-80"], ["h-80", "h-56"]].map((col, c) => (
                  <div
                    key={c}
                    className={`min-w-0 flex-1 flex-col gap-4 ${c === 2 ? "hidden md:flex" : "flex"}`}
                  >
                    {col.map((h, i) => (
                      <div
                        key={i}
                        className={`w-full ${h} rounded-xl bg-gradient-to-br from-sage to-primary/10 motion-safe:animate-pulse`}
                      />
                    ))}
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
                    style={{ touchAction: "none" }}
                    className={cn(
                      "relative select-none rounded-xl transition-opacity md:cursor-grab md:active:cursor-grabbing",
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
          {save.kind === "saved" && "Arrangement saved"}
          {save.kind === "error" &&
            `${save.message} — showing what the site has`}
        </div>
      )}
    </>
  );
}
