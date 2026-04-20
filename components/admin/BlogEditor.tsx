"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { ResizableImage } from "tiptap-extension-resizable-image";
import "tiptap-extension-resizable-image/styles.css";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Loader2,
  Trash2,
} from "lucide-react";
import { uploadImage } from "@/lib/uploadImage";
import ImageCropModal from "./ImageCropModal";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const BRAND_COLORS: { value: string; label: string }[] = [
  { value: "", label: "Default" },
  { value: "#2D5016", label: "Forest Green" },
  { value: "#1E3A0E", label: "Dark Green" },
  { value: "#C4A265", label: "Gold" },
  { value: "#8B4513", label: "Brown" },
  { value: "#4A4A4A", label: "Dark Gray" },
  { value: "#1A1A1A", label: "Black" },
];

/**
 * Extend ResizableImage with a data-align attribute that flows text
 * around the image (left/right float). Value "none" keeps it inline/centered.
 *
 * `draggable: true` enables ProseMirror's native drag-and-drop for the node;
 * the accompanying plugin paints a grip handle over the selected image so the
 * affordance is discoverable. Keyboard alternative: select image, Cmd+X to
 * cut, move caret, Cmd+V to paste — same node, same attrs.
 */
const AlignedResizableImage = ResizableImage.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      dataAlign: {
        default: "none",
        parseHTML: (el) => el.getAttribute("data-align") ?? "none",
        renderHTML: (attrs) => {
          const v = (attrs.dataAlign as string) || "none";
          if (v === "none") return {};
          return { "data-align": v, class: `img-align-${v}` };
        },
      },
    };
  },
  addProseMirrorPlugins() {
    const parent = this.parent?.() ?? [];
    return [
      ...parent,
      imageAlignDecorationPlugin(this.name),
      imageDragHandlePlugin(this.name),
    ];
  },
});

/**
 * Mirrors `dataAlign` onto the image's outer node DOM as `img-align-{v}` so
 * the editor's float CSS has something to match. The library's React node
 * view spreads `node.attrs` directly onto `<img>` and never invokes our
 * `dataAlign.renderHTML`, so the class only ends up in serialized output —
 * not in the live editor DOM. This plugin closes that gap without changing
 * saved HTML or schema (decorations are editor-only).
 */
function imageAlignDecorationPlugin(nodeName: string) {
  return new Plugin({
    key: new PluginKey("image-align-class"),
    props: {
      decorations(state) {
        const decos: Decoration[] = [];
        state.doc.descendants((node, pos) => {
          if (node.type.name !== nodeName) return;
          const v = node.attrs.dataAlign as string | undefined;
          if (v === "left" || v === "right") {
            decos.push(
              Decoration.node(pos, pos + node.nodeSize, {
                class: `img-align-${v}`,
              }),
            );
          }
        });
        return DecorationSet.create(state.doc, decos);
      },
    },
  });
}

const GRIP_SVG =
  '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' +
  '<circle cx="3" cy="3" r="1"/><circle cx="9" cy="3" r="1"/>' +
  '<circle cx="3" cy="6" r="1"/><circle cx="9" cy="6" r="1"/>' +
  '<circle cx="3" cy="9" r="1"/><circle cx="9" cy="9" r="1"/>' +
  "</svg>";

/**
 * Injects a grip element into the selected image's node DOM so the drag
 * affordance is discoverable. The grip is a `<span role="button">` rather
 * than a real `<button>` for two reasons:
 *   1. Tiptap's NodeView.stopEvent returns true for any mousedown whose
 *      target tagName is BUTTON/INPUT/SELECT/TEXTAREA — that early-return
 *      would block PM's `mousedown → mightDrag → dragstart → view.dragging`
 *      pipeline, leaving drops as no-ops or copies.
 *   2. The span has no `draggable` attribute, so the browser walks up to the
 *      nearest draggable ancestor (the `.node-image` outer wrapper, on which
 *      PM auto-sets `draggable="true"`) and initiates the drag of the image
 *      node itself.
 *
 * Keyboard alternative for repositioning: select the image, Cmd+X, move
 * caret, Cmd+V — same node, same attrs.
 */
