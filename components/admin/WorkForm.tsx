"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Italic, Loader2, Star } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import ImageCropEditor, { DEFAULT_CROP } from "@/components/admin/ImageCropEditor";
import type { CropSettings } from "@/components/admin/ImageCropEditor";
import RichTitle, { stripRichTitle } from "@/components/RichTitle";
import {
  ActionButton,
  Button,
  Card,
  Field,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

interface WorkFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    images: string[];
    image_crops?: Record<string, CropSettings>;
    category: string | null;
    is_featured: boolean;
    sort_order: number;
  };
}

export default function WorkForm({ initialData }: WorkFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const [imageCrops, setImageCrops] = useState<Record<string, CropSettings>>(
    initialData?.image_crops ?? {},
  );
  const [isFeatured, setIsFeatured] = useState(
    initialData?.is_featured ?? false,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingCropIndex, setEditingCropIndex] = useState<number | null>(null);

  /* ---- italics in the title ------------------------------------------- */
  // The title is a plain <input>, so the italic run is stored as an <em>
  // marker in the text and the caret positions come from the input itself.
  const titleRef = useRef<HTMLInputElement>(null);
  const [sel, setSel] = useState({ start: 0, end: 0 });

  const trackSelection = () => {
    const el = titleRef.current;
    if (!el) return;
    setSel({ start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 });
  };

  const hasSelection = sel.end > sel.start;

  const toggleItalic = () => {
    const el = titleRef.current;
    if (!el || !hasSelection) return;

    const before = title.slice(0, sel.start);
    const middle = title.slice(sel.start, sel.end);
    const after = title.slice(sel.end);

    let next: string;
    let caret: [number, number];

    if (before.endsWith("<em>") && after.startsWith("</em>")) {
      // Already italic — pressing again takes it back off.
      next = before.slice(0, -4) + middle + after.slice(5);
      caret = [sel.start - 4, sel.end - 4];
    } else {
      next = `${before}<em>${middle}</em>${after}`;
      caret = [sel.start + 4, sel.end + 4];
    }

    setTitle(next);
    // Restore the highlight after React re-renders, so the button can be
    // pressed twice in a row without re-selecting the words.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret[0], caret[1]);
      setSel({ start: caret[0], end: caret[1] });
    });
  };
  /* --------------------------------------------------------------------- */

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
    // Initialize crop for new images
    const updatedCrops = { ...imageCrops };
    for (const img of newImages) {
      if (!updatedCrops[img]) {
        updatedCrops[img] = { ...DEFAULT_CROP };
      }
    }
    setImageCrops(updatedCrops);
  };

  const updateCrop = (imageUrl: string, crop: CropSettings) => {
    setImageCrops((prev) => ({ ...prev, [imageUrl]: crop }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title,
      description: description || undefined,
      images,
      image_crops: imageCrops,
      category: category || undefined,
      is_featured: isFeatured,
    };

    try {
      const url = isEditing
        ? `/api/artworks/${initialData.id}`
        : "/api/artworks";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.toString() ?? "Failed to save");
      }

      router.push(`${ADMIN_BASE}/works`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Card className="mb-6 border-admin-danger/30 bg-admin-danger/5 px-5 py-4">
          <p className="text-[15px] font-semibold text-admin-danger">
            That did not save.
          </p>
          <p className="mt-1 text-sm text-admin-muted">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        {/* -------------------------------------------------- photos ---- */}
        <Card className="h-fit p-6">
          <p className="text-[15px] font-semibold text-admin-ink">Photos</p>
          <p className="mb-3 mt-1 text-[13px] leading-snug text-admin-muted">
            The first one is what people see in the Gallery grid.
          </p>

          <ImageUploader images={images} onChange={handleImagesChange} multiple />

          {images.length > 0 && (
            <div className="mt-6">
              <p className="text-[15px] font-semibold text-admin-ink">
                How each photo is framed
              </p>
              <p className="mb-3 mt-1 text-[13px] leading-snug text-admin-muted">
                Pick a photo to move the picture around inside its frame.
                Nothing is cut off your original file.
              </p>

              <div className="flex flex-wrap gap-2.5">
                {images.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() =>
                      setEditingCropIndex(editingCropIndex === i ? null : i)
                    }
                    aria-pressed={editingCropIndex === i}
                    className={`relative h-20 w-20 overflow-hidden rounded-[14px] border-2 transition-colors ${
                      editingCropIndex === i
                        ? "border-primary"
                        : "border-admin-line hover:border-primary/50"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Photo ${i + 1}`}
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: imageCrops[img]
                          ? `${imageCrops[img].x}% ${imageCrops[img].y}%`
                          : "center",
                      }}
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-admin-ink/60 py-0.5 text-center text-[10px] font-semibold text-cream">
                      {editingCropIndex === i ? "Editing" : `Photo ${i + 1}`}
                    </span>
                  </button>
                ))}
              </div>

              {editingCropIndex !== null && images[editingCropIndex] && (
                <div className="mt-4 rounded-[16px] border border-admin-line bg-sage/50 p-4">
                  <ImageCropEditor
                    imageUrl={images[editingCropIndex]}
                    crop={imageCrops[images[editingCropIndex]] ?? DEFAULT_CROP}
                    onChange={(crop) =>
                      updateCrop(images[editingCropIndex], crop)
                    }
                    aspectRatio={4 / 3}
                    label={`Framing photo ${editingCropIndex + 1}`}
                  />
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ------------------------------------------------- details ---- */}
        <Card className="p-7">
          <Field
            label="Title"
            hint="The name shown under the picture. Highlight a word and press Italic to slant it."
            htmlFor="work-title"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <input
                id="work-title"
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  trackSelection();
                }}
                onSelect={trackSelection}
                onKeyUp={trackSelection}
                onClick={trackSelection}
                required
                className={inputClass}
              />
              <Button
                variant="secondary"
                onClick={toggleItalic}
                disabled={!hasSelection}
                aria-label="Italicise the highlighted words"
                title={
                  hasSelection
                    ? "Italicise the highlighted words"
                    : "Highlight some words in the title first"
                }
                className="sm:min-h-[56px]"
              >
                <Italic size={17} />
                Italic
              </Button>
            </div>
            {title.includes("<em>") && (
              <p className="mt-2 text-[13px] text-admin-muted">
                Visitors will see: <RichTitle text={title} />
              </p>
            )}
          </Field>

          <Field
            label="Description"
            hint="Visitors read this after clicking the piece."
            htmlFor="work-description"
          >
            <textarea
              id="work-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={textareaClass}
            />
          </Field>

          <Field
            label="Category"
            hint="Becomes a filter button at the top of the Gallery page — for example Assemblage or Mosaic."
            htmlFor="work-category"
          >
            <input
              id="work-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Assemblage, Mosaic, Linocut Print"
              className={inputClass}
            />
          </Field>

          <label
            htmlFor="featured"
            className="flex cursor-pointer items-center gap-3.5 rounded-[16px] bg-sage p-5"
          >
            <Star size={22} className="shrink-0 text-gold-dark" />
            <span className="flex-1">
              <span className="block text-[15.5px] font-bold text-admin-ink">
                Also show this on my homepage
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-admin-muted">
                It joins the strip of featured work on your front page.
              </span>
            </span>
            <input
              id="featured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-6 w-6 shrink-0 accent-[#2D5016]"
            />
          </label>

          {(title || images.length > 0) && (
            <div className="mt-6 rounded-[16px] border border-admin-line bg-cream p-5">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold-dark">
                What visitors will see
              </p>
              {images.length > 0 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[0]}
                  alt={stripRichTitle(title)}
                  className="mt-3 max-h-48 w-full rounded-[14px] object-cover"
                  style={{
                    objectPosition: imageCrops[images[0]]
                      ? `${imageCrops[images[0]].x}% ${imageCrops[images[0]].y}%`
                      : "center",
                  }}
                />
              )}
              <h3 className="mt-3 font-display text-[20px] font-bold text-admin-ink">
                <RichTitle text={title} />
              </h3>
              {category && (
                <p className="mt-1 text-sm text-admin-muted">{category}</p>
              )}
              {description && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-admin-muted">
                  {description}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start">
        <ActionButton
          type="submit"
          disabled={saving}
          label={
            saving
              ? "Saving…"
              : isEditing
                ? "Save this piece"
                : "Add it to my Gallery"
          }
          hint={
            isEditing
              ? "Your changes go live on the Gallery page straight away."
              : "It appears on your Gallery page straight away."
          }
          icon={saving ? <Loader2 size={18} className="animate-spin" /> : undefined}
        />
        <ActionButton
          variant="secondary"
          size="lg"
          label="Cancel"
          hint="Goes back without saving anything."
          onClick={() => router.push(`${ADMIN_BASE}/works`)}
        />
      </div>
    </form>
  );
}
