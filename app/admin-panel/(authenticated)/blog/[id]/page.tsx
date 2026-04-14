"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Type,
  Image as ImageIcon,
  LayoutGrid,
  Maximize2,
  Save,
  Bold,
  Palette,
} from "lucide-react";
import { slugify } from "@/lib/formatters";
import ImageUploader from "@/components/ImageUploader";
import ImagePositionPicker from "@/components/admin/ImagePositionPicker";
import type { ImagePosition } from "@/components/admin/ImagePositionPicker";

type BlockType = "text" | "image" | "gallery" | "hero";

interface ContentBlock {
  type: BlockType;
  data: Record<string, unknown>;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content_blocks: ContentBlock[];
  cover_image: string | null;
  status: "draft" | "published";
  published_at: string | null;
}

const blockTypeOptions: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "text", label: "Text", icon: <Type size={14} /> },
  { type: "image", label: "Image", icon: <ImageIcon size={14} /> },
  { type: "gallery", label: "Gallery", icon: <LayoutGrid size={14} /> },
  { type: "hero", label: "Hero", icon: <Maximize2 size={14} /> },
];

function emptyBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "text":
      return { content: "" };
    case "image":
      return { url: "", caption: "", position: { x: "center", y: "middle" } };
    case "gallery":
      return { images: [], columns: 3 };
    case "hero":
      return { url: "", overlay_text: "" };
  }
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
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

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
        // Support legacy posts that only have content (no blocks)
        if (data.content_blocks && data.content_blocks.length > 0) {
          setBlocks(data.content_blocks);
        } else if ((data as unknown as { content?: string }).content) {
          setBlocks([
            { type: "text", data: { content: (data as unknown as { content: string }).content } },
          ]);
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

  const addBlock = (type: BlockType) => {
    setBlocks([...blocks, { type, data: emptyBlockData(type) }]);
    setShowAddMenu(false);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlockData = useCallback(
    (index: number, data: Record<string, unknown>) => {
      setBlocks((prev) =>
        prev.map((b, i) => (i === index ? { ...b, data } : b)),
      );
    },
    [],
  );

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
          content_blocks: blocks,
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
    return (
      <div className="text-center py-12 text-red-500">Post not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {title || "Untitled Post"}
          </h1>
          <p className="text-sm text-gray-500 font-mono">/{slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Post metadata */}
      {!showPreview && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
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
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Block editor / preview */}
      <div className={showPreview ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}>
        {!showPreview && (
          <div className="max-w-2xl space-y-4">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Content Blocks
            </h2>
            {blocks.map((block, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {block.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveBlock(index, -1)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveBlock(index, 1)}
                      disabled={index === blocks.length - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => removeBlock(index)}
                      className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <BlockEditor
                  block={block}
                  onChange={(data) => updateBlockData(index, data)}
                />
              </div>
            ))}

            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Block
              </button>
              {showAddMenu && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {blockTypeOptions.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => addBlock(opt.type)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-left"
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showPreview && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Live Preview
            </p>
            {coverImage[0] && (
              <img
                src={coverImage[0]}
                alt={title}
                className="w-full max-h-64 object-cover rounded-lg"
              />
            )}
            <h2 className="font-display text-2xl font-bold text-primary-dark">
              {title || "Untitled"}
            </h2>
            {blocks.length === 0 ? (
              <p className="text-sm text-gray-400">No content blocks</p>
            ) : (
              blocks.map((block, i) => (
                <BlockPreview key={i} block={block} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
}: {
  block: ContentBlock;
  onChange: (data: Record<string, unknown>) => void;
}) {
  switch (block.type) {
    case "text": {
      const fontSize = (block.data.fontSize as string) ?? "body";
      const fontWeight = (block.data.fontWeight as string) ?? "normal";
      const color = (block.data.color as string) ?? "";
      const showColorPicker = (block.data._showColorPicker as boolean) ?? false;

      const FONT_SIZES = [
        { value: "title", label: "Title" },
        { value: "subtitle", label: "Subtitle" },
        { value: "body", label: "Body" },
        { value: "small", label: "Small" },
      ];

      const COLORS = [
        { value: "", label: "Default" },
        { value: "#2D5016", label: "Forest Green" },
        { value: "#1E3A0E", label: "Dark Green" },
        { value: "#C4A265", label: "Gold" },
        { value: "#4a4a4a", label: "Dark Gray" },
        { value: "#8B4513", label: "Brown" },
        { value: "#1a1a1a", label: "Black" },
        { value: "#ffffff", label: "White" },
      ];

      const textSizeClass =
        fontSize === "title" ? "text-2xl font-display" :
        fontSize === "subtitle" ? "text-lg" :
        fontSize === "small" ? "text-xs" : "text-sm";

      return (
        <div className="space-y-2">
          {/* Toolbar */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* Font size */}
            <select
              value={fontSize}
              onChange={(e) => onChange({ ...block.data, fontSize: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {FONT_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Bold toggle */}
            <button
              type="button"
              onClick={() => onChange({ ...block.data, fontWeight: fontWeight === "bold" ? "normal" : "bold" })}
              className={`p-1.5 rounded border text-xs ${fontWeight === "bold" ? "bg-primary text-white border-primary" : "border-gray-300 hover:bg-gray-50"}`}
            >
              <Bold size={14} />
            </button>

            {/* Color picker toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => onChange({ ...block.data, _showColorPicker: !showColorPicker })}
                className={`p-1.5 rounded border text-xs flex items-center gap-1 ${showColorPicker ? "bg-gray-100 border-gray-400" : "border-gray-300 hover:bg-gray-50"}`}
              >
                <Palette size={14} />
                {color && (
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                )}
              </button>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10 flex gap-1.5 flex-wrap w-48">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => onChange({ ...block.data, color: c.value, _showColorPicker: false })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c.value ? "border-primary ring-2 ring-primary/30" : "border-gray-200"}`}
                      style={{ backgroundColor: c.value || "#e5e7eb" }}
                    >
                      {c.value === "" && <span className="text-[10px] text-gray-500">A</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Text input */}
          <textarea
            value={(block.data.content as string) ?? ""}
            onChange={(e) => onChange({ ...block.data, content: e.target.value })}
            rows={fontSize === "title" ? 2 : fontSize === "subtitle" ? 3 : 4}
            placeholder={fontSize === "title" ? "Enter title..." : fontSize === "subtitle" ? "Enter subtitle..." : "Enter text or markdown..."}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 ${textSizeClass}`}
            style={{
              fontWeight: fontWeight === "bold" ? "bold" : "normal",
              color: color || undefined,
            }}
          />
        </div>
      );
    }
    case "image": {
      const imgPosition: ImagePosition = (block.data.position as ImagePosition) ?? {
        x: "center",
        y: "middle",
      };
      const imgSize = (block.data.size as string) ?? "large";
      const IMG_SIZES = [
        { value: "small", label: "Small (33%)" },
        { value: "medium", label: "Medium (50%)" },
        { value: "large", label: "Large (80%)" },
        { value: "full", label: "Full width" },
      ];
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500">Size</label>
            <select
              value={imgSize}
              onChange={(e) => onChange({ ...block.data, size: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {IMG_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <ImageUploader
            images={block.data.url ? [block.data.url as string] : []}
            onChange={(imgs) =>
              onChange({ ...block.data, url: imgs[0] ?? "" })
            }
            multiple={false}
          />
          {typeof block.data.url === "string" && block.data.url !== "" && (
            <ImagePositionPicker
              imageUrl={block.data.url as string}
              position={imgPosition}
              onChange={(pos) => onChange({ ...block.data, position: pos })}
            />
          )}
          <input
            type="text"
            value={(block.data.caption as string) ?? ""}
            onChange={(e) =>
              onChange({ ...block.data, caption: e.target.value })
            }
            placeholder="Caption (optional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      );
    }
    case "gallery": {
      const galleryImages = (block.data.images as string[]) ?? [];
      const columns = (block.data.columns as number) ?? 3;

      const moveImage = (from: number, to: number) => {
        if (to < 0 || to >= galleryImages.length) return;
        const newImages = [...galleryImages];
        const [moved] = newImages.splice(from, 1);
        newImages.splice(to, 0, moved);
        onChange({ ...block.data, images: newImages });
      };

      const removeImage = (index: number) => {
        onChange({ ...block.data, images: galleryImages.filter((_, i) => i !== index) });
      };

      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500">Columns</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ ...block.data, columns: n })}
                  className={`w-8 h-8 rounded border text-xs font-medium ${columns === n ? "bg-primary text-white border-primary" : "border-gray-300 hover:bg-gray-50"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <ImageUploader
            images={galleryImages}
            onChange={(imgs) => onChange({ ...block.data, images: imgs })}
            multiple
          />

          {galleryImages.length > 1 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Reorder images</p>
              <div className="flex flex-wrap gap-2">
                {galleryImages.map((url, i) => (
                  <div key={url} className="relative group">
                    <img src={url} alt={`${i + 1}`} className="w-16 h-16 object-cover rounded border border-gray-200" />
                    <div className="absolute inset-0 flex items-center justify-between px-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveImage(i, i - 1)}
                        disabled={i === 0}
                        className="bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] disabled:opacity-30"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, i + 1)}
                        disabled={i === galleryImages.length - 1}
                        className="bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] disabled:opacity-30"
                      >
                        →
                      </button>
                    </div>
                    <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] px-1 rounded-tl">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {galleryImages.length > 0 && (
            <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {galleryImages.map((url, i) => (
                <img key={i} src={url} alt={`Preview ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
              ))}
            </div>
          )}
        </div>
      );
    }
    case "hero":
      return (
        <div className="space-y-3">
          <ImageUploader
            images={block.data.url ? [block.data.url as string] : []}
            onChange={(imgs) =>
              onChange({ ...block.data, url: imgs[0] ?? "" })
            }
            multiple={false}
          />
          <input
            type="text"
            value={(block.data.overlay_text as string) ?? ""}
            onChange={(e) =>
              onChange({ ...block.data, overlay_text: e.target.value })
            }
            placeholder="Overlay text (optional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      );
    default:
      return <p className="text-sm text-gray-400">Unknown block type</p>;
  }
}

function BlockPreview({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text": {
      const fs = (block.data.fontSize as string) ?? "body";
      const fw = (block.data.fontWeight as string) ?? "normal";
      const clr = block.data.color as string;
      const sizeClass =
        fs === "title" ? "text-2xl font-display" :
        fs === "subtitle" ? "text-lg" :
        fs === "small" ? "text-xs" : "text-sm";
      return (
        <div
          className={`whitespace-pre-wrap ${sizeClass}`}
          style={{
            fontWeight: fw === "bold" ? "bold" : "normal",
            color: clr || undefined,
          }}
        >
          {(block.data.content as string) || (
            <span className="text-gray-300 italic">Empty text block</span>
          )}
        </div>
      );
    }
    case "image": {
      const pos = (block.data.position as ImagePosition) ?? {
        x: "center",
        y: "middle",
      };
      const size = (block.data.size as string) ?? "large";
      const sizePercent = size === "small" ? "33%" : size === "medium" ? "50%" : size === "full" ? "100%" : "80%";

      let floatStyle: React.CSSProperties = {};
      let figureClass = "rounded-lg";

      if (pos.x === "left") {
        floatStyle = { float: "left", marginRight: "1rem", marginBottom: "0.5rem", maxWidth: sizePercent };
      } else if (pos.x === "right") {
        floatStyle = { float: "right", marginLeft: "1rem", marginBottom: "0.5rem", maxWidth: sizePercent };
      } else {
        floatStyle = { display: "block", margin: "0 auto", maxWidth: sizePercent };
      }

      return (
        <figure style={floatStyle} className={figureClass}>
          {block.data.url ? (
            <img
              src={block.data.url as string}
              alt={(block.data.caption as string) ?? ""}
              className="w-full rounded-lg"
            />
          ) : (
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
              No image
            </div>
          )}
          {typeof block.data.caption === "string" && block.data.caption && (
            <figcaption className="text-xs text-gray-500 mt-1 text-center">
              {block.data.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case "gallery": {
      const images = (block.data.images as string[]) ?? [];
      const cols = (block.data.columns as number) ?? 3;
      return images.length > 0 ? (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Gallery ${i + 1}`}
              className="w-full aspect-square object-cover rounded-lg"
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-300 italic">Empty gallery</div>
      );
    }
    case "hero":
      return (
        <div className="relative rounded-lg overflow-hidden">
          {block.data.url ? (
            <img
              src={block.data.url as string}
              alt=""
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-gray-100" />
          )}
          {typeof block.data.overlay_text === "string" && block.data.overlay_text && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="text-white font-display text-lg font-bold">
                {block.data.overlay_text}
              </span>
            </div>
          )}
        </div>
      );
    default:
      return null;
  }
}
