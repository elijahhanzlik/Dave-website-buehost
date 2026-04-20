import WorksGallery from "@/components/WorksGallery";

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
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold text-primary-dark sm:text-5xl">
          Gallery
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-text-secondary">
          A collection of work spanning nature, landscape, and the organic
          patterns that connect us to the living world.
        </p>

        <WorksGallery artworks={artworks} categories={categories} />
      </div>
    </div>
  );
}
