import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDateRange } from "@/lib/formatters";
import type { Metadata } from "next";

interface Exhibit {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

async function getExhibit(slug: string): Promise<Exhibit | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("exhibits")
      .select("id, title, slug, content, status, start_date, end_date")
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
          {formatDateRange(exhibit.start_date, exhibit.end_date) && (
            <p className="text-sm font-medium uppercase tracking-[0.1em] text-text-muted">
              {formatDateRange(exhibit.start_date, exhibit.end_date)}
            </p>
          )}
          <h1 className="mt-3 font-display text-3xl font-bold text-primary-dark sm:text-4xl md:text-5xl">
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
