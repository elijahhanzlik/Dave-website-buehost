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
} from "lucide-react";
import ImageUploader from "@/components/ImageUploader";

type BlockType = "text" | "image" | "gallery" | "hero";

interface ContentBlock {
  type: BlockType;
  data: Record<string, unknown>;
}

interface PageData {
  id: string;
  slug: string;
  title: string;
  content_blocks: ContentBlock[];
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
      return { url: "", caption: "" };
    case "gallery":
      return { images: [] };
    case "hero":
      return { url: "", overlay_text: "" };
  }
}

export default function EditPagePage() {
  const params = useParams();
  const router = useRouter();
  const [page, setPage] = useState<PageData | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    fetch(`/api/pages/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: PageData) => {
        setPage(data);
        setBlocks(data.content_blocks);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

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
      const res = await fetch(`/api/pages/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_blocks: blocks }),
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

  if (!page) {
    return (
      <div className="text-center py-12 text-red-500">Page not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {page.title}
          </h1>
          <p className="text-sm text-gray-500 font-mono">/{page.slug}</p>
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

      <div className={showPreview ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}>
        {/* Editor */}
        <div className={showPreview ? "" : "max-w-2xl"}>
          {!showPreview && (
            <div className="space-y-4">
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

              {/* Add block button */}
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
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Live Preview
            </p>
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
    case "image":
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
            value={(block.data.caption as string) ?? ""}
            onChange={(e) =>
              onChange({ ...block.data, caption: e.target.value })
            }
            placeholder="Caption (optional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      );
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

function BlockPreview({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text":
      return (
        <div className="whitespace-pre-wrap text-sm">
          {(block.data.content as string) || (
            <span className="text-gray-300 italic">Empty text block</span>
          )}
        </div>
      );
    case "image":
      return (
        <figure>
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
    case "gallery": {
      const images = (block.data.images as string[]) ?? [];
      return images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
