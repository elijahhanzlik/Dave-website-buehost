"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { slugify } from "@/lib/formatters";
import ImageUploader from "@/components/ImageUploader";
import BlogEditor from "@/components/admin/BlogEditor";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [coverImage, setCoverImage] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(slugify(val));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          content,
          content_blocks: [],
          cover_image: coverImage[0] || "",
          status,
          published_at:
            status === "published"
              ? publishedAt || new Date().toISOString()
              : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.toString() ?? "Failed to save");
      }

      router.push("/dave-admin-website-wonderland/blog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          New Blog Post
        </h1>
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
          Create Post
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Metadata */}
      <div className="max-w-3xl space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="new-post-title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Title *
            </label>
            <input
              id="new-post-title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label
              htmlFor="new-post-slug"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Slug
            </label>
            <input
              id="new-post-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
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
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label
              htmlFor="new-post-status"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="new-post-status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "published")
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          {status === "published" && (
            <div>
              <label
                htmlFor="new-post-publish-at"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Publish Date
              </label>
              <input
                id="new-post-publish-at"
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-3xl">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500">
          Content
        </h2>
        <BlogEditor value={content} onChange={setContent} />
      </div>
    </div>
  );
}
