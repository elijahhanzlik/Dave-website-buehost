import HomeClient from "./HomeClient";

// Placeholder data — replaced by Supabase fetch when connected
const PLACEHOLDER_BLOG_POSTS = [
  {
    id: "1",
    title: "Finding Beauty in the Canopy",
    slug: "finding-beauty-in-the-canopy",
    excerpt:
      "Exploring the intersection of arboriculture and visual art — how years spent among the trees shaped a new creative perspective.",
    cover_image: null,
    published_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "2",
    title: "Boulder in Bloom",
    slug: "boulder-in-bloom",
    excerpt:
      "Spring arrives in the Flatirons and with it, an explosion of color that demands to be captured.",
    cover_image: null,
    published_at: "2026-02-28T00:00:00Z",
  },
];

interface FeaturedArtwork {
  id: string;
  title: string;
  images: string[];
  category?: string | null;
}

const PLACEHOLDER_FEATURED: FeaturedArtwork[] = [
  { id: "1", title: "Roots & Light", images: ["https://picsum.photos/seed/roots-light/800/1000"], category: "Nature" },
  { id: "2", title: "Canopy Heart", images: ["https://picsum.photos/seed/canopy-heart/800/1000"], category: "Nature" },
  { id: "3", title: "Boulder Golden Hour", images: ["https://picsum.photos/seed/boulder-golden/800/1000"], category: "Landscape" },
];

interface HeroSettings {
  imageUrl: string | null;
  crop: { x: number; y: number; zoom: number } | null;
}

async function getHeroSettings(): Promise<HeroSettings> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (!supabase) return { imageUrl: null, crop: null };

    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["hero_image", "hero_crop"]);

    if (data) {
      const imageUrl = data.find((s) => s.key === "hero_image")?.value ?? null;
      const cropRaw = data.find((s) => s.key === "hero_crop")?.value;
      let crop = null;
      if (cropRaw) {
        try {
          crop = JSON.parse(cropRaw);
        } catch {
          // ignore
        }
      }
      return { imageUrl, crop };
    }
  } catch {
    // Supabase not configured
  }
  return { imageUrl: null, crop: null };
}

async function getLatestPosts() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (!supabase) return PLACEHOLDER_BLOG_POSTS;
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, content, cover_image, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(2);

    if (data && data.length > 0) {
      return data.map((post) => ({
        ...post,
        excerpt: post.content
          ? post.content.replace(/[#*_>\-\[\]()]/g, "").slice(0, 150) + "..."
          : "",
      }));
    }
  } catch {
    // Supabase not configured — use placeholders
  }
  return PLACEHOLDER_BLOG_POSTS;
}

async function getFeaturedArtworks(): Promise<FeaturedArtwork[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    if (!supabase) return PLACEHOLDER_FEATURED;
    const { data } = await supabase
      .from("artworks")
      .select("id, title, images, category")
      .order("sort_order", { ascending: true })
      .limit(3);

    if (data && data.length > 0) return data;
  } catch {
    // Supabase not configured
  }
  return PLACEHOLDER_FEATURED;
}

export default async function HomePage() {
  const [latestPosts, hero, featuredArtworks] = await Promise.all([
    getLatestPosts(),
    getHeroSettings(),
    getFeaturedArtworks(),
  ]);

  return (
    <HomeClient
      latestPosts={latestPosts}
      heroImageUrl={hero.imageUrl}
      heroCrop={hero.crop}
      featuredArtworks={featuredArtworks}
    />
  );
}
