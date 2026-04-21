import Image from "next/image";
import parse, { domToReact, type DOMNode, type HTMLReactParserOptions } from "html-react-parser";
import { Element } from "html-react-parser";

type AnyBlock = { id?: string; type: string; data?: Record<string, unknown> };

const INLINE_TAGS = new Set(["b", "strong", "i", "em", "mark", "a", "br", "code"]);

function safeHref(href: unknown): string | undefined {
  if (typeof href !== "string") return undefined;
  const trimmed = href.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return undefined;
}

const inlineParseOptions: HTMLReactParserOptions = {
  replace: (node) => {
    if (!(node instanceof Element)) return undefined;
    const tag = node.name.toLowerCase();

    if (!INLINE_TAGS.has(tag)) {
      return <>{domToReact(node.children as DOMNode[], inlineParseOptions)}</>;
    }

    if (tag === "a") {
      const href = safeHref(node.attribs?.href);
      if (!href) return <>{domToReact(node.children as DOMNode[], inlineParseOptions)}</>;
      const external = /^https?:\/\//i.test(href);
      return (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {domToReact(node.children as DOMNode[], inlineParseOptions)}
        </a>
      );
    }

    return undefined;
  },
};

function renderInline(html: unknown): React.ReactNode {
  if (typeof html !== "string" || html === "") return null;
  return parse(html, inlineParseOptions);
}

function getString(data: Record<string, unknown> | undefined, key: string): string {
  const v = data?.[key];
  return typeof v === "string" ? v : "";
}

function HeaderBlock({ data }: { data: Record<string, unknown> }) {
  const text = getString(data, "text");
  const level = typeof data.level === "number" ? data.level : 2;
  const Tag = (`h${Math.min(Math.max(level, 1), 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6");
  return <Tag>{renderInline(text)}</Tag>;
}

function ParagraphBlock({ data }: { data: Record<string, unknown> }) {
  return <p>{renderInline(getString(data, "text"))}</p>;
}

type ListItem = string | { content?: string; items?: ListItem[] };

function renderListItems(items: unknown): React.ReactNode {
  if (!Array.isArray(items)) return null;
  return items.map((item: ListItem, i) => {
    if (typeof item === "string") {
      return <li key={i}>{renderInline(item)}</li>;
    }
    if (item && typeof item === "object") {
      const nested = Array.isArray(item.items) && item.items.length > 0;
      return (
        <li key={i}>
          {renderInline(item.content ?? "")}
          {nested && <ul>{renderListItems(item.items)}</ul>}
        </li>
      );
    }
    return null;
  });
}

function ListBlock({ data }: { data: Record<string, unknown> }) {
  const ordered = data.style === "ordered";
  const Tag = ordered ? "ol" : "ul";
  return <Tag>{renderListItems(data.items)}</Tag>;
}

function ImageBlock({ data }: { data: Record<string, unknown> }) {
  const file = data.file as { url?: unknown } | undefined;
  const url = typeof file?.url === "string" ? file.url : "";
  if (!url) return null;
  const caption = getString(data, "caption");
  const alt = caption || "";
  return (
    <figure className="my-8">
      <Image
        src={url}
        alt={alt}
        width={1600}
        height={900}
        className="w-full h-auto rounded-2xl object-cover"
        sizes="(max-width: 768px) 100vw, 768px"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-text-muted">
          {renderInline(caption)}
        </figcaption>
      )}
    </figure>
  );
}

function QuoteBlock({ data }: { data: Record<string, unknown> }) {
  const text = getString(data, "text");
  const caption = getString(data, "caption");
  return (
    <blockquote>
      <p>{renderInline(text)}</p>
      {caption && <cite className="block mt-2 not-italic text-sm text-text-muted">— {renderInline(caption)}</cite>}
    </blockquote>
  );
}

function LinkToolBlock({ data }: { data: Record<string, unknown> }) {
  const link = safeHref(data.link);
  const meta = (data.meta ?? {}) as Record<string, unknown>;
  const title = getString(meta, "title") || link || "";
  const description = getString(meta, "description");
  const image = (meta.image as { url?: unknown } | undefined)?.url;
  if (!link) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="not-prose my-6 flex gap-4 rounded-xl border border-sage bg-white/60 p-4 no-underline hover:bg-white"
    >
      {typeof image === "string" && image && (
        <img src={image} alt="" className="h-20 w-20 rounded-lg object-cover" />
      )}
      <div className="flex-1">
        <div className="font-display text-lg text-primary-dark">{title}</div>
        {description && <div className="mt-1 text-sm text-text-secondary">{description}</div>}
        <div className="mt-1 text-xs text-text-muted">{new URL(link).hostname}</div>
      </div>
    </a>
  );
}

function EmbedBlock({ data }: { data: Record<string, unknown> }) {
  const embed = safeHref(data.embed);
  if (!embed) return null;
  const caption = getString(data, "caption");
  return (
    <figure className="my-8">
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ paddingTop: "56.25%" }}>
        <iframe
          src={embed}
          title={caption || "Embedded content"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-text-muted">
          {renderInline(caption)}
        </figcaption>
      )}
    </figure>
  );
}

function ColumnsBlock({ data }: { data: Record<string, unknown> }) {
  const cols = data.cols;
  if (!Array.isArray(cols) || cols.length === 0) return null;
  const count = Math.min(cols.length, 4);
  const cls =
    count === 2
      ? "md:grid-cols-2"
      : count === 3
        ? "md:grid-cols-3"
        : count === 4
          ? "md:grid-cols-4"
          : "md:grid-cols-1";
  return (
    <div className={`my-8 grid grid-cols-1 gap-6 ${cls}`}>
      {cols.map((col, i) => {
        const blocks = Array.isArray((col as { blocks?: unknown }).blocks)
          ? ((col as { blocks: AnyBlock[] }).blocks)
          : [];
        return (
          <div key={i}>
            <EditorJsRenderer blocks={blocks} />
          </div>
        );
      })}
    </div>
  );
}

function RenderBlock({ block }: { block: AnyBlock }) {
  const data = block.data ?? {};
  switch (block.type) {
    case "header":
      return <HeaderBlock data={data} />;
    case "paragraph":
      return <ParagraphBlock data={data} />;
    case "list":
      return <ListBlock data={data} />;
    case "image":
      return <ImageBlock data={data} />;
    case "quote":
      return <QuoteBlock data={data} />;
    case "linkTool":
      return <LinkToolBlock data={data} />;
    case "embed":
      return <EmbedBlock data={data} />;
    case "columns":
      return <ColumnsBlock data={data} />;
    default:
      return null;
  }
}

export default function EditorJsRenderer({ blocks }: { blocks: AnyBlock[] | null | undefined }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  return (
    <>
      {blocks.map((block, i) => (
        <RenderBlock key={block.id ?? i} block={block} />
      ))}
    </>
  );
}
