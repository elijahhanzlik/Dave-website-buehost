import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { mapsUrl } from "@/lib/formatters";

interface Exhibit {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  event_dates: string | null;
  event_time: string | null;
  address: string | null;
  cover_image: string | null;
}

async function getExhibit(slug: string): Promise<Exhibit | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("exhibits")
      // select * so the new event columns are optional — the page still renders
      // (text fallback) even before the 002 migration adds those columns.
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exhibit = await getExhibit(slug);

  return {
    title: exhibit
      ? `${exhibit.title} — David Schaldach`
      : "Exhibit — David Schaldach",
  };
}

export default async function ExhibitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exhibit = await getExhibit(slug);

  if (!exhibit) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-24">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-primary-dark">
            Exhibit Not Found
          </h1>
          <p className="mt-4 text-text-secondary">
            The exhibit you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/exhibits"
            className="mt-6 inline-flex items-center gap-2 text-gold-dark hover:text-gold"
          >
            <ArrowLeft size={16} />
            Back to Exhibits
          </Link>
        </div>
      </div>
    );
  }

  const hasEventDetails =
    !!exhibit.event_dates || !!exhibit.event_time || !!exhibit.address;

  // Split "Street · City, ST ZIP" into two display lines when possible.
  const [addressStreet, ...addressRest] = (exhibit.address ?? "")
    .split("·")
    .map((s) => s.trim());
  const addressCity = addressRest.join(", ");

  // --- Rich layout: feature image hero + event details (matches mockup) ---
  if (exhibit.cover_image) {
    return (
      <div className="pb-20 pt-16">
        {/* Full-bleed hero image with title overlay */}
        <div className="relative h-[46vh] min-h-[320px] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={exhibit.cover_image}
            alt={exhibit.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="mx-auto w-full max-w-5xl px-6 pb-8 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                New Exhibit
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl md:text-6xl">
                {exhibit.title}
              </h1>
            </div>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-6 lg:px-8">
          {/* Event details card */}
          {hasEventDetails && (
            <div className="mt-10 rounded-3xl bg-sage px-6 py-10 text-center sm:px-10">
              {(exhibit.event_dates || exhibit.event_time) && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                    Dates
                  </p>
                  {exhibit.event_dates && (
                    <p className="mt-2 font-display text-2xl font-bold text-primary-dark sm:text-3xl">
                      {exhibit.event_dates}
                    </p>
                  )}
                  {exhibit.event_time && (
                    <p className="mt-1 text-sm uppercase tracking-wide text-text-secondary">
                      {exhibit.event_time}
                    </p>
                  )}
                </>
              )}

              {exhibit.address && (
                <>
                  {(exhibit.event_dates || exhibit.event_time) && (
                    <div className="mx-auto my-7 h-px w-16 bg-primary/20" />
                  )}
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                    Location
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold text-primary-dark sm:text-3xl">
                    {addressStreet}
                  </p>
                  {addressCity && (
                    <p className="mt-1 text-base text-text-secondary">
                      {addressCity}
                    </p>
                  )}
                  <a
                    href={mapsUrl(exhibit.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary-dark"
                  >
                    <MapPin size={16} />
                    Get Directions
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </a>
                </>
              )}
            </div>
          )}

          {/* Optional description */}
          {exhibit.content && (
            <div className="mt-12">
              <p className="whitespace-pre-wrap text-lg leading-relaxed text-text-secondary">
                {exhibit.content}
              </p>
            </div>
          )}

          <div className="mt-16 border-t border-sage pt-8">
            <Link
              href="/exhibits"
              className="inline-flex items-center gap-2 text-sm font-medium text-gold-dark transition-colors hover:text-gold"
            >
              <ArrowLeft size={16} />
              Back to all exhibits
            </Link>
          </div>
        </article>
      </div>
    );
  }

  // --- Fallback layout: plain title + text (existing behavior) ---
  return (
    <div className="pt-24 pb-20">
      <article className="mx-auto max-w-3xl px-6 lg:px-8">
        <Link
          href="/exhibits"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to Exhibits
        </Link>

        <header className="mt-8">
          <h1 className="font-display text-3xl font-bold text-primary-dark sm:text-4xl md:text-5xl">
            {exhibit.title}
          </h1>
        </header>

        <div className="mt-10 border-t border-sage pt-10">
          {exhibit.content ? (
            <p className="whitespace-pre-wrap text-lg leading-relaxed text-text-secondary">
              {exhibit.content}
            </p>
          ) : (
            <p className="text-text-muted">No content available.</p>
          )}
        </div>

        <div className="mt-16 border-t border-sage pt-8">
          <Link
            href="/exhibits"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold-dark transition-colors hover:text-gold"
          >
            <ArrowLeft size={16} />
            Back to all exhibits
          </Link>
        </div>
      </article>
    </div>
  );
}
