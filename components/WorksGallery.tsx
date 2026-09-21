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
}

export default function WorksGallery({
  artworks,
  categories,
  renderItem,
}: {
  artworks: Artwork[];
  categories: string[];
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const columnCount = useSyncExternalStore(
    subscribeColumns,
    readColumns,
    serverColumns,
  );

  const wideColumns = buildGalleryColumns(artworks);
  const reading = galleryReadingOrder(wideColumns);
  // Position in reading order: drives the eager-load cutoff and the admin's
  // numbered badges.
  const position = new Map(reading.map((a, i) => [a.id, i]));
  const matches = (a: Artwork) =>
    activeCategory === null || a.category === activeCategory;

  // Wide: the saved columns, filtered in place so pieces keep their column.
  // Narrow: the wide arrangement's reading order dealt two across.
  const columns =
    columnCount === GALLERY_COLUMN_COUNT
      ? wideColumns.map((column) => column.filter(matches))
      : dealColumns(reading.filter(matches), columnCount);
  const filteredCount = reading.filter(matches).length;

  const baseBtn =
    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer";
  const activeBtn = "bg-primary text-white";
  const inactiveBtn =
    "border border-primary/20 text-primary hover:bg-primary hover:text-white";

  return (
    <>
      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`${baseBtn} ${activeCategory === null ? activeBtn : inactiveBtn}`}
            aria-pressed={activeCategory === null}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`${baseBtn} ${activeCategory === cat ? activeBtn : inactiveBtn}`}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="mt-12">
        <div className="flex gap-4">
          {columns.map((column, c) => (
            <div
              key={c}
              data-column={c}
              className="flex min-w-0 flex-1 flex-col gap-4"
            >
              {column.map((artwork) => {
                const i = position.get(artwork.id) ?? 0;
                return (
                  <div key={artwork.id} className="w-full">
                    {/* Eager-load the first row (above the fold) so the
                        gallery's LCP image isn't lazy; the rest lazy-load. */}
                    {renderItem
                      ? renderItem(
                          <ArtworkCard
                            artwork={artwork}
                            priority={i < 4}
                            interactive={false}
                          />,
                          artwork,
                          i,
                        )
                      : <ArtworkCard artwork={artwork} priority={i < 4} />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {filteredCount === 0 && (
          <div className="py-20 text-center">
            <p className="text-text-muted">No artworks to display yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
