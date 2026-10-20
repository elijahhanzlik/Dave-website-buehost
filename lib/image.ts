import { getImageProps } from "next/image";

/**
 * Shared image helpers for public-facing `next/image` usage.
 *
 * BLUR_DATA_URL is a tiny solid sage (#E8EDE2, the design-system background)
 * PNG used as a `placeholder="blur"` blurDataURL. It gives fixed-ratio images
 * an immediate on-brand fill so photos fade in from a placeholder instead of
 * popping in from blank. It's a static string — no runtime cost, no dependency.
 */
export const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR42mN48fYRVsQwtCQA5TWtwbKS79QAAAAASUVORK5CYII=";

/**
 * `sizes` for the artwork detail hero (works/[id]). Shared with the gallery
 * card so InstantLink can warm the exact optimized file the detail page will
 * request — warming the raw Supabase URL would download the full original and
 * leave the detail view's `/_next/image` request cold.
 */
export const ARTWORK_DETAIL_SIZES = "(min-width: 1024px) 1024px, 100vw";

/**
 * Optimized src/srcSet/sizes of an artwork's detail hero, for InstantLink's
 * `prefetchImage`. Mirrors the detail page's <Image> props exactly.
 */
export function artworkDetailPrefetch(src: string | undefined) {
  if (!src) return null;
  const { props } = getImageProps({
    src,
    alt: "",
    width: 0,
    height: 0,
    sizes: ARTWORK_DETAIL_SIZES,
  });
  return { src: props.src, srcSet: props.srcSet, sizes: props.sizes };
}
