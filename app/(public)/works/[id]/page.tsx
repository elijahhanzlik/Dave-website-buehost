import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

interface Artwork {
  id: string;
  title: string;
  description?: string | null;
  images: string[];
  category?: string | null;
  sort_order: number;
  is_featured: boolean;
}

const PLACEHOLDER_ARTWORKS: Artwork[] = [
  {
    id: "1",
    title: "Roots & Light",
    description:
      "Morning light filtering through ancient banyan roots. This image captures the interplay of light and shadow as the sun rises through the complex root system of a centuries-old banyan tree. The roots create natural frames and patterns that draw the eye deeper into the composition.",
    images: [],
    category: "Nature",
    sort_order: 0,
    is_featured: true,
  },
  {
    id: "2",
    title: "Canopy Heart",
    description:
      "The heart-shaped silhouette formed by intertwining branches overhead. Looking straight up through the canopy, two major limbs curve toward each other creating a natural heart shape against the sky — a moment of organic geometry that speaks to the poetry hidden in nature's architecture.",
    images: [],
    category: "Nature",
    sort_order: 1,
    is_featured: true,
  },
  {
    id: "3",
    title: "Boulder Golden Hour",
    description:
      "The Flatirons bathed in warm golden light at sunset. The iconic sandstone formations glow orange and amber as the day's last light paints them from the west. Below, the meadows turn gold, creating a symphony of warm tones.",
    images: [],
    category: "Landscape",
    sort_order: 2,
    is_featured: false,
  },
  {
    id: "4",
    title: "Bark Textures",
    description:
      "Close-up study of Ponderosa pine bark patterns. The puzzle-piece pattern of mature Ponderosa bark reveals warm cinnamon and amber tones. Each plate tells a story of years of growth, fire resistance, and adaptation.",
    images: [],
    category: "Macro",
    sort_order: 3,
    is_featured: false,
  },
  {
    id: "5",
    title: "Forest Floor",
    description:
      "Mosses and ferns creating a miniature landscape on the forest floor. A macro perspective reveals an entire world in miniature — tiny forests of moss, delicate fern fronds unfurling, and the soft carpet of decomposing leaves that feeds the cycle of life.",
    images: [],
    category: "Nature",
    sort_order: 4,
    is_featured: false,
  },
  {
    id: "6",
    title: "Mountain Stream",
    description:
      "Water flowing over smooth river stones in Bear Canyon. Long exposure reveals the silky motion of water as it navigates the ancient stones, each one shaped by millennia of patient flow.",
    images: [],
    category: "Landscape",
    sort_order: 5,
    is_featured: false,
  },
];

async function getAllArtworks(): Promise<Artwork[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (!supabase) return PLACEHOLDER_ARTWORKS;
    const { data } = await supabase
      .from("artworks")
      .select("*")
      .order("sort_order", { ascending: true });

    if (data && data.length > 0) return data;
  } catch {
    // Supabase not configured
  }
  return PLACEHOLDER_ARTWORKS;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const artworks = await getAllArtworks();
  const artwork = artworks.find((a) => a.id === id);

  return {
    title: artwork
      ? `${artwork.title} — David Schaldach`
      : "Artwork — David Schaldach",
    description: artwork?.description?.slice(0, 160) ?? undefined,
  };
}

export default async function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artworks = await getAllArtworks();
  const currentIndex = artworks.findIndex((a) => a.id === id);
  const artwork = artworks[currentIndex];

  if (!artwork) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-24">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-primary-dark">
            Artwork Not Found
          </h1>
          <p className="mt-4 text-text-secondary">
            The artwork you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/works"
            className="mt-6 inline-flex items-center gap-2 text-gold-dark hover:text-gold"
          >
            <ArrowLeft size={16} />
            Back to Gallery
          </Link>
        </div>
      </div>
    );
  }

  const prevArtwork = currentIndex > 0 ? artworks[currentIndex - 1] : null;
  const nextArtwork =
    currentIndex < artworks.length - 1 ? artworks[currentIndex + 1] : null;

  const hasImage = artwork.images.length > 0;

  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/works"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to Gallery
        </Link>

        {/* Image viewer */}
        <div className="mt-8 overflow-hidden rounded-2xl">
          {hasImage ? (
            <img
              src={artwork.images[0]}
              alt={artwork.title}
              className="w-full object-contain max-h-[70vh]"
            />
          ) : (
            <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-sage to-primary/10">
              <svg
                className="h-24 w-24 text-primary/15"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={0.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Additional images */}
        {artwork.images.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {artwork.images.slice(1).map((img, idx) => (
              <div
                key={idx}
                className="aspect-square overflow-hidden rounded-lg"
              >
                <img
                  src={img}
                  alt={`${artwork.title} — ${idx + 2}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8">
          {artwork.category && (
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-gold-dark">
              {artwork.category}
            </p>
          )}
          <h1 className="mt-2 font-display text-3xl font-bold text-primary-dark sm:text-4xl">
            {artwork.title}
          </h1>
          {artwork.description && (
            <p className="mt-4 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-text-secondary">
              {artwork.description}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between border-t border-sage pt-8">
          {prevArtwork ? (
            <Link
              href={`/works/${prevArtwork.id}`}
              className="group flex items-center gap-3 text-text-secondary transition-colors hover:text-primary"
            >
              <ArrowLeft
                size={18}
                className="transition-transform group-hover:-translate-x-1"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-text-muted">
                  Previous
                </p>
                <p className="font-display text-base font-medium">
                  {prevArtwork.title}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextArtwork ? (
            <Link
              href={`/works/${nextArtwork.id}`}
              className="group flex items-center gap-3 text-right text-text-secondary transition-colors hover:text-primary"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-text-muted">
                  Next
                </p>
                <p className="font-display text-base font-medium">
                  {nextArtwork.title}
                </p>
              </div>
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
