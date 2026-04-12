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

async function getLatestPosts() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
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

export default async function HomePage() {
  const latestPosts = await getLatestPosts();

  return <HomeClient latestPosts={latestPosts} />;
}
