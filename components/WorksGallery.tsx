"use client";

import { useState } from "react";
import ArtworkCard from "@/components/ArtworkCard";

interface Artwork {
  id: string;
  title: string;
  year?: number | null;
  description?: string | null;
  images: string[];
  category?: string | null;
  sort_order: number;
  is_featured: boolean;
}

export default function WorksGallery({
  artworks,
  categories,
}: {
  artworks: Artwork[];
  categories: string[];
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? artworks.filter((a) => a.category === activeCategory)
    : artworks;

  const baseBtn =
    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer";
  const activeBtn = "bg-primary text-white";
  const inactiveBtn =
    "border border-primary/20 text-primary hover:bg-primary hover:text-white";

  return (
    <>
      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`${baseBtn} ${activeCategory === null ? activeBtn : inactiveBtn}`}
            aria-pressed={activeCategory === null}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`${baseBtn} ${activeCategory === cat ? activeBtn : inactiveBtn}`}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="mt-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((artwork) => (
            <div key={artwork.id}>
              <ArtworkCard artwork={artwork} />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-text-muted">No artworks to display yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
