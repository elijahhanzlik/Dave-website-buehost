"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Settings2,
} from "lucide-react";
import { slugify } from "@/lib/formatters";
import ImageUploader from "@/components/ImageUploader";

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
      return { url: "", caption: "", position: { x: "center", y: "middle" }, widthPct: 50 };
    case "gallery":
      return { images: [], columns: 3 };
    case "hero":
      return { url: "", overlay_text: "" };
  }
}

type ImagePosition = { x: "left" | "center" | "right"; y: "top" | "middle" | "bottom" };

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
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
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
    if (slug === slugify(post?.title ?? "")) {
      setSlug(slugify(val));
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlocks = [...blocks, { type, data: emptyBlockData(type) }];
    setBlocks(newBlocks);
    setSelectedBlock(newBlocks.length - 1);
    setShowAddMenu(false);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
    setSelectedBlock(null);
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
    setSelectedBlock(newIndex);
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
          content_blocks: blocks.map((b) => ({
            ...b,
            data: Object.fromEntries(
              Object.entries(b.data).filter(([k]) => !k.startsWith("_"))
            ),
          })),
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
    return <div className="text-center py-12 text-red-500">Post not found</div>;
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 sticky top-0 z-20 bg-gray-50 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin-panel/blog")}
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
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Collapsible metadata */}
      {showMeta && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-end gap-4">
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
            <ImageUploader images={coverImage} onChange={setCoverImage} multiple={false} />
          </div>
        </div>
      )}

      {/* ===== WYSIWYG CANVAS ===== */}
      <div
        className="bg-white rounded-xl border border-gray-200 shadow-sm mx-auto"
        style={{ maxWidth: 1152 }}
        onClick={(e) => {
          // Deselect when clicking canvas background
          if (e.target === e.currentTarget) setSelectedBlock(null);
        }}
      >
        <div className="px-8 sm:px-12 lg:px-16 py-10">
          {/* Cover image */}
          {coverImage[0] && (
            <div className="mb-8 -mx-4 overflow-hidden rounded-2xl">
              <img src={coverImage[0]} alt={title} className="w-full max-h-80 object-cover" />
            </div>
          )}

          {/* Title — editable inline */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title..."
            className="w-full font-display text-4xl font-bold text-gray-900 border-none outline-none placeholder:text-gray-300 bg-transparent mb-8"
          />

          {/* Blocks rendered as live content */}
          {blocks.map((block, index) => (
            <div
              key={index}
              className={`relative group ${selectedBlock === index ? "ring-2 ring-primary/30 rounded-lg" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBlock(index);
              }}
            >
              {/* Block controls — show on hover or selection */}
              {selectedBlock === index && (
                <div className="absolute -top-9 left-0 right-0 flex items-center justify-between z-10">
                  <span className="text-[10px] uppercase tracking-wide text-primary font-medium bg-primary/10 px-2 py-0.5 rounded">
                    {block.type}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronUp size={14} /></button>
                    <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronDown size={14} /></button>
                    <button onClick={() => removeBlock(index)} className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              )}

              <LiveBlock
                block={block}
                isSelected={selectedBlock === index}
                onChange={(data) => updateBlockData(index, data)}
              />
            </div>
          ))}

          {/* Clear floats */}
          <div style={{ clear: "both" }} />

          {/* Add block */}
          <div className="relative mt-8">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full border-2 border-dashed border-gray-200 rounded-lg py-3 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors flex items-center justify-center gap-2"
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
    </div>
  );
}

/* ===== LIVE BLOCK — renders as it would appear, with inline editing ===== */

function LiveBlock({
  block,
  isSelected,
  onChange,
}: {
  block: ContentBlock;
  isSelected: boolean;
  onChange: (data: Record<string, unknown>) => void;
}) {
  switch (block.type) {
    case "text":
      return <LiveTextBlock block={block} isSelected={isSelected} onChange={onChange} />;
    case "image":
      return <LiveImageBlock block={block} isSelected={isSelected} onChange={onChange} />;
    case "gallery":
      return <LiveGalleryBlock block={block} isSelected={isSelected} onChange={onChange} />;
    case "hero":
      return <LiveHeroBlock block={block} isSelected={isSelected} onChange={onChange} />;
    default:
      return null;
  }
}

/* ----- TEXT BLOCK ----- */
function LiveTextBlock({
  block,
  isSelected,
  onChange,
}: {
  block: ContentBlock;
  isSelected: boolean;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const content = (block.data.content as string) ?? "";
  const fontSize = (block.data.fontSize as string) ?? "body";
  const fontWeight = (block.data.fontWeight as string) ?? "normal";
  const color = (block.data.color as string) ?? "";
  const showColorPicker = (block.data._showColorPicker as boolean) ?? false;

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

  // Render classes matching public output
  const wrapperClass =
    fontSize === "title"
      ? "mt-6 mb-3 font-display text-3xl"
      : fontSize === "subtitle"
        ? "mt-4 mb-2 font-display text-xl"
        : fontSize === "small"
          ? "mb-4 text-sm leading-relaxed text-gray-500"
          : "mb-4 text-lg leading-relaxed text-gray-600";

  const Tag = fontSize === "title" ? "h2" : fontSize === "subtitle" ? "h3" : "div";

  return (
    <div className="relative">
      {/* Toolbar — only when selected */}
      {isSelected && (
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          <select
            value={fontSize}
            onChange={(e) => onChange({ ...block.data, fontSize: e.target.value })}
            className="border border-gray-300 rounded px-2 py-1 text-xs"
          >
            <option value="title">Title</option>
            <option value="subtitle">Subtitle</option>
            <option value="body">Body</option>
            <option value="small">Small</option>
          </select>
          <button
            type="button"
            onClick={() => onChange({ ...block.data, fontWeight: fontWeight === "bold" ? "normal" : "bold" })}
            className={`p-1.5 rounded border text-xs ${fontWeight === "bold" ? "bg-primary text-white border-primary" : "border-gray-300"}`}
          >
            <Bold size={14} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => onChange({ ...block.data, _showColorPicker: !showColorPicker })}
              className="p-1.5 rounded border border-gray-300 text-xs flex items-center gap-1"
            >
              <Palette size={14} />
              {color && <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color }} />}
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-20 flex gap-1.5 flex-wrap w-48">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => onChange({ ...block.data, color: c.value, _showColorPicker: false })}
                    className={`w-7 h-7 rounded-full border-2 hover:scale-110 transition-transform ${color === c.value ? "border-primary ring-2 ring-primary/30" : "border-gray-200"}`}
                    style={{ backgroundColor: c.value || "#e5e7eb" }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline editable text — always looks like final output */}
      <EditableText
        tag={Tag}
        value={content}
        onChange={(val) => onChange({ ...block.data, content: val })}
        className={`${wrapperClass} outline-none min-h-[1.5em]`}
        style={{ fontWeight: fontWeight === "bold" ? "bold" : "normal", color: color || undefined, whiteSpace: "pre-wrap" }}
        placeholder={fontSize === "title" ? "Title..." : fontSize === "subtitle" ? "Subtitle..." : "Start writing..."}
      />
    </div>
  );
}

/* ----- IMAGE BLOCK ----- */
function LiveImageBlock({
  block,
  isSelected,
  onChange,
}: {
  block: ContentBlock;
  isSelected: boolean;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const url = block.data.url as string;
  const caption = (block.data.caption as string) ?? "";
  const pos: ImagePosition = (block.data.position as ImagePosition) ?? { x: "center", y: "middle" };
  const widthPct = (block.data.widthPct as number) ?? 50;

  if (!url) {
    return (
      <div className="my-4">
        <ImageUploader
          images={[]}
          onChange={(imgs) => onChange({ ...block.data, url: imgs[0] ?? "" })}
          multiple={false}
        />
      </div>
    );
  }

  const figureStyle: React.CSSProperties = {};
  if (pos.x === "left") {
    figureStyle.float = "left";
    figureStyle.marginRight = "1.5rem";
    figureStyle.marginBottom = "1rem";
    figureStyle.width = `${widthPct}%`;
  } else if (pos.x === "right") {
    figureStyle.float = "right";
    figureStyle.marginLeft = "1.5rem";
    figureStyle.marginBottom = "1rem";
    figureStyle.width = `${widthPct}%`;
  } else {
    figureStyle.display = "block";
    figureStyle.margin = "1.5rem auto";
    figureStyle.width = `${widthPct}%`;
  }

  return (
    <figure style={figureStyle} className="my-4">
      <img src={url} alt={caption} className="w-full rounded-2xl" />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-400">{caption}</figcaption>
      )}

      {/* Controls — only when selected */}
      {isSelected && (
        <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 shrink-0">Width</label>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={widthPct}
              onChange={(e) => onChange({ ...block.data, widthPct: parseInt(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="text-xs text-gray-500 w-10 text-right">{widthPct}%</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Align</label>
            {(["left", "center", "right"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange({ ...block.data, position: { ...pos, x: p } })}
                className={`px-3 py-1 rounded border text-xs capitalize ${pos.x === p ? "bg-primary text-white border-primary" : "border-gray-300"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => onChange({ ...block.data, caption: e.target.value })}
              placeholder="Caption (optional)"
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
            />
            <button
              type="button"
              onClick={() => onChange({ ...block.data, url: "" })}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </figure>
  );
}

/* ----- GALLERY BLOCK ----- */
function LiveGalleryBlock({
  block,
  isSelected,
  onChange,
}: {
  block: ContentBlock;
  isSelected: boolean;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const images = (block.data.images as string[]) ?? [];
  const columns = (block.data.columns as number) ?? 3;

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(from, 1);
    newImages.splice(to, 0, moved);
    onChange({ ...block.data, images: newImages });
  };

  return (
    <div className="my-6">
      {images.length > 0 ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {images.map((url, i) => (
            <div key={url} className="relative group">
              <img src={url} alt={`Gallery ${i + 1}`} className="w-full aspect-square object-cover rounded-xl" />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0} className="bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs disabled:opacity-30">←</button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...block.data, images: images.filter((_, j) => j !== i) })}
                    className="bg-red-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >×</button>
                  <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === images.length - 1} className="bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs disabled:opacity-30">→</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-300 text-sm">No images in gallery</div>
      )}

      {isSelected && (
        <div className="mt-3 space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500">Columns</label>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ ...block.data, columns: n })}
                className={`w-8 h-8 rounded border text-xs font-medium ${columns === n ? "bg-primary text-white border-primary" : "border-gray-300"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <ImageUploader
            images={images}
            onChange={(imgs) => onChange({ ...block.data, images: imgs })}
            multiple
          />
        </div>
      )}
    </div>
  );
}

/* ----- HERO BLOCK ----- */
function LiveHeroBlock({
  block,
  isSelected,
  onChange,
}: {
  block: ContentBlock;
  isSelected: boolean;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const url = block.data.url as string;
  const overlayText = (block.data.overlay_text as string) ?? "";

  return (
    <div className="relative my-6 rounded-2xl overflow-hidden">
      {url ? (
        <img src={url} alt="" className="w-full h-64 sm:h-80 object-cover" />
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-primary to-primary-dark" />
      )}
      {overlayText && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="text-white font-display text-2xl font-bold">{overlayText}</span>
        </div>
      )}

      {isSelected && (
        <div className="mt-3 space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <ImageUploader
            images={url ? [url] : []}
            onChange={(imgs) => onChange({ ...block.data, url: imgs[0] ?? "" })}
            multiple={false}
          />
          <input
            type="text"
            value={overlayText}
            onChange={(e) => onChange({ ...block.data, overlay_text: e.target.value })}
            placeholder="Overlay text (optional)"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
      )}
    </div>
  );
}

/* ----- EDITABLE TEXT (contentEditable wrapper) ----- */
function EditableText({
  tag: Tag,
  value,
  onChange,
  className,
  style,
  placeholder,
}: {
  tag: string;
  value: string;
  onChange: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastValue.current) {
      ref.current.innerText = value;
      lastValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (ref.current && !ref.current.innerText && value) {
      ref.current.innerText = value;
    }
  }, [value]);

  const handleInput = () => {
    if (ref.current) {
      const text = ref.current.innerText;
      lastValue.current = text;
      onChange(text);
    }
  };

  const isEmpty = !value;

  return (
    // @ts-expect-error dynamic tag with ref
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleInput}
      className={`${className} ${isEmpty ? "before:content-[attr(data-placeholder)] before:text-gray-300 before:pointer-events-none" : ""}`}
      style={style}
      data-placeholder={placeholder}
    />
  );
}
