"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Maximize2,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { slugify } from "@/lib/formatters";
import ImageUploader from "@/components/ImageUploader";
import ImagePositionPicker from "@/components/admin/ImagePositionPicker";
import type { ImagePosition } from "@/components/admin/ImagePositionPicker";
import {
  ActionButton,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  PageHeader,
  Spinner,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";

const ADMIN_BASE = "/dave-admin-website-wonderland";

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

/** Each block says what it is for, not just what it is called. */
const blockTypeOptions: {
  type: BlockType;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "text",
    label: "Some writing",
    hint: "A paragraph or two.",
    icon: <Type size={20} />,
  },
  {
    type: "image",
    label: "One picture",
    hint: "With a caption, and text wrapping around it if you like.",
    icon: <ImageIcon size={20} />,
  },
  {
    type: "gallery",
    label: "A row of pictures",
    hint: "Several photos side by side.",
    icon: <LayoutGrid size={20} />,
  },
  {
    type: "hero",
    label: "A wide banner",
    hint: "A full-width photo with words over it.",
    icon: <Maximize2 size={20} />,
  },
];

const BLOCK_LABEL: Record<BlockType, string> = {
  text: "Writing",
  image: "Picture",
  gallery: "Row of pictures",
  hero: "Banner",
};

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

export default function EditPagePage() {
  const params = useParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/pages/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: PageData) => {
        setPage(data);
        setBlocks(data.content_blocks);
        setTitle(data.title);
        setSlug(data.slug);
      })
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const addBlock = (type: BlockType) => {
    setBlocks([...blocks, { type, data: emptyBlockData(type) }]);
    setShowAddMenu(false);
  };

  const confirmRemove = () => {
    if (pendingRemove === null) return;
    setBlocks(blocks.filter((_, i) => i !== pendingRemove));
    setPendingRemove(null);
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [
      newBlocks[newIndex],
      newBlocks[index],
    ];
    setBlocks(newBlocks);
  };

  const updateBlockData = useCallback(
    (index: number, data: Record<string, unknown>) => {
      setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, data } : b)));
    },
    [],
  );

  const handleSave = async () => {
    if (!title.trim()) {
      setError("A page needs a name before it can be saved.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/pages/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug || slugify(title),
          content_blocks: blocks,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.toString() ?? "Failed to save");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Getting this page…" />;

  if (!page) {
    return (
      <EmptyState
        title="That page is not here"
        hint="It may have been deleted. Everything still on your website is on the previous screen."
        action={
          <Button href={`${ADMIN_BASE}/pages`} size="lg">
            Back to my pages
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Editing a page"
        title={title || "Untitled page"}
        subtitle="Build the page out of blocks, stacked top to bottom. Nothing changes on your website until you press save."
        action={
          <ActionButton
            onClick={handleSave}
            disabled={saving}
            align="end"
            label={saving ? "Saving…" : saved ? "Saved" : "Save this page"}
            hint="Your changes go live straight away."
            icon={
              saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : saved ? (
                <Check size={18} />
              ) : undefined
            }
          />
        }
      />

      {error && (
        <Card className="mb-6 border-admin-danger/30 bg-admin-danger/5 px-5 py-4">
          <p className="text-[15px] font-semibold text-admin-danger">
            That did not save.
          </p>
          <p className="mt-1 text-sm text-admin-muted">{error}</p>
        </Card>
      )}

      <Card className="mb-6 p-7">
        <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
          <Field
            label="Page name"
            hint="The heading at the top of the page."
            htmlFor="page-title"
          >
            <input
              id="page-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Web address"
            hint="The end of the link people share. Changing it breaks any link already out there."
            htmlFor="page-slug"
          >
            <div className="flex items-center gap-2">
              <span className="shrink-0 font-mono text-[13px] text-admin-muted">
                /
              </span>
              <input
                id="page-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className={inputClass}
              />
            </div>
          </Field>
        </div>
      </Card>

      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-[21px] font-bold text-admin-ink">
          What is on this page
        </h2>
        <Button
          variant="secondary"
          onClick={() => setShowPreview(!showPreview)}
          aria-pressed={showPreview}
        >
          {showPreview ? "Hide the preview" : "Show me how it looks"}
        </Button>
      </div>

      <div
        className={
          showPreview ? "grid grid-cols-1 gap-6 xl:grid-cols-2" : undefined
        }
      >
        <div className={showPreview ? undefined : "max-w-3xl"}>
          <div className="flex flex-col gap-4">
            {blocks.map((block, index) => (
              <Card key={index} className="p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold-dark">
                    {index + 1}. {BLOCK_LABEL[block.type] ?? block.type}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(index, -1)}
                      disabled={index === 0}
                      aria-label="Move this block up"
                      title="Move up"
                    >
                      <ChevronUp size={17} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(index, 1)}
                      disabled={index === blocks.length - 1}
                      aria-label="Move this block down"
                      title="Move down"
                    >
                      <ChevronDown size={17} />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPendingRemove(index)}
                    >
                      <Trash2 size={16} /> Remove
                    </Button>
                  </div>
                </div>

                <BlockEditor
                  block={block}
                  onChange={(data) => updateBlockData(index, data)}
                />
              </Card>
            ))}

            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                aria-expanded={showAddMenu}
                className="flex w-full items-center justify-center gap-2.5 rounded-[20px] border-2 border-dashed border-admin-line py-5 text-[15px] font-semibold text-admin-muted transition-colors hover:border-primary/50 hover:text-primary"
              >
                <Plus size={19} /> Add something to this page
              </button>
              {showAddMenu && (
                <Card className="absolute left-0 right-0 top-full z-20 mt-2 p-2 shadow-xl">
                  {blockTypeOptions.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => addBlock(opt.type)}
                      className="flex w-full items-start gap-3.5 rounded-[15px] px-4 py-3.5 text-left transition-colors hover:bg-sage"
                    >
                      <span className="mt-0.5 shrink-0 text-primary">
                        {opt.icon}
                      </span>
                      <span>
                        <span className="block text-[15.5px] font-semibold text-admin-ink">
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-admin-muted">
                          {opt.hint}
                        </span>
                      </span>
                    </button>
                  ))}
                </Card>
              )}
            </div>
          </div>
        </div>

        {showPreview && (
          <Card className="h-fit p-7">
            <p className="mb-5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-gold-dark">
              What visitors will see
            </p>
            {blocks.length === 0 ? (
              <p className="text-[15px] text-admin-muted">
                Nothing on this page yet.
              </p>
            ) : (
              <PreviewRenderer blocks={blocks} />
            )}
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        title={`Remove this ${pendingRemove !== null ? (BLOCK_LABEL[blocks[pendingRemove]?.type] ?? "block").toLowerCase() : "block"}?`}
        body="It comes off the page along with anything written or uploaded into it. This happens when you press save."
        confirmLabel="Yes, remove it"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
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
          rows={5}
          placeholder="Write here…"
          className={textareaClass}
        />
      );
    case "image": {
      const imgPosition: ImagePosition = (block.data
        .position as ImagePosition) ?? {
        x: "center",
        y: "middle",
      };
      return (
        <div className="flex flex-col gap-4">
          <ImageUploader
            images={block.data.url ? [block.data.url as string] : []}
            onChange={(imgs) => onChange({ ...block.data, url: imgs[0] ?? "" })}
            multiple={false}
          />
          {typeof block.data.url === "string" && block.data.url !== "" && (
            <div className="rounded-[16px] border border-admin-line bg-sage/50 p-4">
              <ImagePositionPicker
                imageUrl={block.data.url as string}
                position={imgPosition}
                onChange={(pos) => onChange({ ...block.data, position: pos })}
              />
            </div>
          )}
          <input
            type="text"
            value={(block.data.caption as string) ?? ""}
            onChange={(e) => onChange({ ...block.data, caption: e.target.value })}
            placeholder="Caption (optional)"
            className={inputClass}
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
        <div className="flex flex-col gap-4">
          <ImageUploader
            images={block.data.url ? [block.data.url as string] : []}
            onChange={(imgs) => onChange({ ...block.data, url: imgs[0] ?? "" })}
            multiple={false}
          />
          <input
            type="text"
            value={(block.data.overlay_text as string) ?? ""}
            onChange={(e) =>
              onChange({ ...block.data, overlay_text: e.target.value })
            }
            placeholder="Words over the photo (optional)"
            className={inputClass}
          />
        </div>
      );
    default:
      return (
        <p className="text-sm text-admin-muted">
          This block is not one this screen knows how to edit.
        </p>
      );
  }
}

