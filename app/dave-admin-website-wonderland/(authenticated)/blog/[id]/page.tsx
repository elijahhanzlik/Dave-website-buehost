"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Save, Settings2 } from "lucide-react";
import type { OutputBlockData } from "@editorjs/editorjs";
import { formatApiError, isoToLocalDatetimeInput, slugify } from "@/lib/formatters";
import ImageUploader from "@/components/ImageUploader";
import BlogEditor, { type BlogEditorHandle } from "@/components/admin/BlogEditor";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  content_blocks: OutputBlockData[] | null;
  cover_image: string | null;
  status: "draft" | "published";
  published_at: string | null;
}

export default function EditBlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const editorRef = useRef<BlogEditorHandle>(null);
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
  const [initialBlocks, setInitialBlocks] = useState<OutputBlockData[]>([]);
  const [showMeta, setShowMeta] = useState(false);

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
          data.published_at ? isoToLocalDatetimeInput(data.published_at) : "",
        );
        setInitialBlocks(
          Array.isArray(data.content_blocks) ? data.content_blocks : [],
        );
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
      const blocks = (await editorRef.current?.save()) ?? [];
      const publishedIso = publishedAt
        ? new Date(publishedAt).toISOString()
        : null;
      const res = await fetch(`/api/blog/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content_blocks: blocks,
          cover_image: coverImage[0] || "",
          status,
          published_at:
            status === "published"
              ? publishedIso ?? new Date().toISOString()
              : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(formatApiError(data.error, "Failed to save"));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!post) {
    return <div className="text-center py-12 text-red-500">Post not found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 sticky top-0 z-20 bg-gray-50 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dave-admin-website-wonderland/blog")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => setShowMeta(!showMeta)}
            className={`inline-flex items-center gap-1 text-sm ${showMeta ? "text-primary" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Settings2 size={14} />
            Post Settings
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? "Saved!" : "Save"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
          {error}
        </div>
      )}

      {showMeta && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            {status === "published" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
            <ImageUploader images={coverImage} onChange={setCoverImage} multiple={false} />
          </div>
        </div>
      )}

      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm mx-auto"
        style={{ maxWidth: 1152 }}
      >
        <div className="px-8 sm:px-12 lg:px-16 py-10">
          {coverImage[0] && (
            <div className="mb-8 -mx-4 overflow-hidden rounded-2xl">
              <img src={coverImage[0]} alt={title} className="w-full max-h-80 object-cover" />
            </div>
          )}

          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title…"
            className="w-full font-display text-4xl font-bold text-gray-900 border-none outline-none placeholder:text-gray-300 bg-transparent mb-6"
          />

          <BlogEditor ref={editorRef} initialBlocks={initialBlocks} />
        </div>
      </div>
    </div>
  );
}
