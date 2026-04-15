"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  published_at: string;
}

interface FeaturedArtwork {
  id: string;
  title: string;
  images: string[];
  category: string | null;
}

interface HeroCrop {
  x: number;
  y: number;
  zoom: number;
}

export default function HomeClient({
  latestPosts,
  heroImageUrl,
  heroCrop,
  featuredArtworks,
}: {
  latestPosts: BlogPost[];
  heroImageUrl?: string | null;
  heroCrop?: HeroCrop | null;
  featuredArtworks: FeaturedArtwork[];
}) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (parallaxRef.current) {
            const y = window.scrollY * 0.15;
            parallaxRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative h-screen w-full overflow-hidden bg-primary-dark">
        <div className="flex h-full">
          {/* Left green panel — desktop only */}
          <div className="hidden md:flex md:w-2/5 flex-col items-center justify-center bg-primary-dark px-8 relative z-10">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white lg:text-5xl xl:text-6xl animate-fade-in text-center">
              David Schaldach
            </h1>
            <p
              className="mt-4 text-lg text-white/80 animate-fade-in-up"
              style={{ animationDelay: "0.2s", opacity: 0 }}
            >
              Studio Artist &middot; Boulder, CO
            </p>

            {/* Nav links centered in green panel */}
            <nav
              className="mt-12 animate-fade-in-up"
              style={{ animationDelay: "0.3s", opacity: 0 }}
            >
              <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
                {[
                  { href: "/works", label: "Gallery" },
                  { href: "/exhibits", label: "Exhibits" },
                  { href: "/about", label: "About" },
                  { href: "/blog", label: "Blog" },
                  { href: "/contact", label: "Contact" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium uppercase tracking-[0.15em] text-white/80 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* CTA Buttons */}
            <div
              className="mt-10 flex flex-col gap-4 animate-fade-in-up"
              style={{ animationDelay: "0.4s", opacity: 0 }}
            >
              <Link
                href="/works"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-white border-2 border-white/60 transition-all duration-300 hover:bg-white/20 hover:border-white/80"
              >
                View Gallery
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/about"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-white border-2 border-white/60 transition-all duration-300 hover:bg-white/20 hover:border-white/80"
              >
                About David
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>

          {/* Right image panel */}
          <div className="flex-1 relative">
            <div
              ref={parallaxRef}
              className="absolute inset-0 will-change-transform"
            >
              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt="David Schaldach among the trees"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="h-[120%] w-full bg-cover bg-no-repeat"
                  style={{
                    backgroundImage: `
                      linear-gradient(
                        to bottom,
                        rgba(30, 58, 14, 0.1) 0%,
                        rgba(30, 58, 14, 0.3) 40%,
                        rgba(30, 58, 14, 0.6) 100%
                      ),
                      linear-gradient(
                        160deg,
                        #2D5016 0%,
                        #3D6B1E 25%,
                        #4a7a2a 45%,
                        #2D5016 65%,
                        #1E3A0E 100%
                      )
                    `,
                    backgroundPosition: "center 20%",
                  }}
                >
                  {/* Heart shape silhouette — decorative SVG overlay */}
                  <div className="absolute inset-0 flex items-start justify-center pt-[8vh] md:pt-[10vh] opacity-20">
                    <svg
                      viewBox="0 0 200 180"
                      className="w-48 h-48 md:w-72 md:h-72"
                      fill="none"
                    >
                      <path
                        d="M100 170 C100 170 20 110 20 60 C20 30 45 10 70 10 C85 10 95 20 100 35 C105 20 115 10 130 10 C155 10 180 30 180 60 C180 110 100 170 100 170Z"
                        fill="rgba(245, 240, 232, 0.3)"
                      />
                    </svg>
                  </div>

                  {/* Tree-like texture lines */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-[40%] bg-gradient-to-t from-cream/40 to-transparent" />
                    <div className="absolute bottom-[35%] left-1/2 -translate-x-1/2 w-[200px] h-px bg-gradient-to-r from-transparent via-cream/20 to-transparent" />
                    <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-[300px] h-px bg-gradient-to-r from-transparent via-cream/15 to-transparent" />
                  </div>
                </div>
              )}
            </div>

            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/50" />

            {/* Mobile hero content — shown when green panel is hidden */}
            <div className="md:hidden relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
              <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl animate-fade-in">
                David Schaldach
              </h1>
              <p
                className="mt-4 text-lg text-white/80 sm:text-xl animate-fade-in-up"
                style={{ animationDelay: "0.2s", opacity: 0 }}
              >
                Studio Artist &middot; Boulder, CO
              </p>
              <div
                className="mt-10 flex flex-col gap-4 sm:flex-row animate-fade-in-up"
                style={{ animationDelay: "0.4s", opacity: 0 }}
              >
                <Link
                  href="/works"
                  className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-white backdrop-blur-md border-2 border-white/60 transition-all duration-300 hover:bg-white/20 hover:border-white/80"
                >
                  View Gallery
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-white backdrop-blur-md border-2 border-white/60 transition-all duration-300 hover:bg-white/20 hover:border-white/80"
                >
                  About David
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in z-10" style={{ animationDelay: "1s", opacity: 0 }}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">
              Scroll
            </span>
            <div className="h-10 w-px bg-gradient-to-b from-white/60 to-transparent" />
          </div>
        </div>
      </section>

      {/* ===== FEATURED WORKS ===== */}
      <section className="bg-primary-dark py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="font-display text-center text-3xl font-semibold text-cream sm:text-4xl md:text-5xl mb-12">
            Featured Works
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {featuredArtworks.map((artwork) => {
              const hasImage = artwork.images.length > 0;
              return (
                <Link
                  key={artwork.id}
                  href={`/works/${artwork.id}`}
                  className="group relative block overflow-hidden rounded-xl"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary-dark/30">
                    {hasImage ? (
                      <img
                        src={artwork.images[0]}
                        alt={artwork.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sage to-primary/10">
                        <svg
                          className="h-16 w-16 text-primary/20"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="w-full p-5">
                      <h3 className="font-display text-lg font-semibold text-white">
                        {artwork.title}
                      </h3>
                      {artwork.category && (
                        <p className="mt-1 text-sm text-white/70">{artwork.category}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/works"
              className="group inline-flex items-center gap-2 rounded-full border-2 border-cream/40 bg-cream/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-cream transition-all duration-300 hover:bg-cream/20 hover:border-cream/60"
            >
              View Full Gallery
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FEATURED SECTIONS ===== */}
      <section className="relative py-20 sm:py-28">
        {/* Background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-sage via-cream to-sage opacity-60" />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-2">
            {/* About David card */}
            <div className="group relative overflow-hidden rounded-2xl">
              {/* Card background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-dark/90" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(61,107,30,0.4),transparent_70%)]" />

              {/* Glass card content */}
              <div className="glass-card relative m-6 p-8 sm:m-8 sm:p-10">
                <h3 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                  About David
                </h3>
                <p className="mt-4 leading-relaxed text-white/75">
                  Former certified arborist turned studio artist, David brings a
                  unique perspective shaped by years working intimately with
                  nature. Based in Boulder, Colorado, his work celebrates the
                  organic beauty found in the world around us.
                </p>
                <Link
                  href="/about"
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/20 px-6 py-2.5 text-sm font-medium text-gold-light transition-all duration-300 hover:bg-gold/30 hover:border-gold"
                >
                  Read More
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>

            {/* Latest from the Blog card */}
            <div className="group relative overflow-hidden rounded-2xl">
              {/* Card background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/70 to-primary/80" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(61,107,30,0.3),transparent_70%)]" />

              {/* Glass card content */}
              <div className="glass-card relative m-6 p-8 sm:m-8 sm:p-10">
                <h3 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                  Latest from the Blog
                </h3>

                <div className="mt-6 space-y-4">
                  {latestPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="block rounded-lg bg-white/5 p-4 transition-colors hover:bg-white/10"
                    >
                      <h4 className="font-display text-lg font-medium text-white">
                        {post.title}
                      </h4>
                      <p className="mt-1 text-sm text-white/60 line-clamp-2">
                        {post.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>

                <Link
                  href="/blog"
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/20 px-6 py-2.5 text-sm font-medium text-gold-light transition-all duration-300 hover:bg-gold/30 hover:border-gold"
                >
                  Read the Blog
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
