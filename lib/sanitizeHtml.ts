import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "blockquote",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "figure",
  "figcaption",
  "span",
  "div",
];

const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "width",
  "height",
  "class",
  "style",
  "data-align",
  "data-keep-ratio",
  "data-text-align",
];

const STYLE_ALLOWED_PROPS = new Set([
  "color",
  "background-color",
  "text-align",
  "float",
  "width",
  "height",
  "max-width",
  "margin",
  "margin-left",
  "margin-right",
  "margin-top",
  "margin-bottom",
  "font-weight",
  "font-style",
  "text-decoration",
]);

function filterStyleAttribute(value: string): string {
  return value
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .filter((decl) => {
      const [prop] = decl.split(":");
      if (!prop) return false;
      const normalized = prop.trim().toLowerCase();
      if (!STYLE_ALLOWED_PROPS.has(normalized)) return false;
      const rest = decl.slice(prop.length + 1);
      if (/url\s*\(|expression\s*\(|@import|javascript:/i.test(rest)) return false;
      return true;
    })
    .join("; ");
}

DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
  if (data.attrName === "style") {
    const cleaned = filterStyleAttribute(data.attrValue ?? "");
    if (!cleaned) {
      data.keepAttr = false;
    } else {
      data.attrValue = cleaned;
    }
  }
});

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    const href = node.getAttribute("href") ?? "";
    if (/^javascript:/i.test(href)) node.removeAttribute("href");
    node.setAttribute("rel", "noopener noreferrer");
    if (!node.getAttribute("target")) node.setAttribute("target", "_blank");
  }
  if (node.tagName === "IMG") {
    const src = node.getAttribute("src") ?? "";
    if (/^javascript:/i.test(src)) node.removeAttribute("src");
  }
});

/** Sanitize user-supplied HTML for safe rendering on the public site. */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|\/|#):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
  });
}
