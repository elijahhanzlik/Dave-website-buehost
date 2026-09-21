/**
 * How the public Gallery decides which piece goes in which column.
 *
 * Pure functions, shared by the public page, the admin's live editor and the
 * reorder API, so all three agree on the arrangement.
 *
 * On wide screens the Gallery has three columns. Each piece carries its own
 * `gallery_column` (0 = left), set by dragging in the admin's live view, and
 * pieces inside a column follow `sort_order`. Moving one piece therefore
 * changes only that piece — nothing else shifts. A piece without a column
 * (newly added, or before the column existed) goes to whichever column holds
 * the fewest pieces, so new work never piles onto one side.
 *
 * Narrow screens show two columns: the wide arrangement is read row by row
 * and dealt out two across, so the order visitors read is the same one.
 */

export const GALLERY_COLUMN_COUNT = 3;
export const WIDE_QUERY = "(min-width: 768px)";

export interface GalleryPlaceable {
  id: string;
  sort_order: number;
  gallery_column?: number | null;
}

export function isGalleryColumn(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < GALLERY_COLUMN_COUNT
  );
}

/** Wide-screen columns: placed pieces by their column, the rest to the
 *  emptiest column. Within a column, by sort_order. */
export function buildGalleryColumns<T extends GalleryPlaceable>(
  artworks: T[],
): T[][] {
  const sorted = [...artworks].sort((a, b) => a.sort_order - b.sort_order);
  const columns: T[][] = Array.from({ length: GALLERY_COLUMN_COUNT }, () => []);
  const unplaced: T[] = [];
  for (const artwork of sorted) {
    if (isGalleryColumn(artwork.gallery_column)) {
      columns[artwork.gallery_column].push(artwork);
    } else {
      unplaced.push(artwork);
    }
  }
  for (const artwork of unplaced) {
    let best = 0;
    for (let c = 1; c < columns.length; c++) {
      if (columns[c].length < columns[best].length) best = c;
    }
    columns[best].push(artwork);
  }
  return columns;
}

/** Row by row across the columns: 1 2 3 / 4 5 6 / … */
export function galleryReadingOrder<T>(columns: T[][]): T[] {
  const out: T[] = [];
  const rows = Math.max(0, ...columns.map((c) => c.length));
  for (let r = 0; r < rows; r++) {
    for (const column of columns) {
      if (column[r] !== undefined) out.push(column[r]);
    }
  }
  return out;
}

/** Deal a list into N columns, one piece per column in turn. */
export function dealColumns<T>(list: T[], columnCount: number): T[][] {
  const columns: T[][] = Array.from({ length: columnCount }, () => []);
  list.forEach((item, i) => columns[i % columnCount].push(item));
  return columns;
}
