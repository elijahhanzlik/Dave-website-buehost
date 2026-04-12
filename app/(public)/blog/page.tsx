import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/formatters";

export const metadata: Metadata = {
  title: "Blog — David Schaldach",
  description: "Thoughts on nature, photography, and the creative process from David Schaldach.",
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  cover_image: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

const PLACEHOLDER_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Finding Beauty in the Canopy",
    slug: "finding-beauty-in-the-canopy",
    content:
      "For years I climbed trees professionally — diagnosing disease, pruning limbs, assessing risk. But somewhere along the way, the clinical eye became an artistic one. I started noticing how light played through leaves at different times of day, how the architecture of branches created natural frames, and how the view from 60 feet up offered a perspective most people never experience.\n\nThis shift didn't happen overnight. It was gradual, like the growth of the trees themselves. One day I brought a camera up into the canopy, and everything changed.",
    cover_image: null,
    status: "published",
    published_at: "2026-03-15T00:00:00Z",
    created_at: "2026-03-15T00:00:00Z",
  },
  {
    id: "2",
    title: "Boulder in Bloom",
    slug: "boulder-in-bloom",
    content:
      "Spring in Boulder is an event. The Flatirons provide a dramatic backdrop as wildflowers carpet the meadows and fruit trees explode into blossom along the creek paths. For a photographer with a background in arboriculture, it's paradise.\n\nThis spring I've been documenting the progression of bloom across different elevations — from the warm valleys near town to the last patches of snow in the high country. The timing is everything, and some years you have just days to catch a particular species at peak bloom.",
    cover_image: null,
    status: "published",
    published_at: "2026-02-28T00:00:00Z",
    created_at: "2026-02-28T00:00:00Z",
  },
  {
    id: "3",
    title: "The Art of Seeing Slowly",
    slug: "the-art-of-seeing-slowly",
    content:
      "In a world of fast scrolling and instant images, I've found that my best work comes from slowing down. Way down. Sometimes I'll spend an hour with a single tree, watching how the light changes, how the wind reveals different angles, how the shadows tell their own story.\n\nThis practice of patient observation is something I carried over from my arborist days. When you're diagnosing a tree, you can't rush. You have to look at the whole picture — roots, trunk, canopy, and everything in between.",
    cover_image: null,
    status: "published",
    published_at: "2026-01-20T00:00:00Z",
    created_at: "2026-01-20T00:00:00Z",
  },
];

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (data && data.length > 0) return data;
  } catch {
    // Supabase not configured
  }
  return PLACEHOLDER_POSTS;
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold text-primary-dark sm:text-5xl">
          Blog
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-text-secondary">
          Thoughts on nature, photography, and the creative process.
        </p>

        {/* Blog grid */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Cover image / placeholder */}
              <div className="aspect-[16/10] w-full overflow-hidden">
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-sage">
                    <svg
                      className="h-12 w-12 text-primary/15"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {post.published_at && (
                  <p className="text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
                    {formatDate(post.published_at)}
                  </p>
                )}
                <h2 className="mt-2 font-display text-xl font-semibold text-primary-dark transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                {post.content && (
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary line-clamp-3">
                    {post.content.replace(/[#*_>\-\[\]()]/g, "").slice(0, 160)}...
                  </p>
                )}
                <span className="mt-4 inline-block text-sm font-medium text-gold-dark transition-colors group-hover:text-gold">
                  Read more &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-text-muted">No blog posts yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