function imageDragHandlePlugin(nodeName: string) {
  return new Plugin({
    key: new PluginKey("image-drag-handle"),
    view(editorView) {
      let handle: HTMLSpanElement | null = null;
      let host: HTMLElement | null = null;

      const remove = () => {
        if (handle && handle.parentElement === host) host?.removeChild(handle);
        handle = null;
        host = null;
      };

      const ensureHandleOn = (dom: HTMLElement) => {
        if (host === dom && handle) return;
        remove();
        const grip = document.createElement("span");
        grip.className = "tiptap-image-drag-handle";
        grip.setAttribute("role", "button");
        grip.setAttribute("tabindex", "0");
        grip.setAttribute("aria-label", "Drag to reposition image");
        grip.setAttribute("data-drag-handle", "");
        grip.setAttribute("contenteditable", "false");
        grip.innerHTML = GRIP_SVG;
        dom.appendChild(grip);
        handle = grip;
        host = dom;
      };

      const update = () => {
        const { selection } = editorView.state;
        if (
          !(selection instanceof NodeSelection) ||
          selection.node.type.name !== nodeName
        ) {
          remove();
          return;
        }
        const dom = editorView.nodeDOM(selection.from);
        if (!(dom instanceof HTMLElement)) {
          remove();
          return;
        }
        ensureHandleOn(dom);
      };

      update();
      return {
        update,
        destroy: remove,
      };
    },
  });
}

export default function BlogEditor({ value, onChange }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // Tiptap v3 warns about SSR hydration mismatch without this flag.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
        heading: { levels: [1, 2, 3] },
        dropcursor: { color: "#2D5016", width: 2 },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      TextStyle,
      Color,
      AlignedResizableImage.configure({
        defaultWidth: 600,
        defaultHeight: 400,
        minWidth: 120,
        minHeight: 80,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose-custom max-w-none focus:outline-none min-h-[60vh] px-6 py-8",
        role: "textbox",
        "aria-label": "Blog post content",
        "aria-multiline": "true",
      },
    },
  });

  // Keep editor content in sync if parent resets value (e.g., loaded from API).
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const handleImagePick = () => fileInputRef.current?.click();

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingFile(file);
  };

  const handleCrop = async (blob: Blob) => {
    if (!editor) return;
    setPendingFile(null);
    setUploading(true);
    try {
      const upload = blob instanceof File
        ? blob
        : new File([blob], `image-${Date.now()}.${blobExt(blob.type)}`, { type: blob.type });
      const url = await uploadImage(upload);
      const { width, height } = await probeImage(URL.createObjectURL(upload));
      editor
        .chain()
        .focus()
        .setResizableImage({
          src: url,
          alt: "",
          width,
          height,
          "data-keep-ratio": true,
        })
        .run();
    } finally {
      setUploading(false);
    }
  };

  const promptLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (leave empty to remove)", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <Toolbar
        editor={editor}
        colorOpen={colorOpen}
        onToggleColor={() => setColorOpen((v) => !v)}
        onCloseColor={() => setColorOpen(false)}
        linkOpen={linkOpen}
        onToggleLink={() => {
          setLinkOpen(false);
          promptLink();
        }}
        onInsertImage={handleImagePick}
        uploading={uploading}
      />

      <ImageFloatingBar editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChosen}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <EditorContent editor={editor} />

      {pendingFile && (
        <ImageCropModal
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onCrop={handleCrop}
        />
      )}
    </div>
  );
}

/* ---------- Toolbar ---------- */

