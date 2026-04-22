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
import { slugify } from "@/lib/formatters";
import ImageUploader from "@/components/ImageUploader";
import ImagePositionPicker from "@/components/admin/ImagePositionPicker";
import type { ImagePosition } from "@/components/admin/ImagePositionPicker";

type BlockType = "text" | "image" | "gallery" | "hero";

interface ContentBlock {
  type: BlockType;
  data: Record<string, unknown>;
}

interface Exhibit {
  id: string;
  title: string;
  slug: string;
  content_blocks: ContentBlock[];
  cover_image: string | null;
  start_date: string | null;
  end_date: string | null;
  venue: string | null;
  link: string | null;
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
      return { images: [] };
    case "hero":
      return { url: "", overlay_text: "" };
  }
}

export default function EditExhibitPage() {
  const params = useParams();
  const router = useRouter();
  const [exhibit, setExhibit] = useState<Exhibit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [coverImage, setCoverImage] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venue, setVenue] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [publishedAt, setPublishedAt] = useState("");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    fetch(`/api/exhibits/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: Exhibit) => {
        setExhibit(data);
        setTitle(data.title);
        setSlug(data.slug);
        setCoverImage(data.cover_image ? [data.cover_image] : []);
        setStartDate(data.start_date ?? "");
        setEndDate(data.end_date ?? "");
        setVenue(data.venue ?? "");
        setLink(data.link ?? "");
        setStatus(data.status);
        setPublishedAt(
          data.published_at
            ? new Date(data.published_at).toISOString().slice(0, 16)
            : "",
        );
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
    if (slug === slugify(exhibit?.title ?? "")) {
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
      const res = await fetch(`/api/exhibits/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content_blocks: blocks,
          cover_image: coverImage[0] || "",
          start_date: startDate || null,
          end_date: endDate || null,
          venue: venue.trim() || null,
          link: link.trim() || null,
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

  if (!exhibit) {
    return (
      <div className="text-center py-12 text-red-500">Exhibit not found</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {title || "Untitled Exhibit"}
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

      {/* Exhibit metadata */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g., Boulder Museum of Contemporary Art"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com/exhibition"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="mt-1 text-xs text-gray-500">
              External URL for this exhibit (venue page, press release, etc.).
            </p>
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
    case "image": {
      const pos = (block.data.position as ImagePosition) ?? {
        x: "center",
        y: "middle",
      };

      let floatStyle: React.CSSProperties = {};
      let figureClass = "rounded-lg max-w-[50%]";

      if (pos.x === "left") {
        floatStyle = { float: "left", marginRight: "1rem", marginBottom: "0.5rem" };
      } else if (pos.x === "right") {
        floatStyle = { float: "right", marginLeft: "1rem", marginBottom: "0.5rem" };
      } else {
        floatStyle = { display: "block", margin: "0 auto" };
        figureClass = "rounded-lg max-w-[70%]";
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
