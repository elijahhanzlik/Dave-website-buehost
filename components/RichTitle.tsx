import { Fragment } from "react";

/**
 * Renders a title that may contain italicised words.
 *
 * Titles are stored with `<em>` markers around the italic run — a species name,
 * a boat, a quoted phrase. Nothing else is interpreted: the string is never
 * handed to `dangerouslySetInnerHTML`, so any other markup a title picks up
 * shows as literal text rather than becoming DOM.
 *
 * Built fresh per call — a shared /g regex carries `lastIndex` between renders,
 * so two titles on one page would parse inconsistently.
 */
const emRe = () => /<em>([\s\S]*?)<\/em>/gi;

export default function RichTitle({ text }: { text: string }) {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  const re = emRe();

  while ((match = re.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push(
        <Fragment key={`t${cursor}`}>{text.slice(cursor, match.index)}</Fragment>,
      );
    }
    parts.push(<em key={`e${match.index}`}>{match[1]}</em>);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    parts.push(<Fragment key={`t${cursor}`}>{text.slice(cursor)}</Fragment>);
  }
  // No markers at all is the common case — return the string untouched.
  return <>{parts.length ? parts : text}</>;
}

/**
 * The same title as plain text, for places that cannot hold markup:
 * `alt` attributes, `<title>` metadata, and Open Graph tags.
 */
export function stripRichTitle(text: string): string {
  return (text ?? "").replace(emRe(), "$1");
}

/** True when the title carries at least one italic run. */
export function hasItalics(text: string): boolean {
  return emRe().test(text ?? "");
}
