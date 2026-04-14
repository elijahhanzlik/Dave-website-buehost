"use client";

import { useEffect, useRef, useState } from "react";
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

interface HeroCrop {
  x: number;
  y: number;
  zoom: number;
}

export default function HomeClient({
  latestPosts,
  heroImageUrl,
  heroCrop,
}: {
  latestPosts: BlogPost[];
  heroImageUrl?: string | null;
  heroCrop?: HeroCrop | null;
}) {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section
        ref={heroRef}
        className="relative h-screen w-full overflow-hidden"
      >
        {/* Hero background — placeholder gradient until real image is set */}
        <div
          className="absolute inset-0"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt="David Schaldach among the trees"
              className="h-[120%] w-full object-cover"
              style={{
                objectPosition: heroCrop
                  ? `${heroCrop.x}% ${heroCrop.y}%`
                  : "center 20%",
                transform: heroCrop && heroCrop.zoom > 1
                  ? `scale(${heroCrop.zoom})`
                  : undefined,
                transformOrigin: heroCrop
                  ? `${heroCrop.x}% ${heroCrop.y}%`
                  : undefined,
              }}
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

        {/* Hero content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <h1
            className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl animate-fade-in"
          >
            David Schaldach
          </h1>
          <p
            className="mt-4 max-w-xl text-lg text-white/80 sm:text-xl animate-fade-in-up"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            Creative &amp; Photographer &middot; Boulder, CO
          </p>

          {/* CTA Buttons */}
          <div
            className="mt-10 flex flex-col gap-4 sm:flex-row animate-fade-in-up"
            style={{ animationDelay: "0.4s", opacity: 0 }}
          >
            <Link
              href="/works"
              className="group inline-flex items-center gap-2 rounded-full bg-primary/30 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-white backdrop-blur-md border border-primary/40 transition-all duration-300 hover:bg-primary/45 hover:border-primary/60"
            >
              View Gallery
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 rounded-full bg-primary/30 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.12em] text-white backdrop-blur-md border border-primary/40 transition-all duration-300 hover:bg-primary/45 hover:border-primary/60"
            >
              About David
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in" style={{ animationDelay: "1s", opacity: 0 }}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">
              Scroll
            </span>
            <div className="h-10 w-px bg-gradient-to-b from-white/60 to-transparent" />
          </div>
        </div>
      </section>

      {/* ===== WELCOME SECTION ===== */}
      <section className="bg-primary-dark py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl font-semibold text-cream sm:text-4xl md:text-5xl">
            Welcome
          </h2>
          <p className="mt-6 font-display text-xl italic leading-relaxed text-cream/80 sm:text-2xl">
            &ldquo;He was a certified arborist, now he&apos;s branching out.&rdquo;
          </p>
          <p className="mt-6 text-base leading-relaxed text-cream/60 sm:text-lg">
            From the canopy to the canvas — David Schaldach brings an
            arborist&apos;s eye for natural beauty to his creative work.
            Every image is rooted in the patterns, textures, and quiet
            drama of the living world.
          </p>
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
                  Former certified arborist turned creative, David brings a
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