/**
 * Groups blocks so floated images share a container with adjacent text,
 * enabling CSS float-based text wrapping. The y-position on image blocks
 * controls insertion order: top = before text, middle = between paragraphs,
 * bottom = after text.
 */
function PreviewRenderer({ blocks }: { blocks: ContentBlock[] }) {
  type Group =
    | { kind: "float"; image: ContentBlock; text: ContentBlock | null }
    | { kind: "standalone"; block: ContentBlock };

  const groups: Group[] = [];
  const used = new Set<number>();

  for (let i = 0; i < blocks.length; i++) {
    if (used.has(i)) continue;

    const block = blocks[i];
    const pos =
      block.type === "image"
        ? ((block.data.position as ImagePosition) ?? {
            x: "center",
            y: "middle",
          })
        : null;

    const isFloated = pos && pos.x !== "center";

    if (block.type === "image" && isFloated) {
      // Find the nearest text block to pair with
      let textIdx = -1;
      if (pos.y === "top" || pos.y === "middle") {
        for (let j = i + 1; j < blocks.length; j++) {
          if (!used.has(j) && blocks[j].type === "text") {
            textIdx = j;
            break;
          }
        }
      } else {
        // y === "bottom": look for the previous text block
        for (let j = i - 1; j >= 0; j--) {
          if (!used.has(j) && blocks[j].type === "text") {
            textIdx = j;
            break;
          }
        }
      }

      if (textIdx >= 0) {
        used.add(i);
        used.add(textIdx);
        groups.push({ kind: "float", image: block, text: blocks[textIdx] });
      } else {
        used.add(i);
        groups.push({ kind: "float", image: block, text: null });
      }
    } else {
      used.add(i);
      groups.push({ kind: "standalone", block });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group, i) => {
        if (group.kind === "standalone") {
          return <BlockPreview key={i} block={group.block} />;
        }

        const pos = (group.image.data.position as ImagePosition) ?? {
          x: "center",
          y: "middle",
        };

        const imageEl = <BlockPreview key="img" block={group.image} />;
        const textEl = group.text ? (
          <BlockPreview key="txt" block={group.text} />
        ) : null;

        return (
          <div key={i} style={{ overflow: "hidden" }}>
            {pos.y === "bottom" ? (
              <>
                {textEl}
                {imageEl}
              </>
            ) : (
              <>
                {imageEl}
                {textEl}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BlockPreview({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text":
      return (
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-admin-ink">
          {(block.data.content as string) || (
            <span className="italic text-admin-muted/60">Nothing written yet</span>
          )}
        </div>
      );
    case "image": {
      const pos = (block.data.position as ImagePosition) ?? {
        x: "center",
        y: "middle",
      };

      let floatStyle: React.CSSProperties = {};
      let figureClass = "rounded-[14px] max-w-[50%]";

      if (pos.x === "left") {
        floatStyle = {
          float: "left",
          marginRight: "1rem",
          marginBottom: "0.5rem",
        };
      } else if (pos.x === "right") {
        floatStyle = {
          float: "right",
          marginLeft: "1rem",
          marginBottom: "0.5rem",
        };
      } else {
        floatStyle = { display: "block", margin: "0 auto" };
        figureClass = "rounded-[14px] max-w-[70%]";
      }

      return (
        <figure style={floatStyle} className={figureClass}>
          {block.data.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.data.url as string}
              alt={(block.data.caption as string) ?? ""}
              className="w-full rounded-[14px]"
            />
          ) : (
            <div className="flex h-32 w-full items-center justify-center rounded-[14px] bg-sage text-sm text-admin-muted">
              No picture yet
            </div>
          )}
          {typeof block.data.caption === "string" && block.data.caption && (
            <figcaption className="mt-1.5 text-center text-xs text-admin-muted">
              {block.data.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case "gallery": {
      const images = (block.data.images as string[]) ?? [];
      return images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {images.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Picture ${i + 1}`}
              className="aspect-square w-full rounded-[14px] object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="text-[15px] italic text-admin-muted/60">
          No pictures in this row yet
        </div>
      );
    }
    case "hero":
      return (
        <div className="relative overflow-hidden rounded-[14px]">
          {block.data.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.data.url as string}
              alt=""
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="h-40 w-full bg-sage" />
          )}
          {typeof block.data.overlay_text === "string" &&
            block.data.overlay_text && (
              <div className="absolute inset-0 flex items-center justify-center bg-admin-ink/35">
                <span className="font-display text-[19px] font-bold text-cream">
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
