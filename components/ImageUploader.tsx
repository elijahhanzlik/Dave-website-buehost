"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/formatters";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  multiple?: boolean;
}

export default function ImageUploader({
  images,
  onChange,
  multiple = true,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Try Supabase Storage upload
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!res.ok) {
        // Supabase Storage not available — fall back to data URL
        return await fileToDataUrl(file);
      }

      const { signedUrl, publicUrl } = await res.json();

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        return await fileToDataUrl(file);
      }

      return publicUrl;
    } catch {
      // Network error or Supabase not configured — fall back to data URL
      try {
        return await fileToDataUrl(file);
      } catch {
        return null;
      }
    }
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/"),
      );
      if (fileArray.length === 0) return;

      setUploading(true);
      try {
        const urls = await Promise.all(fileArray.map(uploadFile));
        const validUrls = urls.filter((u): u is string => u !== null);

        if (multiple) {
          onChange([...images, ...validUrls]);
        } else {
          onChange(validUrls.slice(0, 1));
        }
      } finally {
        setUploading(false);
      }
    },
    [images, onChange, multiple],
  );

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const openFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = multiple;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) handleFiles(files);
    };
    input.click();
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={openFilePicker}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400",
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Upload size={24} />
            <span className="text-sm">
              Drop images here or click to browse
            </span>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative group aspect-square">
              <img
                src={url}
                alt={`Upload ${i + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(i);
                }}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
