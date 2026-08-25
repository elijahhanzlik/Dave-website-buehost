import type { Metadata } from "next";
import Link from "next/link";
import InlineLinks from "@/components/InlineLinks";
import { formatDateRange } from "@/lib/formatters";
import { getPublishedEvents } from "@/lib/supabase/public";

// Prerender + ISR (5 min) instead of a per-request dynamic DB read.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Events & Services — David Schaldach",
  description: "Upcoming events and services offered by David Schaldach.",
};

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="h-44 w-full bg-gradient-to-br from-primary via-primary-light to-primary-dark sm:h-52 md:h-64">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(196,162,101,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,240,232,0.1),transparent_50%)]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="px-4 text-center font-display text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              Events &amp; Services
            </h1>
          </div>
        </div>

        {events.length === 0 ? (
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
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-semibold text-primary-dark sm:text-3xl">
                Nothing Scheduled Yet
              </h2>
              <p className="mt-4 text-lg text-text-secondary">
                Check back soon for upcoming events and services.
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-12 divide-y divide-sage">
            {events.map((event) => (
              <li key={event.id}>
                {/* Deliberately not one big <Link>: the summary may carry its
                    own inline link, and an anchor inside an anchor is invalid. */}
                <div className="group py-8 first:pt-0">
                  <Link href={`/events/${event.slug}`} className="block">
                    <h2 className="font-display text-2xl font-semibold text-primary-dark transition-colors group-hover:text-primary">
                      {event.title}
                    </h2>
                    {formatDateRange(event.start_date, event.end_date) && (
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-gold-dark">
                        {formatDateRange(event.start_date, event.end_date)}
                      </p>
                    )}
                  </Link>
                  {event.content && (
                    <p className="mt-3 break-words text-base leading-relaxed text-text-secondary">
                      <InlineLinks text={event.content} />
                    </p>
                  )}
                  <Link
                    href={`/events/${event.slug}`}
                    className="mt-4 inline-block text-sm font-medium text-gold-dark transition-colors group-hover:text-gold"
                  >
                    View details &rarr;
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
