"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { slugify } from "@/lib/formatters";
import ImageUploader from "@/components/ImageUploader";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
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
  const [showPreview, setShowPreview] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = useState("");

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
        setContent(data.content ?? "");
        setCoverImage(data.cover_image ? [data.cover_image] : []);
        setStatus(data.status);
        setPublishedAt(
          data.published_at
            ? new Date(data.published_at).toISOString().slice(0, 16)
            : "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/blog/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content: content || undefined,
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

      router.push("/admin-panel/blog");
      router.refresh();
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
    return (
      <div className="text-center py-12 text-red-500">Post not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit Post
        </h1>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {showPreview ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-2xl">
          {coverImage[0] && (
            <img
              src={coverImage[0]}
              alt={title}
              className="w-full max-h-64 object-cover rounded-lg mb-4"
            />
          )}
          <h2 className="text-xl font-display font-bold mb-4">
            {title || "Untitled"}
          </h2>
          <div className="whitespace-pre-wrap text-sm text-gray-700">
            {content || "No content"}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image
            </label>
            <ImageUploader
              images={coverImage}
              onChange={setCoverImage}
              multiple={false}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content (Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "draft" | "published")
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {status === "published" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publish Date
                </label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Update Post
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin-panel/blog")}
              className="px-5 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
