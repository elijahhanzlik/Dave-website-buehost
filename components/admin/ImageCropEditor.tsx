"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, Move } from "lucide-react";

export interface CropSettings {
  x: number; // focal point 0-100 (left to right)
  y: number; // focal point 0-100 (top to bottom)
  zoom: number; // 1-3
}

interface ImageCropEditorProps {
  imageUrl: string;
  crop: CropSettings;
  onChange: (crop: CropSettings) => void;
  aspectRatio?: number; // width/height for preview, e.g. 16/9
  label?: string;
}

const DEFAULT_CROP: CropSettings = { x: 50, y: 50, zoom: 1 };

export default function ImageCropEditor({
  imageUrl,
  crop,
  onChange,
  aspectRatio = 16 / 9,
  label = "Crop & Position",
}: ImageCropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, cropX: 0, cropY: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        cropX: crop.x,
        cropY: crop.y,
      };
    },
    [crop.x, crop.y],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.current.x) / rect.width) * -100;
      const dy = ((e.clientY - dragStart.current.y) / rect.height) * -100;

      onChange({
        ...crop,
        x: Math.max(0, Math.min(100, dragStart.current.cropX + dx)),
        y: Math.max(0, Math.min(100, dragStart.current.cropY + dy)),
      });
    };

    const handleMouseUp = () => setDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, crop, onChange]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setDragging(true);
      dragStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        cropX: crop.x,
        cropY: crop.y,
      };
    },
    [crop.x, crop.y],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const dx = ((touch.clientX - dragStart.current.x) / rect.width) * -100;
      const dy = ((touch.clientY - dragStart.current.y) / rect.height) * -100;

      onChange({
        ...crop,
        x: Math.max(0, Math.min(100, dragStart.current.cropX + dx)),
        y: Math.max(0, Math.min(100, dragStart.current.cropY + dy)),
      });
    };

    const handleTouchEnd = () => setDragging(false);

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragging, crop, onChange]);

  const adjustZoom = (delta: number) => {
    onChange({
      ...crop,
      zoom: Math.max(1, Math.min(3, Math.round((crop.zoom + delta) * 10) / 10)),
    });
  };

  const objectPosition = `${crop.x}% ${crop.y}%`;
  const scale = crop.zoom;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">{label}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Crop area */}
        <div>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Move size={12} /> Drag to reposition
          </p>
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 select-none"
            style={{
              aspectRatio: `${aspectRatio}`,
              cursor: dragging ? "grabbing" : "grab",
            }}
          >
            <img
              src={imageUrl}
              alt="Crop preview"
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{
                objectPosition,
                transform: `scale(${scale})`,
                transformOrigin: objectPosition,
              }}
            />
            {/* Crosshair overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40" />
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => adjustZoom(-0.1)}
              disabled={crop.zoom <= 1}
              className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-30"
            >
              <ZoomOut size={14} />
            </button>
            <div className="flex-1">
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={crop.zoom}
                onChange={(e) =>
                  onChange({ ...crop, zoom: parseFloat(e.target.value) })
                }
                className="w-full accent-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => adjustZoom(0.1)}
              disabled={crop.zoom >= 3}
              className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-30"
            >
              <ZoomIn size={14} />
            </button>
            <span className="text-xs text-gray-500 w-10 text-right">
              {Math.round(crop.zoom * 100)}%
            </span>
          </div>
        </div>

        {/* Preview panel */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Preview</p>
          <div className="space-y-3">
            {/* Desktop preview */}
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Desktop</p>
              <div
                className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                style={{ aspectRatio: "16/9" }}
              >
                <img
                  src={imageUrl}
                  alt="Desktop preview"
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition,
                    transform: `scale(${scale})`,
                    transformOrigin: objectPosition,
                  }}
                />
              </div>
            </div>
            {/* Mobile preview */}
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Mobile</p>
              <div
                className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100 mx-auto"
                style={{ aspectRatio: "9/16", maxWidth: "120px" }}
              >
                <img
                  src={imageUrl}
                  alt="Mobile preview"
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition,
                    transform: `scale(${scale})`,
                    transformOrigin: objectPosition,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_CROP };
