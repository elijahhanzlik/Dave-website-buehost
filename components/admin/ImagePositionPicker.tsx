"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type XPosition = "left" | "center" | "right";
type YPosition = "top" | "middle" | "bottom";

export interface ImagePosition {
  x: XPosition;
  y: YPosition;
}

interface ImagePositionPickerProps {
  imageUrl: string;
  position: ImagePosition;
  onChange: (position: ImagePosition) => void;
}

const X_ZONES: XPosition[] = ["left", "center", "right"];
const Y_ZONES: YPosition[] = ["top", "middle", "bottom"];

const ZONE_LABELS: Record<string, string> = {
  "top-left": "Top Left",
  "top-center": "Top Center",
  "top-right": "Top Right",
  "middle-left": "Mid Left",
  "middle-center": "Mid Center",
  "middle-right": "Mid Right",
  "bottom-left": "Bottom Left",
  "bottom-center": "Bottom Center",
  "bottom-right": "Bottom Right",
};

const IMG_SIZE = 72;
const CANVAS_HEIGHT = 220;

function positionToOffset(
  pos: ImagePosition,
  canvasW: number,
  canvasH: number,
): { x: number; y: number } {
  const cellW = canvasW / 3;
  const cellH = canvasH / 3;

  const xi = X_ZONES.indexOf(pos.x);
  const yi = Y_ZONES.indexOf(pos.y);

  return {
    x: cellW * xi + (cellW - IMG_SIZE) / 2,
    y: cellH * yi + (cellH - IMG_SIZE) / 2,
  };
}

function detectZone(
  px: number,
  py: number,
  canvasW: number,
  canvasH: number,
): ImagePosition {
  const cellW = canvasW / 3;
  const cellH = canvasH / 3;

  const xCenters = [cellW * 0.5, cellW * 1.5, cellW * 2.5];
  const yCenters = [cellH * 0.5, cellH * 1.5, cellH * 2.5];

  let closestX: XPosition = "center";
  let minXDist = Infinity;
  for (let i = 0; i < 3; i++) {
    const dist = Math.abs(px - xCenters[i]);
    if (dist < minXDist) {
      minXDist = dist;
      closestX = X_ZONES[i];
    }
  }

  let closestY: YPosition = "middle";
  let minYDist = Infinity;
  for (let i = 0; i < 3; i++) {
    const dist = Math.abs(py - yCenters[i]);
    if (dist < minYDist) {
      minYDist = dist;
      closestY = Y_ZONES[i];
    }
  }

  return { x: closestX, y: closestY };
}

export default function ImagePositionPicker({
  imageUrl,
  position,
  onChange,
}: ImagePositionPickerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverZone, setHoverZone] = useState<ImagePosition | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(400);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Track canvas width for accurate positioning
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;

      const current = positionToOffset(position, cw, ch);

      dragOffset.current = {
        x: e.clientX - rect.left - current.x,
        y: e.clientY - rect.top - current.y,
      };

      setDragPos(current);
      setDragging(true);

      const zone = detectZone(
        e.clientX - rect.left,
        e.clientY - rect.top,
        cw,
        ch,
      );
      setHoverZone(zone);
    },
    [position],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;

      const x = Math.max(
        0,
        Math.min(cw - IMG_SIZE, e.clientX - rect.left - dragOffset.current.x),
      );
      const y = Math.max(
        0,
        Math.min(ch - IMG_SIZE, e.clientY - rect.top - dragOffset.current.y),
      );

      setDragPos({ x, y });

      const centerX = x + IMG_SIZE / 2;
      const centerY = y + IMG_SIZE / 2;
      setHoverZone(detectZone(centerX, centerY, cw, ch));
    };

    const handleMouseUp = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;

      const x = Math.max(
        0,
        Math.min(cw - IMG_SIZE, e.clientX - rect.left - dragOffset.current.x),
      );
      const y = Math.max(
        0,
        Math.min(ch - IMG_SIZE, e.clientY - rect.top - dragOffset.current.y),
      );

      const centerX = x + IMG_SIZE / 2;
      const centerY = y + IMG_SIZE / 2;
      const newPos = detectZone(centerX, centerY, cw, ch);

      onChange(newPos);
      setDragging(false);
      setDragPos(null);
      setHoverZone(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, onChange]);

  const displayPos =
    dragging && dragPos
      ? dragPos
      : positionToOffset(position, canvasWidth, CANVAS_HEIGHT);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
        Image Position &mdash; Drag to reposition
      </label>
      <div
        ref={canvasRef}
        className="relative border border-gray-200 rounded-lg bg-gray-50 overflow-hidden select-none"
        style={{ height: CANVAS_HEIGHT }}
      >
        {/* 3x3 Grid Overlay - visible only during drag */}
        {dragging && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Vertical grid lines */}
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gray-300/70" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-gray-300/70" />
            {/* Horizontal grid lines */}
            <div className="absolute top-1/3 left-0 right-0 h-px bg-gray-300/70" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-gray-300/70" />

            {/* Zone highlight cells */}
            {Y_ZONES.map((yp, yi) =>
              X_ZONES.map((xp, xi) => {
                const isHovered =
                  hoverZone?.x === xp && hoverZone?.y === yp;
                return (
                  <div
                    key={`${yp}-${xp}`}
                    className={`absolute transition-colors duration-75 ${
                      isHovered ? "bg-primary/15" : "bg-transparent"
                    }`}
                    style={{
                      left: `${(xi / 3) * 100}%`,
                      top: `${(yi / 3) * 100}%`,
                      width: "33.3333%",
                      height: "33.3333%",
                    }}
                  >
                    <span
                      className={`absolute inset-0 flex items-center justify-center text-[10px] font-medium transition-colors duration-75 ${
                        isHovered ? "text-primary-dark" : "text-gray-400"
                      }`}
                    >
                      {ZONE_LABELS[`${yp}-${xp}`]}
                    </span>
                  </div>
                );
              }),
            )}
          </div>
        )}

        {/* Draggable image thumbnail */}
        <div
          className={`absolute z-20 rounded-lg overflow-hidden shadow-md border-2 ${
            dragging
              ? "border-primary cursor-grabbing opacity-75"
              : "border-transparent cursor-grab hover:border-primary/50"
          }`}
          style={{
            width: IMG_SIZE,
            height: IMG_SIZE,
            left: displayPos.x,
            top: displayPos.y,
            transition: dragging
              ? "none"
              : "left 0.2s ease, top 0.2s ease",
          }}
          onMouseDown={handleMouseDown}
        >
          <img
            src={imageUrl}
            alt="Position preview"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Current position label (when not dragging) */}
        {!dragging && (
          <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm rounded px-2 py-0.5 text-[10px] text-gray-500 font-medium">
            {position.y}-{position.x}
          </div>
        )}
      </div>
    </div>
  );
}
