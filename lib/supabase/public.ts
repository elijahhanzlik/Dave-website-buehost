import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

/**
 * Cookie-free Supabase client for PUBLIC, cacheable reads.
 *
 * Unlike `lib/supabase/server.ts` (which reads `cookies()` and therefore forces
 * every consuming route into dynamic rendering), this client uses only the
 * public anon key with no request cookies. That keeps public pages statically
 * prerenderable. RLS still applies via the anon key, so only published/public
 * rows are returned — identical to what an unauthenticated visitor already saw.
 *
 * Reads are wrapped in `unstable_cache` (below) so results are cached across the
 * revalidate window and, importantly, so supabase-js's cache-busting `fetch`
 * calls don't re-mark the route as dynamic.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Revalidate cached public reads every 5 minutes.
export const PUBLIC_REVALIDATE = 300;

// ---------- Row shapes (structural; pages keep their own local interfaces) ----------

export interface PublicArtwork {
  id: string;
  title: string;
  description?: string | null;
  images: string[];
  category?: string | null;
  sort_order: number;
  is_featured: boolean;
}

export interface PublicBlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  content_blocks: unknown;
  cover_image: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

export interface PublicExhibit {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  event_dates: string | null;
  event_time: string | null;
  address: string | null;
  cover_image: string | null;
}

export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface PublicPage {
  id: string;
  slug: string;
  title: string;
  content_blocks: {
    type: "text" | "image" | "gallery" | "hero";
    data: Record<string, unknown>;
  }[];
}

export interface SiteSetting {
  key: string;
  value: string | null;
}

// ---------- Cached list reads ----------

export const getArtworks = unstable_cache(
  async (): Promise<PublicArtwork[]> => {
    try {
      const supabase = createPublicClient();
      if (!supabase) return [];
      const { data } = await supabase
        .from("artworks")
        .select("*")
        .order("sort_order", { ascending: true });
      return data ?? [];
    } catch {
      return [];
    }
  },
  ["public:artworks"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["artworks"] },
);

export const getPublishedPosts = unstable_cache(
  async (): Promise<PublicBlogPost[]> => {
    try {
      const supabase = createPublicClient();
      if (!supabase) return [];
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      return data ?? [];
    } catch {
      return [];
    }
  },
  ["public:blog_posts"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["blog_posts"] },
);

export const getPublishedExhibits = unstable_cache(
  async (): Promise<PublicExhibit[]> => {
    try {
      const supabase = createPublicClient();
      if (!supabase) return [];
      const { data } = await supabase
        .from("exhibits")
        // select * so the newer event columns stay optional (pre-migration safe)
        .select("*")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        // Tie-break: every row ships at sort_order 0 until an admin drags one,
        // so without this the order is Postgres' arbitrary physical order.
        .order("created_at", { ascending: true });
      return data ?? [];
    } catch {
      return [];
    }
  },
  ["public:exhibits"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["exhibits"] },
);

export const getPublishedEvents = unstable_cache(
  async (): Promise<PublicEvent[]> => {
    try {
      const supabase = createPublicClient();
      if (!supabase) return [];
      const { data } = await supabase
        .from("events")
        .select(
          "id, title, slug, content, status, start_date, end_date, created_at",
        )
        .eq("status", "published")
        .order("end_date", { ascending: false, nullsFirst: false });
      return data ?? [];
    } catch {
      return [];
    }
  },
  ["public:events"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["events"] },
);

export const getPages = unstable_cache(
  async (): Promise<PublicPage[]> => {
    try {
      const supabase = createPublicClient();
      if (!supabase) return [];
      const { data } = await supabase.from("pages").select("*");
      return data ?? [];
    } catch {
      return [];
    }
  },
  ["public:pages"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["pages"] },
);

export const getSettings = unstable_cache(
  async (): Promise<SiteSetting[]> => {
    try {
      const supabase = createPublicClient();
      if (!supabase) return [];
      const { data } = await supabase
        .from("site_settings")
        .select("key, value");
      return data ?? [];
    } catch {
      return [];
    }
  },
  ["public:site_settings"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["site_settings"] },
);

// ---------- Derived single-item reads (share the cached list above) ----------

export async function getPublishedPost(
  slug: string,
): Promise<PublicBlogPost | null> {
  const posts = await getPublishedPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getPublishedExhibit(
  slug: string,
): Promise<PublicExhibit | null> {
  const exhibits = await getPublishedExhibits();
  return exhibits.find((e) => e.slug === slug) ?? null;
}

export async function getPublishedEvent(
  slug: string,
): Promise<PublicEvent | null> {
  const events = await getPublishedEvents();
  return events.find((e) => e.slug === slug) ?? null;
}

export async function getPage(slug: string): Promise<PublicPage | null> {
  const pages = await getPages();
  return pages.find((p) => p.slug === slug) ?? null;
}

/** Pull a single setting value out of the cached settings list. */
export function settingValue(
  settings: SiteSetting[],
  key: string,
): string | null {
  return settings.find((s) => s.key === key)?.value ?? null;
}