function Toolbar({
  editor,
  colorOpen,
  onToggleColor,
  onCloseColor,
  onToggleLink,
  onInsertImage,
  uploading,
}: {
  editor: Editor;
  colorOpen: boolean;
  onToggleColor: () => void;
  onCloseColor: () => void;
  linkOpen: boolean;
  onToggleLink: () => void;
  onInsertImage: () => void;
  uploading: boolean;
}) {
  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs);

  const currentColor = (editor.getAttributes("textStyle").color as string) || "";

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5"
    >
      <ParagraphStyleSelect editor={editor} />

      <Separator />

      <TbBtn
        label="Bold"
        shortcut="Cmd+B"
        active={isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon size={14} />
      </TbBtn>
      <TbBtn
        label="Italic"
        shortcut="Cmd+I"
        active={isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon size={14} />
      </TbBtn>
      <TbBtn
        label="Underline"
        shortcut="Cmd+U"
        active={isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={14} />
      </TbBtn>
      <TbBtn
        label="Strikethrough"
        active={isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={14} />
      </TbBtn>

      <Separator />

      <TbBtn
        label="Bullet list"
        active={isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} />
      </TbBtn>
      <TbBtn
        label="Numbered list"
        active={isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} />
      </TbBtn>

      <Separator />

      <TbBtn
        label="Align left"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft size={14} />
      </TbBtn>
      <TbBtn
        label="Align center"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter size={14} />
      </TbBtn>
      <TbBtn
        label="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight size={14} />
      </TbBtn>

      <Separator />

      <div className="relative">
        <button
          type="button"
          aria-label="Text color"
          aria-haspopup="listbox"
          aria-expanded={colorOpen}
          onClick={onToggleColor}
          className="flex items-center gap-1 rounded p-1.5 text-gray-600 hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <Palette size={14} />
          <span
            aria-hidden="true"
            className="h-2 w-3 rounded-sm border border-gray-300"
            style={{ backgroundColor: currentColor || "#e5e7eb" }}
          />
        </button>
        {colorOpen && (
          <ul
            role="listbox"
            aria-label="Text color"
            className="absolute left-0 top-full z-20 mt-1 flex w-48 flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
            onKeyDown={(e) => {
              if (e.key === "Escape") onCloseColor();
            }}
          >
            {BRAND_COLORS.map((c) => {
              const selected = currentColor === c.value;
              return (
                <li key={c.label} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    title={c.label}
                    aria-label={c.label}
                    onClick={() => {
                      if (c.value) {
                        editor.chain().focus().setColor(c.value).run();
                      } else {
                        editor.chain().focus().unsetColor().run();
                      }
                      onCloseColor();
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      selected ? "border-primary ring-2 ring-primary/30" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: c.value || "#ffffff" }}
                  >
                    {!c.value && (
                      <span className="text-[10px] text-gray-500">A</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <TbBtn
        label="Insert link"
        active={isActive("link")}
        onClick={onToggleLink}
      >
        <LinkIcon size={14} />
      </TbBtn>

      <Separator />

      <TbBtn
        label="Insert image"
        onClick={onInsertImage}
        disabled={uploading}
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
      </TbBtn>
    </div>
  );
}

function ParagraphStyleSelect({ editor }: { editor: Editor }) {
  const current = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "p";

  const apply = (value: string) => {
    const chain = editor.chain().focus();
    if (value === "p") chain.setParagraph().run();
    else if (value === "h1") chain.setHeading({ level: 1 }).run();
    else if (value === "h2") chain.setHeading({ level: 2 }).run();
    else if (value === "h3") chain.setHeading({ level: 3 }).run();
  };

  return (
    <label className="flex items-center gap-1 text-xs text-gray-600">
      <span className="sr-only">Paragraph style</span>
      <select
        aria-label="Paragraph style"
        value={current}
        onChange={(e) => apply(e.target.value)}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="p">Body</option>
        <option value="h1">Title</option>
        <option value="h2">Heading</option>
        <option value="h3">Subheading</option>
      </select>
      <ParagraphIcon value={current} />
    </label>
  );
}

function ParagraphIcon({ value }: { value: string }) {
  const size = 12;
  if (value === "h1") return <Heading1 size={size} className="text-gray-400" />;
  if (value === "h2") return <Heading2 size={size} className="text-gray-400" />;
  if (value === "h3") return <Heading3 size={size} className="text-gray-400" />;
  return <Pilcrow size={size} className="text-gray-400" />;
}

function Separator() {
  return <div className="mx-1 h-5 w-px bg-gray-300" aria-hidden="true" />;
}

function TbBtn({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      onClick={onClick}
      className={`rounded p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
        active
          ? "bg-primary text-white hover:bg-primary-dark"
          : "text-gray-600 hover:bg-white hover:text-gray-900"
      } disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

/* ---------- Floating image bar (shown when image node selected) ---------- */

function ImageFloatingBar({ editor }: { editor: Editor }) {
  const [visible, setVisible] = useState(false);
  const [attrs, setAttrs] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const update = () => {
      const active = editor.isActive("image");
      setVisible(active);
      if (active) setAttrs(editor.getAttributes("image"));
    };
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    update();
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!visible) return null;

  const current = (attrs.dataAlign as string) || "none";

  const setAlign = (v: string) => {
    editor.chain().focus().updateAttributes("image", { dataAlign: v }).run();
  };

  return (
    <div
      role="toolbar"
      aria-label="Image options"
      className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-primary/5 px-3 py-1.5 text-xs text-gray-700"
    >
      <span className="font-medium text-primary">Image</span>
      <span className="text-gray-300">|</span>
      <span className="text-gray-500">Align:</span>
      {[
        { v: "left", label: "Wrap left", Icon: AlignLeft },
        { v: "none", label: "Inline / center", Icon: AlignCenter },
        { v: "right", label: "Wrap right", Icon: AlignRight },
      ].map(({ v, label, Icon }) => (
        <button
          key={v}
          type="button"
          aria-label={label}
          aria-pressed={current === v}
          title={label}
          onClick={() => setAlign(v)}
          className={`rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
            current === v
              ? "border-primary bg-primary text-white"
              : "border-gray-300 bg-white hover:bg-gray-50"
          }`}
        >
          <Icon size={12} />
        </button>
      ))}
      <span className="text-gray-300">|</span>
      <span className="text-gray-500">Drag corners to resize</span>
      <div className="ml-auto">
        <button
          type="button"
          aria-label="Remove image"
          onClick={() => editor.chain().focus().deleteSelection().run()}
          className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-1 text-red-600 hover:bg-red-50"
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function blobExt(mime: string): string {
  const m = /image\/(\w+)/.exec(mime);
  return m?.[1] ?? "jpg";
}

function probeImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 600, height: 400 });
    img.src = src;
  });
}
