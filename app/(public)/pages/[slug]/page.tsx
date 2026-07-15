import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getPage, getPages } from "@/lib/supabase/public";
import { BLUR_DATA_URL } from "@/lib/image";

// Prerender each CMS page at build time + ISR (5 min).
export const revalidate = 300;

interface ContentBlock {
  type: "text" | "image" | "gallery" | "hero";
  data: Record<string, unknown>;
}

export async function generateStaticParams() {
  const pages = await getPages();
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  return {
    title: page
      ? `${page.title} — David Schaldach`
      : "Page Not Found — David Schaldach",
  };
}

function renderTextBlock(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let key = 0;

  function flushParagraph() {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ");
      if (text.trim()) {
        elements.push(
          <p key={key++} className="mb-6 text-lg leading-relaxed text-text-secondary">
            {text}
          </p>
        );
      }
      currentParagraph = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      elements.push(
        <h2 key={key++} className="mt-10 mb-4 font-display text-2xl font-semibold text-primary-dark">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      flushParagraph();
      elements.push(
        <h2 key={key++} className="mt-10 mb-4 font-display text-3xl font-bold text-primary-dark">
          {trimmed.slice(2)}
        </h2>
      );
    } else if (trimmed === "") {
      flushParagraph();
    } else {
      currentParagraph.push(trimmed);
    }
  }

  flushParagraph();
  return elements;
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

      let figureClass = "my-8";
      const imgClass = "rounded-2xl";

      if (pos.x === "left") {
        figureClass = "float-left mr-8 mb-4 max-w-[50%]";
      } else if (pos.x === "right") {
        figureClass = "float-right ml-8 mb-4 max-w-[50%]";
      } else {
        figureClass = "my-8 mx-auto max-w-[80%]";
      }

      return (
        <figure className={figureClass}>
          <Image
            src={url}
            alt={caption ?? ""}
            width={0}
            height={0}
            sizes="(min-width: 768px) 50vw, 100vw"
            className={`w-full ${imgClass}`}
          />
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
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
              <Image
                src={url}
                alt={`Gallery image ${i + 1}`}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      );
    }
    case "hero": {
      const url = block.data.url as string;
      const overlayText = block.data.overlay_text as string;
      return (
        <div className="relative my-8 h-64 overflow-hidden rounded-2xl sm:h-80 md:h-96">
          {url ? (
            <Image
              src={url}
              alt=""
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary via-primary-light to-primary-dark" />
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

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-24">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-primary-dark">
            Page Not Found
          </h1>
          <p className="mt-4 text-text-secondary">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-gold-dark hover:text-gold"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <article className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold text-primary-dark sm:text-5xl">
          {page.title}
        </h1>

        <div className="mt-10">
          {page.content_blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
          {/* Clear floats */}
          <div style={{ clear: "both" }} />
        </div>
      </article>
    </div>
  );
}
