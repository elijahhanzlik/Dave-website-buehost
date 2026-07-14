import HomeClient from "./HomeClient";
import {
  getArtworks,
  getPublishedPosts,
  getSettings,
  settingValue,
  type SiteSetting,
} from "@/lib/supabase/public";

// Prerender the homepage and refresh its cached data every 5 minutes (ISR)
// instead of hitting Supabase on every request.
export const revalidate = 300;

// Placeholder data — used when Supabase is unconfigured or empty
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
  category: string | null;
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

interface HomeBadge {
  title: string;
  dates: string | null;
  time: string | null;
  address: string | null;
}

/**
 * The homepage "NEW EXHIBIT" badge, derived from site_settings keys.
 * Returns null (badge hidden) unless at least a title is set.
 */
function readHomeBadge(settings: SiteSetting[]): HomeBadge | null {
  const title = settingValue(settings, "home_exhibit_title")?.trim() || null;
  if (!title) return null;
  return {
    title,
    dates: settingValue(settings, "home_exhibit_dates")?.trim() || null,
    time: settingValue(settings, "home_exhibit_time")?.trim() || null,
    address: settingValue(settings, "home_exhibit_address")?.trim() || null,
  };
}

function readHeroSettings(settings: SiteSetting[]): HeroSettings {
  const imageUrl = settingValue(settings, "hero_image");
  const cropRaw = settingValue(settings, "hero_crop");
  let crop = null;
  if (cropRaw) {
    try {
      crop = JSON.parse(cropRaw);
    } catch {
      // ignore malformed crop
    }
  }
  return { imageUrl, crop };
}

export default async function HomePage() {
  const [posts, artworks, settings] = await Promise.all([
    getPublishedPosts(),
    getArtworks(),
    getSettings(),
  ]);

  const latestPosts =
    posts.length > 0
      ? posts.slice(0, 2).map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          cover_image: post.cover_image,
          published_at: post.published_at ?? "",
          excerpt: post.content
            ? post.content.replace(/[#*_>\-\[\]()]/g, "").slice(0, 150) + "..."
            : "",
        }))
      : PLACEHOLDER_BLOG_POSTS;

  const featuredArtworks: FeaturedArtwork[] =
    artworks.length > 0
      ? artworks.slice(0, 3).map((a) => ({
          id: a.id,
          title: a.title,
          images: a.images,
          category: a.category ?? null,
        }))
      : PLACEHOLDER_FEATURED;

  const hero = readHeroSettings(settings);
  const homeBadge = readHomeBadge(settings);

  return (
    <HomeClient
      latestPosts={latestPosts}
      heroImageUrl={hero.imageUrl}
      heroCrop={hero.crop}
      featuredArtworks={featuredArtworks}
      homeBadge={homeBadge}
    />
  );
}
