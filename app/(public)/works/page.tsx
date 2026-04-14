import ArtworkCard from "@/components/ArtworkCard";

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
    description: "Morning light filtering through ancient banyan roots.",
    images: [],
    category: "Nature",
    sort_order: 0,
    is_featured: true,
  },
  {
    id: "2",
    title: "Canopy Heart",
    description: "The heart-shaped silhouette formed by intertwining branches.",
    images: [],
    category: "Nature",
    sort_order: 1,
    is_featured: true,
  },
  {
    id: "3",
    title: "Boulder Golden Hour",
    description: "The Flatirons bathed in warm golden light at sunset.",
    images: [],
    category: "Landscape",
    sort_order: 2,
    is_featured: false,
  },
  {
    id: "4",
    title: "Bark Textures",
    description: "Close-up study of Ponderosa pine bark patterns.",
    images: [],
    category: "Macro",
    sort_order: 3,
    is_featured: false,
  },
  {
    id: "5",
    title: "Forest Floor",
    description: "Mosses and ferns creating a miniature landscape.",
    images: [],
    category: "Nature",
    sort_order: 4,
    is_featured: false,
  },
  {
    id: "6",
    title: "Mountain Stream",
    description: "Water flowing over smooth river stones in Bear Canyon.",
    images: [],
    category: "Landscape",
    sort_order: 5,
    is_featured: false,
  },
];

async function getArtworks(): Promise<Artwork[]> {
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

function getCategories(artworks: Artwork[]): string[] {
  const cats = new Set(artworks.map((a) => a.category).filter(Boolean) as string[]);
  return Array.from(cats);
}

export default async function WorksPage() {
  const artworks = await getArtworks();
  const categories = getCategories(artworks);

  return (
    <div className="pt-24 pb-20">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold text-primary-dark sm:text-5xl">
          Gallery
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-text-secondary">
          A collection of work spanning nature, landscape, and the organic
          patterns that connect us to the living world.
        </p>

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white">
              All
            </span>
            {categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white cursor-pointer"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Gallery grid */}
      <div className="mx-auto mt-12 max-w-7xl px-6 lg:px-8">
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {artworks.map((artwork) => (
            <div key={artwork.id} className="mb-6 break-inside-avoid">
              <ArtworkCard artwork={artwork} />
            </div>
          ))}
        </div>

        {artworks.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-text-muted">No artworks to display yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
