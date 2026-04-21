"use client";

import { useEffect, useId, useRef } from "react";
import type EditorJS from "@editorjs/editorjs";
import type { OutputBlockData } from "@editorjs/editorjs";

interface BlogEditorProps {
  value: OutputBlockData[] | null;
  onChange: (blocks: OutputBlockData[]) => void;
}

export interface BlogEditorHandle {
  save: () => Promise<OutputBlockData[]>;
}

export default function BlogEditor({ value, onChange }: BlogEditorProps) {
  const holderId = useId().replace(/[:]/g, "_");
  const editorRef = useRef<EditorJS | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    let editor: EditorJS | null = null;

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

      editor = new EditorJSCtor({
        holder: holderId,
        autofocus: false,
        placeholder: "Start writing…",
        data: { blocks: value ?? [] },
        // The Tools type expects a specific generic shape per tool; our runtime
        // shape (mix of class refs and config objects) matches what EditorJS
        // actually consumes but doesn't satisfy the inferred type.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: tools as any,
        onChange: async (api) => {
          try {
            const out = await api.saver.save();
            onChangeRef.current(out.blocks);
          } catch {
            /* save failures surface in the editor UI */
          }
        },
      });

      editorRef.current = editor;
    })();

    return () => {
      cancelled = true;
      const e = editorRef.current;
      editorRef.current = null;
      if (e && typeof e.destroy === "function") {
        // destroy() is sync in v2.31; ignore returned promise if any
        void e.destroy();
      }
    };
    // We intentionally only initialize once. `value` is the seed; subsequent
    // updates flow back via onChange and are not re-fed into the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 min-h-[300px]">
      <div id={holderId} />
    </div>
  );
}
