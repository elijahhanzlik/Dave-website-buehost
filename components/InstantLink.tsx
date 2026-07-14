"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

/**
 * Instant-feel navigation link for the gallery -> detail flow only.
 *
 * - On hover/focus/touch (once): prefetch the route and warm the target's hero
 *   image so the detail view paints instantly.
 * - On press: start navigation on `mousedown` (before the click completes), but
 *   ONLY for an unmodified primary-button press. Modified clicks (Cmd/Ctrl/Shift/
 *   Alt) and non-primary buttons fall through to the underlying <Link>, which
 *   preserves open-in-new-tab, right-click menu, and Cmd/Ctrl-click. Keyboard
 *   Enter also falls through to <Link> (no mousedown → default click).
 *
 * Deliberately NOT used for the nav bar, breadcrumbs/back links, or body links.
 */
export default function InstantLink({
  href,
  prefetchImage,
  className,
  children,
}: {
  href: string;
  prefetchImage?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const warmed = useRef(false);
  const pushed = useRef(false);

  const warm = useCallback(() => {
    if (warmed.current) return;
    warmed.current = true;
    router.prefetch(href);
    if (prefetchImage) {
      const img = new window.Image();
      img.src = prefetchImage;
    }
  }, [href, prefetchImage, router]);

  return (
    <Link
      href={href}
      prefetch={false}
      className={className}
      onMouseEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
      onMouseDown={(e) => {
        if (
          e.button === 0 &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey
        ) {
          pushed.current = true;
          router.push(href);
        }
      }}
      onClick={(e) => {
        // Navigation already started on mousedown — cancel the duplicate click
        // nav so we don't push a second history entry. Modified/keyboard
        // activations never set this flag and pass through normally.
        if (pushed.current) {
          pushed.current = false;
          e.preventDefault();
        }
      }}
    >
      {children}
    </Link>
  );
}
