"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import ImageCropEditor, { DEFAULT_CROP } from "@/components/admin/ImageCropEditor";
import type { CropSettings } from "@/components/admin/ImageCropEditor";

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

      router.push("/admin-panel/works");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
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
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., Photography, Digital Art"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Images
        </label>
        <ImageUploader images={images} onChange={handleImagesChange} multiple />
      </div>

      {/* Crop editor for each image */}
      {images.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Photo Crop & Position
          </p>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() =>
                  setEditingCropIndex(editingCropIndex === i ? null : i)
                }
                className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                  editingCropIndex === i
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <img
                  src={img}
                  alt={`Image ${i + 1}`}
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: imageCrops[img]
                      ? `${imageCrops[img].x}% ${imageCrops[img].y}%`
                      : "center",
                  }}
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                  {editingCropIndex === i ? "Editing" : `Photo ${i + 1}`}
                </span>
              </button>
            ))}
          </div>

          {editingCropIndex !== null && images[editingCropIndex] && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <ImageCropEditor
                imageUrl={images[editingCropIndex]}
                crop={imageCrops[images[editingCropIndex]] ?? DEFAULT_CROP}
                onChange={(crop) => updateCrop(images[editingCropIndex], crop)}
                aspectRatio={4 / 3}
                label={`Crop Photo ${editingCropIndex + 1}`}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          id="featured"
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="featured" className="text-sm text-gray-700">
          Featured work
        </label>
      </div>

      {/* Preview */}
      {(title || images.length > 0) && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Preview
          </p>
          {images.length > 0 && (
            <img
              src={images[0]}
              alt={title}
              className="w-full max-h-48 object-cover rounded-lg mb-3"
              style={{
                objectPosition: imageCrops[images[0]]
                  ? `${imageCrops[images[0]].x}% ${imageCrops[images[0]].y}%`
                  : "center",
              }}
            />
          )}
          <h3 className="font-display font-semibold text-lg">{title}</h3>
          {category && (
            <p className="text-sm text-gray-500 mt-1">{category}</p>
          )}
          {description && (
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {isEditing ? "Update Work" : "Create Work"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin-panel/works")}
          className="px-5 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
