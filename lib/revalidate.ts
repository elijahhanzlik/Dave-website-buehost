import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Called after every artwork write (create, edit, delete, reorder).
 *
 * The tag purge clears the cached Supabase read in lib/supabase/public.ts.
 * The path purges are belt-and-braces for Vercel's CDN: the public pages are
 * prerendered with a 5-minute ISR window and, once that window lapses, the
 * CDN serves the stale copy first and only then re-renders. Purging the
 * paths outright means a visitor anywhere gets the new order on their next
 * load, not after a refresh or two, and not only for the person who saved.
 */
export function revalidateArtworks() {
  revalidateTag("artworks", { expire: 0 });
  revalidatePath("/works");
  revalidatePath("/works/[id]", "page");
  revalidatePath("/");
}
