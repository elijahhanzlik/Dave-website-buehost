import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with clsx — the standard cn() pattern. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Turn a human-readable string into a URL-safe slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Format a date string for display. */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

type AnyBlock = { type: string; data?: Record<string, unknown> };

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function collectBlockText(block: AnyBlock, out: string[]): void {
  const data = block.data ?? {};
  switch (block.type) {
    case "header":
    case "paragraph": {
      const t = data.text;
      if (typeof t === "string") out.push(stripTags(t));
      return;
    }
    case "quote": {
      const t = data.text;
      if (typeof t === "string") out.push(stripTags(t));
      return;
    }
    case "list": {
      const items = data.items;
      if (!Array.isArray(items)) return;
      for (const item of items) {
        if (typeof item === "string") {
          out.push(stripTags(item));
        } else if (item && typeof item === "object" && "content" in item) {
          const c = (item as { content?: unknown }).content;
          if (typeof c === "string") out.push(stripTags(c));
        }
      }
      return;
    }
    case "image":
    case "embed": {
      const c = data.caption;
      if (typeof c === "string") out.push(stripTags(c));
      return;
    }
    case "columns": {
      const cols = data.cols;
      if (!Array.isArray(cols)) return;
      for (const col of cols) {
        const blocks = (col as { blocks?: unknown }).blocks;
        if (Array.isArray(blocks)) {
          for (const b of blocks) collectBlockText(b as AnyBlock, out);
        }
      }
      return;
    }
  }
}

/**
 * Build a plain-text preview from an Editor.js blocks array, falling back
 * to a markdown string with formatting characters stripped. Used for blog
 * list cards and meta descriptions.
 */
export function blocksToPreview(
  blocks: unknown,
  fallbackMarkdown?: string | null,
  max = 160,
): string {
  const out: string[] = [];
  if (Array.isArray(blocks)) {
    for (const block of blocks) {
      if (block && typeof block === "object" && "type" in block) {
        collectBlockText(block as AnyBlock, out);
      }
      if (out.join(" ").length >= max) break;
    }
  }
  let text = out.join(" ").trim();
  if (!text && fallbackMarkdown) {
    text = fallbackMarkdown.replace(/[#*_>\-\[\]()]/g, "").trim();
  }
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}
