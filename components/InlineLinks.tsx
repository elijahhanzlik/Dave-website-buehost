import { Fragment } from "react";

/**
 * Renders a plain-text field that may contain simple inline links.
 *
 * Content fields (events, exhibits) are plain text everywhere else on the
 * site, so we deliberately do NOT parse arbitrary HTML out of the database.
 * Exactly one construct is recognised:
 *
 *     <a href="https://example.com">label</a>
 *
 * Everything else — including any other tag an editor might paste — is
 * rendered as literal text by React's own escaping. Only http(s) URLs are
 * accepted, so `javascript:` and `data:` hrefs can never reach the DOM.
 *
 * Links open in the same tab (no `target`), which is what the Events page
 * asks for.
 */
// Built fresh per call: a shared /g regex carries `lastIndex` between
// renders, so two events on one page would parse inconsistently.
const anchorRe = () => /<a\s+href="(https?:\/\/[^"\s]+)"\s*>([\s\S]*?)<\/a>/gi;

export default function InlineLinks({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  const re = anchorRe();
  while ((match = re.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push(<Fragment key={`t${cursor}`}>{text.slice(cursor, match.index)}</Fragment>);
    }
    parts.push(
      <a
        key={`a${match.index}`}
        href={match[1]}
        className="text-gold-dark underline underline-offset-2 transition-colors hover:text-gold"
      >
        {match[2]}
      </a>,
    );
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    parts.push(<Fragment key={`t${cursor}`}>{text.slice(cursor)}</Fragment>);
  }

  return <>{parts}</>;
}

/** The same text with links flattened to their label — for previews and clamps. */
export function stripInlineLinks(text: string): string {
  return text.replace(anchorRe(), "$2");
}
