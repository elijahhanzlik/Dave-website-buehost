"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { formatApiError, slugify } from "@/lib/formatters";
import ImageUploader from "@/components/ImageUploader";
import ImagePositionPicker from "@/components/admin/ImagePositionPicker";
import type { ImagePosition } from "@/components/admin/ImagePositionPicker";

type BlockType = "text" | "image" | "gallery" | "hero";

interface ContentBlock {
  type: BlockType;
  data: Record<string, unknown>;
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
      return { images: [] };
    case "hero":
      return { url: "", overlay_text: "" };
  }
}

export default function NewExhibitPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [coverImage, setCoverImage] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([
    { type: "text", data: { content: "" } },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(slugify(val));
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
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/exhibits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          content_blocks: blocks,
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
        throw new Error(formatApiError(data.error, "Failed to save"));
      }

      router.push("/dave-admin-website-wonderland/exhibits");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          New Exhibit
        </h1>
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
          Create Exhibit
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Exhibit metadata */}
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

      {/* Block editor */}
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
    case "text":
      return (
        <textarea
          value={(block.data.content as string) ?? ""}
          onChange={(e) => onChange({ ...block.data, content: e.target.value })}
          rows={4}
          placeholder="Enter text or markdown..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      );
    case "image": {
      const imgPosition: ImagePosition = (block.data.position as ImagePosition) ?? {
        x: "center",
        y: "middle",
      };
      return (
        <div className="space-y-3">
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
    case "gallery":
      return (
        <ImageUploader
          images={(block.data.images as string[]) ?? []}
          onChange={(imgs) => onChange({ ...block.data, images: imgs })}
          multiple
        />
      );
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
