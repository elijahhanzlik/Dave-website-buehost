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
