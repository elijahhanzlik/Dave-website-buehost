"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, X } from "lucide-react";

interface Props {
  file: File;
  onCancel: () => void;
  onCrop: (blob: Blob) => void;
}

const ASPECT_OPTIONS: { label: string; value: number | undefined }[] = [
  { label: "Free", value: undefined },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:2", value: 3 / 2 },
];

export default function ImageCropModal({ file, onCancel, onCrop }: Props) {
  const [src, setSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const onCompleted = useCallback((_: Area, area: Area) => {
    setPixels(area);
  }, []);

  const applyCrop = async () => {
    if (!pixels || !src) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(src, pixels, file.type);
      onCrop(blob);
    } finally {
      setProcessing(false);
    }
  };

  const useOriginal = async () => {
    onCrop(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
    >
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="font-display text-lg text-gray-900">Crop image</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel crop"
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative h-[60vh] min-h-[320px] bg-gray-900">
          {src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCompleted}
              restrictPosition={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white">
              <Loader2 className="animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Aspect
            </span>
            {ASPECT_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setAspect(opt.value)}
                aria-pressed={aspect === opt.value}
                className={`rounded border px-3 py-1 text-xs ${
                  aspect === opt.value
                    ? "border-primary bg-primary text-white"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="crop-zoom" className="text-xs font-medium text-gray-500">
              Zoom
            </label>
            <input
              id="crop-zoom"
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={useOriginal}
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-50"
          >
            Use original
          </button>
          <button
            type="button"
            onClick={applyCrop}
            disabled={processing || !pixels}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {processing && <Loader2 size={14} className="animate-spin" />}
            Crop &amp; insert
          </button>
        </div>
      </div>
    </div>
  );
}

async function getCroppedBlob(
  src: string,
  area: Area,
  mime: string,
): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height,
  );

  const type = mime && mime !== "image/gif" ? mime : "image/jpeg";
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      type,
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
