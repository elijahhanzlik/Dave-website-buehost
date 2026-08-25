import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getPublishedExhibits,
  getSettings,
  settingValue,
} from "@/lib/supabase/public";
import { BLUR_DATA_URL } from "@/lib/image";

// Prerender + ISR (5 min) instead of a per-request dynamic DB read.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Exhibits — David Schaldach",
  description: "Documentation of David Schaldach's art exhibits.",
};

export default async function ExhibitsPage() {
  const [exhibits, settings] = await Promise.all([
    getPublishedExhibits(),
    getSettings(),
  ]);
  const bannerImage = settingValue(settings, "exhibits_banner");

  return (
    <div className="pt-24 pb-20">
      {/* Hero banner */}
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-b-3xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="relative h-44 w-full bg-gradient-to-br from-primary via-primary-light to-primary-dark sm:h-52 md:h-64">
            {bannerImage ? (
              <>
                <Image
                  src={bannerImage}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1280px) 1280px, 100vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(196,162,101,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,240,232,0.1),transparent_50%)]" />
              </>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              Exhibits
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {exhibits.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center">
            <div className="rounded-2xl bg-sage p-12 max-w-lg w-full">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                  />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-semibold text-primary-dark sm:text-3xl">
                No Exhibits Yet
              </h2>
              <p className="mt-4 text-lg text-text-secondary">
                Check back soon for upcoming shows.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-12 divide-y divide-sage">
            {exhibits.map((exhibit) => (
              <Link
                key={exhibit.id}
                href={`/exhibits/${exhibit.slug}`}
                className="group block py-8 first:pt-0"
              >
                {exhibit.cover_image && (
                  <div className="relative mb-8 aspect-[4/3] overflow-hidden rounded-2xl">
                    <Image
                      src={exhibit.cover_image}
                      alt={exhibit.title}
                      fill
                      sizes="(min-width: 768px) 768px, 100vw"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <h2 className="font-display text-xl font-bold text-primary-dark transition-colors group-hover:text-primary">
                  {exhibit.title}
                </h2>
                {exhibit.event_dates && (
                  <p className="mt-1 text-sm font-medium uppercase tracking-[0.1em] text-gold-dark">
                    {exhibit.event_dates}
                  </p>
                )}
                {exhibit.content && (
                  <p className="mt-3 text-base text-text-secondary whitespace-pre-line">
                    {exhibit.content}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

