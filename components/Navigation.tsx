"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/formatters";

const NAV_LINKS = [
  { href: "/works", label: "Gallery" },
  { href: "/exhibits", label: "Exhibits" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const showSolid = scrolled || !isHome;
  // On homepage before scroll, hide desktop nav (hero green panel has its own)
  const hideDesktopNav = isHome && !scrolled;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          showSolid
            ? "bg-cream/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "font-display text-2xl font-semibold tracking-tight transition-all duration-300",
              showSolid ? "text-primary-dark" : "text-white",
              hideDesktopNav && "md:opacity-0 md:pointer-events-none"
            )}
          >
            David Schaldach
          </Link>

          {/* Desktop links */}
          <ul
            className={cn(
              "hidden items-center gap-8 md:flex transition-opacity duration-300",
              hideDesktopNav && "opacity-0 pointer-events-none"
            )}
          >
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "text-sm font-medium uppercase tracking-[0.15em] transition-colors duration-200",
                    showSolid
                      ? pathname === link.href
                        ? "text-primary"
                        : "text-text-secondary hover:text-primary"
                      : pathname === link.href
                        ? "text-white"
                        : "text-white/80 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "relative z-50 md:hidden p-2 transition-colors",
              mobileOpen
                ? "text-white"
                : showSolid
                  ? "text-primary-dark"
                  : "text-white"
            )}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col items-center justify-center bg-primary-dark/95 backdrop-blur-lg transition-all duration-300 md:hidden",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <ul className="flex flex-col items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-2xl font-medium uppercase tracking-[0.2em] transition-colors",
                  pathname === link.href
                    ? "text-gold"
                    : "text-white/80 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
