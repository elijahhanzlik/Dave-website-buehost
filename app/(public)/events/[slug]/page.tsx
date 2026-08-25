import Link from "next/link";
import InlineLinks from "@/components/InlineLinks";
import { ArrowLeft } from "lucide-react";
import { formatDateRange } from "@/lib/formatters";
import type { Metadata } from "next";
import { getPublishedEvent, getPublishedEvents } from "@/lib/supabase/public";

// Prerender each published event at build time + ISR (5 min).
export const revalidate = 300;

interface EventItem {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

async function getEvent(slug: string): Promise<EventItem | null> {
  return getPublishedEvent(slug);
}

export async function generateStaticParams() {
  const events = await getPublishedEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);

  return {
    title: event
      ? `${event.title} — David Schaldach`
      : "Events & Services — David Schaldach",
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-24">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-primary-dark">
            Not Found
          </h1>
          <p className="mt-4 text-text-secondary">
            The event or service you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/events"
            className="mt-6 inline-flex items-center gap-2 text-gold-dark hover:text-gold"
          >
            <ArrowLeft size={16} />
            Back to Events &amp; Services
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <article className="mx-auto max-w-3xl px-6 lg:px-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to Events &amp; Services
        </Link>

        <header className="mt-8">
          <h1 className="font-display text-3xl font-bold text-primary-dark sm:text-4xl md:text-5xl">
            {event.title}
          </h1>
          {formatDateRange(event.start_date, event.end_date) && (
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.1em] text-gold-dark">
              {formatDateRange(event.start_date, event.end_date)}
            </p>
          )}
        </header>

        <div className="mt-10 border-t border-sage pt-10">
          {event.content ? (
            <div className="whitespace-pre-wrap break-words text-lg leading-relaxed text-text-secondary">
              <InlineLinks text={event.content} />
            </div>
          ) : (
            <p className="text-text-muted">No content available.</p>
          )}
        </div>

        <div className="mt-16 border-t border-sage pt-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold-dark transition-colors hover:text-gold"
          >
            <ArrowLeft size={16} />
            Back to all events &amp; services
          </Link>
        </div>
      </article>
    </div>
  );
}
