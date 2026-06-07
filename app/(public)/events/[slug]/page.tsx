import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import type { Metadata } from "next";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

async function getEvent(slug: string): Promise<EventItem | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("events")
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
          {event.published_at && (
            <p className="text-sm font-medium uppercase tracking-[0.1em] text-text-muted">
              {formatDate(event.published_at)}
            </p>
          )}
          <h1 className="mt-3 font-display text-3xl font-bold text-primary-dark sm:text-4xl md:text-5xl">
            {event.title}
          </h1>
        </header>

        <div className="mt-10 border-t border-sage pt-10">
          {event.content ? (
            <div className="whitespace-pre-wrap break-words text-lg leading-relaxed text-text-secondary">
              {event.content}
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
