"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import type { OutputBlockData } from "@editorjs/editorjs";
import {
  formatApiError,
  isoToLocalDatetimeInput,
  slugify,
} from "@/lib/formatters";
import ImageUploader from "@/components/ImageUploader";
import BlogEditor, { type BlogEditorHandle } from "@/components/admin/BlogEditor";
import StatusChoice from "@/components/admin/StatusChoice";
import {
  ActionButton,
  Card,
  Field,
  inputClass,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

export interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  content_blocks: OutputBlockData[] | null;
  cover_image: string | null;
  status: "draft" | "published";
  published_at: string | null;
}

/**
 * One editor for writing a new post and for editing an existing one. These
 * were two entirely different screens: the new-post form was a stack of small
 * labelled inputs, the edit screen was a full-bleed document with a hidden
 * settings drawer. Same job, so now the same screen.
 */
export default function BlogPostForm({
  initialData,
}: {
  initialData?: BlogPostData;
}) {
  const router = useRouter();
  const editorRef = useRef<BlogEditorHandle>(null);
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [coverImage, setCoverImage] = useState<string[]>(
    initialData?.cover_image ? [initialData.cover_image] : [],
  );
  const [status, setStatus] = useState<"draft" | "published">(
    initialData?.status ?? "draft",
  );
  const [publishedAt, setPublishedAt] = useState(
    initialData?.published_at
      ? isoToLocalDatetimeInput(initialData.published_at)
      : "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const initialBlocks = Array.isArray(initialData?.content_blocks)
    ? initialData.content_blocks
    : [];

  const handleSave = async () => {
    if (!title.trim()) {
      setError("A post needs a title before it can be saved.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      // `null` means Editor.js is still loading. Saving now would replace the
      // post's body with nothing, so refuse rather than destroy the writing.
      const blocks = await editorRef.current?.save();
      if (blocks == null) {
        throw new Error(
          "The editor is still loading. Give it a moment and press save again — nothing has been changed.",
        );
      }
      const publishedIso = publishedAt
        ? new Date(publishedAt).toISOString()
        : null;

      const res = await fetch(
        isEditing ? `/api/blog/${initialData.id}` : "/api/blog",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            slug: slugify(title),
            content_blocks: blocks,
            cover_image: coverImage[0] || "",
            status,
            published_at:
              status === "published"
                ? (publishedIso ?? new Date().toISOString())
                : null,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(formatApiError(data.error, "Failed to save"));
      }

      if (isEditing) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        router.refresh();
      } else {
        router.push(`${ADMIN_BASE}/blog`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {error && (
        <Card className="mb-6 border-admin-danger/30 bg-admin-danger/5 px-5 py-4">
          <p className="text-[15px] font-semibold text-admin-danger">
            That did not save.
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-admin-muted">
            {error}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {/* ------------------------------------------------- the post ---- */}
        <Card className="overflow-hidden">
          {coverImage[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage[0]}
              alt=""
              className="max-h-56 w-full object-cover"
            />
          ) : (
            <div className="flex h-32 items-center justify-center bg-sage text-sm text-admin-muted">
              No cover photo yet — add one on the right
            </div>
          )}

          <div className="p-7 sm:p-9">
            <label htmlFor="post-title" className="sr-only">
              Post title
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title…"
              className="mb-2 w-full border-none bg-transparent font-display text-[34px] font-bold text-admin-ink outline-none placeholder:text-admin-muted/45"
            />
            {title && (
              <p className="mb-7 font-mono text-[12.5px] text-admin-muted">
                Web address: /blog/{slugify(title)}
              </p>
            )}
            <BlogEditor ref={editorRef} initialBlocks={initialBlocks} />
          </div>
        </Card>

        {/* --------------------------------------------------- settings -- */}
        <Card className="h-fit p-7">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold-dark">
            About this post
          </p>
          <p className="mb-5 mt-1.5 text-[13px] leading-snug text-admin-muted">
            None of this appears in the writing itself.
          </p>

          <StatusChoice
            value={status}
            onChange={setStatus}
            publishedHint="It appears on your Blog page for everyone."
            draftHint="It stays off your Blog page until you change this."
          />

          <div className="mt-6">
            {status === "published" && (
              <Field
                label="Date shown on the post"
                hint="Leave it alone to use right now."
                htmlFor="post-published-at"
              >
                <input
                  id="post-published-at"
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className={inputClass}
                />
              </Field>
            )}

            <Field
              label="Cover photo"
              hint="Shown at the top of the post and beside it in the list."
            >
              <ImageUploader
                images={coverImage}
                onChange={setCoverImage}
                multiple={false}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start">
        <ActionButton
          onClick={handleSave}
          disabled={saving}
          label={
            saving
              ? "Saving…"
              : saved
                ? "Saved"
                : status === "published"
                  ? "Save and publish"
                  : "Save this draft"
          }
          hint={
            status === "published"
              ? isEditing
                ? "Everyone sees the new version straight away."
                : "It goes on your Blog page straight away."
              : "Kept as a draft — nothing appears on your website."
          }
          icon={
            saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : saved ? (
              <Check size={18} />
            ) : undefined
          }
        />
        <ActionButton
          variant="secondary"
          size="lg"
          label="Cancel"
          hint="Goes back without saving anything."
          onClick={() => router.push(`${ADMIN_BASE}/blog`)}
        />
      </div>
    </div>
  );
}
