"use client";

import { useState, useSyncExternalStore } from "react";
import ArtworkCard from "@/components/ArtworkCard";
import {
  GALLERY_COLUMN_COUNT,
  WIDE_QUERY,
  buildGalleryColumns,
  dealColumns,
  galleryReadingOrder,
} from "@/lib/galleryLayout";

/**
 * Column count follows the same breakpoint the old CSS-columns layout used:
 * 2 below `md`, 3 from `md` up. It is read through matchMedia rather than left
 * to CSS so that WHICH piece lands in WHICH column is decided here — by each
 * piece's saved `gallery_column` (see lib/galleryLayout.ts) — not by the
 * browser's column-balancing algorithm. CSS multi-column balances on rendered
 * image heights, which differ by window width, by when images finish loading,
 * and between Chrome and Safari, so two visitors with identical data could
 * see different arrangements. With saved columns everyone sees the same
 * thing, and the admin's live view is exactly the site.
 */

function subscribeColumns(cb: () => void) {
  const mql = window.matchMedia(WIDE_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}
function readColumns() {
  return window.matchMedia(WIDE_QUERY).matches ? 3 : 2;
}
// Server render assumes the wide layout; phones correct on hydration.
function serverColumns() {
  return 3;
}

export interface Artwork {
  id: string;
  title: string;
  description?: string | null;
  images: string[];
  category?: string | null;
  sort_order: number;
  is_featured: boolean;
  gallery_column?: number | null;
  is_sold?: boolean;
  sold_only?: boolean;
}

type SaleFilter = "all" | "available" | "sold";

const FILTERS: { value: SaleFilter; label: string }[] = [
  { value: "all", label: "All works" },
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
];

/** Rows from before the sold migration lack the fields — treat as false. */
function matchesFilter(
  a: Artwork,
  filter: SaleFilter,
  includeSoldOnly: boolean,
): boolean {
  if (filter === "available") return !a.is_sold;
  if (filter === "sold") return !!a.is_sold;
  // "All works" hides sold_only pieces (they appear under Sold only).
  return includeSoldOnly || !a.sold_only;
}

export default function WorksGallery({
  artworks,
  renderItem,
  includeSoldOnlyInAll = false,
}: {
  artworks: Artwork[];
  /**
   * The admin's live editor sets this so "All works" shows every piece,
   * sold_only ones included, and every piece stays draggable. Public pages
   * leave it off, so sold_only pieces appear under "Sold" only.
   */
  includeSoldOnlyInAll?: boolean;
  /**
   * Lets the admin's live gallery editor wrap each card (drag handle, badge)
   * while this component stays the single definition of the masonry layout.
   * Defaults to rendering the card as-is.
   */
  renderItem?: (
    card: React.ReactNode,
    artwork: Artwork,
    index: number,
  ) => React.ReactNode;
}) {
  const [filter, setFilter] = useState<SaleFilter>("all");
  const columnCount = useSyncExternalStore(
    subscribeColumns,
    readColumns,
    serverColumns,
  );

  // Columns are built from the pieces the active filter keeps. For "All
  // works" that is what the saved arrangement is drawn from (sold_only pieces
  // drop out without disturbing anyone else's column); for the other filters
  // only its reading order is used.
  const visible = artworks.filter((a) =>
    matchesFilter(a, filter, includeSoldOnlyInAll),
  );
  const wideColumns = buildGalleryColumns(visible);
  const reading = galleryReadingOrder(wideColumns);
  // Position in reading order: drives the eager-load cutoff and the admin's
  // numbered badges.
  const position = new Map(reading.map((a, i) => [a.id, i]));

  // "All works" at wide width: the saved columns as arranged. Any other
  // filter, or narrow width: the reading order dealt left to right across the
  // columns, so a filter packs its matches together instead of leaving gaps.
  const showSaved = columnCount === GALLERY_COLUMN_COUNT && filter === "all";
  const columns = showSaved ? wideColumns : dealColumns(reading, columnCount);

  const baseBtn =
    "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors";
  const activeBtn = "border border-primary bg-primary text-white";
  const inactiveBtn =
    "border border-primary/15 bg-cream text-primary hover:border-primary/40";

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`${baseBtn} ${filter === f.value ? activeBtn : inactiveBtn}`}
            aria-pressed={filter === f.value}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex gap-4">
          {columns.map((column, c) => (
            <div
              key={c}
              // Only saved columns are drop targets for the admin's drag
              // editor; dealt columns don't map to a piece's gallery_column.
              data-column={showSaved ? c : undefined}
              className="flex min-w-0 flex-1 flex-col gap-4"
            >
              {column.map((artwork) => {
                const i = position.get(artwork.id) ?? 0;
                return (
                  <div key={artwork.id} className="w-full">
                    {/* Eager-load the first row (above the fold) so the
                        gallery's LCP image isn't lazy; the rest lazy-load. */}
                    {renderItem ? (
                      renderItem(
                        <ArtworkCard
                          artwork={artwork}
                          priority={i < 4}
                          interactive={false}
                        />,
                        artwork,
                        i,
                      )
                    ) : (
                      <ArtworkCard artwork={artwork} priority={i < 4} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-text-muted">No artworks to display yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
