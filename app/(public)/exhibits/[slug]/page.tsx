import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import type { Metadata } from "next";

interface ContentBlock {
  type: "text" | "image" | "gallery" | "hero";
  data: Record<string, unknown>;
}

interface Exhibit {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  content_blocks: ContentBlock[] | null;
  cover_image: string | null;
  start_date: string | null;
  end_date: string | null;
  venue: string | null;
  link: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  const fmt = (d: string) => {
    const parts = d.split("-");
    if (parts.length !== 3) return formatDate(d);
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    return new Date(year, month, day).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return fmt(start ?? (end as string));
}

async function getExhibit(slug: string): Promise<Exhibit | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("exhibits")
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

type ImagePosition = { x: "left" | "center" | "right"; y: "top" | "middle" | "bottom" };

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text": {
      const content = (block.data.content as string) ?? "";
      if (!content.trim()) return null;
      const fs = (block.data.fontSize as string) ?? "body";
      const fw = (block.data.fontWeight as string) ?? "normal";
      const clr = block.data.color as string;

      if (fs === "title") {
        return (
          <h2
            className="mt-10 mb-4 font-display text-3xl text-primary-dark"
            style={{ fontWeight: fw === "bold" ? "bold" : 600, color: clr || undefined }}
          >
            {content}
          </h2>
        );
      }
      if (fs === "subtitle") {
        return (
          <h3
            className="mt-8 mb-3 font-display text-xl text-primary-dark"
            style={{ fontWeight: fw === "bold" ? "bold" : 500, color: clr || undefined }}
          >
            {content}
          </h3>
        );
      }
      const sizeClass = fs === "small" ? "text-sm" : "text-lg";
      return (
        <div
          className={`mb-6 leading-relaxed text-text-secondary whitespace-pre-wrap ${sizeClass}`}
          style={{ fontWeight: fw === "bold" ? "bold" : "normal", color: clr || undefined }}
        >
          {content}
        </div>
      );
    }
    case "image": {
      const url = block.data.url as string;
      const caption = block.data.caption as string;
      const pos: ImagePosition = (block.data.position as ImagePosition) ?? {
        x: "center",
        y: "middle",
      };

      if (!url) return null;

      let figureClass: string;
      if (pos.x === "left") {
        figureClass = "float-left mr-8 mb-4 max-w-[50%]";
      } else if (pos.x === "right") {
        figureClass = "float-right ml-8 mb-4 max-w-[50%]";
      } else {
        figureClass = "my-8 mx-auto max-w-[80%]";
      }

      return (
        <figure className={figureClass}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={caption ?? ""} className="w-full rounded-2xl" />
          {caption && (
            <figcaption className="mt-2 text-center text-sm text-text-muted">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case "gallery": {
      const images = (block.data.images as string[]) ?? [];
      if (images.length === 0) return null;
      return (
        <div className="my-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Gallery image ${i + 1}`}
              className="aspect-square w-full rounded-xl object-cover"
            />
          ))}
        </div>
      );
    }
    case "hero": {
      const url = block.data.url as string;
      const overlayText = block.data.overlay_text as string;
      return (
        <div className="relative my-8 overflow-hidden rounded-2xl">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-64 w-full object-cover sm:h-80 md:h-96" />
          ) : (
            <div className="h-64 w-full bg-gradient-to-br from-primary via-primary-light to-primary-dark sm:h-80 md:h-96" />
          )}
          {overlayText && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl md:text-5xl">
                {overlayText}
              </h2>
            </div>
          )}
        </div>
      );
    }
    default:
      return null;
  }
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

  const blocks = Array.isArray(exhibit.content_blocks) ? exhibit.content_blocks : [];

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

        {exhibit.cover_image && (
          <div className="mt-8 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={exhibit.cover_image}
              alt={exhibit.title}
              className="w-full object-cover"
            />
          </div>
        )}

        <header className="mt-8">
          {(() => {
            const range = formatDateRange(exhibit.start_date, exhibit.end_date);
            const label =
              range ??
              (exhibit.published_at ? formatDate(exhibit.published_at) : null);
            return label ? (
              <p className="text-sm font-medium uppercase tracking-[0.1em] text-text-muted">
                {label}
              </p>
            ) : null;
          })()}
          <h1 className="mt-3 font-display text-3xl font-bold text-primary-dark sm:text-4xl md:text-5xl">
            {exhibit.title}
          </h1>
          {exhibit.venue && (
            <p className="mt-3 font-display text-lg italic text-text-secondary">
              {exhibit.venue}
            </p>
          )}
          {exhibit.link && (
            <a
              href={exhibit.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold-dark underline underline-offset-4 transition-colors hover:text-gold"
            >
              Visit exhibit page &rarr;
            </a>
          )}
        </header>

        <div className="mt-10 border-t border-sage pt-10">
          {blocks.length > 0 ? (
            blocks.map((block, i) => <BlockRenderer key={i} block={block} />)
          ) : (
            <p className="text-text-muted">No content available.</p>
          )}
          <div style={{ clear: "both" }} />
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
