"use client";

import { useEffect, useId, useImperativeHandle, useRef, type Ref } from "react";
import type EditorJS from "@editorjs/editorjs";
import type { OutputBlockData } from "@editorjs/editorjs";

export interface BlogEditorHandle {
  save: () => Promise<OutputBlockData[]>;
}

interface BlogEditorProps {
  initialBlocks?: OutputBlockData[] | null;
  ref?: Ref<BlogEditorHandle>;
}

export default function BlogEditor({ initialBlocks, ref }: BlogEditorProps) {
  const holderId = useId().replace(/[:]/g, "_");
  const editorRef = useRef<EditorJS | null>(null);
  // Seed is captured once at mount; parent changes to initialBlocks after
  // mount are intentionally ignored — the editor owns the content from there.
  const initialBlocksRef = useRef(initialBlocks);

  useImperativeHandle(
    ref,
    () => ({
      async save() {
        const e = editorRef.current;
        if (!e) return [];
        const out = await e.save();
        return out.blocks;
      },
    }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [
        { default: EditorJSCtor },
        { default: Header },
        { default: Paragraph },
        { default: List },
        { default: Image },
        { default: Quote },
        { default: LinkTool },
        { default: Embed },
        { default: Columns },
        { uploadByFile },
      ] = await Promise.all([
        import("@editorjs/editorjs"),
        import("@editorjs/header"),
        import("@editorjs/paragraph"),
        import("@editorjs/list"),
        import("@editorjs/image"),
        import("@editorjs/quote"),
        import("@editorjs/link"),
        import("@editorjs/embed"),
        import("@calumk/editorjs-columns"),
        import("./blog-editor/imageUploader"),
      ]);

      if (cancelled) return;

      // Tools available inside columns. Excludes columns itself to prevent
      // recursion, and excludes linkTool/embed to keep nested UI simple.
      const columnTools = {
        header: { class: Header, inlineToolbar: true },
        paragraph: { class: Paragraph, inlineToolbar: true },
        list: { class: List, inlineToolbar: true },
        image: {
          class: Image,
          config: { uploader: { uploadByFile } },
        },
        quote: { class: Quote, inlineToolbar: true },
      };

      const tools = {
        ...columnTools,
        linkTool: { class: LinkTool },
        embed: { class: Embed, inlineToolbar: true },
        columns: {
          class: Columns,
          config: {
            EditorJsLibrary: EditorJSCtor,
            tools: columnTools,
          },
        },
      };

      // No onChange handler: serializing the tree while typing inside a
      // nested Columns block steals focus back to the parent editor
      // (see @calumk/editorjs-columns #11). The parent reads content via the
      // imperative `save()` handle at submit time instead.
      const editor = new EditorJSCtor({
        holder: holderId,
        autofocus: false,
        placeholder: "Start writing…",
        data: { blocks: initialBlocksRef.current ?? [] },
        // The Tools type expects a specific generic shape per tool; our runtime
        // shape (mix of class refs and config objects) matches what EditorJS
        // actually consumes but doesn't satisfy the inferred type.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: tools as any,
      });

      if (cancelled) {
        void editor.destroy?.();
        return;
      }

      editorRef.current = editor;
    })();

    return () => {
      cancelled = true;
      const e = editorRef.current;
      editorRef.current = null;
      if (e && typeof e.destroy === "function") {
        void e.destroy();
      }
    };
  }, [holderId]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 min-h-[300px]">
      <div id={holderId} />
    </div>
  );
}
