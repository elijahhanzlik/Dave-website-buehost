"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, RefreshCw, RotateCw } from "lucide-react";
import { Button, Card } from "@/components/admin/ui";
import { cn } from "@/lib/formatters";

const PREVIEW_URL = "/dave-admin-website-wonderland/gallery-preview";

/**
 * Hosts the live gallery editor in an <iframe> at a chosen screen size.
 *
 * The iframe is always given its true CSS width, so the page inside hits the
 * same breakpoints a real phone or laptop would. When that width is wider than
 * the admin has room for, the frame is scaled down visually with a CSS
 * transform — the layout inside is unchanged, it's just shown smaller.
 */

type PresetKey = "fit" | "phone" | "tablet" | "laptop" | "desktop" | "custom";

interface Preset {
  key: PresetKey;
  label: string;
  hint: string;
  width: number | null; // null = fill the available width
  height: number | null; // null = fill the available height
}

const PRESETS: Preset[] = [
  { key: "fit", label: "Fit", hint: "Fills this window", width: null, height: null },
  { key: "phone", label: "Phone", hint: "390 × 844", width: 390, height: 844 },
  { key: "tablet", label: "Tablet", hint: "820 × 1180", width: 820, height: 1180 },
  { key: "laptop", label: "Laptop", hint: "1280 × 800", width: 1280, height: 800 },
  { key: "desktop", label: "Desktop", hint: "1536 × 960", width: 1536, height: 960 },
  { key: "custom", label: "Custom", hint: "Any size", width: 1024, height: 768 },
];

const MIN_SIZE = 320;
const MAX_SIZE = 4000;

function clampSize(n: number) {
  if (!Number.isFinite(n)) return MIN_SIZE;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(n)));
}

export default function GalleryPreviewFrame() {
  const [preset, setPreset] = useState<PresetKey>("fit");
  const [custom, setCustom] = useState({ width: 1024, height: 768 });
  const [rotated, setRotated] = useState(false);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setAvailableWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const active = PRESETS.find((p) => p.key === preset) ?? PRESETS[0];
  const base =
    preset === "custom"
      ? custom
      : { width: active.width, height: active.height };
  const isFit = preset === "fit";
  const canRotate = !isFit;

  const width = isFit ? null : rotated ? base.height : base.width;
  const height = isFit ? null : rotated ? base.width : base.height;

  // Scale down only when the device is wider than the room we have.
  const scale =
    width && availableWidth && width > availableWidth
      ? availableWidth / width
      : 1;

  const frameStyle: React.CSSProperties = isFit
    ? { width: "100%", height: "calc(100vh - 220px)", minHeight: 480 }
    : { width: width ?? undefined, height: height ?? undefined };

  const wrapperStyle: React.CSSProperties = isFit
    ? { width: "100%" }
    : {
        width: (width ?? 0) * scale,
        height: (height ?? 0) * scale,
        overflow: "hidden",
      };

  const reload = () => {
    const win = iframeRef.current?.contentWindow;
    if (win) {
      try {
        win.location.reload();
        return;
      } catch {
        /* fall through to a remount */
      }
    }
    setReloadKey((k) => k + 1);
  };

  const sizeLabel = isFit
    ? availableWidth
      ? `${availableWidth} px wide`
      : ""
    : `${width} × ${height}`;

  return (
    <div>
      <Card className="mb-5 flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={preset === p.key ? "primary" : "secondary"}
              onClick={() => setPreset(p.key)}
              aria-pressed={preset === p.key}
              title={p.hint}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {preset === "custom" && (
            <div className="flex items-center gap-2 text-sm text-admin-muted">
              <label className="flex items-center gap-1.5">
                <span className="sr-only sm:not-sr-only">Width</span>
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={custom.width}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, width: clampSize(Number(e.target.value)) }))
                  }
                  className="w-24 rounded-[10px] border-[1.5px] border-admin-line bg-white px-3 py-2 text-admin-ink focus:border-primary focus:outline-none"
                  aria-label="Preview width in pixels"
                />
              </label>
              <span aria-hidden>×</span>
              <label className="flex items-center gap-1.5">
                <span className="sr-only sm:not-sr-only">Height</span>
                <input
                  type="number"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  value={custom.height}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, height: clampSize(Number(e.target.value)) }))
                  }
                  className="w-24 rounded-[10px] border-[1.5px] border-admin-line bg-white px-3 py-2 text-admin-ink focus:border-primary focus:outline-none"
                  aria-label="Preview height in pixels"
                />
              </label>
            </div>
          )}

          <p className="text-sm text-admin-muted">
            <span className="font-semibold text-admin-ink">{active.label}</span>
            {sizeLabel && <> · {sizeLabel}</>}
            {scale < 1 && <> · shown at {Math.round(scale * 100)}%</>}
          </p>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {canRotate && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRotated((r) => !r)}
                aria-pressed={rotated}
                title="Turn the device sideways"
              >
                <RotateCw size={16} />
                Rotate
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={reload} title="Reload the preview">
              <RefreshCw size={16} />
              Reload
            </Button>
            <a
              href={PREVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex min-h-[40px] items-center gap-2 rounded-full border-[1.5px] border-transparent px-4 text-sm font-semibold text-admin-muted transition-colors hover:bg-sage hover:text-primary",
              )}
            >
              <ExternalLink size={16} />
              Open in a new tab
            </a>
          </div>
        </div>
      </Card>

      <div ref={containerRef} className="w-full">
        <div
          style={wrapperStyle}
          className={cn(
            "mx-auto rounded-[20px] border border-admin-line bg-admin-surface shadow-sm",
            !isFit && "p-0",
          )}
        >
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={PREVIEW_URL}
            title="Live gallery preview"
            style={{
              ...frameStyle,
              transform: scale < 1 ? `scale(${scale})` : undefined,
              transformOrigin: "top left",
            }}
            className="block rounded-[20px] bg-cream"
          />
        </div>
      </div>
    </div>
  );
}
