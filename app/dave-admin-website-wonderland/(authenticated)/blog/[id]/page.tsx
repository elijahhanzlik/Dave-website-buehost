"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Save, Settings2, AlertTriangle } from "lucide-react";
import { slugify } from "@/lib/formatters";
import ImageUploader from "@/components/ImageUploader";
import BlogEditor from "@/components/admin/BlogEditor";

interface LegacyContentBlock {
  type: "text" | "image" | "gallery" | "hero";
  data: Record<string, unknown>;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  content_blocks: LegacyContentBlock[] | null;
  cover_image: string | null;
  status: "draft" | "published";
  published_at: string | null;
}

export default function EditBlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [coverImage, setCoverImage] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = useState("");
  const [content, setContent] = useState("");
  const [showMeta, setShowMeta] = useState(false);
  const [hadLegacyBlocks, setHadLegacyBlocks] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: BlogPost) => {
        setPost(data);
        setTitle(data.title);
        setSlug(data.slug);
        setCoverImage(data.cover_image ? [data.cover_image] : []);
        setStatus(data.status);
        setPublishedAt(
          data.published_at
            ? new Date(data.published_at).toISOString().slice(0, 16)
            : "",
        );

        const hasHtml =
          typeof data.content === "string" &&
          /<\/?[a-z][\s\S]*>/i.test(data.content);
        const hasBlocks =
          Array.isArray(data.content_blocks) && data.content_blocks.length > 0;

        if (hasHtml) {
          setContent(data.content as string);
        } else if (hasBlocks) {
          setHadLegacyBlocks(true);
          setContent(blocksToHtml(data.content_blocks!));
        } else if (typeof data.content === "string" && data.content) {
          // Plain/markdown — wrap in paragraphs per blank-line split.
          setContent(plainToHtml(data.content));
        } else {
          setContent("");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (slug === slugify(post?.title ?? "")) {
      setSlug(slugify(val));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/blog/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content,
          // Once saved in HTML mode, blank out the legacy blocks so the
          // public page picks up the new HTML path.
          content_blocks: [],
          cover_image: coverImage[0] || "",
          status,
          published_at:
            status === "published"
              ? publishedAt
                ? new Date(publishedAt).toISOString()
                : new Date().toISOString()
              : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.toString() ?? "Failed to save");
      }

      setSaved(true);
      setHadLegacyBlocks(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const showLegacyBanner = useMemo(
    () => hadLegacyBlocks && !bannerDismissed,
    [hadLegacyBlocks, bannerDismissed],
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-12 text-center text-red-500">Post not found</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="sticky top-0 z-20 -mx-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-6 py-3 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              router.push("/dave-admin-website-wonderland/blog")
            }
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => setShowMeta(!showMeta)}
            className={`inline-flex items-center gap-1 text-sm ${
              showMeta ? "text-primary" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Settings2 size={14} />
            Post Settings
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {saved ? "Saved!" : "Save"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showLegacyBanner && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">This post uses the old block format.</p>
            <p className="mt-1 text-amber-800">
              Text has been preserved and converted to the new rich-text
              editor. Image, gallery, and hero blocks were dropped and must be
              re-inserted using the Insert Image tool. Saving will permanently
              migrate this post to the new format.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metadata */}
      {showMeta && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-post-slug"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Slug
              </label>
              <input
                id="edit-post-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-end gap-4">
              <div>
                <label
                  htmlFor="edit-post-status"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Status
                </label>
                <select
                  id="edit-post-status"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "draft" | "published")
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              {status === "published" && (
                <div>
                  <label
                    htmlFor="edit-post-publish-at"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Publish Date
                  </label>
                  <input
                    id="edit-post-publish-at"
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Cover Image
            </span>
            <ImageUploader
              images={coverImage}
              onChange={setCoverImage}
              multiple={false}
            />
          </div>
        </div>
      )}

      {/* Title — editable inline */}
      <div className="mx-auto w-full max-w-4xl">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Post title..."
          className="mb-4 w-full border-none bg-transparent font-display text-4xl font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none"
        />

        <BlogEditor value={content} onChange={setContent} />
      </div>
    </div>
  );
}

/* ---------- legacy block → HTML conversion (one-way, lossy for images) ---------- */

function blocksToHtml(blocks: LegacyContentBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    if (block.type !== "text") continue;
    const raw = (block.data.content as string) ?? "";
    if (!raw.trim()) continue;
    const fontSize = (block.data.fontSize as string) ?? "body";
    const fw = (block.data.fontWeight as string) === "bold" ? "bold" : "";
    const color = (block.data.color as string) ?? "";
    const styleAttr = [
      fw && `font-weight: ${fw}`,
      color && `color: ${color}`,
    ]
      .filter(Boolean)
      .join("; ");
    const style = styleAttr ? ` style="${styleAttr}"` : "";

    if (fontSize === "title") {
      parts.push(`<h2${style}>${escapeHtml(raw)}</h2>`);
    } else if (fontSize === "subtitle") {
      parts.push(`<h3${style}>${escapeHtml(raw)}</h3>`);
    } else {
      // Split on blank lines → paragraphs; preserve single newlines as <br>.
      const paragraphs = raw.split(/\n{2,}/);
      for (const p of paragraphs) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        const withBreaks = escapeHtml(trimmed).replace(/\n/g, "<br>");
        parts.push(`<p${style}>${withBreaks}</p>`);
      }
    }
  }
  return parts.join("");
}

function plainToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
